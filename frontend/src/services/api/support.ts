import { apiClient } from './apiClient';
import type { 
  SupportTicket, 
  SupportTicketMessage, 
  SupportTicketCreateInput, 
  SupportTicketReplyInput, 
  SupportTicketUpdateInput,
  SupportTicketStats
} from '../../types';
import { API_PATHS } from '../../types';

// チケット一覧取得
export const getSupportTickets = async (params?: {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  organizationId?: string;
  userId?: string;
}): Promise<{ tickets: SupportTicket[]; total: number }> => {
  const response = await apiClient.get(API_PATHS.SUPPORT.TICKETS, { params });
  return response.data;
};

// チケット詳細取得
export const getSupportTicket = async (ticketId: string): Promise<SupportTicket> => {
  const response = await apiClient.get(API_PATHS.SUPPORT.TICKET_DETAIL(ticketId));
  return response.data;
};

// チケット作成
export const createSupportTicket = async (
  data: SupportTicketCreateInput
): Promise<SupportTicket> => {
  const response = await apiClient.post(API_PATHS.SUPPORT.CREATE, data);
  return response.data;
};

// チケットへの返信
export const replySupportTicket = async (
  ticketId: string,
  data: SupportTicketReplyInput
): Promise<SupportTicketMessage> => {
  const response = await apiClient.post(API_PATHS.SUPPORT.REPLY(ticketId), data);
  return response.data;
};

// チケット更新
export const updateSupportTicket = async (
  ticketId: string,
  data: SupportTicketUpdateInput
): Promise<SupportTicket> => {
  const response = await apiClient.patch(API_PATHS.SUPPORT.UPDATE_STATUS(ticketId), data);
  return response.data;
};

// チケット削除
export const deleteSupportTicket = async (ticketId: string): Promise<void> => {
  await apiClient.delete(API_PATHS.SUPPORT.TICKET_DETAIL(ticketId));
};

// 統計情報取得
export const getSupportTicketStats = async (params?: {
  organizationId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<SupportTicketStats> => {
  const response = await apiClient.get(`${API_PATHS.SUPPORT.BASE}/stats`, { params });
  return response.data;
};