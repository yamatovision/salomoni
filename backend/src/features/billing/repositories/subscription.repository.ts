import { FilterQuery, UpdateQuery } from 'mongoose';
import { Subscription, ISubscription } from '../models/subscription.model';
import { ID, SubscriptionStatus } from '../../../types/index';
import { logger } from '../../../common/utils/logger';

export class SubscriptionRepository {
  async create(data: Partial<ISubscription>): Promise<ISubscription> {
    try {
      const subscription = new Subscription(data);
      await subscription.save();
      logger.info('Subscription created', { subscriptionId: subscription._id, organizationId: subscription.organizationId });
      return subscription;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create subscription', { error: errorMessage, data });
      throw new Error(`サブスクリプション作成に失敗しました: ${errorMessage}`);
    }
  }

  async findById(id: ID): Promise<ISubscription | null> {
    try {
      return await Subscription.findById(id).populate('organizationId');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find subscription by ID', { error: errorMessage, id });
      throw new Error(`サブスクリプション取得に失敗しました: ${errorMessage}`);
    }
  }

  async findByOrganizationId(organizationId: ID): Promise<ISubscription | null> {
    try {
      return await Subscription.findOne({ 
        organizationId, 
        status: { $in: ['active', 'trialing', 'past_due'] } 
      }).sort({ createdAt: -1 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find subscription by organization', { error: errorMessage, organizationId });
      throw new Error(`組織のサブスクリプション取得に失敗しました: ${errorMessage}`);
    }
  }

  async findByUnivapayId(univapaySubscriptionId: string): Promise<ISubscription | null> {
    try {
      return await Subscription.findOne({ univapaySubscriptionId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find subscription by Univapay ID', { error: errorMessage, univapaySubscriptionId });
      throw new Error(`Univapay IDでのサブスクリプション取得に失敗しました: ${errorMessage}`);
    }
  }

  async update(id: ID, data: UpdateQuery<ISubscription>): Promise<ISubscription | null> {
    try {
      const subscription = await Subscription.findByIdAndUpdate(
        id, 
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (subscription) {
        logger.info('Subscription updated', { subscriptionId: id, updatedFields: Object.keys(data) });
      }
      
      return subscription;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update subscription', { error: errorMessage, id, data });
      throw new Error(`サブスクリプション更新に失敗しました: ${errorMessage}`);
    }
  }

  async updateStatus(id: ID, status: SubscriptionStatus): Promise<ISubscription | null> {
    try {
      return await this.update(id, { status });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update subscription status', { error: errorMessage, id, status });
      throw new Error(`サブスクリプションステータス更新に失敗しました: ${errorMessage}`);
    }
  }

  async findExpiring(days: number = 7): Promise<ISubscription[]> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      
      return await Subscription.find({
        status: 'active',
        currentPeriodEnd: { $lte: expiryDate }
      }).populate('organizationId');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find expiring subscriptions', { error: errorMessage, days });
      throw new Error(`期限切れ予定のサブスクリプション取得に失敗しました: ${errorMessage}`);
    }
  }

  async findAll(filter: FilterQuery<ISubscription> = {}): Promise<ISubscription[]> {
    try {
      return await Subscription.find(filter).populate('organizationId').sort({ createdAt: -1 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find subscriptions', { error: errorMessage, filter });
      throw new Error(`サブスクリプション一覧取得に失敗しました: ${errorMessage}`);
    }
  }

  async countByStatus(status: SubscriptionStatus): Promise<number> {
    try {
      return await Subscription.countDocuments({ status });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to count subscriptions by status', { error: errorMessage, status });
      throw new Error(`ステータス別サブスクリプション数取得に失敗しました: ${errorMessage}`);
    }
  }

  async delete(id: ID): Promise<boolean> {
    try {
      const result = await Subscription.findByIdAndDelete(id);
      if (result) {
        logger.info('Subscription deleted', { subscriptionId: id });
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete subscription', { error: errorMessage, id });
      throw new Error(`サブスクリプション削除に失敗しました: ${errorMessage}`);
    }
  }

  // SuperAdmin用メソッド
  async getSubscriptionStats(): Promise<{
    total: number;
    active: number;
    trialing: number;
    cancelled: number;
    expired: number;
  }> {
    try {
      const results = await Subscription.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const stats = {
        total: 0,
        active: 0,
        trialing: 0,
        cancelled: 0,
        expired: 0
      };

      results.forEach(result => {
        stats.total += result.count;
        switch (result._id) {
          case 'active':
            stats.active = result.count;
            break;
          case 'trialing':
            stats.trialing = result.count;
            break;
          case 'cancelled':
            stats.cancelled = result.count;
            break;
          case 'expired':
            stats.expired = result.count;
            break;
        }
      });

      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get subscription stats', { error: errorMessage });
      throw new Error(`サブスクリプション統計取得に失敗しました: ${errorMessage}`);
    }
  }

  async getMonthlyRecurringRevenue(): Promise<number> {
    try {
      // プランごとの料金マッピング（仮の値）
      const planPricing: Record<string, number> = {
        free: 0,
        standard: 3000,
        professional: 5000,
        enterprise: 10000
      };

      const result = await Subscription.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$plan',
            count: { $sum: 1 }
          }
        }
      ]);

      let mrr = 0;
      result.forEach(item => {
        const price = planPricing[item._id] || 0;
        mrr += price * item.count;
      });

      return mrr;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get MRR', { error: errorMessage });
      throw new Error(`月間経常収益取得に失敗しました: ${errorMessage}`);
    }
  }
}

export const subscriptionRepository = new SubscriptionRepository();