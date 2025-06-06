import { FourPillarsDataModel } from '../models/four-pillars-data.model';
import { FourPillarsData, ID } from '../../../types';
import { logger } from '../../../common/utils/logger';

export class FourPillarsDataRepository {
  
  /**
   * 四柱推命データを作成
   */
  async create(data: Omit<FourPillarsData, '_id' | 'calculatedAt'>): Promise<FourPillarsData> {
    try {
      logger.info('四柱推命データ作成開始', { userId: data.userId, clientId: data.clientId });
      
      const fourPillarsData = new FourPillarsDataModel(data);
      const savedData = await fourPillarsData.save();
      
      logger.info('四柱推命データ作成完了', { 
        id: savedData._id,
        userId: data.userId,
        clientId: data.clientId
      });
      
      return savedData.toJSON() as unknown as FourPillarsData;
    } catch (error) {
      logger.error('四柱推命データ作成エラー:', error);
      throw new Error('四柱推命データの作成に失敗しました');
    }
  }

  /**
   * IDで四柱推命データを取得
   */
  async findById(id: ID): Promise<FourPillarsData | null> {
    try {
      const data = await FourPillarsDataModel.findById(id);
      return data ? (data.toJSON() as unknown as FourPillarsData) : null;
    } catch (error) {
      logger.error('四柱推命データ取得エラー:', error);
      throw new Error('四柱推命データの取得に失敗しました');
    }
  }

  /**
   * ユーザーIDで最新の四柱推命データを取得
   */
  async findLatestByUserId(userId: ID): Promise<FourPillarsData | null> {
    try {
      logger.info('ユーザーの四柱推命データ取得開始', { userId });
      
      const data = await FourPillarsDataModel.findLatestByUserId(userId);
      
      if (data) {
        logger.info('ユーザーの四柱推命データ取得完了', { 
          userId,
          dataId: data._id,
          calculatedAt: data.calculatedAt
        });
      } else {
        logger.info('ユーザーの四柱推命データが見つかりません', { userId });
      }
      
      return data ? (data.toJSON() as unknown as FourPillarsData) : null;
    } catch (error) {
      logger.error('ユーザーの四柱推命データ取得エラー:', error);
      throw new Error('ユーザーの四柱推命データの取得に失敗しました');
    }
  }

  /**
   * クライアントIDで最新の四柱推命データを取得
   */
  async findLatestByClientId(clientId: ID): Promise<FourPillarsData | null> {
    try {
      logger.info('クライアントの四柱推命データ取得開始', { clientId });
      
      const data = await FourPillarsDataModel.findLatestByClientId(clientId);
      
      if (data) {
        logger.info('クライアントの四柱推命データ取得完了', { 
          clientId,
          dataId: data._id,
          calculatedAt: data.calculatedAt
        });
      } else {
        logger.info('クライアントの四柱推命データが見つかりません', { clientId });
      }
      
      return data ? (data.toJSON() as unknown as FourPillarsData) : null;
    } catch (error) {
      logger.error('クライアントの四柱推命データ取得エラー:', error);
      throw new Error('クライアントの四柱推命データの取得に失敗しました');
    }
  }

  /**
   * ユーザーIDで四柱推命データを削除
   */
  async deleteByUserId(userId: ID): Promise<boolean> {
    try {
      logger.info('ユーザーの四柱推命データ削除開始', { userId });
      
      const result = await FourPillarsDataModel.deleteMany({ userId });
      
      logger.info('ユーザーの四柱推命データ削除完了', { 
        userId,
        deletedCount: result.deletedCount
      });
      
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('ユーザーの四柱推命データ削除エラー:', error);
      throw new Error('ユーザーの四柱推命データの削除に失敗しました');
    }
  }

  /**
   * クライアントIDで四柱推命データを削除
   */
  async deleteByClientId(clientId: ID): Promise<boolean> {
    try {
      logger.info('クライアントの四柱推命データ削除開始', { clientId });
      
      const result = await FourPillarsDataModel.deleteMany({ clientId });
      
      logger.info('クライアントの四柱推命データ削除完了', { 
        clientId,
        deletedCount: result.deletedCount
      });
      
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('クライアントの四柱推命データ削除エラー:', error);
      throw new Error('クライアントの四柱推命データの削除に失敗しました');
    }
  }

  /**
   * 四柱推命データを更新（通常は使わないが、必要に応じて）
   */
  async updateById(id: ID, updateData: Partial<FourPillarsData>): Promise<FourPillarsData | null> {
    try {
      logger.info('四柱推命データ更新開始', { id });
      
      const updatedData = await FourPillarsDataModel.findByIdAndUpdate(
        id,
        { ...updateData, calculatedAt: new Date() },
        { new: true }
      );
      
      if (updatedData) {
        logger.info('四柱推命データ更新完了', { id });
      } else {
        logger.warn('更新対象の四柱推命データが見つかりません', { id });
      }
      
      return updatedData ? (updatedData.toJSON() as unknown as FourPillarsData) : null;
    } catch (error) {
      logger.error('四柱推命データ更新エラー:', error);
      throw new Error('四柱推命データの更新に失敗しました');
    }
  }

  /**
   * ユーザーまたはクライアントが既に四柱推命データを持っているかチェック
   */
  async existsByUserOrClient(userId?: ID, clientId?: ID): Promise<boolean> {
    try {
      if (!userId && !clientId) {
        return false;
      }

      const query: any = {};
      if (userId) query.userId = userId;
      if (clientId) query.clientId = clientId;

      const count = await FourPillarsDataModel.countDocuments(query);
      return count > 0;
    } catch (error) {
      logger.error('四柱推命データ存在チェックエラー:', error);
      throw new Error('四柱推命データの存在チェックに失敗しました');
    }
  }
}