import { apiClient } from './apiClient';
import { API_PATHS } from '../../types';
import type { Client, ClientCreateRequest, ClientUpdateRequest, ApiResponse, PaginationParams } from '../../types';

export class ClientService {
  async createClient(data: ClientCreateRequest): Promise<ApiResponse<Client>> {
    const response = await apiClient.post<ApiResponse<Client>>(API_PATHS.CLIENTS.BASE, data);
    return response.data;
  }

  async getClients(params?: PaginationParams): Promise<ApiResponse<Client[]>> {
    const response = await apiClient.get<ApiResponse<Client[]>>(API_PATHS.CLIENTS.BASE, { params });
    return response.data;
  }

  async getClient(clientId: string): Promise<ApiResponse<Client>> {
    const response = await apiClient.get<ApiResponse<Client>>(API_PATHS.CLIENTS.DETAIL(clientId));
    return response.data;
  }

  async updateClient(clientId: string, data: ClientUpdateRequest): Promise<ApiResponse<Client>> {
    const response = await apiClient.put<ApiResponse<Client>>(API_PATHS.CLIENTS.DETAIL(clientId), data);
    return response.data;
  }

  async deleteClient(clientId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(API_PATHS.CLIENTS.DETAIL(clientId));
    return response.data;
  }

  async getDailyClients(): Promise<ApiResponse<Client[]>> {
    const response = await apiClient.get<ApiResponse<Client[]>>(API_PATHS.CLIENTS.DAILY);
    return response.data;
  }
}