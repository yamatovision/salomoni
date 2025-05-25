import { Document } from 'mongoose';
import { subscriptionRepository } from '../repositories/subscription.repository';
import { paymentMethodRepository } from '../repositories/payment-method.repository';
import { invoiceRepository } from '../repositories/invoice.repository';
import { univapayService } from './univapay.service';
import { logger } from '../../../common/utils/logger';
import { 
  ID, 
  OrganizationPlan, 
  SubscriptionStatus,
  InvoiceItem,
  InvoiceStatus
} from '../../../types/index';
import { ISubscription } from '../models/subscription.model';
import { IPaymentMethod } from '../models/payment-method.model';

export interface CreateSubscriptionParams {
  organizationId: ID;
  plan: OrganizationPlan;
  paymentMethodId: ID;
  trialDays?: number;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionParams {
  plan?: OrganizationPlan;
  status?: SubscriptionStatus;
  metadata?: Record<string, any>;
}

export class SubscriptionService {
  private readonly planPrices = {
    standard: 9800,
    professional: 18000,
    enterprise: 36000
  };

  private readonly planFeatures = {
    standard: {
      maxStylists: 3,
      maxClients: 300,
      monthlyTokens: 2000000,
      supportLevel: 'basic' as const
    },
    professional: {
      maxStylists: 10,
      maxClients: -1, // unlimited
      monthlyTokens: 5000000,
      supportLevel: 'standard' as const
    },
    enterprise: {
      maxStylists: -1, // unlimited
      maxClients: -1, // unlimited
      monthlyTokens: -1, // unlimited
      supportLevel: 'premium' as const
    }
  };

