import { Plan, IPlan, PlanType, BillingCycle } from '../models/plan.model';
import { logger } from '../../../common/utils/logger';

export interface PlanListOptions {
  type?: PlanType;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface PlanCreateData {
  name: string;
  type: PlanType;
  price: number;
  billingCycle: BillingCycle;
  features: string[];
  limits?: {
    stylists?: number;
    clients?: number;
    tokensPerMonth?: number;
  };
  tokenAmount?: number;
  displayOrder?: number;
  metadata?: Record<string, any>;
}

export interface PlanUpdateData {
  name?: string;
  price?: number;
  features?: string[];
  limits?: {
    stylists?: number;
    clients?: number;
    tokensPerMonth?: number;
  };
  tokenAmount?: number;
  isActive?: boolean;
  displayOrder?: number;
  metadata?: Record<string, any>;
}

export class PlanRepository {
  /**
   * プラン一覧を取得
   */
  static async findAll(options: PlanListOptions = {}): Promise<IPlan[]> {
    try {
      const query: any = {};
      
      if (options.type) {
        query.type = options.type;
      }
      
      if (options.isActive !== undefined) {
        query.isActive = options.isActive;
      }

      let queryBuilder = Plan.find(query);
      
      queryBuilder = queryBuilder.sort('displayOrder');
      
      if (options.limit) {
        queryBuilder = queryBuilder.limit(options.limit);
      }
      
      if (options.offset) {
        queryBuilder = queryBuilder.skip(options.offset);
      }

      return await queryBuilder.exec();
    } catch (error) {
      logger.error('Failed to find plans', { error, options });
      throw error;
    }
  }

  /**
   * IDによるプラン取得
   */
  static async findById(planId: string): Promise<IPlan | null> {
    try {
      return await Plan.findById(planId);
    } catch (error) {
      logger.error('Failed to find plan by ID', { error, planId });
      throw error;
    }
  }

  /**
   * プラン作成
   */
  static async create(data: PlanCreateData): Promise<IPlan> {
    try {
      const plan = new Plan(data);
      return await plan.save();
    } catch (error) {
      logger.error('Failed to create plan', { error, data });
      throw error;
    }
  }

  /**
   * プラン更新
   */
  static async update(planId: string, data: PlanUpdateData): Promise<IPlan | null> {
    try {
      return await Plan.findByIdAndUpdate(
        planId,
        { $set: data },
        { new: true, runValidators: true }
      );
    } catch (error) {
      logger.error('Failed to update plan', { error, planId, data });
      throw error;
    }
  }

  /**
   * プラン削除（論理削除）
   */
  static async delete(planId: string): Promise<IPlan | null> {
    try {
      return await Plan.findByIdAndUpdate(
        planId,
        { $set: { isActive: false } },
        { new: true }
      );
    } catch (error) {
      logger.error('Failed to delete plan', { error, planId });
      throw error;
    }
  }

  /**
   * プラン数を取得
   */
  static async count(options: { type?: PlanType; isActive?: boolean } = {}): Promise<number> {
    try {
      const query: any = {};
      
      if (options.type) {
        query.type = options.type;
      }
      
      if (options.isActive !== undefined) {
        query.isActive = options.isActive;
      }

      return await Plan.countDocuments(query);
    } catch (error) {
      logger.error('Failed to count plans', { error, options });
      throw error;
    }
  }
}