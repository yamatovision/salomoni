import { v4 as uuidv4 } from 'uuid';
import type { 
  Appointment,
  AppointmentCreateRequest,
  PaginationParams,
  PaginationInfo 
} from '../../../types';
import { mockAppointments } from '../data/mockAppointments';

interface AppointmentsResponse {
  appointments: Appointment[];
  pagination: PaginationInfo;
}

export class MockAppointmentService {
  private appointments: Appointment[] = [...mockAppointments];

  /**
   * 新規予約作成
   */
  async createAppointment(data: AppointmentCreateRequest): Promise<Appointment> {
    const newAppointment: Appointment = {
      id: uuidv4(),
      organizationId: 'mock-org-id',
      clientId: data.clientId,
      stylistId: data.stylistId,
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration || 60,
      services: data.services || [],
      status: 'pending',
      notes: data.notes,
      createdBy: 'mock-user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.appointments.push(newAppointment);

    console.warn('🔧 Using MOCK data for appointment creation');
    console.log('Created appointment:', newAppointment);

    return newAppointment;
  }

  /**
   * 予約一覧取得（管理者用）
   */
  async getAppointments(
    filters: {
      date?: string;
      stylistId?: string;
      clientId?: string;
      status?: string;
    } = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<AppointmentsResponse> {
    console.warn('🔧 Using MOCK data for appointments list');
    
    let filteredAppointments = [...this.appointments];

    // 日付フィルター
    if (filters.date) {
      const filterDate = new Date(filters.date);
      filteredAppointments = filteredAppointments.filter(apt => {
        const aptDate = new Date(apt.scheduledAt);
        return (
          aptDate.getFullYear() === filterDate.getFullYear() &&
          aptDate.getMonth() === filterDate.getMonth() &&
          aptDate.getDate() === filterDate.getDate()
        );
      });
    }

    // スタイリストフィルター
    if (filters.stylistId) {
      filteredAppointments = filteredAppointments.filter(
        apt => apt.stylistId === filters.stylistId
      );
    }

    // クライアントフィルター
    if (filters.clientId) {
      filteredAppointments = filteredAppointments.filter(
        apt => apt.clientId === filters.clientId
      );
    }

    // ステータスフィルター
    if (filters.status) {
      filteredAppointments = filteredAppointments.filter(
        apt => apt.status === filters.status
      );
    }

    // 時間でソート
    filteredAppointments.sort((a, b) => 
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

    // ページネーション
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

    return {
      appointments: paginatedAppointments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredAppointments.length / limit),
        totalItems: filteredAppointments.length,
        itemsPerPage: limit,
        hasNext: endIndex < filteredAppointments.length,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 予約詳細取得
   */
  async getAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = this.appointments.find(apt => apt.id === appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    console.warn('🔧 Using MOCK data for appointment detail');
    
    return appointment;
  }

  /**
   * スタイリスト割当
   */
  async assignStylist(appointmentId: string, stylistId: string): Promise<Appointment> {
    const index = this.appointments.findIndex(apt => apt.id === appointmentId);
    
    if (index === -1) {
      throw new Error('Appointment not found');
    }

    this.appointments[index] = {
      ...this.appointments[index],
      stylistId,
      status: 'confirmed',
      updatedAt: new Date(),
    };

    console.warn('🔧 Using MOCK data for stylist assignment');
    
    return this.appointments[index];
  }

  /**
   * 予約時間変更
   */
  async updateAppointmentTime(
    appointmentId: string,
    data: { scheduledAt: string; duration?: number }
  ): Promise<Appointment> {
    const index = this.appointments.findIndex(apt => apt.id === appointmentId);
    
    if (index === -1) {
      throw new Error('Appointment not found');
    }

    this.appointments[index] = {
      ...this.appointments[index],
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration || this.appointments[index].duration,
      updatedAt: new Date(),
    };

    console.warn('🔧 Using MOCK data for appointment time update');
    
    return this.appointments[index];
  }

  /**
   * 予約ステータス更新
   */
  async updateAppointmentStatus(
    appointmentId: string,
    status: 'confirmed' | 'completed' | 'cancelled'
  ): Promise<Appointment> {
    const index = this.appointments.findIndex(apt => apt.id === appointmentId);
    
    if (index === -1) {
      throw new Error('Appointment not found');
    }

    this.appointments[index] = {
      ...this.appointments[index],
      status,
      updatedAt: new Date(),
    };

    console.warn('🔧 Using MOCK data for appointment status update');
    
    return this.appointments[index];
  }

  /**
   * カレンダー同期実行
   */
  async syncCalendar(provider: 'google' | 'hotpepper' | 'salonanswer'): Promise<void> {
    console.warn('🔧 Using MOCK data for calendar sync');
    console.log(`Simulating calendar sync with ${provider}`);
    
    // モックでは2秒待機してから完了
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}