  async createSubscription(params: CreateSubscriptionParams): Promise<ISubscription> {
    try {
      logger.info('Creating subscription', { 
        organizationId: params.organizationId, 
        plan: params.plan 
      });

      const existingSubscription = await subscriptionRepository.findByOrganizationId(params.organizationId);
      if (existingSubscription && existingSubscription.status === SubscriptionStatus.ACTIVE) {
        throw new Error('この組織には既にアクティブなサブスクリプションが存在します');
      }

      const paymentMethod = await paymentMethodRepository.findById(params.paymentMethodId);
      if (!paymentMethod || paymentMethod.organizationId.toString() !== params.organizationId.toString()) {
        throw new Error('指定された支払い方法が見つかりません');
      }

      const now = new Date();
      const trialEndDate = params.trialDays ? new Date(now.getTime() + params.trialDays * 24 * 60 * 60 * 1000) : null;
      const periodStart = trialEndDate || now;
      const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, periodStart.getDate());

      let univapaySubscription = null;
      
      if (!trialEndDate && paymentMethod.univapayTokenId) {
        univapaySubscription = await this.createUnivapaySubscription(
          paymentMethod.univapayTokenId,
          params.plan,
          params.metadata
        );
      }

      const subscriptionData: Omit<ISubscription, '_id' | 'createdAt' | 'updatedAt' | keyof Document> = {
        organizationId: params.organizationId,
        plan: params.plan,
        status: trialEndDate ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        univapaySubscriptionId: univapaySubscription?.id,
        trialEndsAt: trialEndDate || undefined,
        metadata: params.metadata || {}
      };

      const subscription = await subscriptionRepository.create(subscriptionData);

      if (!trialEndDate) {
        await this.createSubscriptionInvoice(subscription, paymentMethod);
      }

      logger.info('Subscription created successfully', { 
        subscriptionId: subscription._id,
        organizationId: params.organizationId,
        plan: params.plan,
        status: subscription.status
      });

      return subscription;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create subscription', { 
        error: errorMessage, 
        organizationId: params.organizationId,
        plan: params.plan 
      });
      throw error;
    }
  }

  async updateSubscription(subscriptionId: ID, params: UpdateSubscriptionParams): Promise<ISubscription> {
    try {
      logger.info('Updating subscription', { subscriptionId, params });

      const subscription = await subscriptionRepository.findById(subscriptionId);
      if (!subscription) {
        throw new Error('サブスクリプションが見つかりません');
      }

      if (params.plan && params.plan !== subscription.plan) {
        await this.handlePlanChange(subscription, params.plan);
      }

      const updatedSubscription = await subscriptionRepository.update(subscriptionId, params);
      if (!updatedSubscription) {
        throw new Error('サブスクリプション更新に失敗しました');
      }

      if (subscription.univapaySubscriptionId && params.plan) {
        await this.updateUnivapaySubscription(subscription.univapaySubscriptionId, params.plan);
      }

      logger.info('Subscription updated successfully', { subscriptionId });
      return updatedSubscription;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update subscription', { error: errorMessage, subscriptionId });
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: ID, cancelAtPeriodEnd: boolean = true): Promise<ISubscription> {
    try {
      logger.info('Canceling subscription', { subscriptionId, cancelAtPeriodEnd });

      const subscription = await subscriptionRepository.findById(subscriptionId);
      if (!subscription) {
        throw new Error('サブスクリプションが見つかりません');
      }

      if (subscription.status === SubscriptionStatus.CANCELED) {
        throw new Error('このサブスクリプションは既にキャンセルされています');
      }

      let updateData: any = { cancelAtPeriodEnd };

      if (!cancelAtPeriodEnd) {
        updateData.status = SubscriptionStatus.CANCELED;
      }

      const updatedSubscription = await subscriptionRepository.update(subscriptionId, updateData);
      if (!updatedSubscription) {
        throw new Error('サブスクリプションキャンセルに失敗しました');
      }

      if (subscription.univapaySubscriptionId && !cancelAtPeriodEnd) {
        await univapayService.cancelSubscription(subscription.univapaySubscriptionId);
      }

      logger.info('Subscription canceled successfully', { 
        subscriptionId, 
        cancelAtPeriodEnd,
        newStatus: updatedSubscription.status 
      });

      return updatedSubscription;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to cancel subscription', { error: errorMessage, subscriptionId });
      throw error;
    }
  }

  async getSubscriptionByOrganization(organizationId: ID): Promise<ISubscription | null> {
    try {
      return await subscriptionRepository.findByOrganizationId(organizationId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get subscription by organization', { error: errorMessage, organizationId });
      throw error;
    }
  }

  async getSubscriptionById(subscriptionId: ID): Promise<ISubscription | null> {
    try {
      return await subscriptionRepository.findById(subscriptionId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get subscription by ID', { error: errorMessage, subscriptionId });
      throw error;
    }
  }

  async processExpiringSubscriptions(): Promise<void> {
    try {
      logger.info('Processing expiring subscriptions');

      const expiringSubscriptions = await subscriptionRepository.findExpiring(3); // 3日以内に期限切れ

      for (const subscription of expiringSubscriptions) {
        if (subscription.cancelAtPeriodEnd) {
          await this.handleSubscriptionExpiry(subscription);
        } else {
          await this.renewSubscription(subscription);
        }
      }

      logger.info('Processed expiring subscriptions', { count: expiringSubscriptions.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to process expiring subscriptions', { error: errorMessage });
      throw error;
    }
  }

  async getPlanDetails(plan: OrganizationPlan) {
    return {
      name: plan,
      price: this.planPrices[plan],
      features: this.planFeatures[plan],
      currency: 'JPY'
    };
  }

  private async createUnivapaySubscription(
    tokenId: string, 
    plan: OrganizationPlan, 
    metadata?: Record<string, any>
  ) {
    const amount = this.planPrices[plan];
    
    return await univapayService.createSubscription(tokenId, {
      amount,
      currency: 'JPY',
      period: 'month',
      metadata: {
        plan,
        ...metadata
      }
    });
  }

  private async updateUnivapaySubscription(univapaySubscriptionId: string, newPlan: OrganizationPlan) {
    const amount = this.planPrices[newPlan];
    
    return await univapayService.updateSubscription(univapaySubscriptionId, {
      amount,
      metadata: { plan: newPlan }
    });
  }

  private async handlePlanChange(subscription: ISubscription, newPlan: OrganizationPlan): Promise<void> {
    const currentPrice = this.planPrices[subscription.plan];
    const newPrice = this.planPrices[newPlan];
    
    if (newPrice > currentPrice) {
      await this.handleUpgrade(subscription, newPlan);
    } else if (newPrice < currentPrice) {
      await this.handleDowngrade(subscription, newPlan);
    }
  }

  private async handleUpgrade(subscription: ISubscription, newPlan: OrganizationPlan): Promise<void> {
    const defaultPaymentMethod = await paymentMethodRepository.findDefaultByOrganizationId(subscription.organizationId);
    if (defaultPaymentMethod) {
      const priceDifference = this.planPrices[newPlan] - this.planPrices[subscription.plan];
      const daysRemaining = Math.ceil((subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const proratedAmount = Math.round((priceDifference * daysRemaining) / 30);

      if (proratedAmount > 0) {
        await this.createUpgradeInvoice(subscription, newPlan, proratedAmount, defaultPaymentMethod);
      }
    }
  }

  private async handleDowngrade(subscription: ISubscription, newPlan: OrganizationPlan): Promise<void> {
    logger.info('Handling plan downgrade', { 
      subscriptionId: subscription._id, 
      currentPlan: subscription.plan, 
      newPlan 
    });
  }

  private async renewSubscription(subscription: ISubscription): Promise<void> {
    const nextPeriodStart = subscription.currentPeriodEnd;
    const nextPeriodEnd = new Date(nextPeriodStart.getFullYear(), nextPeriodStart.getMonth() + 1, nextPeriodStart.getDate());

    await subscriptionRepository.update(subscription._id, {
      currentPeriodStart: nextPeriodStart,
      currentPeriodEnd: nextPeriodEnd
    });

    const defaultPaymentMethod = await paymentMethodRepository.findDefaultByOrganizationId(subscription.organizationId);
    if (defaultPaymentMethod) {
      await this.createSubscriptionInvoice(subscription, defaultPaymentMethod);
    }
  }

  private async handleSubscriptionExpiry(subscription: ISubscription): Promise<void> {
    await subscriptionRepository.updateStatus(subscription._id, SubscriptionStatus.CANCELED);
    
    if (subscription.univapaySubscriptionId) {
      await univapayService.cancelSubscription(subscription.univapaySubscriptionId);
    }
  }

  private async createSubscriptionInvoice(subscription: ISubscription, paymentMethod: IPaymentMethod): Promise<void> {
    const planPrice = this.planPrices[subscription.plan];
    const items: InvoiceItem[] = [{
      description: `${subscription.plan}プラン（月額）`,
      unitPrice: planPrice,
      quantity: 1,
      amount: planPrice
    }];

    await invoiceRepository.create({
      organizationId: subscription.organizationId,
      subscriptionId: subscription._id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
      status: InvoiceStatus.SENT,
      items,
      subtotal: planPrice,
      tax: 0,
      total: planPrice,
      billingPeriod: {
        start: subscription.currentPeriodStart,
        end: subscription.currentPeriodEnd
      },
      type: 'subscription',
      paymentMethodId: paymentMethod._id
    });
  }

  private async createUpgradeInvoice(
    subscription: ISubscription, 
    newPlan: OrganizationPlan, 
    amount: number, 
    paymentMethod: IPaymentMethod
  ): Promise<void> {
    const items: InvoiceItem[] = [{
      description: `プラン変更差額（${subscription.plan} → ${newPlan}）`,
      unitPrice: amount,
      quantity: 1,
      amount
    }];

    await invoiceRepository.create({
      organizationId: subscription.organizationId,
      subscriptionId: subscription._id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1日後（即時請求）
      status: InvoiceStatus.SENT,
      items,
      subtotal: amount,
      tax: 0,
      total: amount,
      type: 'one-time',
      paymentMethodId: paymentMethod._id
    });
  }
}

export const subscriptionService = new SubscriptionService();