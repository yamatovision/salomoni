import { apiClient } from './apiClient';
import { API_PATHS } from '../../types';
import type {
  SuperAdminBillingSummary,
  SuperAdminInvoice,
  SuperAdminInvoiceDetail,
} from '../../types';

export class SuperAdminBillingService {
  /**
   * SuperAdmin請求サマリー取得
   */
  async getBillingSummary(): Promise<SuperAdminBillingSummary> {
    const response = await apiClient.get<{ success: boolean; data: { summary: SuperAdminBillingSummary } }>(
      API_PATHS.SUPERADMIN.BILLING_SUMMARY
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.summary;
    }
    
    throw new Error('請求サマリーの取得に失敗しました');
  }

  /**
   * 全組織の請求書一覧取得
   */
  async getInvoices(params?: {
    organizationId?: string;
    status?: 'paid' | 'pending' | 'overdue';
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    invoices: SuperAdminInvoice[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        invoices: SuperAdminInvoice[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    }>(API_PATHS.SUPERADMIN.INVOICES, { params });
    
    if (response.data.success && response.data.data) {
      const { invoices, pagination } = response.data.data;
      return {
        invoices: invoices || [],
        total: pagination.total,
        page: pagination.page,
        totalPages: pagination.totalPages,
      };
    }
    
    throw new Error('請求書一覧の取得に失敗しました');
  }

  /**
   * 請求書詳細取得
   */
  async getInvoiceDetail(invoiceId: string): Promise<SuperAdminInvoiceDetail> {
    const response = await apiClient.get<{ success: boolean; data: { invoice: SuperAdminInvoiceDetail } }>(
      API_PATHS.SUPERADMIN.BILLING_INVOICE_DETAIL(invoiceId)
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data.invoice;
    }
    
    throw new Error('請求書詳細の取得に失敗しました');
  }
}

// シングルトンインスタンスをエクスポート
export const superAdminBillingService = new SuperAdminBillingService();