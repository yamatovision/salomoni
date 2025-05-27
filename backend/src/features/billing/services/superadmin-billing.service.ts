import { 
  SuperAdminBillingSummary,
  SuperAdminInvoiceListItem,
  SuperAdminInvoiceDetail,
  InvoiceStatus
} from '../../../types/index';
import { invoiceRepository } from '../repositories/invoice.repository';
import { subscriptionRepository } from '../repositories/subscription.repository';
import { paymentHistoryRepository } from '../repositories/payment-history.repository';
// import { OrganizationRepository } from '../../organizations/repositories/organization.repository';
// const organizationRepository = new OrganizationRepository();
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/errors';

export class SuperAdminBillingService {
  async getBillingSummary(period?: string, organizationId?: string): Promise<SuperAdminBillingSummary> {
    const operationId = `superadmin-billing-summary-${Date.now()}`;
    logger.info('Getting SuperAdmin billing summary', { operationId, period, organizationId });

    try {
      // 期間の計算
      const { startDate, endDate } = this.calculatePeriod(period || 'current_month');
      
      // 請求金額の集計
      const invoiceSummary = await invoiceRepository.getTotalAmountByPeriod(
        startDate,
        endDate,
        organizationId
      );

      // サブスクリプション統計
      // const subscriptionStats = await subscriptionRepository.getSubscriptionStats();
      
      // MRR（月間経常収益）
      const mrr = await subscriptionRepository.getMonthlyRecurringRevenue();

      // 組織数
      // const activeOrganizations = organizationId 
      //   ? 1 
      //   : await organizationRepository.countActiveOrganizations();

      // 支払い成功率の計算
      const paymentStats = await paymentHistoryRepository.getPaymentStatsByPeriod(
        startDate,
        endDate,
        organizationId
      );

      const successRate = paymentStats.total > 0
        ? (paymentStats.succeeded / paymentStats.total) * 100
        : 0;

      // 平均請求額
      // const avgInvoiceAmount = paymentStats.total > 0
      //   ? invoiceSummary.total / paymentStats.total
      //   : 0;

      // 前期間との比較
      const { startDate: prevStartDate, endDate: prevEndDate } = this.calculatePreviousPeriod(period || 'current_month');
      const prevInvoiceSummary = await invoiceRepository.getTotalAmountByPeriod(
        prevStartDate,
        prevEndDate,
        organizationId
      );

      const growthRate = prevInvoiceSummary.total > 0
        ? ((invoiceSummary.total - prevInvoiceSummary.total) / prevInvoiceSummary.total) * 100
        : 0;

      const summary: SuperAdminBillingSummary = {
        revenue: {
          total: invoiceSummary.paid + invoiceSummary.pending,
          subscription: mrr,
          tokenSales: invoiceSummary.paid - mrr,
          monthlyGrowth: Math.round(growthRate * 100) / 100,
          yearlyGrowth: 0 // TODO: 年間成長率の計算を実装
        },
        paymentStatus: {
          totalOutstanding: invoiceSummary.pending,
          totalOverdue: invoiceSummary.failed,
          successRate: Math.round(successRate * 100) / 100,
          failureCount: paymentStats.failed
        },
        topOrganizations: [], // TODO: トップ組織の実装
        period: {
          start: startDate,
          end: endDate
        }
      };

      logger.info('SuperAdmin billing summary retrieved', { operationId, summary });
      return summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get SuperAdmin billing summary', { operationId, error: errorMessage });
      throw new AppError('請求サマリーの取得に失敗しました', 500, 'BILLING_SUMMARY_ERROR');
    }
  }

