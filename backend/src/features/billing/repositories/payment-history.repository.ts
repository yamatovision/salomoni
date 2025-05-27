import { FilterQuery, UpdateQuery } from 'mongoose';
import { PaymentHistory, IPaymentHistory } from '../models/payment-history.model';
import { ID } from '../../../types/index';
import { logger } from '../../../common/utils/logger';

export class PaymentHistoryRepository {
  async create(data: Partial<IPaymentHistory>): Promise<IPaymentHistory> {
    try {
      const paymentHistory = new PaymentHistory(data);
      await paymentHistory.save();
      logger.info('Payment history created', { 
        paymentHistoryId: paymentHistory._id, 
        organizationId: paymentHistory.organizationId,
        status: paymentHistory.status
      });
      return paymentHistory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create payment history', { error: errorMessage, data });
      throw new Error(`支払い履歴作成に失敗しました: ${errorMessage}`);
    }
  }

  async findById(id: ID): Promise<IPaymentHistory | null> {
    try {
      return await PaymentHistory.findById(id)
        .populate('organizationId')
        .populate('invoiceId')
        .populate('paymentMethodId');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find payment history by ID', { error: errorMessage, id });
      throw new Error(`支払い履歴取得に失敗しました: ${errorMessage}`);
    }
  }

  async findByOrganizationId(organizationId: ID, limit?: number): Promise<IPaymentHistory[]> {
    try {
      const query = PaymentHistory.find({ organizationId })
        .populate('invoiceId')
        .populate('paymentMethodId')
        .sort({ createdAt: -1 });
      
      if (limit) {
        query.limit(limit);
      }
      
      return await query.exec();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find payment history by organization', { error: errorMessage, organizationId });
      throw new Error(`組織の支払い履歴取得に失敗しました: ${errorMessage}`);
    }
  }

