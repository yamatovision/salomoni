import { DailyFortuneModel } from '../models/daily-fortune.model';
import { FortuneCardModel } from '../models/fortune-card.model';
import { DailyAdviceModel } from '../models/daily-advice.model';
import { DailyFortune, FortuneCard, DailyAdviceData, ID } from '../../../types';
import { AppError } from '../../../common/utils/errors';
import { logger } from '../../../common/utils/logger';

export class FortuneRepository {
  /**
   * 日本時間での日付範囲を計算するユーティリティ関数
   * @param date 対象日付
   * @returns 日本時間の0:00:00から23:59:59までの範囲
   */
  private getJSTDateRange(date: Date): { start: Date; end: Date } {
    // 日本時間の0:00:00を計算
    const jstOffset = 9 * 60; // JST is UTC+9 (minutes)
    const inputDate = new Date(date);
    
    // 入力日付の日本時間での日付部分を取得
    const jstDate = new Date(inputDate.getTime() + jstOffset * 60 * 1000);
    const year = jstDate.getUTCFullYear();
    const month = jstDate.getUTCMonth();
    const day = jstDate.getUTCDate();
    
    // 日本時間の0:00:00 (UTC時刻で前日の15:00:00)
    const startOfDayJST = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    startOfDayJST.setUTCMinutes(startOfDayJST.getUTCMinutes() - jstOffset);
    
    // 日本時間の23:59:59.999
    const endOfDayJST = new Date(startOfDayJST);
    endOfDayJST.setUTCHours(endOfDayJST.getUTCHours() + 23);
    endOfDayJST.setUTCMinutes(endOfDayJST.getUTCMinutes() + 59);
    endOfDayJST.setUTCSeconds(59);
    endOfDayJST.setUTCMilliseconds(999);
    
    logger.info(`[FortuneRepository] 日付範囲計算:`, {
      inputDate: inputDate.toISOString(),
      jstDate: `${year}-${month + 1}-${day}`,
      startUTC: startOfDayJST.toISOString(),
      endUTC: endOfDayJST.toISOString()
    });
    
    return { start: startOfDayJST, end: endOfDayJST };
  }

  /**
   * ローカルタイムゾーンでの日付範囲を計算するユーティリティ関数
   * @param date 対象日付
   * @param timezone タイムゾーン文字列 (例: 'America/New_York', 'Europe/London')
   * @returns 指定タイムゾーンの0:00:00から23:59:59までの範囲
   */
  private getLocalDateRange(date: Date, timezone: string): { start: Date; end: Date } {
    try {
      // 入力日付を指定タイムゾーンで解釈
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const parts = formatter.formatToParts(date);
      const dateComponents: any = {};
      parts.forEach(part => {
        if (part.type !== 'literal') {
          dateComponents[part.type] = part.value;
        }
      });

      // タイムゾーンの0:00:00を計算
      const year = parseInt(dateComponents.year);
      const month = parseInt(dateComponents.month) - 1; // JavaScriptの月は0ベース
      const day = parseInt(dateComponents.day);

      // 該当タイムゾーンの0:00:00と23:59:59をUTCで計算
      const startLocal = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`);
      const endLocal = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59.999`);

      // タイムゾーンオフセットを取得して適用
      const startFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });

      const startStr = startFormatter.format(startLocal);
      const endStr = startFormatter.format(new Date(endLocal));

      logger.info(`[FortuneRepository] ローカル日付範囲計算:`, {
        inputDate: date.toISOString(),
        timezone,
        localDate: `${year}-${month + 1}-${day}`,
        startLocal: startStr,
        endLocal: endStr
      });

      return { start: startLocal, end: endLocal };
    } catch (error) {
      logger.warn(`[FortuneRepository] タイムゾーン処理エラー、JSTにフォールバック:`, error);
      // エラー時はJSTにフォールバック
      return this.getJSTDateRange(date);
    }
  }
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
    date?: Date,
    timezone?: string
  ): Promise<DailyFortune | null> {
    try {
      const query: any = {};
      if (userId) query.userId = userId;
      if (clientId) query.clientId = clientId;
      if (date) {
        const { start, end } = timezone 
          ? this.getLocalDateRange(date, timezone)
          : this.getJSTDateRange(date);
        query.date = { $gte: start, $lte: end };
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
    date?: Date,
    timezone?: string
  ): Promise<DailyAdviceData | null> {
    try {
      const query: any = { userId };
      if (date) {
        const { start, end } = timezone 
          ? this.getLocalDateRange(date, timezone)
          : this.getJSTDateRange(date);
        query.date = { $gte: start, $lte: end };
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