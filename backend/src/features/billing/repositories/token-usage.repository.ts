import { FilterQuery } from 'mongoose';
import { TokenUsage, ITokenUsage } from '../models/token-usage.model';
import { ID } from '../../../types/index';
import { logger } from '../../../common/utils/logger';

export class TokenUsageRepository {
  async create(data: Partial<ITokenUsage>): Promise<ITokenUsage> {
    try {
      const tokenUsage = new TokenUsage(data);
      await tokenUsage.save();
      return tokenUsage;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create token usage record', { error: errorMessage, data });
      throw new Error(`トークン使用量記録作成に失敗しました: ${errorMessage}`);
    }
  }

  async findByOrganizationId(organizationId: ID, limit?: number): Promise<ITokenUsage[]> {
    try {
      const query = TokenUsage.find({ organizationId })
        .populate('userId')
        .sort({ timestamp: -1 });
      
      if (limit) {
        query.limit(limit);
      }
      
      return await query.exec();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find token usage by organization', { error: errorMessage, organizationId });
      throw new Error(`組織のトークン使用量取得に失敗しました: ${errorMessage}`);
    }
  }

  async findByUserId(userId: ID, limit?: number): Promise<ITokenUsage[]> {
    try {
      const query = TokenUsage.find({ userId }).sort({ timestamp: -1 });
      
      if (limit) {
        query.limit(limit);
      }
      
      return await query.exec();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find token usage by user', { error: errorMessage, userId });
      throw new Error(`ユーザーのトークン使用量取得に失敗しました: ${errorMessage}`);
    }
  }

  async getUsageSummaryByOrganization(
    organizationId: ID,
    startDate: Date,
    endDate: Date
  ): Promise<{ totalTokens: number; totalCost: number; usageCount: number }> {
    try {
      const result = await TokenUsage.aggregate([
        {
          $match: {
            organizationId: organizationId,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalTokens: { $sum: '$tokens' },
            totalCost: { $sum: '$cost' },
            usageCount: { $sum: 1 }
          }
        }
      ]);

      return result.length > 0 
        ? result[0] 
        : { totalTokens: 0, totalCost: 0, usageCount: 0 };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get usage summary by organization', { error: errorMessage, organizationId });
      throw new Error(`組織のトークン使用量サマリー取得に失敗しました: ${errorMessage}`);
    }
  }

  async getUsageSummaryByUser(
    userId: ID,
    startDate: Date,
    endDate: Date
  ): Promise<{ totalTokens: number; totalCost: number; usageCount: number }> {
    try {
      const result = await TokenUsage.aggregate([
        {
          $match: {
            userId: userId,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalTokens: { $sum: '$tokens' },
            totalCost: { $sum: '$cost' },
            usageCount: { $sum: 1 }
          }
        }
      ]);

      return result.length > 0 
        ? result[0] 
        : { totalTokens: 0, totalCost: 0, usageCount: 0 };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get usage summary by user', { error: errorMessage, userId });
      throw new Error(`ユーザーのトークン使用量サマリー取得に失敗しました: ${errorMessage}`);
    }
  }

  async getDailyUsageByOrganization(
    organizationId: ID,
    days: number = 30
  ): Promise<Array<{ date: string; totalTokens: number; totalCost: number }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await TokenUsage.aggregate([
        {
          $match: {
            organizationId: organizationId,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            totalTokens: { $sum: '$tokens' },
            totalCost: { $sum: '$cost' }
          }
        },
        {
          $project: {
            date: '$_id',
            totalTokens: 1,
            totalCost: 1,
            _id: 0
          }
        },
        { $sort: { date: 1 } }
      ]);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get daily usage by organization', { error: errorMessage, organizationId });
      throw new Error(`組織の日別トークン使用量取得に失敗しました: ${errorMessage}`);
    }
  }

  async getTopUsersByUsage(
    organizationId: ID,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<Array<{ userId: ID; totalTokens: number; totalCost: number }>> {
    try {
      const result = await TokenUsage.aggregate([
        {
          $match: {
            organizationId: organizationId,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$userId',
            totalTokens: { $sum: '$tokens' },
            totalCost: { $sum: '$cost' }
          }
        },
        {
          $project: {
            userId: '$_id',
            totalTokens: 1,
            totalCost: 1,
            _id: 0
          }
        },
        { $sort: { totalTokens: -1 } },
        { $limit: limit }
      ]);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get top users by usage', { error: errorMessage, organizationId });
      throw new Error(`使用量上位ユーザー取得に失敗しました: ${errorMessage}`);
    }
  }

  async findAll(filter: FilterQuery<ITokenUsage> = {}): Promise<ITokenUsage[]> {
    try {
      return await TokenUsage.find(filter)
        .populate('organizationId')
        .populate('userId')
        .sort({ timestamp: -1 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find token usage records', { error: errorMessage, filter });
      throw new Error(`トークン使用量一覧取得に失敗しました: ${errorMessage}`);
    }
  }

  async deleteOldRecords(daysToKeep: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await TokenUsage.deleteMany({ timestamp: { $lt: cutoffDate } });
      
      if (result.deletedCount > 0) {
        logger.info('Old token usage records deleted', { deletedCount: result.deletedCount, cutoffDate });
      }
      
      return result.deletedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete old token usage records', { error: errorMessage, daysToKeep });
      throw new Error(`古いトークン使用量記録削除に失敗しました: ${errorMessage}`);
    }
  }
}

export const tokenUsageRepository = new TokenUsageRepository();