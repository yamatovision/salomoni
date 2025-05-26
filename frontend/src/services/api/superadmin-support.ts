import { apiClient } from './apiClient';
import type { 
  SupportTicket, 
  SupportTicketMessage, 
  SupportTicketReplyInput, 
  SupportTicketUpdateInput,
  SupportTicketStats
} from '../../types';
import { API_PATHS } from '../../types';

// SuperAdmin用チケット一覧取得（全組織のチケット）
export const getSuperAdminSupportTickets = async (params?: {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  organizationId?: string;
  userId?: string;
}): Promise<{ tickets: SupportTicket[]; total: number }> => {
  const response = await apiClient.get(API_PATHS.SUPERADMIN.SUPPORT_TICKETS, { params });
  return response.data.data;
};

// SuperAdmin用チケット詳細取得
export const getSuperAdminSupportTicket = async (ticketId: string): Promise<SupportTicket> => {
  const response = await apiClient.get(API_PATHS.SUPERADMIN.SUPPORT_TICKET_DETAIL(ticketId));
  return response.data.data;
};

// SuperAdmin用チケットへの返信
export const replySuperAdminSupportTicket = async (
  ticketId: string,
  data: SupportTicketReplyInput
): Promise<SupportTicketMessage> => {
  const response = await apiClient.post(API_PATHS.SUPERADMIN.SUPPORT_TICKET_REPLY(ticketId), data);
  return response.data.data;
};

// SuperAdmin用チケット更新
export const updateSuperAdminSupportTicket = async (
  ticketId: string,
  data: SupportTicketUpdateInput
): Promise<SupportTicket> => {
  const response = await apiClient.patch(API_PATHS.SUPERADMIN.SUPPORT_TICKET_STATUS(ticketId), data);
  return response.data.data;
};

// SuperAdmin用統計情報取得（全組織の統計）
export const getSuperAdminSupportTicketStats = async (params?: {
  organizationId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<SupportTicketStats> => {
  const response = await apiClient.get(API_PATHS.SUPERADMIN.SUPPORT_STATS, { params });
  return response.data.data;
};