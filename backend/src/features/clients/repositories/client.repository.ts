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

      logger.info('Clients retrieved successfully', {
        organizationId,
        count: clients.length,
        total,
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
   * 本日の担当クライアントを取得（予約データとの結合が必要）
   * ※ この実装は予約機能実装後に拡張される予定
   */
  async findDailyClients(
    organizationId: string,
    stylistId?: string,
    date?: Date
  ): Promise<IClientDocument[]> {
    try {
      const targetDate = date || new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      logger.debug('Finding daily clients', {
        organizationId,
        stylistId,
        date: startOfDay,
      });

      // TODO: 予約データとの結合処理を実装
      // 現時点では最近訪問したクライアントを返す暫定実装
      const clients = await ClientModel.find({
        organizationId,
        lastVisitDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      })
        .sort({ lastVisitDate: -1 })
        .limit(10);

      logger.info('Daily clients retrieved', {
        organizationId,
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
}