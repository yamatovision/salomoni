import type { Client, ClientCreateRequest, ClientUpdateRequest, ApiResponse } from '../../../types';
import { mockClients } from '../data/mockClients';

export class MockClientService {
  private clients: Client[] = [...mockClients];

  async createClient(data: ClientCreateRequest): Promise<ApiResponse<Client>> {
    // 新しいクライアントを作成
    const newClient: Client = {
      id: `client-${Date.now()}`,
      organizationId: 'org-001', // モックでは固定
      name: data.name,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      gender: data.gender,
      email: data.email,
      phoneNumber: data.phoneNumber,
      memo: data.memo,
      visitCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.clients.push(newClient);

    // モック使用をログに出力
    console.warn('🔧 Using MOCK data for client creation');
    console.log('Created client:', newClient);

    return {
      success: true,
      data: newClient,
    };
  }

  async getClients(): Promise<ApiResponse<Client[]>> {
    console.warn('🔧 Using MOCK data for clients list');
    
    return {
      success: true,
      data: this.clients,
    };
  }

  async getClient(clientId: string): Promise<ApiResponse<Client>> {
    const client = this.clients.find(c => c.id === clientId);
    
    if (!client) {
      return {
        success: false,
        error: 'Client not found',
      };
    }

    console.warn('🔧 Using MOCK data for client detail');
    
    return {
      success: true,
      data: client,
    };
  }

  async updateClient(clientId: string, data: ClientUpdateRequest): Promise<ApiResponse<Client>> {
    const index = this.clients.findIndex(c => c.id === clientId);
    
    if (index === -1) {
      return {
        success: false,
        error: 'Client not found',
      };
    }

    const updatedClient: Client = {
      ...this.clients[index],
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : this.clients[index].birthDate,
      updatedAt: new Date(),
    };

    this.clients[index] = updatedClient;

    console.warn('🔧 Using MOCK data for client update');
    
    return {
      success: true,
      data: updatedClient,
    };
  }

  async deleteClient(clientId: string): Promise<ApiResponse<void>> {
    const index = this.clients.findIndex(c => c.id === clientId);
    
    if (index === -1) {
      return {
        success: false,
        error: 'Client not found',
      };
    }

    this.clients.splice(index, 1);

    console.warn('🔧 Using MOCK data for client deletion');
    
    return {
      success: true,
    };
  }

  async getDailyClients(): Promise<ApiResponse<Client[]>> {
    // 今日の日付でフィルタリング（モックでは最初の5件を返す）
    const dailyClients = this.clients.slice(0, 5);

    console.warn('🔧 Using MOCK data for daily clients');
    
    return {
      success: true,
      data: dailyClients,
    };
  }
}