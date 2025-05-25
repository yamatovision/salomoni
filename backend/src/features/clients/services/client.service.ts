import {
  Client,
  ClientCreateRequest,
  ClientUpdateRequest,
  ClientSearchFilter,
  PaginationParams,
  PaginationInfo,
  FourPillarsCalculateRequest,
} from '../../../types';
import { ClientRepository } from '../repositories/client.repository';
import { IClientDocument } from '../models/client.model';
import { logger } from '../../../common/utils/logger';
import { SajuService } from '../../saju/services/saju.service';

export class ClientService {
  private clientRepository: ClientRepository;
  private sajuService: SajuService;

  constructor() {
    this.clientRepository = new ClientRepository();
    this.sajuService = new SajuService();
  }

  /**
   * 新規クライアントを作成
   */
  async createClient(
    organizationId: string,
    data: ClientCreateRequest
  ): Promise<Client> {
    try {
      logger.info('Creating new client', { organizationId, name: data.name });

      // 重複チェック
      if (data.email || data.phoneNumber) {
        const duplicate = await this.clientRepository.checkDuplicate(
          organizationId,
          data.email,
          data.phoneNumber
        );

        if (duplicate) {
          const field = duplicate.email === data.email ? 'メールアドレス' : '電話番号';
          throw new Error(`指定された${field}は既に登録されています`);
        }
      }

      // クライアント作成
      const clientData: Partial<IClientDocument> = {
        organizationId,
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        visitCount: 0,
      };

      const createdClient = await this.clientRepository.create(clientData);

      // 生年月日が登録されている場合、四柱推命データを自動計算
      if (data.birthDate) {
        try {
          const sajuRequest: FourPillarsCalculateRequest = {
            birthDate: data.birthDate,
            birthTime: '12:00', // デフォルト時間
            timezone: 'Asia/Tokyo',
            location: {
              name: 'Tokyo',
              longitude: 139.6917,
              latitude: 35.6895,
            },
          };

          const fourPillarsData = await this.sajuService.calculateFourPillars(
            sajuRequest
          );

          // 四柱推命データIDをクライアントに関連付け
          await this.clientRepository.update(
            createdClient.id,
            organizationId,
            { fourPillarsDataId: fourPillarsData._id as any }
          );

          logger.info('Four pillars data calculated for client', {
            clientId: createdClient.id,
            fourPillarsDataId: fourPillarsData._id,
          });
        } catch (error) {
          // 四柱推命計算に失敗してもクライアント作成は成功とする
          logger.error('Failed to calculate four pillars data', {
            error,
            clientId: createdClient.id,
          });
        }
      }

      return createdClient.toJSON() as Client;
    } catch (error) {
      logger.error('Failed to create client', { error, organizationId });
      throw error;
    }
  }

  /**
   * クライアント一覧を取得
   */
  async getClients(
    organizationId: string,
    filters: ClientSearchFilter = {},
    pagination: PaginationParams = { page: 1, limit: 20 },
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    clients: Client[];
    pagination: PaginationInfo;
  }> {
    try {
      logger.info('Getting clients', { organizationId, filters, pagination });

      const { clients, total } = await this.clientRepository.findAll(
        organizationId,
        filters,
        pagination,
        sortBy,
        sortOrder
      );

      const paginationInfo: PaginationInfo = {
        currentPage: pagination.page,
        totalPages: Math.ceil(total / pagination.limit),
        totalItems: total,
        itemsPerPage: pagination.limit,
        hasNext: pagination.page * pagination.limit < total,
        hasPrev: pagination.page > 1,
      };

      return {
        clients: clients.map((client) => client.toJSON() as Client),
        pagination: paginationInfo,
      };
    } catch (error) {
      logger.error('Failed to get clients', { error, organizationId });
      throw error;
    }
  }

  /**
   * クライアント詳細を取得
   */
  async getClient(clientId: string, organizationId: string): Promise<Client | null> {
    try {
      logger.info('Getting client details', { clientId, organizationId });

      const client = await this.clientRepository.findById(clientId, organizationId);
      if (!client) {
        return null;
      }

      return client.toJSON() as Client;
    } catch (error) {
      logger.error('Failed to get client', { error, clientId });
      throw error;
    }
  }

