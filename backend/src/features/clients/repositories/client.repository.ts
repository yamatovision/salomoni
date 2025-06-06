import { FilterQuery } from 'mongoose';
import { ClientModel, IClientDocument } from '../models/client.model';
import { PaginationParams, ClientSearchFilter } from '../../../types';
import { logger } from '../../../common/utils/logger';

export class ClientRepository {
  /**
   * クライアントを作成
   */
  async create(data: Partial<IClientDocument>): Promise<IClientDocument> {
    try {
      logger.debug('Creating client', { organizationId: data.organizationId, name: data.name });
      const client = new ClientModel(data);
      const savedClient = await client.save();
      logger.info('Client created successfully', { clientId: savedClient._id });
      return savedClient;
    } catch (error) {
      logger.error('Failed to create client', { error, data });
      throw error;
    }
  }

  /**
   * IDでクライアントを取得
   */
  async findById(id: string, organizationId: string): Promise<IClientDocument | null> {
    try {
      logger.debug('Finding client by ID', { clientId: id, organizationId });
      const client = await ClientModel.findOne({ _id: id, organizationId });
      
      if (!client) {
        logger.warn('Client not found', { clientId: id, organizationId });
      }
      
      return client;
    } catch (error) {
      logger.error('Failed to find client by ID', { error, clientId: id });
      throw error;
    }
  }

  /**
   * 組織内のクライアント一覧を取得（ページネーション・検索対応）
   */
  async findAll(
    organizationId: string,
    filters: ClientSearchFilter = {},
    pagination: PaginationParams = { page: 1, limit: 20 },
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ clients: IClientDocument[]; total: number }> {
    try {
      // ページネーションパラメータのデフォルト値を設定
      const page = pagination.page ?? 1;
      const limit = pagination.limit ?? 20;
      
      logger.debug('Finding all clients', { organizationId, filters, pagination: { page, limit } });

      // クエリ構築
      const query: FilterQuery<IClientDocument> = { organizationId };

      // 検索条件の適用
      if (filters.searchTerm) {
        query.$or = [
          { name: { $regex: filters.searchTerm, $options: 'i' } },
          { email: { $regex: filters.searchTerm, $options: 'i' } },
          { phoneNumber: { $regex: filters.searchTerm, $options: 'i' } },
        ];
      }

      if (filters.gender) {
        query.gender = filters.gender;
      }

      if (filters.birthDateFrom || filters.birthDateTo) {
        query.birthDate = {};
        if (filters.birthDateFrom) {
          query.birthDate.$gte = new Date(filters.birthDateFrom);
        }
        if (filters.birthDateTo) {
          query.birthDate.$lte = new Date(filters.birthDateTo);
        }
      }

      if (filters.missingBirthDate === true) {
        query.birthDate = { $exists: false };
      }

      // ページネーションの計算
      const skip = (page - 1) * limit;
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // クエリ実行
      const [clients, total] = await Promise.all([
        ClientModel.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        ClientModel.countDocuments(query),
      ]);

      // デバッグ：取得したデータの詳細を確認
      logger.info('Clients retrieved successfully', {
        organizationId,
        count: clients.length,
        total,
        firstClient: clients[0] ? {
          id: clients[0].id,
          name: clients[0].name,
          email: clients[0].email,
          collection: clients[0].collection.name,
          hasRole: 'role' in clients[0],
          keys: Object.keys(clients[0].toJSON()),
        } : null,
      });

      return { clients, total };
    } catch (error) {
      logger.error('Failed to find clients', { error, organizationId });
      throw error;
    }
  }

  /**
   * クライアント情報を更新
   */
  async update(
    id: string,
    organizationId: string,
    data: Partial<IClientDocument>
  ): Promise<IClientDocument | null> {
    try {
      logger.debug('Updating client', { clientId: id, organizationId });

      const client = await ClientModel.findOneAndUpdate(
        { _id: id, organizationId },
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!client) {
        logger.warn('Client not found for update', { clientId: id, organizationId });
      } else {
        logger.info('Client updated successfully', { clientId: id });
      }

      return client;
    } catch (error) {
      logger.error('Failed to update client', { error, clientId: id });
      throw error;
    }
  }

  /**
   * クライアントを削除
   */
  async delete(id: string, organizationId: string): Promise<boolean> {
    try {
      logger.debug('Deleting client', { clientId: id, organizationId });

      const result = await ClientModel.deleteOne({ _id: id, organizationId });
      const deleted = result.deletedCount > 0;

      if (deleted) {
        logger.info('Client deleted successfully', { clientId: id });
      } else {
        logger.warn('Client not found for deletion', { clientId: id, organizationId });
      }

      return deleted;
    } catch (error) {
      logger.error('Failed to delete client', { error, clientId: id });
      throw error;
    }
  }

  /**
   * 名前と組織IDでクライアントを検索
   */
  async findByNameAndOrganization(
    name: string,
    organizationId: string
  ): Promise<IClientDocument | null> {
    try {
      logger.debug('Finding client by name and organization', { name, organizationId });
      const client = await ClientModel.findOne({ name, organizationId });
      
      if (!client) {
        logger.debug('Client not found by name', { name, organizationId });
      }
      
      return client;
    } catch (error) {
      logger.error('Failed to find client by name', { error, name, organizationId });
      throw error;
    }
  }

