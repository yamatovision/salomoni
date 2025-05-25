import { apiClient } from './apiClient';
import { API_PATHS } from '../../types';
import type { 
  Client, 
  ClientCreateRequest, 
  ClientUpdateRequest, 
  ClientSearchFilter,
  PaginationParams,
  PaginationInfo 
} from '../../types';

interface ClientsResponse {
  clients: Client[];
  pagination: PaginationInfo;
}

export class ClientService {
  async createClient(data: ClientCreateRequest): Promise<Client> {
    const response = await apiClient.post<{ success: boolean; data: Client }>(
      API_PATHS.CLIENTS.BASE, 
      data
    );
    return response.data.data;
  }

  async getClients(
    filters: ClientSearchFilter = {}, 
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<ClientsResponse> {
    const params = {
      ...filters,
      ...pagination,
      // フィルター条件をクエリパラメータに変換
      missingBirthDate: filters.birthDateMissing,
      hasAppointmentInMonth: filters.visitedThisMonth,
    };

    const response = await apiClient.get<{ 
      success: boolean; 
      data: Client[]; 
      meta: { pagination: PaginationInfo } 
    }>(API_PATHS.CLIENTS.BASE, { params });

    return {
      clients: response.data.data,
      pagination: response.data.meta.pagination,
    };
  }

  async getClient(clientId: string): Promise<Client> {
    const response = await apiClient.get<{ success: boolean; data: Client }>(
      API_PATHS.CLIENTS.DETAIL(clientId)
    );
    return response.data.data;
  }

  async updateClient(clientId: string, data: ClientUpdateRequest): Promise<Client> {
    const response = await apiClient.put<{ success: boolean; data: Client }>(
      API_PATHS.CLIENTS.DETAIL(clientId), 
      data
    );
    return response.data.data;
  }

  async deleteClient(clientId: string): Promise<void> {
    await apiClient.delete(API_PATHS.CLIENTS.DETAIL(clientId));
  }

  async getDailyClients(stylistId?: string, date?: string): Promise<Client[]> {
    const params = {
      stylistId,
      date,
    };
    
    const response = await apiClient.get<{ success: boolean; data: Client[] }>(
      API_PATHS.CLIENTS.DAILY, 
      { params }
    );
    return response.data.data;
  }

  async recordVisit(clientId: string): Promise<void> {
    await apiClient.post(API_PATHS.CLIENTS.VISIT(clientId));
  }
}