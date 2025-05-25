import { v4 as uuidv4 } from 'uuid';
import type { 
  Client, 
  ClientCreateRequest, 
  ClientUpdateRequest,
  ClientSearchFilter,
  PaginationParams,
  PaginationInfo 
} from '../../../types';
import { mockClients } from '../data/mockClients';

interface ClientsResponse {
  clients: Client[];
  pagination: PaginationInfo;
}

export class MockClientService {
  private clients: Client[] = [...mockClients];

  async createClient(data: ClientCreateRequest): Promise<Client> {
    const newClient: Client = {
      id: uuidv4(),
      organizationId: 'mock-org-id',
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      visitCount: 0,
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.clients.push(newClient);

    // モック使用をログに出力
    console.warn('🔧 Using MOCK data for client creation');
    console.log('Created client:', newClient);

    return newClient;
  }

  async getClients(
    filters: ClientSearchFilter = {}, 
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<ClientsResponse> {
    console.warn('🔧 Using MOCK data for clients list');
    
    let filteredClients = [...this.clients];

    // 検索フィルタリング
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredClients = filteredClients.filter(
        client => 
          client.name.toLowerCase().includes(term) ||
          client.phoneNumber?.toLowerCase().includes(term) ||
          client.email?.toLowerCase().includes(term)
      );
    }

    // 生年月日未設定フィルター
    if (filters.birthDateMissing) {
      filteredClients = filteredClients.filter(client => !client.birthDate);
    }

    // 今月来店フィルター
    if (filters.visitedThisMonth) {
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      filteredClients = filteredClients.filter(client => {
        if (!client.lastVisitDate) return false;
        const visitDate = new Date(client.lastVisitDate);
        return visitDate.getMonth() === thisMonth && visitDate.getFullYear() === thisYear;
      });
    }

    // お気に入りフィルター
    if (filters.isFavorite) {
      filteredClients = filteredClients.filter(client => client.visitCount >= 10);
    }

    // ページネーション
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedClients = filteredClients.slice(startIndex, endIndex);

    return {
      clients: paginatedClients,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredClients.length / limit),
        totalItems: filteredClients.length,
        itemsPerPage: limit,
        hasNext: endIndex < filteredClients.length,
        hasPrev: page > 1,
      },
    };
  }

  async getClient(clientId: string): Promise<Client> {
    const client = this.clients.find(c => c.id === clientId);
    
    if (!client) {
      throw new Error('Client not found');
    }

    console.warn('🔧 Using MOCK data for client detail');
    
    return client;
  }

  async updateClient(clientId: string, data: ClientUpdateRequest): Promise<Client> {
    const index = this.clients.findIndex(c => c.id === clientId);
    
    if (index === -1) {
      throw new Error('Client not found');
    }

    const updatedClient: Client = {
      ...this.clients[index],
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : this.clients[index].birthDate,
      updatedAt: new Date(),
    };

    this.clients[index] = updatedClient;

    console.warn('🔧 Using MOCK data for client update');
    
    return updatedClient;
  }

  async deleteClient(clientId: string): Promise<void> {
    const index = this.clients.findIndex(c => c.id === clientId);
    
    if (index === -1) {
      throw new Error('Client not found');
    }

    this.clients.splice(index, 1);

    console.warn('🔧 Using MOCK data for client deletion');
  }

  async getDailyClients(stylistId?: string, date?: string): Promise<Client[]> {
    // 今日の日付でフィルタリング（モックでは最初の5件を返す）
    const dailyClients = this.clients.slice(0, 5);

    console.warn('🔧 Using MOCK data for daily clients');
    
    return dailyClients;
  }

  async recordVisit(clientId: string): Promise<void> {
    const index = this.clients.findIndex(c => c.id === clientId);
    
    if (index === -1) {
      throw new Error('Client not found');
    }

    this.clients[index].visitCount += 1;
    this.clients[index].lastVisitDate = new Date();
    this.clients[index].updatedAt = new Date();

    console.warn('🔧 Using MOCK data for visit recording');
  }
}