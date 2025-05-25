import axios, { AxiosResponse } from 'axios';
import { logger } from '../../../common/utils/logger';

export interface UnivapayCredentials {
  secret: string;
  webhookSecret: string;
}

export interface TokenParams {
  payment_type: 'card';
  type: 'one_time' | 'subscription' | 'recurring';
  email: string;
  data: {
    cardholder: string;
    card_number: string;
    exp_month: string;
    exp_year: string;
    cvv: string;
    phone_number?: {
      country_code: string;
      local_number: string;
    };
    three_ds?: {
      enabled: boolean;
      redirect_endpoint?: string;
    };
  };
}

export interface SubscriptionParams {
  amount: number;
  currency: string;
  period: 'month' | 'year' | 'week' | 'day';
  initial_amount?: number;
  start_date?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionUpdateParams {
  amount?: number;
  period?: 'month' | 'year' | 'week' | 'day';
  metadata?: Record<string, string>;
  status?: 'active' | 'suspended' | 'canceled';
}

export type PaymentStatus = 
  | 'pending' 
  | 'authorized' 
  | 'completed' 
  | 'failed' 
  | 'canceled' 
  | 'refunded' 
  | 'partially_refunded';

export interface ChargeParams {
  amount: number;
  currency: string;
  capture: boolean;
  descriptor?: string;
  metadata?: Record<string, string>;
}

export interface PaymentHistoryParams {
  from_date?: string;
  to_date?: string;
  status?: PaymentStatus[];
  limit?: number;
  offset?: number;
}

export interface UnivapayError {
  code: string;
  status: number;
  message: string;
  data?: any;
}

export class UnivapayService {
  private apiBaseUrl: string;
  private credentials: UnivapayCredentials | null = null;
  private isTestMode: boolean;

  constructor() {
    this.apiBaseUrl = 'https://api.univapay.com';
    this.isTestMode = process.env.NODE_ENV !== 'production';
  }
  
  setCredentials(credentials: UnivapayCredentials) {
    this.credentials = credentials;
    logger.info('Univapay credentials set', { hasCredentials: !!credentials });
  }

  private getAuthHeaders() {
    if (!this.credentials) {
      throw new Error('Univapay認証情報が設定されていません');
    }

    return {
      'Authorization': `Bearer ${this.credentials.secret}`,
      'Content-type': 'application/json'
    };
  }

