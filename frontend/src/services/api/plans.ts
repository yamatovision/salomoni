import { apiClient } from './apiClient';
import { API_PATHS } from '../../types';
import type { 
  PlanDetail,
  TokenPlan,
} from '../../types';

export interface Plan {
  id: string;
  _id?: string; // MongoDB ID for compatibility
  name: string;
  type: 'subscription' | 'token_pack';
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'one_time';
  features: string[] | {
    maxStylists?: number;
    maxClients?: number;
    monthlyTokens?: number;
    customBranding?: boolean;
    apiAccess?: boolean;
  };
  limits?: {
    stylists?: number;
    clients?: number;
    tokensPerMonth?: number;
  };
  tokenAmount?: number;
  isActive: boolean;
  isPopular?: boolean;
  displayOrder: number;
  description?: string;
  savingsPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanListResponse {
  plans: Plan[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreatePlanRequest {
  name: string;
  type: 'subscription' | 'token_pack';
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'one_time';
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

export interface UpdatePlanRequest {
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

export class PlanService {
  /**
   * プラン一覧を取得
   */
  async getPlans(params?: {
    type?: 'subscription' | 'token_pack';
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PlanListResponse> {
    const response = await apiClient.get<{ success: boolean; data: PlanListResponse }>(
      API_PATHS.SUPERADMIN.PLANS,
      { params }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('プラン一覧の取得に失敗しました');
  }

  /**
   * プラン詳細を取得
   */
  async getPlanById(planId: string): Promise<Plan> {
    const response = await apiClient.get<{ success: boolean; data: Plan }>(
      API_PATHS.SUPERADMIN.PLAN_DETAIL(planId)
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('プラン詳細の取得に失敗しました');
  }

  /**
   * 新しいプランを作成
   */
  async createPlan(data: CreatePlanRequest): Promise<Plan> {
    const response = await apiClient.post<{ success: boolean; data: Plan }>(
      API_PATHS.SUPERADMIN.PLANS,
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('プランの作成に失敗しました');
  }

  /**
   * プランを更新
   */
  async updatePlan(planId: string, data: UpdatePlanRequest): Promise<Plan> {
    const response = await apiClient.put<{ success: boolean; data: Plan }>(
      API_PATHS.SUPERADMIN.PLAN_DETAIL(planId),
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('プランの更新に失敗しました');
  }

  /**
   * プランを削除（論理削除）
   */
  async deletePlan(planId: string): Promise<void> {
    const response = await apiClient.delete<{ success: boolean }>(
      API_PATHS.SUPERADMIN.PLAN_DETAIL(planId)
    );
    
    if (!response.data.success) {
      throw new Error('プランの削除に失敗しました');
    }
  }

  /**
   * アクティブなサブスクリプションプランを取得
   */
  async getActiveSubscriptionPlans(): Promise<PlanDetail[]> {
    const { plans } = await this.getPlans({ 
      type: 'subscription', 
      isActive: true 
    });
    
    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      plan: 'standard' as any, // TODO: map from plan type
      price: plan.price,
      billingCycle: plan.billingCycle === 'monthly' ? 'monthly' : 'yearly' as any,
      features: {
        maxStylists: plan.limits?.stylists || 0,
        maxClients: plan.limits?.clients || 0,
        monthlyTokens: plan.limits?.tokensPerMonth || 0,
        supportLevel: 'standard' as any,
        customBranding: false,
        apiAccess: false,
        dataExport: true,
        multiLocation: false,
        dedicatedSupport: false,
        customIntegration: false,
      },
      isPopular: false,
      createdAt: new Date(plan.createdAt),
      updatedAt: new Date(plan.updatedAt),
    }));
  }

  /**
   * アクティブなトークンパックを取得
   */
  async getActiveTokenPacks(): Promise<TokenPlan[]> {
    const { plans } = await this.getPlans({ 
      type: 'token_pack', 
      isActive: true 
    });
    
    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      tokenAmount: plan.tokenAmount || 0,
      price: plan.price,
      pricePerToken: plan.price / (plan.tokenAmount || 1),
      description: plan.description || (Array.isArray(plan.features) ? plan.features.join(', ') : ''),
      isPopular: plan.isPopular,
      createdAt: new Date(plan.createdAt),
      updatedAt: new Date(plan.updatedAt),
    }));
  }
}

// シングルトンインスタンスをエクスポート
export const planService = new PlanService();