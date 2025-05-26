import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { UserRole } from '../../../types';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/errors';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  /**
   * 管理者ダッシュボードデータを取得
   */
  async getAdminDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new AppError('認証が必要です', 401);
      }

      // 権限チェック
      if (![UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.currentRole)) {
        throw new AppError('このリソースへのアクセス権限がありません', 403);
      }

      logger.info('管理者ダッシュボードデータ取得開始', {
        userId: user.id,
        organizationId: user.organizationId,
        role: user.currentRole
      });

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new AppError('組織IDが指定されていません', 400);
      }

      // ダッシュボードサマリーを取得
      const dashboardSummary = await this.dashboardService.getDashboardSummary(organizationId);

      // チャートデータを取得
      const chartData = await this.dashboardService.getDashboardChartData(organizationId);

      // レスポンスデータを構築
      const responseData = {
        ...dashboardSummary,
        charts: chartData
      };

      logger.info('管理者ダッシュボードデータ取得成功', {
        userId: user.id,
        organizationId,
        todayAppointments: dashboardSummary.todayAppointments,
        totalClients: dashboardSummary.totalClients,
        totalStylists: dashboardSummary.totalStylists
      });

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      logger.error('管理者ダッシュボードデータ取得エラー', {
        error,
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });
      next(error);
    }
  }

  /**
   * ダッシュボード統計情報を取得（軽量版）
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new AppError('認証が必要です', 401);
      }

      // 権限チェック
      if (![UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.currentRole)) {
        throw new AppError('このリソースへのアクセス権限がありません', 403);
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new AppError('組織IDが指定されていません', 400);
      }

      // サマリーのみ取得（チャートデータは含まない）
      const dashboardSummary = await this.dashboardService.getDashboardSummary(organizationId);

      logger.info('ダッシュボード統計情報取得成功', {
        userId: user.id,
        organizationId
      });

      res.json({
        success: true,
        data: dashboardSummary
      });
    } catch (error) {
      logger.error('ダッシュボード統計情報取得エラー', {
        error,
        userId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * トークン使用状況チャートデータを取得
   */
  async getTokenUsageChart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new AppError('認証が必要です', 401);
      }

      // 権限チェック
      if (![UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.currentRole)) {
        throw new AppError('このリソースへのアクセス権限がありません', 403);
      }

      const organizationId = user.organizationId;
      if (!organizationId) {
        throw new AppError('組織IDが指定されていません', 400);
      }

      // チャートデータを取得
      const chartData = await this.dashboardService.getDashboardChartData(organizationId);

      logger.info('トークン使用状況チャートデータ取得成功', {
        userId: user.id,
        organizationId
      });

      res.json({
        success: true,
        data: chartData.tokenUsageChart
      });
    } catch (error) {
      logger.error('トークン使用状況チャートデータ取得エラー', {
        error,
        userId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * リアルタイムダッシュボード更新（将来の拡張用）
   */
  async subscribeToDashboardUpdates(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // SSE（Server-Sent Events）を使用したリアルタイム更新の実装予定
      res.status(501).json({
        success: false,
        error: 'リアルタイム更新機能は準備中です'
      });
    } catch (error) {
      next(error);
    }
  }
}