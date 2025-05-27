import { RevenueSimulationRepository } from '../repositories/revenue-simulation.repository';
import { Plan } from '../../plans/models/plan.model';
import { PlanType, BillingCycle } from '../../plans/models/plan.model';
import { logger } from '../../../common/utils/logger';

export interface SimulationData {
  currentOrganizations: {
    total: number;
    active: number;
    trial: number;
    byPlan: Record<string, number>;
  };
  revenueHistory: Array<{
    month: string;
    revenue: number;
    subscriptionRevenue: number;
    tokenRevenue: number;
  }>;
  growthMetrics: {
    newOrganizationsTrend: Array<{
      month: string;
      count: number;
    }>;
    churnRateTrend: Array<{
      month: string;
      churnRate: number;
      churnedCount: number;
      activeCount: number;
    }>;
    averageChurnRate: number;
    averageNewOrganizations: number;
  };
  tokenMetrics: {
    averagePurchaseByPlan: Record<string, number>;
    monthlyUsageStats: {
      totalUsage: number;
      averageUsagePerOrg: number;
    };
  };
  planPricing: {
    subscription: Array<{
      id: string;
      name: string;
      price: number;
      billingCycle: string;
      limits: {
        stylists?: number;
        clients?: number;
        tokensPerMonth?: number;
      };
    }>;
    tokenPacks: Array<{
      id: string;
      name: string;
      price: number;
      tokenAmount: number;
    }>;
  };
}

export class RevenueSimulationService {
  /**
   * シミュレーション用の基礎データを取得
   */
  static async getSimulationData(): Promise<SimulationData> {
    try {
      logger.info('収益シミュレーションデータの取得を開始');

      // 並行してデータを取得
      const [
        totalOrgs,
        activeOrgs,
        orgDistribution,
        revenueHistory,
        newOrgTrend,
        churnRateTrend,
        avgTokenPurchase,
        tokenUsageStats,
        subscriptionPlans,
        tokenPackPlans,
      ] = await Promise.all([
        RevenueSimulationRepository.getTotalOrganizationCount(),
        RevenueSimulationRepository.getActiveOrganizationCount(),
        RevenueSimulationRepository.getOrganizationDistributionByPlan(),
        RevenueSimulationRepository.getMonthlyRevenueHistory(6),
        RevenueSimulationRepository.getNewOrganizationTrend(6),
        RevenueSimulationRepository.getChurnRateTrend(6),
        RevenueSimulationRepository.getAverageTokenPurchaseByPlan(),
        RevenueSimulationRepository.getMonthlyTokenUsageStats(),
        Plan.find({
          type: PlanType.SUBSCRIPTION,
          isActive: true,
        }).sort('displayOrder'),
        Plan.find({
          type: PlanType.TOKEN_PACK,
          isActive: true,
        }).sort('displayOrder'),
      ]);

      // 平均解約率の計算
      const averageChurnRate = churnRateTrend.length > 0
        ? churnRateTrend.reduce((sum, item) => sum + item.churnRate, 0) / churnRateTrend.length
        : 0;

      // 平均新規組織数の計算
      const averageNewOrganizations = newOrgTrend.length > 0
        ? Math.round(newOrgTrend.reduce((sum, item) => sum + item.count, 0) / newOrgTrend.length)
        : 0;

      // プラン情報の整形
      const subscriptionPlanData = subscriptionPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        billingCycle: plan.billingCycle,
        limits: plan.limits,
      }));

      const tokenPackData = tokenPackPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        tokenAmount: plan.tokenAmount || 0,
      }));

      // プラン別組織数の計算（トライアル組織を含む）
      const trialCount = totalOrgs - activeOrgs;
      
      const simulationData: SimulationData = {
        currentOrganizations: {
          total: totalOrgs,
          active: activeOrgs,
          trial: Math.max(0, trialCount),
          byPlan: orgDistribution,
        },
        revenueHistory,
        growthMetrics: {
          newOrganizationsTrend: newOrgTrend,
          churnRateTrend,
          averageChurnRate: Math.round(averageChurnRate * 10) / 10,
          averageNewOrganizations,
        },
        tokenMetrics: {
          averagePurchaseByPlan: avgTokenPurchase,
          monthlyUsageStats: tokenUsageStats,
        },
        planPricing: {
          subscription: subscriptionPlanData,
          tokenPacks: tokenPackData,
        },
      };

      logger.info('収益シミュレーションデータの取得が完了', {
        totalOrganizations: totalOrgs,
        activeOrganizations: activeOrgs,
        revenueHistoryMonths: revenueHistory.length,
      });

      return simulationData;
    } catch (error) {
      logger.error('収益シミュレーションデータの取得に失敗', { error });
      throw error;
    }
  }

  /**
   * デフォルトプランの初期データを作成（開発用）
   */
  static async initializeDefaultPlans(): Promise<void> {
    try {
      const existingPlans = await Plan.countDocuments();
      if (existingPlans > 0) {
        logger.info('プランデータは既に存在します');
        return;
      }

      // サブスクリプションプラン
      const subscriptionPlans = [
        {
          name: 'スタンダードプラン',
          type: PlanType.SUBSCRIPTION,
          price: 9800,
          billingCycle: BillingCycle.MONTHLY,
          features: [
            'スタイリスト5名まで',
            'クライアント100名まで',
            '月間1000トークン',
            '基本的なサポート',
          ],
          limits: {
            stylists: 5,
            clients: 100,
            tokensPerMonth: 1000,
          },
          displayOrder: 1,
        },
        {
          name: 'プロフェッショナルプラン',
          type: PlanType.SUBSCRIPTION,
          price: 19800,
          billingCycle: BillingCycle.MONTHLY,
          features: [
            'スタイリスト20名まで',
            'クライアント500名まで',
            '月間5000トークン',
            '優先サポート',
            'API連携',
          ],
          limits: {
            stylists: 20,
            clients: 500,
            tokensPerMonth: 5000,
          },
          displayOrder: 2,
        },
        {
          name: 'エンタープライズプラン',
          type: PlanType.SUBSCRIPTION,
          price: 49800,
          billingCycle: BillingCycle.MONTHLY,
          features: [
            'スタイリスト無制限',
            'クライアント無制限',
            '月間20000トークン',
            '専任サポート',
            'カスタマイズ可能',
            'SLA保証',
          ],
          limits: {
            stylists: 999999,
            clients: 999999,
            tokensPerMonth: 20000,
          },
          displayOrder: 3,
        },
      ];

      // トークンパック
      const tokenPacks = [
        {
          name: 'スモールパック',
          type: PlanType.TOKEN_PACK,
          price: 1000,
          billingCycle: BillingCycle.ONE_TIME,
          tokenAmount: 1000,
          features: ['1000トークン'],
          displayOrder: 10,
        },
        {
          name: 'ミディアムパック',
          type: PlanType.TOKEN_PACK,
          price: 4500,
          billingCycle: BillingCycle.ONE_TIME,
          tokenAmount: 5000,
          features: ['5000トークン', '10%ボーナス'],
          displayOrder: 11,
        },
        {
          name: 'ラージパック',
          type: PlanType.TOKEN_PACK,
          price: 9000,
          billingCycle: BillingCycle.ONE_TIME,
          tokenAmount: 10000,
          features: ['10000トークン', '11%ボーナス'],
          displayOrder: 12,
        },
      ];

      await Plan.insertMany([...subscriptionPlans, ...tokenPacks]);
      logger.info('デフォルトプランの初期化が完了しました');
    } catch (error) {
      logger.error('デフォルトプランの初期化に失敗', { error });
      throw error;
    }
  }
}