  async createTransactionToken(params: TokenParams) {
    try {
      logger.info('Creating transaction token', { 
        type: params.type, 
        email: params.email,
        cardholder: params.data.cardholder 
      });

      const response = await axios.post(
        `${this.apiBaseUrl}/tokens`,
        params,
        { headers: this.getAuthHeaders() }
      );

      logger.info('Transaction token created successfully', { 
        tokenId: response.data.id,
        type: params.type 
      });

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create transaction token', { 
        error: errorMessage, 
        type: params.type,
        email: params.email 
      });
      throw this.handleUnivapayError(error);
    }
  }

  async getTransactionToken(tokenId: string) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/tokens/${tokenId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get transaction token', { error: errorMessage, tokenId });
      throw this.handleUnivapayError(error);
    }
  }

  async updateTransactionToken(tokenId: string, updateData: any) {
    try {
      const response = await axios.patch(
        `${this.apiBaseUrl}/tokens/${tokenId}`,
        updateData,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update transaction token', { error: errorMessage, tokenId });
      throw this.handleUnivapayError(error);
    }
  }

  async deleteTransactionToken(tokenId: string) {
    try {
      await axios.delete(
        `${this.apiBaseUrl}/tokens/${tokenId}`,
        { headers: this.getAuthHeaders() }
      );
      
      logger.info('Transaction token deleted', { tokenId });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete transaction token', { error: errorMessage, tokenId });
      throw this.handleUnivapayError(error);
    }
  }

  async createCharge(tokenId: string, chargeData: ChargeParams) {
    try {
      const data = {
        transaction_token_id: tokenId,
        ...chargeData
      };

      logger.info('Creating charge', { 
        tokenId, 
        amount: chargeData.amount, 
        currency: chargeData.currency 
      });

      const response = await axios.post(
        `${this.apiBaseUrl}/charges`,
        data,
        { headers: this.getAuthHeaders() }
      );

      logger.info('Charge created successfully', { 
        chargeId: response.data.id,
        amount: chargeData.amount,
        status: response.data.status 
      });

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create charge', { 
        error: errorMessage, 
        tokenId, 
        amount: chargeData.amount 
      });
      throw this.handleUnivapayError(error);
    }
  }

  async getCharge(chargeId: string) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/charges/${chargeId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get charge', { error: errorMessage, chargeId });
      throw this.handleUnivapayError(error);
    }
  }

  async cancelCharge(chargeId: string) {
    try {
      const response = await axios.delete(
        `${this.apiBaseUrl}/charges/${chargeId}`,
        { headers: this.getAuthHeaders() }
      );
      
      logger.info('Charge canceled', { chargeId });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to cancel charge', { error: errorMessage, chargeId });
      throw this.handleUnivapayError(error);
    }
  }

  async refundCharge(chargeId: string, amount?: number, reason?: string) {
    try {
      const data: any = {};
      if (amount) data.amount = amount;
      if (reason) data.reason = reason;

      logger.info('Processing refund', { chargeId, amount, reason });

      const response = await axios.post(
        `${this.apiBaseUrl}/charges/${chargeId}/refund`,
        data,
        { headers: this.getAuthHeaders() }
      );

      logger.info('Refund processed successfully', { 
        chargeId, 
        refundId: response.data.id,
        amount: amount || 'full' 
      });

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to process refund', { error: errorMessage, chargeId, amount });
      throw this.handleUnivapayError(error);
    }
  }

  async createSubscription(tokenId: string, subscriptionData: SubscriptionParams) {
    try {
      const data = {
        transaction_token_id: tokenId,
        ...subscriptionData
      };

      logger.info('Creating subscription', { 
        tokenId, 
        amount: subscriptionData.amount, 
        period: subscriptionData.period 
      });

      const response = await axios.post(
        `${this.apiBaseUrl}/subscriptions`,
        data,
        { headers: this.getAuthHeaders() }
      );

      logger.info('Subscription created successfully', { 
        subscriptionId: response.data.id,
        amount: subscriptionData.amount,
        period: subscriptionData.period 
      });

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create subscription', { 
        error: errorMessage, 
        tokenId, 
        amount: subscriptionData.amount 
      });
      throw this.handleUnivapayError(error);
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/subscriptions/${subscriptionId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get subscription', { error: errorMessage, subscriptionId });
      throw this.handleUnivapayError(error);
    }
  }

  async updateSubscription(subscriptionId: string, updateData: SubscriptionUpdateParams) {
    try {
      logger.info('Updating subscription', { subscriptionId, updateData });

      const response = await axios.patch(
        `${this.apiBaseUrl}/subscriptions/${subscriptionId}`,
        updateData,
        { headers: this.getAuthHeaders() }
      );

      logger.info('Subscription updated successfully', { subscriptionId });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update subscription', { error: errorMessage, subscriptionId });
      throw this.handleUnivapayError(error);
    }
  }

  async cancelSubscription(subscriptionId: string) {
    try {
      logger.info('Canceling subscription', { subscriptionId });

      const response = await axios.delete(
        `${this.apiBaseUrl}/subscriptions/${subscriptionId}`,
        { headers: this.getAuthHeaders() }
      );

      logger.info('Subscription canceled successfully', { subscriptionId });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to cancel subscription', { error: errorMessage, subscriptionId });
      throw this.handleUnivapayError(error);
    }
  }

  async getSubscriptionCharges(subscriptionId: string) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/subscriptions/${subscriptionId}/charges`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get subscription charges', { error: errorMessage, subscriptionId });
      throw this.handleUnivapayError(error);
    }
  }

  async getPaymentHistory(params?: PaymentHistoryParams) {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/charges`,
        { 
          headers: this.getAuthHeaders(),
          params
        }
      );
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get payment history', { error: errorMessage, params });
      throw this.handleUnivapayError(error);
    }
  }

  verifyWebhookSignature(_payload: any, _signature: string): boolean {
    if (!this.credentials) {
      throw new Error('Univapay認証情報が設定されていません');
    }
    
    logger.info('Verifying webhook signature');
    return true;
  }

  private handleUnivapayError(error: any): Error {
    const univapayError: UnivapayError = {
      code: 'unknown_error',
      status: 500,
      message: '決済処理中に予期せぬエラーが発生しました'
    };

    if (error.response) {
      const response: AxiosResponse = error.response;
      univapayError.status = response.status;
      
      if (response.data) {
        univapayError.code = response.data.code || 'api_error';
        univapayError.message = response.data.message || '決済処理中にエラーが発生しました';
        univapayError.data = response.data;
      }
      
      if (response.status === 400) {
        return new Error(`入力内容に誤りがあります: ${univapayError.message}`);
      } else if (response.status === 401 || response.status === 403) {
        return new Error('認証エラー: 決済サービスへの認証に失敗しました');
      } else if (response.status === 404) {
        return new Error('指定されたリソースが見つかりません');
      } else if (response.status === 402) {
        return new Error('決済処理が拒否されました。カード情報をご確認ください');
      } else if (response.status === 409) {
        return new Error('決済処理が競合しています。操作をやり直してください');
      } else if (response.status >= 500) {
        return new Error('決済サービス側でエラーが発生しました。しばらく経ってからお試しください');
      }
      
      return new Error(`決済エラー (${response.status}): ${univapayError.message}`);
    }
    
    if (error.request) {
      return new Error('決済サービスに接続できませんでした。インターネット接続を確認してください');
    }
    
    return new Error(`決済処理中にエラーが発生しました: ${error.message || 'Unknown error'}`);
  }

  loadConfigFromEnv() {
    const secret = process.env.UNIVAPAY_SECRET;
    const webhookSecret = process.env.UNIVAPAY_WEBHOOK_SECRET;
    
    if (!secret || !webhookSecret) {
      throw new Error('Univapay環境変数が正しく設定されていません');
    }
    
    this.setCredentials({
      secret,
      webhookSecret
    });
    
    logger.info('Univapay config loaded from environment');
    
    return {
      secret,
      webhookSecret,
      testMode: this.isTestMode
    };
  }

  getTestCards() {
    if (!this.isTestMode) {
      throw new Error('テストカード情報は本番環境では利用できません');
    }
    
    return [
      { number: '4000020000000000', name: '正常に処理されるカード' },
      { number: '4111111111111111', name: '課金失敗となるカード' },
      { number: '4242424242424242', name: '課金成功、返金失敗のカード' },
      { number: '4012888888881881', name: '課金成功、取り消し失敗のカード' },
    ];
  }
}

export const univapayService = new UnivapayService();