  async findByInvoiceId(invoiceId: ID): Promise<IPaymentHistory[]> {
    try {
      return await PaymentHistory.find({ invoiceId })
        .populate('organizationId')
        .populate('paymentMethodId')
        .sort({ createdAt: -1 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find payment history by invoice', { error: errorMessage, invoiceId });
      throw new Error(`請求書の支払い履歴取得に失敗しました: ${errorMessage}`);
    }
  }

  async findByUnivapayChargeId(univapayChargeId: string): Promise<IPaymentHistory | null> {
    try {
      return await PaymentHistory.findOne({ univapayChargeId })
        .populate('organizationId')
        .populate('invoiceId')
        .populate('paymentMethodId');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find payment history by Univapay charge ID', { error: errorMessage, univapayChargeId });
      throw new Error(`Univapay課金IDでの支払い履歴取得に失敗しました: ${errorMessage}`);
    }
  }

  async findByStatus(status: 'success' | 'failed' | 'pending', limit?: number): Promise<IPaymentHistory[]> {
    try {
      const query = PaymentHistory.find({ status })
        .populate('organizationId')
        .populate('invoiceId')
        .populate('paymentMethodId')
        .sort({ createdAt: -1 });
      
      if (limit) {
        query.limit(limit);
      }
      
      return await query.exec();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find payment history by status', { error: errorMessage, status });
      throw new Error(`ステータス別支払い履歴取得に失敗しました: ${errorMessage}`);
    }
  }

  async getSuccessfulPaymentsByOrganization(
    organizationId: ID,
    startDate: Date,
    endDate: Date
  ): Promise<{ totalAmount: number; count: number }> {
    try {
      const result = await PaymentHistory.aggregate([
        {
          $match: {
            organizationId: organizationId,
            status: 'success',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      return result.length > 0 
        ? result[0] 
        : { totalAmount: 0, count: 0 };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get successful payments by organization', { error: errorMessage, organizationId });
      throw new Error(`組織の成功支払い取得に失敗しました: ${errorMessage}`);
    }
  }

  async getFailedPaymentsByOrganization(
    organizationId: ID,
    startDate: Date,
    endDate: Date
  ): Promise<IPaymentHistory[]> {
    try {
      return await PaymentHistory.find({
        organizationId,
        status: 'failed',
        createdAt: { $gte: startDate, $lte: endDate }
      })
      .populate('invoiceId')
      .populate('paymentMethodId')
      .sort({ createdAt: -1 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get failed payments by organization', { error: errorMessage, organizationId });
      throw new Error(`組織の失敗支払い取得に失敗しました: ${errorMessage}`);
    }
  }

  async getPaymentSuccessRate(
    organizationId: ID,
    startDate: Date,
    endDate: Date
  ): Promise<{ successRate: number; totalPayments: number; successfulPayments: number }> {
    try {
      const result = await PaymentHistory.aggregate([
        {
          $match: {
            organizationId: organizationId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            successfulPayments: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            }
          }
        }
      ]);

      if (result.length === 0) {
        return { successRate: 0, totalPayments: 0, successfulPayments: 0 };
      }

      const { totalPayments, successfulPayments } = result[0];
      const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

      return { successRate, totalPayments, successfulPayments };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get payment success rate', { error: errorMessage, organizationId });
      throw new Error(`支払い成功率取得に失敗しました: ${errorMessage}`);
    }
  }

  async findAll(filter: FilterQuery<IPaymentHistory> = {}): Promise<IPaymentHistory[]> {
    try {
      return await PaymentHistory.find(filter)
        .populate('organizationId')
        .populate('invoiceId')
        .populate('paymentMethodId')
        .sort({ createdAt: -1 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find payment history', { error: errorMessage, filter });
      throw new Error(`支払い履歴一覧取得に失敗しました: ${errorMessage}`);
    }
  }

  async update(id: ID, data: UpdateQuery<IPaymentHistory>): Promise<IPaymentHistory | null> {
    try {
      const paymentHistory = await PaymentHistory.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (paymentHistory) {
        logger.info('Payment history updated', { paymentHistoryId: id, updatedFields: Object.keys(data) });
      }
      
      return paymentHistory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update payment history', { error: errorMessage, id, data });
      throw new Error(`支払い履歴更新に失敗しました: ${errorMessage}`);
    }
  }

  async countByStatus(status: 'success' | 'failed' | 'pending'): Promise<number> {
    try {
      return await PaymentHistory.countDocuments({ status });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to count payment history by status', { error: errorMessage, status });
      throw new Error(`ステータス別支払い履歴数取得に失敗しました: ${errorMessage}`);
    }
  }

  async delete(id: ID): Promise<boolean> {
    try {
      const result = await PaymentHistory.findByIdAndDelete(id);
      if (result) {
        logger.info('Payment history deleted', { paymentHistoryId: id });
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete payment history', { error: errorMessage, id });
      throw new Error(`支払い履歴削除に失敗しました: ${errorMessage}`);
    }
  }

  // SuperAdmin用メソッド
  async getPaymentStatsByPeriod(
    startDate: Date,
    endDate: Date,
    organizationId?: ID
  ): Promise<{
    total: number;
    succeeded: number;
    failed: number;
    pending: number;
    totalAmount: number;
  }> {
    try {
      const matchConditions: any = {
        createdAt: { $gte: startDate, $lte: endDate }
      };
      if (organizationId) {
        matchConditions.organizationId = organizationId;
      }

      const results = await PaymentHistory.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        }
      ]);

      const stats = {
        total: 0,
        succeeded: 0,
        failed: 0,
        pending: 0,
        totalAmount: 0
      };

      results.forEach(result => {
        stats.total += result.count;
        stats.totalAmount += result.amount;
        
        switch (result._id) {
          case 'success':
            stats.succeeded = result.count;
            break;
          case 'failed':
            stats.failed = result.count;
            break;
          case 'pending':
            stats.pending = result.count;
            break;
        }
      });

      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get payment stats by period', { error: errorMessage, startDate, endDate });
      throw new Error(`期間別支払い統計取得に失敗しました: ${errorMessage}`);
    }
  }
}

export const paymentHistoryRepository = new PaymentHistoryRepository();