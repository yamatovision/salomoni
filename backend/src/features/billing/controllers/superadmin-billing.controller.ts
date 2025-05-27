import { Request, Response, NextFunction } from 'express';
import { superAdminBillingService } from '../services/superadmin-billing.service';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/errors';
import { 
  InvoiceStatus,
  SuperAdminInvoiceUpdateRequest
} from '../../../types/index';

export class SuperAdminBillingController {
  /**
   * 請求サマリーを取得
   * GET /api/superadmin/billing/summary
   */
  async getBillingSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    const operationId = `ctrl-superadmin-billing-summary-${Date.now()}`;
    logger.info('SuperAdmin billing summary requested', { 
      operationId,
      userId: req.user?.id,
      query: req.query
    });

    try {
      const { period, organizationId } = req.query;
      
      const summary = await superAdminBillingService.getBillingSummary(
        period as string,
        organizationId as string
      );

      logger.info('SuperAdmin billing summary retrieved successfully', { 
        operationId,
        period,
        organizationId
      });

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Failed to get SuperAdmin billing summary', { 
        operationId,
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * 請求書一覧を取得
   * GET /api/superadmin/billing/invoices
   */
  async getInvoiceList(req: Request, res: Response, next: NextFunction): Promise<void> {
    const operationId = `ctrl-superadmin-invoice-list-${Date.now()}`;
    logger.info('SuperAdmin invoice list requested', { 
      operationId,
      userId: req.user?.id,
      query: req.query
    });

    try {
      const {
        page,
        limit,
        status,
        type,
        organizationId,
        startDate,
        endDate,
        sortBy,
        sortOrder
      } = req.query;

      const params = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as InvoiceStatus,
        type: type as 'subscription' | 'one-time' | 'token',
        organizationId: organizationId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await superAdminBillingService.getInvoiceList(params);

      logger.info('SuperAdmin invoice list retrieved successfully', { 
        operationId,
        count: result.invoices.length,
        total: result.total,
        pages: result.pages
      });

      res.status(200).json({
        success: true,
        data: result.invoices,
        pagination: {
          total: result.total,
          pages: result.pages,
          currentPage: result.currentPage,
          limit: params.limit || 20
        }
      });
    } catch (error) {
      logger.error('Failed to get SuperAdmin invoice list', { 
        operationId,
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * 請求書詳細を取得
   * GET /api/superadmin/billing/invoices/:invoiceId
   */
  async getInvoiceDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    const operationId = `ctrl-superadmin-invoice-detail-${Date.now()}`;
    const { invoiceId } = req.params;
    
    logger.info('SuperAdmin invoice detail requested', { 
      operationId,
      userId: req.user?.id,
      invoiceId
    });

    try {
      if (!invoiceId) {
        throw new AppError('請求書IDが指定されていません', 400, 'INVALID_INVOICE_ID');
      }
      const invoice = await superAdminBillingService.getInvoiceDetail(invoiceId);

      logger.info('SuperAdmin invoice detail retrieved successfully', { 
        operationId,
        invoiceId,
        organizationId: invoice.organizationId
      });

      res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      logger.error('Failed to get SuperAdmin invoice detail', { 
        operationId,
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id,
        invoiceId
      });
      next(error);
    }
  }

  /**
   * 請求書を更新（Phase 3で実装）
   * PATCH /api/superadmin/billing/invoices/:invoiceId
   */
  async updateInvoice(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const operationId = `ctrl-superadmin-invoice-update-${Date.now()}`;
    const { invoiceId } = req.params;
    const updateData: SuperAdminInvoiceUpdateRequest = req.body;
    
    logger.info('SuperAdmin invoice update requested', { 
      operationId,
      userId: req.user?.id,
      invoiceId,
      updateData
    });

    try {
      // Phase 3で実装予定
      throw new AppError('この機能は現在開発中です', 501, 'NOT_IMPLEMENTED');
    } catch (error) {
      logger.error('Failed to update SuperAdmin invoice', { 
        operationId,
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id,
        invoiceId
      });
      next(error);
    }
  }

  /**
   * 請求書を再送信（Phase 3で実装）
   * POST /api/superadmin/billing/invoices/:invoiceId/resend
   */
  async resendInvoice(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const operationId = `ctrl-superadmin-invoice-resend-${Date.now()}`;
    const { invoiceId } = req.params;
    
    logger.info('SuperAdmin invoice resend requested', { 
      operationId,
      userId: req.user?.id,
      invoiceId
    });

    try {
      // Phase 3で実装予定
      throw new AppError('この機能は現在開発中です', 501, 'NOT_IMPLEMENTED');
    } catch (error) {
      logger.error('Failed to resend SuperAdmin invoice', { 
        operationId,
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id,
        invoiceId
      });
      next(error);
    }
  }
}

export const superAdminBillingController = new SuperAdminBillingController();