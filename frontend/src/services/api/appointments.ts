import { apiClient } from './apiClient';
import { API_PATHS } from '../../types';
import type { 
  Appointment,
  AppointmentCreateRequest,
  AppointmentUpdateRequest,
  PaginationParams,
  PaginationInfo 
} from '../../types';

interface AppointmentsResponse {
  appointments: Appointment[];
  pagination: PaginationInfo;
}

export class AppointmentService {
  /**
   * 新規予約作成
   */
  async createAppointment(data: AppointmentCreateRequest): Promise<Appointment> {
    const response = await apiClient.post<{ success: boolean; data: Appointment }>(
      API_PATHS.APPOINTMENTS.BASE,
      data
    );
    return response.data.data;
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
    const params = {
      ...filters,
      ...pagination,
    };

    const response = await apiClient.get<{
      success: boolean;
      data: Appointment[];
      meta: { pagination: PaginationInfo };
    }>(API_PATHS.APPOINTMENTS.ADMIN_LIST, { params });

    return {
      appointments: response.data.data,
      pagination: response.data.meta.pagination,
    };
  }

  /**
   * 予約詳細取得
   */
  async getAppointment(appointmentId: string): Promise<Appointment> {
    const response = await apiClient.get<{ success: boolean; data: Appointment }>(
      API_PATHS.APPOINTMENTS.DETAIL(appointmentId)
    );
    return response.data.data;
  }

  /**
   * スタイリスト割当
   */
  async assignStylist(appointmentId: string, stylistId: string): Promise<Appointment> {
    const response = await apiClient.post<{ success: boolean; data: Appointment }>(
      API_PATHS.APPOINTMENTS.ASSIGN(appointmentId),
      { stylistId }
    );
    return response.data.data;
  }

  /**
   * 予約時間変更
   */
  async updateAppointmentTime(
    appointmentId: string,
    data: { scheduledAt: string; duration?: number }
  ): Promise<Appointment> {
    const response = await apiClient.put<{ success: boolean; data: Appointment }>(
      API_PATHS.APPOINTMENTS.MOVE(appointmentId),
      data
    );
    return response.data.data;
  }

  /**
   * 予約ステータス更新
   */
  async updateAppointmentStatus(
    appointmentId: string,
    status: 'confirmed' | 'completed' | 'cancelled'
  ): Promise<Appointment> {
    const response = await apiClient.put<{ success: boolean; data: Appointment }>(
      API_PATHS.APPOINTMENTS.DETAIL(appointmentId),
      { status }
    );
    return response.data.data;
  }

  /**
   * カレンダー同期実行
   */
  async syncCalendar(provider: 'google' | 'hotpepper' | 'salonanswer'): Promise<void> {
    await apiClient.post(API_PATHS.APPOINTMENTS.CALENDAR_SYNC, { provider });
  }
}