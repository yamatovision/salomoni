import { FilterQuery, UpdateQuery } from 'mongoose';
import { Invoice, IInvoice } from '../models/invoice.model';
import { ID, InvoiceStatus } from '../../../types/index';
import { logger } from '../../../common/utils/logger';

export class InvoiceRepository {
  async create(data: Partial<IInvoice>): Promise<IInvoice> {
    try {
      const invoice = new Invoice(data);
      await invoice.save();
      logger.info('Invoice created', { invoiceId: invoice._id, organizationId: invoice.organizationId });
      return invoice;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create invoice', { error: errorMessage, data });
      throw new Error(`請求書作成に失敗しました: ${errorMessage}`);
    }
  }

  async findById(id: ID): Promise<IInvoice | null> {
    try {
      return await Invoice.findById(id)
        .populate('organizationId')
        .populate('subscriptionId')
        .populate('paymentMethodId');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find invoice by ID', { error: errorMessage, id });
      throw new Error(`請求書取得に失敗しました: ${errorMessage}`);
    }
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<IInvoice | null> {
    try {
      return await Invoice.findOne({ invoiceNumber })
        .populate('organizationId')
        .populate('subscriptionId')
        .populate('paymentMethodId');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find invoice by number', { error: errorMessage, invoiceNumber });
      throw new Error(`請求書番号での取得に失敗しました: ${errorMessage}`);
    }
  }

  async findByOrganizationId(organizationId: ID, limit?: number): Promise<IInvoice[]> {
    try {
      const query = Invoice.find({ organizationId })
        .populate('subscriptionId')
        .populate('paymentMethodId')
        .sort({ issueDate: -1 });
      
      if (limit) {
        query.limit(limit);
      }
      
      return await query.exec();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find invoices by organization', { error: errorMessage, organizationId });
      throw new Error(`組織の請求書取得に失敗しました: ${errorMessage}`);
    }
  }

  async findBySubscriptionId(subscriptionId: ID): Promise<IInvoice[]> {
    try {
      return await Invoice.find({ subscriptionId })
        .populate('organizationId')
        .populate('paymentMethodId')
        .sort({ issueDate: -1 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find invoices by subscription', { error: errorMessage, subscriptionId });
      throw new Error(`サブスクリプションの請求書取得に失敗しました: ${errorMessage}`);
    }
  }

  async findByUnivapayChargeId(univapayChargeId: string): Promise<IInvoice | null> {
    try {
      return await Invoice.findOne({ univapayChargeId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find invoice by Univapay charge ID', { error: errorMessage, univapayChargeId });
      throw new Error(`Univapay課金IDでの請求書取得に失敗しました: ${errorMessage}`);
    }
  }

  async update(id: ID, data: UpdateQuery<IInvoice>): Promise<IInvoice | null> {
    try {
      const invoice = await Invoice.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (invoice) {
        logger.info('Invoice updated', { invoiceId: id, updatedFields: Object.keys(data) });
      }
      
      return invoice;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update invoice', { error: errorMessage, id, data });
      throw new Error(`請求書更新に失敗しました: ${errorMessage}`);
    }
  }

  async updateStatus(id: ID, status: InvoiceStatus, paidAt?: Date): Promise<IInvoice | null> {
    try {
      const updateData: any = { status };
      if (status === 'paid' && paidAt) {
        updateData.paidAt = paidAt;
      }
      
      return await this.update(id, updateData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update invoice status', { error: errorMessage, id, status });
      throw new Error(`請求書ステータス更新に失敗しました: ${errorMessage}`);
    }
  }

  async findOverdue(): Promise<IInvoice[]> {
    try {
      const today = new Date();
      return await Invoice.find({
        status: { $in: ['sent'] },
        dueDate: { $lt: today }
      }).populate('organizationId');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find overdue invoices', { error: errorMessage });
      throw new Error(`期限切れ請求書取得に失敗しました: ${errorMessage}`);
    }
  }

  async findPendingByOrganization(organizationId: ID): Promise<IInvoice[]> {
    try {
      return await Invoice.find({
        organizationId,
        status: { $in: ['draft', 'sent'] }
      }).sort({ issueDate: -1 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find pending invoices', { error: errorMessage, organizationId });
      throw new Error(`未払い請求書取得に失敗しました: ${errorMessage}`);
    }
  }

  async findAll(filter: FilterQuery<IInvoice> = {}): Promise<IInvoice[]> {
    try {
      return await Invoice.find(filter)
        .populate('organizationId')
        .populate('subscriptionId')
        .populate('paymentMethodId')
        .sort({ issueDate: -1 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to find invoices', { error: errorMessage, filter });
      throw new Error(`請求書一覧取得に失敗しました: ${errorMessage}`);
    }
  }

  async getTotalAmountByOrganization(organizationId: ID, status?: InvoiceStatus): Promise<number> {
    try {
      const matchConditions: any = { organizationId };
      if (status) {
        matchConditions.status = status;
      }

      const result = await Invoice.aggregate([
        { $match: matchConditions },
        { $group: { _id: null, totalAmount: { $sum: '$total' } } }
      ]);

      return result.length > 0 ? result[0].totalAmount : 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get total amount by organization', { error: errorMessage, organizationId, status });
      throw new Error(`組織の請求金額合計取得に失敗しました: ${errorMessage}`);
    }
  }

  async countByStatus(status: InvoiceStatus): Promise<number> {
    try {
      return await Invoice.countDocuments({ status });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to count invoices by status', { error: errorMessage, status });
      throw new Error(`ステータス別請求書数取得に失敗しました: ${errorMessage}`);
    }
  }

  async delete(id: ID): Promise<boolean> {
    try {
      const result = await Invoice.findByIdAndDelete(id);
      if (result) {
        logger.info('Invoice deleted', { invoiceId: id });
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete invoice', { error: errorMessage, id });
      throw new Error(`請求書削除に失敗しました: ${errorMessage}`);
    }
  }
}

export const invoiceRepository = new InvoiceRepository();