import {
  Appointment,
  AppointmentCreateRequest,
  PaginationParams,
  PaginationInfo,
  AppointmentStatus,
  UserRole,
} from '../../../types';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { ClientRepository } from '../../clients/repositories/client.repository';
import { UserRepository } from '../../users/repositories/user.repository';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/middleware/errorHandler';

export class AppointmentService {
  private appointmentRepository: AppointmentRepository;
  private clientRepository: ClientRepository;
  private userRepository: UserRepository;

  constructor() {
    this.appointmentRepository = new AppointmentRepository();
    this.clientRepository = new ClientRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * 新規予約を作成
   */
  async createAppointment(
    organizationId: string,
    userId: string,
    appointmentData: AppointmentCreateRequest
  ): Promise<Appointment> {
    logger.info('[AppointmentService] Creating appointment', {
      organizationId,
      userId,
      appointmentData,
    });

    // クライアントの存在確認と組織チェック
    const client = await this.clientRepository.findById(appointmentData.clientId, organizationId);
    if (!client) {
      throw new AppError('指定されたクライアントが見つかりません', 404);
    }
    if (client.organizationId !== organizationId) {
      throw new AppError('他の組織のクライアントにアクセスすることはできません', 403);
    }

    // スタイリストの存在確認と組織チェック（指定された場合）
    if (appointmentData.stylistId) {
      const stylist = await this.userRepository.findById(appointmentData.stylistId);
      if (!stylist) {
        throw new AppError('指定されたスタイリストが見つかりません', 404);
      }
      if (stylist.organizationId !== organizationId) {
        throw new AppError('指定されたスタイリストが見つかりません', 404);
      }
      if (stylist.role !== UserRole.USER) {
        throw new AppError('指定されたユーザーはスタイリストではありません', 400);
      }
    }

    const appointment = await this.appointmentRepository.create({
      organizationId,
      clientId: appointmentData.clientId,
      stylistId: appointmentData.stylistId,
      scheduledAt: new Date(appointmentData.scheduledAt),
      duration: appointmentData.duration,
      services: appointmentData.services,
      note: appointmentData.note,
      status: AppointmentStatus.SCHEDULED,
    });

    logger.info('[AppointmentService] Appointment created successfully', {
      appointmentId: appointment.id,
    });

    return appointment;
  }

  /**
   * 予約一覧を取得（管理者用）
   */
  async getAppointments(
    organizationId: string,
    userId: string,
    userRole: UserRole,
    filters: {
      status?: AppointmentStatus;
      stylistId?: string;
      clientId?: string;
      from?: string;
      to?: string;
    },
    pagination: PaginationParams
  ): Promise<{ appointments: Appointment[]; pagination: PaginationInfo }> {
    logger.info('[AppointmentService] Getting appointments', {
      organizationId,
      userId,
      userRole,
      filters,
      pagination,
    });

    // スタイリストの場合は自分の予約のみ取得
    const stylistIdFilter = userRole === UserRole.USER ? userId : filters.stylistId;

    const { appointments, total } = await this.appointmentRepository.findMany(
      {
        organizationId,
        status: filters.status,
        stylistId: stylistIdFilter,
        clientId: filters.clientId,
        from: filters.from ? new Date(filters.from) : undefined,
        to: filters.to ? new Date(filters.to) : undefined,
      },
      pagination
    );

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    return {
      appointments,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 予約詳細を取得
   */
  async getAppointment(
    organizationId: string,
    userId: string,
    userRole: UserRole,
    appointmentId: string
  ): Promise<Appointment> {
    logger.info('[AppointmentService] Getting appointment detail', {
      organizationId,
      userId,
      userRole,
      appointmentId,
    });

    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new AppError('予約が見つかりません', 404);
    }

    if (appointment.organizationId !== organizationId) {
      throw new AppError('他の組織の予約にアクセスすることはできません', 403);
    }

    // スタイリストの場合は自分の予約のみアクセス可能
    if (userRole === UserRole.USER && appointment.stylistId !== userId) {
      throw new AppError('他のスタイリストの予約にアクセスすることはできません', 403);
    }

    return appointment;
  }

  /**
   * スタイリストを割り当て
   */
  async assignStylist(
    organizationId: string,
    userId: string,
    appointmentId: string,
    stylistId: string
  ): Promise<Appointment> {
    logger.info('[AppointmentService] Assigning stylist', {
      organizationId,
      userId,
      appointmentId,
      stylistId,
    });

    // 予約の存在確認と権限チェック
    const appointment = await this.getAppointment(
      organizationId,
      userId,
      UserRole.ADMIN,
      appointmentId
    );

    // キャンセル済みまたはノーショーの予約は変更不可
    if (
      appointment.status === AppointmentStatus.CANCELED ||
      appointment.status === AppointmentStatus.NO_SHOW
    ) {
      throw new AppError('キャンセル済みまたはノーショーの予約は変更できません', 400);
    }

    // スタイリストの存在確認と組織チェック
    const stylist = await this.userRepository.findById(stylistId);
    if (!stylist) {
      throw new AppError('指定されたスタイリストが見つかりません', 404);
    }
    if (stylist.organizationId !== organizationId) {
      throw new AppError('他の組織のスタイリストを指定することはできません', 403);
    }
    if (stylist.role !== UserRole.USER) {
      throw new AppError('指定されたユーザーはスタイリストではありません', 400);
    }

    // 重複チェック
    const hasOverlap = await this.appointmentRepository.checkOverlap(
      organizationId,
      stylistId,
      appointment.scheduledAt,
      appointment.duration,
      appointmentId
    );

    if (hasOverlap) {
      throw new AppError('指定された時間帯は既に予約が入っています', 409, 'APPOINTMENT_OVERLAP');
    }

    const updatedAppointment = await this.appointmentRepository.update(appointmentId, {
      stylistId,
    });

    if (!updatedAppointment) {
      throw new AppError('予約の更新に失敗しました', 500, 'UPDATE_FAILED');
    }

    logger.info('[AppointmentService] Stylist assigned successfully', {
      appointmentId,
      stylistId,
    });

    return updatedAppointment;
  }

  /**
   * 予約時間を変更
   */
  async moveAppointment(
    organizationId: string,
    userId: string,
    appointmentId: string,
    scheduledAt: string,
    duration?: number
  ): Promise<Appointment> {
    logger.info('[AppointmentService] Moving appointment', {
      organizationId,
      userId,
      appointmentId,
      scheduledAt,
      duration,
    });

    // 予約の存在確認と権限チェック
    const appointment = await this.getAppointment(
      organizationId,
      userId,
      UserRole.ADMIN,
      appointmentId
    );

    // キャンセル済みまたはノーショーの予約は変更不可
    if (
      appointment.status === AppointmentStatus.CANCELED ||
      appointment.status === AppointmentStatus.NO_SHOW
    ) {
      throw new AppError('キャンセル済みまたはノーショーの予約は変更できません', 400);
    }

    const newScheduledAt = new Date(scheduledAt);
    const newDuration = duration || appointment.duration;

    // スタイリストが割り当てられている場合は重複チェック
    if (appointment.stylistId) {
      const hasOverlap = await this.appointmentRepository.checkOverlap(
        organizationId,
        appointment.stylistId,
        newScheduledAt,
        newDuration,
        appointmentId
      );

      if (hasOverlap) {
        throw new AppError('指定された時間帯は既に予約が入っています', 409, 'APPOINTMENT_OVERLAP');
      }
    }

    const updateData: any = {
      scheduledAt: newScheduledAt,
    };
    if (duration !== undefined) {
      updateData.duration = duration;
    }

    const updatedAppointment = await this.appointmentRepository.update(
      appointmentId,
      updateData
    );

    if (!updatedAppointment) {
      throw new AppError('予約の更新に失敗しました', 500, 'UPDATE_FAILED');
    }

    logger.info('[AppointmentService] Appointment moved successfully', {
      appointmentId,
      newScheduledAt,
      newDuration,
    });

    return updatedAppointment;
  }

  /**
   * カレンダー同期（今回は仮実装）
   */
  async syncCalendar(organizationId: string, userId: string): Promise<{ message: string }> {
    logger.info('[AppointmentService] Calendar sync requested', {
      organizationId,
      userId,
    });

    // TODO: 実際のカレンダー同期機能を実装
    // 現在は仮実装として成功メッセージのみ返す

    return {
      message: 'カレンダー同期機能は現在開発中です',
    };
  }
}