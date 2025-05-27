import type { RevenueSimulationData } from '../types';

export interface SimulationParams {
  monthlyGrowthRate: number; // 月次成長率（%）
  churnRate: number; // 解約率（%）
  averageTokenPurchase: number; // 平均トークン購入額
  months: number; // シミュレーション期間（月）
  newOrganizationsPerMonth?: number; // 月間新規組織数
  growthRatePercent?: number; // 成長率（%）
}

export interface SimulationResult {
  projectedRevenue: Array<{
    month: string;
    revenue: number;
    subscriptionRevenue: number;
    tokenRevenue: number;
    totalOrganizations: number;
  }>;
  summary: {
    totalRevenue: number;
    averageMonthlyRevenue: number;
    finalMonthRevenue: number;
    totalGrowth: number;
  };
}

export class RevenueSimulator {
  private data: RevenueSimulationData;

  constructor(data: RevenueSimulationData) {
    this.data = data;
  }

  /**
   * 収益シミュレーションを実行
   */
  simulate(params: SimulationParams): SimulationResult {
    const projectedRevenue: SimulationResult['projectedRevenue'] = [];
    
    // 現在の組織数とプラン分布を取得
    let activeOrgs = this.data.currentOrganizations?.active || 0;
    const planDistribution = this.calculatePlanDistribution();
    
    // 過去のデータから現在の月次収益を計算
    const currentMonthlyRevenue = this.calculateCurrentMonthlyRevenue();
    
    // 将来の収益を予測
    for (let i = 0; i < params.months; i++) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() + i);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      
      // 組織数の成長を計算
      const growthFactor = Math.pow(1 + params.monthlyGrowthRate / 100, i);
      const churnFactor = Math.pow(1 - params.churnRate / 100, i);
      const projectedOrgs = Math.round(activeOrgs * growthFactor * churnFactor);
      
      // サブスクリプション収益を計算
      const subscriptionRevenue = this.calculateSubscriptionRevenue(projectedOrgs, planDistribution);
      
      // トークン収益を計算（組織数に比例）
      const tokenRevenue = projectedOrgs * params.averageTokenPurchase;
      
      // 合計収益
      const totalRevenue = subscriptionRevenue + tokenRevenue;
      
      projectedRevenue.push({
        month: monthKey,
        revenue: totalRevenue,
        subscriptionRevenue,
        tokenRevenue,
        totalOrganizations: projectedOrgs,
      });
    }
    
    // サマリーを計算
    const totalRevenue = projectedRevenue.reduce((sum, item) => sum + item.revenue, 0);
    const averageMonthlyRevenue = totalRevenue / params.months;
    const finalMonthRevenue = projectedRevenue[projectedRevenue.length - 1]?.revenue || 0;
    const totalGrowth = ((finalMonthRevenue - currentMonthlyRevenue) / currentMonthlyRevenue) * 100;
    
    return {
      projectedRevenue,
      summary: {
        totalRevenue,
        averageMonthlyRevenue,
        finalMonthRevenue,
        totalGrowth,
      },
    };
  }

  /**
   * 現在のプラン分布を計算
   */
  private calculatePlanDistribution(): Record<string, number> {
    const total = Object.values(this.data.currentOrganizations?.byPlan || {}).reduce((sum: number, count: number) => sum + count, 0);
    const distribution: Record<string, number> = {};
    
    for (const [plan, count] of Object.entries(this.data.currentOrganizations?.byPlan || {})) {
      distribution[plan] = total > 0 ? count / total : 0;
    }
    
    return distribution;
  }

  /**
   * 現在の月次収益を計算
   */
  private calculateCurrentMonthlyRevenue(): number {
    const latestMonth = this.data.revenueHistory?.[this.data.revenueHistory.length - 1];
    return latestMonth?.revenue || 0;
  }

  /**
   * サブスクリプション収益を計算
   */
  private calculateSubscriptionRevenue(
    organizationCount: number,
    planDistribution: Record<string, number>
  ): number {
    let revenue = 0;
    
    // プラン価格情報を使用
    for (const plan of this.data.planPricing?.subscription || []) {
      const planKey = plan.name.toLowerCase().replace(/プラン$/, '');
      const distribution = planDistribution[planKey] || 0;
      const orgCount = Math.round(organizationCount * distribution);
      revenue += orgCount * plan.price;
    }
    
    return revenue;
  }

  /**
   * 成長率のトレンドを分析
   */
  analyzeGrowthTrend(): {
    averageMonthlyGrowth: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    // newOrganizationsTrendは現在の型定義では数値なので、成長率から推定
    const growthRate = this.data.growthMetrics?.monthlyGrowthRate || 0;
    
    // 成長率に基づいてトレンドを判断
    if (growthRate > 5) {
      return { averageMonthlyGrowth: growthRate, trend: 'increasing' };
    } else if (growthRate < -5) {
      return { averageMonthlyGrowth: growthRate, trend: 'decreasing' };
    }
    
    return { averageMonthlyGrowth: growthRate, trend: 'stable' };
  }

  /**
   * 最適なプラン価格を提案
   */
  suggestOptimalPricing(): {
    plan: string;
    currentPrice: number;
    suggestedPrice: number;
    reason: string;
  }[] {
    const suggestions: {
      plan: string;
      currentPrice: number;
      suggestedPrice: number;
      reason: string;
    }[] = [];
    
    // 各プランの価格最適化を提案
    for (const plan of this.data.planPricing?.subscription || []) {
      const planKey = plan.name.toLowerCase().replace(/プラン$/, '');
      const distribution = this.data.currentOrganizations?.byPlan[planKey] || 0;
      const totalOrgs = this.data.currentOrganizations?.active || 0;
      const marketShare = totalOrgs > 0 ? distribution / totalOrgs : 0;
      
      // 市場シェアに基づいて価格調整を提案
      if (marketShare < 0.2 && plan.price > 20000) {
        suggestions.push({
          plan: plan.name,
          currentPrice: plan.price,
          suggestedPrice: Math.round(plan.price * 0.9),
          reason: '市場シェアが低いため、価格を10%引き下げることを推奨',
        });
      } else if (marketShare > 0.5 && plan.price < 50000) {
        suggestions.push({
          plan: plan.name,
          currentPrice: plan.price,
          suggestedPrice: Math.round(plan.price * 1.1),
          reason: '市場シェアが高いため、価格を10%引き上げる余地あり',
        });
      }
    }
    
    return suggestions;
  }
}

/**
 * デフォルトのシミュレーションパラメータ
 */
export const defaultSimulationParams: SimulationParams = {
  monthlyGrowthRate: 5, // 5%の月次成長
  churnRate: 2, // 2%の解約率
  averageTokenPurchase: 5000, // 平均5000円のトークン購入
  months: 12, // 12ヶ月間のシミュレーション
};