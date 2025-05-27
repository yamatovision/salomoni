import { Request, Response, NextFunction } from 'express';
import { sajuService } from '../services/saju.service';
import { logger } from '../../../common/utils/logger';
import { ApiResponse } from '../../../types';
import { BadRequestError } from '../../../common/utils/errors';

export class SajuController {
  /**
   * 四柱推命計算実行
   */
  async calculate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('[SajuController] 四柱推命計算リクエスト受信', {
        userId: req.user?.userId,
        body: req.body
      });

      const result = await sajuService.calculateFourPillars(req.body);

      const response: ApiResponse<any> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('[SajuController] 四柱推命計算エラー', error);
      next(error);
    }
  }

  /**
   * 四柱推命マスターデータ取得
   */
  async getMasters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('[SajuController] マスターデータ取得リクエスト受信', {
        userId: req.user?.userId
      });

      const result = await sajuService.getMasterData();

      const response: ApiResponse<any> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('[SajuController] マスターデータ取得エラー', error);
      next(error);
    }
  }

  /**
   * 追加分析実行
   */
  async analyze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('[SajuController] 追加分析リクエスト受信', {
        userId: req.user?.userId,
        analysisType: req.body.analysisType
      });

      const result = await sajuService.analyzeFourPillars(req.body);

      const response: ApiResponse<any> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('[SajuController] 追加分析エラー', error);
      next(error);
    }
  }

  /**
   * 相性診断実行
   */
  async compatibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('[SajuController] 相性診断リクエスト受信', {
        userId: req.user?.userId,
        userCount: req.body.users?.length
      });

      const result = await sajuService.calculateCompatibility(req.body);

      const response: ApiResponse<any> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('[SajuController] 相性診断エラー', error);
      next(error);
    }
  }

  /**
   * ユーザーの四柱推命プロフィール取得
   */
  async getUserFourPillars(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        throw new BadRequestError('ユーザーIDが必要です');
      }
      
      logger.info('[SajuController] ユーザー四柱推命プロフィール取得リクエスト受信', {
        requestingUserId: req.user?.userId,
        targetUserId: userId
      });

      const result = await sajuService.getUserFourPillars(userId);

      const response: ApiResponse<any> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('[SajuController] ユーザー四柱推命プロフィール取得エラー', error);
      next(error);
    }
  }

  /**
   * 日本の都道府県リスト取得
   */
  async getJapanesePrefectures(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('[SajuController] 日本の都道府県リスト取得リクエスト受信', {
        userId: req.user?.userId
      });

      const result = await sajuService.getJapanesePrefectures();

      const response: ApiResponse<any> = {
        success: true,
        data: result
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('[SajuController] 日本の都道府県リスト取得エラー', error);
      next(error);
    }
  }
}

// シングルトンインスタンスをエクスポート
export const sajuController = new SajuController();