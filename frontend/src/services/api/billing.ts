import { apiClient } from './apiClient';
import { API_PATHS } from '../../types';
import type { 
  TokenPackageItem,
  PaymentMethod,
  Invoice,
  BillingSummary,
  CreateTokenResponse,
  ChargeTokensRequest,
  ChargeTokensResponse,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  RevenueSimulationData,
} from '../../types';

export class BillingService {
  /**
   * 決済トークンを作成
   */
  async createToken(cardData: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvv: string;
    holder_name?: string;
  }): Promise<CreateTokenResponse> {
    const response = await apiClient.post<CreateTokenResponse>(
      API_PATHS.BILLING.TOKEN,
      cardData
    );
    return response.data;
  }

  /**
   * サブスクリプションを作成
   */
  async createSubscription(data: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> {
    const response = await apiClient.post<CreateSubscriptionResponse>(
      API_PATHS.BILLING.SUBSCRIPTION,
      data
    );
    return response.data;
  }

  /**
   * トークンチャージを購入
   */
  async chargeTokens(data: ChargeTokensRequest): Promise<ChargeTokensResponse> {
    const response = await apiClient.post<ChargeTokensResponse>(
      API_PATHS.OWNER.CHARGE_TOKENS,
      data
    );
    return response.data;
  }

  /**
   * 請求サマリーを取得
   */
  async getBillingSummary(): Promise<BillingSummary> {
    const response = await apiClient.get(
      API_PATHS.OWNER.BILLING_SUMMARY
    );
    
    // デバッグログ
    console.log('[BillingService] getBillingSummary response:', response.data);
    
    // APIレスポンスの構造を正しく処理
    if (response.data.success && response.data.data) {
      return response.data.data.summary || {};
    }
    
    // エラーケース
    console.error('[BillingService] Invalid response structure:', response.data);
    return {} as BillingSummary;
  }

  /**
   * 請求書一覧を取得
   */
  async getInvoices(params?: {
    page?: number;
    limit?: number;
    status?: 'paid' | 'pending' | 'overdue';
    from_date?: string;
    to_date?: string;
  }): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await apiClient.get(API_PATHS.OWNER.INVOICES, {
      params
    });
    
    // デバッグログ
    console.log('[BillingService] getInvoices response:', response.data);
    
    // APIレスポンスの構造を正しく処理
    if (response.data.success && response.data.data) {
      const { invoices, pagination } = response.data.data;
      return {
        invoices: invoices || [],
        total: pagination?.total || 0,
        page: params?.page || 1,
        totalPages: Math.ceil((pagination?.total || 0) / (params?.limit || 10))
      };
    }
    
    // エラーケース
    console.error('[BillingService] Invalid response structure:', response.data);
    return {
      invoices: [],
      total: 0,
      page: 1,
      totalPages: 0
    };
  }

  /**
   * 支払い方法を取得
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    // 現在の実装では、請求サマリーから取得
    const summary = await this.getBillingSummary();
    return summary.paymentMethods || [];
  }

  /**
   * プラン変更
   */
  async changePlan(planType: 'basic' | 'standard' | 'premium'): Promise<void> {
    const organizationId = localStorage.getItem('organizationId');
    if (!organizationId) {
      throw new Error('組織IDが見つかりません');
    }

    await apiClient.patch(
      API_PATHS.ORGANIZATIONS.PLAN(organizationId),
      { planType }
    );
  }

  /**
   * トークンパッケージ一覧を取得
   */
  getTokenPackages(): TokenPackageItem[] {
    // 静的データとして定義
    return [
      {
        id: 'token-1000',
        name: '1,000トークン',
        tokens: 1000,
        price: 980,
        description: 'お試しパック'
      },
      {
        id: 'token-5000', 
        name: '5,000トークン',
        tokens: 5000,
        price: 4500,
        description: '5%お得'
      },
      {
        id: 'token-10000',
        name: '10,000トークン', 
        tokens: 10000,
        price: 8000,
        description: '20%お得！'
      }
    ];
  }

  /**
   * プラン一覧を取得
   */
  getSubscriptionPlans() {
    // 静的データとして定義
    return {
      basic: {
        name: 'ベーシック',
        monthlyPrice: 9800,
        includedTokens: 5000,
        features: [
          'スタイリスト5名まで',
          'AIチャット機能',
          '基本的な四柱推命分析',
          'メールサポート'
        ]
      },
      standard: {
        name: 'スタンダード',
        monthlyPrice: 19800,
        includedTokens: 15000,
        features: [
          'スタイリスト15名まで',
          'AIチャット機能',
          '高度な四柱推命分析',
          '離職予兆検知',
          '優先メールサポート'
        ]
      },
      premium: {
        name: 'プレミアム',
        monthlyPrice: 36000,
        includedTokens: 50000,
        features: [
          'スタイリスト無制限',
          'AIチャット機能',
          '完全な四柱推命分析',
          '離職予兆検知',
          'カスタムAIトレーニング',
          '24時間電話サポート'
        ]
      }
    };
  }

  /**
   * 収益シミュレーションデータを取得（SuperAdmin用）
   */
  async getSimulationData(): Promise<RevenueSimulationData> {
    const response = await apiClient.get<{ success: boolean; data: RevenueSimulationData }>(
      API_PATHS.SUPERADMIN.REVENUE_SIMULATION_DATA
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('収益シミュレーションデータの取得に失敗しました');
  }
}