  /**
   * クライアント情報を更新（エイリアスメソッド）
   */
  async updateClient(
    id: string,
    organizationId: string,
    data: Partial<IClientDocument>
  ): Promise<IClientDocument | null> {
    return this.update(id, organizationId, data);
  }

  /**
   * クライアントを作成（エイリアスメソッド）
   */
  async createClient(data: Partial<IClientDocument>): Promise<IClientDocument> {
    return this.create(data);
  }

  /**
   * 重複チェック（メールアドレスまたは電話番号）
   */
  async checkDuplicate(
    organizationId: string,
    email?: string,
    phoneNumber?: string,
    excludeId?: string
  ): Promise<IClientDocument | null> {
    try {
      logger.debug('Checking for duplicate client', {
        organizationId,
        email,
        phoneNumber,
        excludeId,
      });

      const duplicate = await ClientModel.findDuplicate(
        organizationId,
        email,
        phoneNumber,
        excludeId
      );

      if (duplicate) {
        logger.warn('Duplicate client found', {
          duplicateId: duplicate._id,
          email,
          phoneNumber,
        });
      }

      return duplicate;
    } catch (error) {
      logger.error('Failed to check duplicate client', { error });
      throw error;
    }
  }

  /**
   * 本日の担当クライアントを取得（予約データから取得）
   */
  async findDailyClients(
    organizationId: string,
    stylistId?: string,
    date?: Date
  ): Promise<IClientDocument[]> {
    try {
      const targetDate = date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      logger.debug('Finding daily clients', {
        organizationId,
        stylistId,
        date: startOfDay,
      });

      // 予約データから本日の予約のあるクライアントIDを取得
      const { AppointmentModel } = await import('../../appointments/models/appointment.model');
      
      const appointmentQuery: any = {
        organizationId,
        scheduledAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      };

      // スタイリストIDが指定されている場合はフィルタリング
      if (stylistId) {
        appointmentQuery.stylistId = stylistId;
      }

      // 今日の予約を取得
      const appointments = await AppointmentModel.find(appointmentQuery);
      
      // 予約のあるクライアントIDを取得
      const clientIds = [...new Set(appointments.map(apt => apt.clientId))];

      logger.debug('Found appointments for daily clients', {
        appointmentCount: appointments.length,
        uniqueClientCount: clientIds.length,
      });

      if (clientIds.length === 0) {
        return [];
      }

      // クライアント情報を取得
      const clients = await ClientModel.find({
        _id: { $in: clientIds },
        organizationId,
      }).sort({ name: 1 });

      logger.info('Daily clients retrieved', {
        organizationId,
        stylistId,
        count: clients.length,
      });

      return clients;
    } catch (error) {
      logger.error('Failed to find daily clients', { error });
      throw error;
    }
  }

  /**
   * クライアントの訪問情報を更新
   */
  async updateVisitInfo(id: string, organizationId: string): Promise<IClientDocument | null> {
    try {
      logger.debug('Updating client visit info', { clientId: id, organizationId });

      const client = await this.findById(id, organizationId);
      if (!client) {
        return null;
      }

      await client.updateVisit();
      logger.info('Client visit info updated', { clientId: id });

      return client;
    } catch (error) {
      logger.error('Failed to update client visit info', { error, clientId: id });
      throw error;
    }
  }

  /**
   * スタイリストの担当クライアント一覧を取得
   */
  async findStylistClients(
    organizationId: string,
    stylistId: string,
    pagination: PaginationParams = { page: 1, limit: 50 }
  ): Promise<{ clients: IClientDocument[]; total: number }> {
    try {
      const page = pagination.page ?? 1;
      const limit = pagination.limit ?? 50;
      const skip = (page - 1) * limit;

      logger.debug('Finding stylist clients', { organizationId, stylistId, pagination: { page, limit } });

      // 予約データからスタイリストが担当したことのあるクライアントIDを取得
      const { AppointmentModel } = await import('../../appointments/models/appointment.model');
      
      // スタイリストが担当した予約を全て取得（過去・現在・未来問わず）
      const appointments = await AppointmentModel.find({
        organizationId,
        stylistId,
      }).select('clientId');
      
      // 重複を除いたクライアントIDリストを作成
      const uniqueClientIds = [...new Set(appointments.map(apt => apt.clientId.toString()))];

      logger.debug('Found appointments for stylist', {
        appointmentCount: appointments.length,
        uniqueClientCount: uniqueClientIds.length,
      });

      if (uniqueClientIds.length === 0) {
        return { clients: [], total: 0 };
      }

      // クライアント情報を取得（ページネーション付き）
      const [clients, total] = await Promise.all([
        ClientModel.find({
          _id: { $in: uniqueClientIds },
          organizationId,
        })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
        ClientModel.countDocuments({
          _id: { $in: uniqueClientIds },
          organizationId,
        }),
      ]);

      logger.info('Stylist clients retrieved', {
        organizationId,
        stylistId,
        count: clients.length,
        total,
      });

      return { clients, total };
    } catch (error) {
      logger.error('Failed to find stylist clients', { error, organizationId, stylistId });
      throw error;
    }
  }
}