  /**
   * クライアント情報を更新
   */
  async updateClient(
    clientId: string,
    organizationId: string,
    data: ClientUpdateRequest
  ): Promise<Client | null> {
    try {
      logger.info('Updating client', { clientId, organizationId });

      // 既存のクライアントを確認
      const existingClient = await this.clientRepository.findById(clientId, organizationId);
      if (!existingClient) {
        return null;
      }

      // 重複チェック（メールまたは電話番号が変更される場合）
      if (data.email || data.phoneNumber) {
        const duplicate = await this.clientRepository.checkDuplicate(
          organizationId,
          data.email,
          data.phoneNumber,
          clientId
        );

        if (duplicate) {
          const field = duplicate.email === data.email ? 'メールアドレス' : '電話番号';
          throw new Error(`指定された${field}は既に登録されています`);
        }
      }

      // 更新データの準備
      const updateData: Partial<IClientDocument> = {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      };

      // クライアント更新
      const updatedClient = await this.clientRepository.update(
        clientId,
        organizationId,
        updateData
      );

      if (!updatedClient) {
        return null;
      }

      // 生年月日が更新された場合、四柱推命データを再計算
      if (data.birthDate && (!existingClient.birthDate || 
          existingClient.birthDate.toISOString().split('T')[0] !== data.birthDate)) {
        try {
          const sajuRequest: FourPillarsCalculateRequest = {
            birthDate: data.birthDate,
            birthTime: '12:00', // デフォルト時間
            timezone: 'Asia/Tokyo',
            location: {
              name: 'Tokyo',
              longitude: 139.6917,
              latitude: 35.6895,
            },
          };

          const fourPillarsData = await this.sajuService.calculateFourPillars(
            sajuRequest
          );

          // 四柱推命データIDを更新
          await this.clientRepository.update(
            clientId,
            organizationId,
            { fourPillarsDataId: fourPillarsData._id as any }
          );

          logger.info('Four pillars data recalculated for client', {
            clientId,
            fourPillarsDataId: fourPillarsData._id,
          });
        } catch (error) {
          logger.error('Failed to recalculate four pillars data', {
            error,
            clientId,
          });
        }
      }

      return updatedClient.toJSON() as Client;
    } catch (error) {
      logger.error('Failed to update client', { error, clientId });
      throw error;
    }
  }

  /**
   * クライアントを削除
   */
  async deleteClient(clientId: string, organizationId: string): Promise<boolean> {
    try {
      logger.info('Deleting client', { clientId, organizationId });

      const deleted = await this.clientRepository.delete(clientId, organizationId);
      
      if (!deleted) {
        logger.warn('Client not found for deletion', { clientId, organizationId });
      }

      return deleted;
    } catch (error) {
      logger.error('Failed to delete client', { error, clientId });
      throw error;
    }
  }

  /**
   * 本日の担当クライアントを取得
   */
  async getDailyClients(
    organizationId: string,
    stylistId?: string,
    date?: string
  ): Promise<Client[]> {
    try {
      const targetDate = date ? new Date(date) : new Date();
      
      logger.info('Getting daily clients', {
        organizationId,
        stylistId,
        date: targetDate,
      });

      const clients = await this.clientRepository.findDailyClients(
        organizationId,
        stylistId,
        targetDate
      );

      return clients.map((client) => client.toJSON() as Client);
    } catch (error) {
      logger.error('Failed to get daily clients', { error, organizationId });
      throw error;
    }
  }

  /**
   * クライアントの訪問情報を更新
   */
  async recordVisit(clientId: string, organizationId: string): Promise<Client | null> {
    try {
      logger.info('Recording client visit', { clientId, organizationId });

      const updatedClient = await this.clientRepository.updateVisitInfo(
        clientId,
        organizationId
      );

      if (!updatedClient) {
        return null;
      }

      return updatedClient.toJSON() as Client;
    } catch (error) {
      logger.error('Failed to record client visit', { error, clientId });
      throw error;
    }
  }
}