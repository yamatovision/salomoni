import { Subscription } from '../models/subscription.model';
import { Invoice } from '../models/invoice.model';
import { PaymentHistory } from '../models/payment-history.model';
import { TokenUsage } from '../models/token-usage.model';
import { OrganizationStatus, OrganizationPlan } from '../../../types';
import { OrganizationModel } from '../../organizations/models/organization.model';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export class RevenueSimulationRepository {
  /**
   * 現在のアクティブ組織数を取得
   */
  static async getActiveOrganizationCount(): Promise<number> {
    return await OrganizationModel.countDocuments({
      status: { $in: [OrganizationStatus.ACTIVE, OrganizationStatus.TRIAL] },
    });
  }

  /**
   * 組織総数を取得
   */
  static async getTotalOrganizationCount(): Promise<number> {
    return await OrganizationModel.countDocuments();
  }

  /**
   * プラン別組織分布を取得
   */
  static async getOrganizationDistributionByPlan(): Promise<Record<string, number>> {
    const distribution = await OrganizationModel.aggregate([
      {
        $match: {
          status: { $in: [OrganizationStatus.ACTIVE, OrganizationStatus.TRIAL] },
        },
      },
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
        },
      },
    ]);

    const result: Record<string, number> = {
      [OrganizationPlan.STANDARD]: 0,
      [OrganizationPlan.PROFESSIONAL]: 0,
      [OrganizationPlan.ENTERPRISE]: 0,
    };

    distribution.forEach((item: { _id: string; count: number }) => {
      if (item._id && result.hasOwnProperty(item._id)) {
        result[item._id] = item.count;
      }
    });

    return result;
  }

  /**
   * 過去N月の月別収益実績を取得
   */
  static async getMonthlyRevenueHistory(months: number = 6): Promise<Array<{
    month: string;
    revenue: number;
    subscriptionRevenue: number;
    tokenRevenue: number;
  }>> {
    const history = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = startOfMonth(subMonths(now, i));
      const endDate = endOfMonth(subMonths(now, i));
      
      // サブスクリプション収益
      const subscriptionRevenue = await Invoice.aggregate([
        {
          $match: {
            type: 'subscription',
            status: 'paid',
            paidAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      // トークン購入収益
      const tokenRevenue = await PaymentHistory.aggregate([
        {
          $match: {
            type: 'token_purchase',
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      history.push({
        month: monthKey,
        subscriptionRevenue: subscriptionRevenue[0]?.total || 0,
        tokenRevenue: tokenRevenue[0]?.total || 0,
        revenue: (subscriptionRevenue[0]?.total || 0) + (tokenRevenue[0]?.total || 0),
      });
    }

    return history;
  }

  /**
   * 過去N月の新規組織数推移を取得
   */
  static async getNewOrganizationTrend(months: number = 6): Promise<Array<{
    month: string;
    count: number;
  }>> {
    const trend = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = startOfMonth(subMonths(now, i));
      const endDate = endOfMonth(subMonths(now, i));
      
      const count = await OrganizationModel.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      });

      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      trend.push({
        month: monthKey,
        count,
      });
    }

    return trend;
  }

  /**
   * 過去N月の解約率推移を取得
   */
  static async getChurnRateTrend(months: number = 6): Promise<Array<{
    month: string;
    churnRate: number;
    churnedCount: number;
    activeCount: number;
  }>> {
    const trend = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = startOfMonth(subMonths(now, i));
      const endDate = endOfMonth(subMonths(now, i));
      
      // 月初のアクティブ組織数
      const activeAtStart = await OrganizationModel.countDocuments({
        createdAt: { $lt: startDate },
        $or: [
          { status: { $in: [OrganizationStatus.ACTIVE, OrganizationStatus.TRIAL] } },
          { 
            status: OrganizationStatus.CANCELED,
            updatedAt: { $gte: startDate },
          },
        ],
      });

      // 月内に解約した組織数
      const churned = await OrganizationModel.countDocuments({
        status: OrganizationStatus.CANCELED,
        updatedAt: { $gte: startDate, $lte: endDate },
      });

      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      const churnRate = activeAtStart > 0 ? (churned / activeAtStart) * 100 : 0;
      
      trend.push({
        month: monthKey,
        churnRate: Math.round(churnRate * 10) / 10,
        churnedCount: churned,
        activeCount: activeAtStart,
      });
    }

    return trend;
  }

  /**
   * プラン別平均トークン購入額を取得
   */
  static async getAverageTokenPurchaseByPlan(): Promise<Record<string, number>> {
    const averages = await PaymentHistory.aggregate([
      {
        $match: {
          type: 'token_purchase',
          status: 'completed',
        },
      },
      {
        $lookup: {
          from: 'organizations',
          localField: 'organizationId',
          foreignField: '_id',
          as: 'organization',
        },
      },
      {
        $unwind: '$organization',
      },
      {
        $group: {
          _id: '$organization.plan',
          avgAmount: { $avg: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const result: Record<string, number> = {
      [OrganizationPlan.STANDARD]: 0,
      [OrganizationPlan.PROFESSIONAL]: 0,
      [OrganizationPlan.ENTERPRISE]: 0,
    };

    averages.forEach((item: { _id: string; avgAmount: number; count: number }) => {
      if (item._id && result.hasOwnProperty(item._id)) {
        result[item._id] = Math.round(item.avgAmount);
      }
    });

    return result;
  }

  /**
   * 現在のアクティブサブスクリプション数を取得
   */
  static async getActiveSubscriptionCount(): Promise<number> {
    return await Subscription.countDocuments({
      status: 'active',
    });
  }

  /**
   * 月間トークン使用量の統計を取得
   */
  static async getMonthlyTokenUsageStats(): Promise<{
    totalUsage: number;
    averageUsagePerOrg: number;
  }> {
    const startDate = startOfMonth(new Date());
    const endDate = endOfMonth(new Date());

    const stats = await TokenUsage.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalUsage: { $sum: '$tokens' },
          uniqueOrgs: { $addToSet: '$organizationId' },
        },
      },
    ]);

    if (!stats.length) {
      return { totalUsage: 0, averageUsagePerOrg: 0 };
    }

    const totalUsage = stats[0].totalUsage;
    const orgCount = stats[0].uniqueOrgs.length;
    const averageUsagePerOrg = orgCount > 0 ? Math.round(totalUsage / orgCount) : 0;

    return { totalUsage, averageUsagePerOrg };
  }
}