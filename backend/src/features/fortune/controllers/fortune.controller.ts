import { Request, Response, NextFunction } from 'express';
import { FortuneService } from '../services/fortune.service';
import { ApiResponse, ID } from '../../../types';
import { AppError } from '../../../common/utils/errors';

export class FortuneController {
  private fortuneService: FortuneService;

  constructor() {
    this.fortuneService = new FortuneService();
  }

  /**
   * 日運データ取得
   * GET /api/fortune/daily
   */
  getDailyFortune = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId, clientId, date } = req.query;
      
      const targetDate = date ? new Date(date as string) : new Date();

      const fortune = await this.fortuneService.getDailyFortune(
        userId as ID | undefined,
        clientId as ID | undefined,
        targetDate
      );

      const response: ApiResponse<any> = {
        success: true,
        data: fortune,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * AIアドバイス生成
   * GET /api/fortune/users/:userId/daily-advice
   */
  getDailyAdvice = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.params;
      const { date, regenerate, timezone } = req.query;

      if (!userId) {
        throw new AppError('ユーザーIDは必須です', 400, 'USER_ID_REQUIRED');
      }

      const targetDate = date ? new Date(date as string) : new Date();
      const shouldRegenerate = regenerate === 'true';
      const userTimezone = timezone as string | undefined;

      const advice = await this.fortuneService.getDailyAdvice(
        userId,
        targetDate,
        shouldRegenerate,
        userTimezone
      );

      const response: ApiResponse<any> = {
        success: true,
        data: advice,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 運勢カード取得
   * GET /api/fortune/cards
   */
  getFortuneCards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { category, limit } = req.query;

      const cards = await this.fortuneService.getFortuneCards(
        category as string | undefined,
        limit ? parseInt(limit as string) : undefined
      );

      const response: ApiResponse<any> = {
        success: true,
        data: cards,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 本日の相性スタイリスト取得
   * GET /api/fortune/compatibility/today
   */
  getCompatibilityToday = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId, limit } = req.query;

      if (!userId) {
        throw new AppError('ユーザーIDは必須です', 400, 'USER_ID_REQUIRED');
      }

      const compatibleStylists = await this.fortuneService.getCompatibilityToday(
        userId as ID,
        limit ? parseInt(limit as string) : undefined
      );

      const response: ApiResponse<any> = {
        success: true,
        data: compatibleStylists,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 週間運勢取得（将来実装予定）
   * GET /api/fortune/weekly
   */
  getWeeklyFortune = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // TODO: 実装予定
      const response: ApiResponse<any> = {
        success: true,
        data: {
          message: '週間運勢機能は開発中です',
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 月間運勢取得（将来実装予定）
   * GET /api/fortune/monthly
   */
  getMonthlyFortune = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // TODO: 実装予定
      const response: ApiResponse<any> = {
        success: true,
        data: {
          message: '月間運勢機能は開発中です',
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * アドバイス再生成（将来実装予定）
   * POST /api/fortune/users/:userId/regenerate
   */
  regenerateAdvice = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.params;
      const { date } = req.body;

      if (!userId) {
        throw new AppError('ユーザーIDは必須です', 400, 'USER_ID_REQUIRED');
      }

      const targetDate = date ? new Date(date) : new Date();

      // 再生成フラグをtrueにしてアドバイスを取得
      const advice = await this.fortuneService.getDailyAdvice(
        userId,
        targetDate,
        true
      );

      const response: ApiResponse<any> = {
        success: true,
        data: advice,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * スタイリスト向け運勢詳細取得（将来実装予定）
   * GET /api/fortune/stylists/:userId/detail
   */
  getStylistFortuneDetail = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // TODO: 実装予定
      const response: ApiResponse<any> = {
        success: true,
        data: {
          message: 'スタイリスト向け運勢詳細機能は開発中です',
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}