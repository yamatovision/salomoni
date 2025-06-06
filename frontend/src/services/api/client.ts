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
      hasAppointmentInMonth: filters.visitedThisMonth,
    };

    // デバッグ：実際のURLを確認
    console.log('Requesting URL:', API_PATHS.CLIENTS.BASE);
    console.log('Full URL:', `${apiClient.defaults.baseURL}${API_PATHS.CLIENTS.BASE}`);
    
    const response = await apiClient.get<{ 
      success: boolean; 
      data: {
        clients: Client[];
        pagination: PaginationInfo;
      }
    }>(API_PATHS.CLIENTS.BASE, { params });

    // デバッグログを追加
    console.log('Client API Response:', response.data);
    console.log('Response data structure:', {
      hasData: !!response.data,
      hasDataProperty: !!response.data?.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      innerDataKeys: response.data?.data ? Object.keys(response.data.data) : [],
      isDataArray: Array.isArray(response.data?.data),
      hasClientsProperty: !!response.data?.data?.clients,
    });

    // レスポンス構造の修正：data.dataが配列の場合とオブジェクトの場合の両方に対応
    if (Array.isArray(response.data.data)) {
      // 古い形式のレスポンス（data.dataが配列）
      console.warn('Received legacy response format - data.data is an array');
      return {
        clients: response.data.data as Client[],
        pagination: (response.data as any).pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.data.length,
          itemsPerPage: 20,
          hasNext: false,
          hasPrev: false,
        },
      };
    } else {
      // 新しい形式のレスポンス（data.data.clientsが配列）
      return {
        clients: response.data.data.clients,
        pagination: response.data.data.pagination,
      };
    }
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

  async getMyClients(
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<ClientsResponse> {
    const response = await apiClient.get<{ 
      success: boolean; 
      data: {
        clients: Client[];
        pagination: PaginationInfo;
      }
    }>(API_PATHS.CLIENTS.MY_CLIENTS, { params: pagination });

    return {
      clients: response.data.data.clients,
      pagination: response.data.data.pagination,
    };
  }

  async getClientSajuProfile(clientId: string): Promise<any> {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `${API_PATHS.CLIENTS.DETAIL(clientId)}/saju-profile`
    );
    return response.data.data;
  }

  async getClientCompatibility(clientId: string): Promise<{
    clientId: string;
    clientName: string;
    compatibilities: Array<{
      stylistId: string;
      stylistName: string;
      profileImage?: string;
      compatibilityScore: number;
      details: any;
    }>;
  }> {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `${API_PATHS.ADMIN.CLIENTS}/${clientId}/compatibility`
    );
    return response.data.data;
  }
}