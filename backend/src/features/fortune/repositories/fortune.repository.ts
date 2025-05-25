import { DailyFortuneModel } from '../models/daily-fortune.model';
import { FortuneCardModel } from '../models/fortune-card.model';
import { DailyAdviceModel } from '../models/daily-advice.model';
import { DailyFortune, FortuneCard, DailyAdviceData, ID } from '../../../types';
import { AppError } from '../../../common/utils/errors';
import { logger } from '../../../common/utils/logger';

export class FortuneRepository {
  // 日運データの作成または更新
  async upsertDailyFortune(fortuneData: Partial<DailyFortune>): Promise<DailyFortune> {
    try {
      const query = fortuneData.userId
        ? { userId: fortuneData.userId, date: fortuneData.date }
        : { clientId: fortuneData.clientId, date: fortuneData.date };

      const fortune = await DailyFortuneModel.findOneAndUpdate(
        query,
        { $set: fortuneData },
        { new: true, upsert: true, runValidators: true }
      );

      logger.info('[FortuneRepository] 日運データを保存しました', {
        id: fortune._id,
        userId: fortune.userId,
        clientId: fortune.clientId,
        date: fortune.date,
      });

      return fortune.toJSON() as unknown as DailyFortune;
    } catch (error) {
      logger.error('[FortuneRepository] 日運データ保存エラー:', error);
      throw new AppError('Failed to save daily fortune', 500, 'FORTUNE_SAVE_ERROR');
    }
  }

  // 日運データの取得
  async findDailyFortune(
    userId?: ID,
    clientId?: ID,
    date?: Date
  ): Promise<DailyFortune | null> {
    try {
      const query: any = {};
      if (userId) query.userId = userId;
      if (clientId) query.clientId = clientId;
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        query.date = { $gte: startOfDay, $lte: endOfDay };
      }

      const fortune = await DailyFortuneModel.findOne(query);
      return fortune ? (fortune.toJSON() as unknown as DailyFortune) : null;
    } catch (error) {
      logger.error('[FortuneRepository] 日運データ取得エラー:', error);
      throw new AppError('Failed to fetch daily fortune', 500, 'FORTUNE_FETCH_ERROR');
    }
  }

  // 運勢カードの作成
  async createFortuneCard(cardData: Partial<FortuneCard>): Promise<FortuneCard> {
    try {
      const card = new FortuneCardModel(cardData);
      await card.save();

      logger.info('[FortuneRepository] 運勢カードを作成しました', {
        id: card._id,
        category: card.category,
        title: card.title,
      });

      return card.toJSON() as unknown as FortuneCard;
    } catch (error) {
      logger.error('[FortuneRepository] 運勢カード作成エラー:', error);
      throw new AppError('Failed to create fortune card', 500, 'CARD_CREATE_ERROR');
    }
  }

  // 運勢カードの検索
  async findFortuneCards(
    category?: string,
    limit = 10
  ): Promise<FortuneCard[]> {
    try {
      const query = category ? { category } : {};
      const cards = await FortuneCardModel.find(query).limit(limit);
      return cards.map(card => card.toJSON() as unknown as FortuneCard);
    } catch (error) {
      logger.error('[FortuneRepository] 運勢カード検索エラー:', error);
      throw new AppError('Failed to fetch fortune cards', 500, 'CARD_FETCH_ERROR');
    }
  }

  // デイリーアドバイスの作成または更新
  async upsertDailyAdvice(adviceData: Partial<DailyAdviceData>): Promise<DailyAdviceData> {
    try {
      const query = { userId: adviceData.userId, date: adviceData.date };

      const advice = await DailyAdviceModel.findOneAndUpdate(
        query,
        { $set: adviceData },
        { new: true, upsert: true, runValidators: true }
      );

      logger.info('[FortuneRepository] デイリーアドバイスを保存しました', {
        id: advice._id,
        userId: advice.userId,
        date: advice.date,
      });

      return advice.toJSON() as unknown as DailyAdviceData;
    } catch (error) {
      logger.error('[FortuneRepository] デイリーアドバイス保存エラー:', error);
      throw new AppError('Failed to save daily advice', 500, 'ADVICE_SAVE_ERROR');
    }
  }

  // デイリーアドバイスの取得
  async findDailyAdvice(
    userId: ID,
    date?: Date
  ): Promise<DailyAdviceData | null> {
    try {
      const query: any = { userId };
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        query.date = { $gte: startOfDay, $lte: endOfDay };
      }

      const advice = await DailyAdviceModel.findOne(query).sort({ date: -1 });
      return advice ? (advice.toJSON() as unknown as DailyAdviceData) : null;
    } catch (error) {
      logger.error('[FortuneRepository] デイリーアドバイス取得エラー:', error);
      throw new AppError('Failed to fetch daily advice', 500, 'ADVICE_FETCH_ERROR');
    }
  }

  // 期限切れデータのクリーンアップ
  async cleanupExpiredData(): Promise<void> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 30日以上前の日運データを削除
      const fortuneResult = await DailyFortuneModel.deleteMany({
        date: { $lt: thirtyDaysAgo },
      });

      logger.info('[FortuneRepository] 期限切れデータをクリーンアップしました', {
        deletedFortunes: fortuneResult.deletedCount,
      });
    } catch (error) {
      logger.error('[FortuneRepository] クリーンアップエラー:', error);
      // クリーンアップの失敗は致命的ではないので、エラーをログに記録するのみ
    }
  }
}