  async getInvoiceList(params: {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    type?: 'subscription' | 'one-time' | 'token';
    organizationId?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ 
    invoices: SuperAdminInvoiceListItem[]; 
    total: number; 
    pages: number;
    currentPage: number;
  }> {
    const operationId = `superadmin-invoice-list-${Date.now()}`;
    logger.info('Getting SuperAdmin invoice list', { operationId, params });

    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        organizationId,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      // フィルター条件の構築
      const filter: any = {};
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (organizationId) filter.organizationId = organizationId;
      if (startDate || endDate) {
        filter.issueDate = {};
        if (startDate) filter.issueDate.$gte = startDate;
        if (endDate) filter.issueDate.$lte = endDate;
      }

      // ページネーション付きで請求書を取得
      const result = await invoiceRepository.findAllWithPagination(
        filter,
        page,
        limit,
        sortBy,
        sortOrder
      );

      // SuperAdminInvoiceListItem形式に変換
      const invoices: SuperAdminInvoiceListItem[] = result.invoices.map(invoice => ({
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        organizationId: invoice.organizationId.toString(),
        organizationName: (invoice.organizationId as any).name || '不明',
        type: invoice.type === 'one-time' ? 'adjustment' : invoice.type as 'subscription' | 'token' | 'adjustment',
        status: invoice.status,
        amount: invoice.total,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt,
        overdueDays: invoice.status === 'overdue' ? Math.floor((new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined
      }));

      logger.info('SuperAdmin invoice list retrieved', { 
        operationId, 
        count: invoices.length,
        total: result.total,
        pages: result.pages
      });

      return {
        invoices,
        total: result.total,
        pages: result.pages,
        currentPage: page
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get SuperAdmin invoice list', { operationId, error: errorMessage });
      throw new AppError('請求書一覧の取得に失敗しました', 500, 'INVOICE_LIST_ERROR');
    }
  }

  async getInvoiceDetail(invoiceId: string): Promise<SuperAdminInvoiceDetail> {
    const operationId = `superadmin-invoice-detail-${Date.now()}`;
    logger.info('Getting SuperAdmin invoice detail', { operationId, invoiceId });

    try {
      // 請求書を取得
      const invoice = await invoiceRepository.findById(invoiceId);
      if (!invoice) {
        throw new AppError('請求書が見つかりません', 404, 'INVOICE_NOT_FOUND');
      }

      // 支払い履歴を取得
      const paymentHistory = await paymentHistoryRepository.findByInvoiceId(invoiceId);

      // 関連するサブスクリプション情報
      // let subscriptionInfo = null;
      // if (invoice.subscriptionId) {
      //   const subscription = await subscriptionRepository.findById(invoice.subscriptionId);
      //   if (subscription) {
      //     subscriptionInfo = {
      //       id: subscription._id.toString(),
      //       planId: subscription.plan,
      //       planName: subscription.plan,
      //       status: subscription.status,
      //       currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      //       currentPeriodEnd: subscription.currentPeriodEnd.toISOString()
      //     };
      //   }
      // }

      // SuperAdminInvoiceDetail形式に変換
      logger.info('Converting invoice to detail format', { 
        invoiceId: invoice._id,
        organizationId: invoice.organizationId,
        organizationIdType: typeof invoice.organizationId 
      });
      
      const organizationData = invoice.organizationId as any;
      const isPopulated = organizationData && typeof organizationData === 'object' && organizationData._id;
      const organizationId = isPopulated ? organizationData._id.toString() : organizationData?.toString() || invoice.organizationId?.toString() || '';
      
      const invoiceDetail: SuperAdminInvoiceDetail = {
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        organizationId: organizationId,
        type: invoice.type,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt,
        items: invoice.items.map((item: any) => ({
          description: item.description,
          unitPrice: item.unitPrice || (item.amount / (item.quantity || 1)),
          quantity: item.quantity || 1,
          amount: item.amount
        })),
        subtotal: invoice.subtotal || invoice.total - invoice.tax,
        tax: invoice.tax,
        total: invoice.total,
        organization: {
          id: organizationId,
          name: isPopulated ? (organizationData.name || '不明') : '不明',
          email: isPopulated ? (organizationData.email || '') : '',
          phone: isPopulated ? organizationData.phone : undefined,
          plan: isPopulated ? (organizationData.plan || 'standard') : 'standard',
          status: isPopulated ? (organizationData.status || 'active') : 'active'
        },
        paymentHistory: paymentHistory.map(payment => ({
          attemptDate: payment.createdAt,
          status: payment.status === 'pending' ? 'failed' : payment.status as 'success' | 'failed',
          amount: payment.amount,
          paymentMethodId: payment.paymentMethodId?.toString(),
          failureReason: payment.failureReason
        })),
        notes: [],
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt
      };

      logger.info('SuperAdmin invoice detail retrieved', { operationId, invoiceId });
      return invoiceDetail;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get SuperAdmin invoice detail', { operationId, error: errorMessage });
      throw new AppError('請求書詳細の取得に失敗しました', 500, 'INVOICE_DETAIL_ERROR');
    }
  }

  // ヘルパーメソッド
  private calculatePeriod(period: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    switch (period) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'last_3_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'last_6_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  private calculatePreviousPeriod(period: string): { startDate: Date; endDate: Date } {
    const { startDate, endDate } = this.calculatePeriod(period);
    const duration = endDate.getTime() - startDate.getTime();
    
    return {
      startDate: new Date(startDate.getTime() - duration),
      endDate: new Date(endDate.getTime() - duration)
    };
  }
}

export const superAdminBillingService = new SuperAdminBillingService();