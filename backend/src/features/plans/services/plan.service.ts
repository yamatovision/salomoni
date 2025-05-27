import { PlanRepository, PlanCreateData, PlanUpdateData } from '../repositories/plan.repository';
import { IPlan, PlanType } from '../models/plan.model';
import { logger } from '../../../common/utils/logger';
import { ID } from '../../../types';

export class PlanService {
  /**
   * プラン一覧の取得
   */
  static async getPlans(filters: {
    type?: PlanType;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    plans: IPlan[];
    totalCount: number;
  }> {
    try {
      const [plans, totalCount] = await Promise.all([
        PlanRepository.findAll(filters),
        PlanRepository.count({ type: filters.type, isActive: filters.isActive })
      ]);

      logger.info('Plans retrieved successfully', {
        count: plans.length,
        totalCount,
        filters
      });

      return { plans, totalCount };
    } catch (error) {
      logger.error('Failed to get plans', { error, filters });
      throw error;
    }
  }

  /**
   * プラン詳細の取得
   */
  static async getPlanById(planId: ID): Promise<IPlan | null> {
    try {
      const plan = await PlanRepository.findById(planId);
      
      if (!plan) {
        logger.warn('Plan not found', { planId });
        return null;
      }

      logger.info('Plan retrieved successfully', { planId });
      return plan;
    } catch (error) {
      logger.error('Failed to get plan by ID', { error, planId });
      throw error;
    }
  }

  /**
   * プランの作成
   */
  static async createPlan(data: PlanCreateData): Promise<IPlan> {
    try {
      // バリデーション
      if (data.type === PlanType.SUBSCRIPTION) {
        if (!data.limits || !data.limits.stylists || !data.limits.clients || !data.limits.tokensPerMonth) {
          throw new Error('サブスクリプションプランには制限値が必要です');
        }
      }

      if (data.type === PlanType.TOKEN_PACK) {
        if (!data.tokenAmount) {
          throw new Error('トークンパックにはトークン数が必要です');
        }
      }

      const plan = await PlanRepository.create(data);
      
      logger.info('Plan created successfully', {
        planId: plan.id,
        name: plan.name,
        type: plan.type
      });

      return plan;
    } catch (error) {
      logger.error('Failed to create plan', { error, data });
      throw error;
    }
  }

  /**
   * プランの更新
   */
  static async updatePlan(planId: ID, data: PlanUpdateData): Promise<IPlan> {
    try {
      const existingPlan = await PlanRepository.findById(planId);
      
      if (!existingPlan) {
        throw new Error('プランが見つかりません');
      }

      // 型固有のバリデーション
      if (existingPlan.type === PlanType.SUBSCRIPTION && data.limits) {
        if ((data.limits.stylists !== undefined && data.limits.stylists <= 0) ||
            (data.limits.clients !== undefined && data.limits.clients <= 0) ||
            (data.limits.tokensPerMonth !== undefined && data.limits.tokensPerMonth <= 0)) {
          throw new Error('制限値は正の数値である必要があります');
        }
      }

      if (existingPlan.type === PlanType.TOKEN_PACK && data.tokenAmount !== undefined && data.tokenAmount <= 0) {
        throw new Error('トークン数は正の数値である必要があります');
      }

      const updatedPlan = await PlanRepository.update(planId, data);
      
      if (!updatedPlan) {
        throw new Error('プランの更新に失敗しました');
      }

      logger.info('Plan updated successfully', {
        planId,
        updatedFields: Object.keys(data)
      });

      return updatedPlan;
    } catch (error) {
      logger.error('Failed to update plan', { error, planId, data });
      throw error;
    }
  }

  /**
   * プランの削除（論理削除）
   */
  static async deletePlan(planId: ID): Promise<void> {
    try {
      const plan = await PlanRepository.findById(planId);
      
      if (!plan) {
        throw new Error('プランが見つかりません');
      }

      // TODO: アクティブなサブスクリプションがある場合は削除不可のチェックを追加

      await PlanRepository.delete(planId);
      
      logger.info('Plan deleted successfully', { planId });
    } catch (error) {
      logger.error('Failed to delete plan', { error, planId });
      throw error;
    }
  }

  /**
   * アクティブなサブスクリプションプランの取得
   */
  static async getActiveSubscriptionPlans(): Promise<IPlan[]> {
    try {
      return await PlanRepository.findAll({
        type: PlanType.SUBSCRIPTION,
        isActive: true
      });
    } catch (error) {
      logger.error('Failed to get active subscription plans', { error });
      throw error;
    }
  }

  /**
   * アクティブなトークンパックの取得
   */
  static async getActiveTokenPacks(): Promise<IPlan[]> {
    try {
      return await PlanRepository.findAll({
        type: PlanType.TOKEN_PACK,
        isActive: true
      });
    } catch (error) {
      logger.error('Failed to get active token packs', { error });
      throw error;
    }
  }
}