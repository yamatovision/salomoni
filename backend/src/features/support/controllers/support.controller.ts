import { Request, Response, NextFunction } from 'express';
import { SupportService } from '../services/support.service';
import { UserRole, TicketStatus } from '../../../types';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/utils/errors';

export class SupportController {
  private supportService: SupportService;

  constructor() {
    this.supportService = new SupportService();
  }

  /**
   * サポートチケットを作成
   */
  async createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new AppError('認証が必要です', 401);
      }

      const { title, description, priority, category } = req.body;

      logger.info('サポートチケット作成リクエスト', {
        userId: user.id,
        organizationId: user.organizationId,
        title
      });

      if (!user.organizationId) {
        throw new AppError('組織情報が見つかりません', 400);
      }

      const ticket = await this.supportService.createTicket(
        user.id,
        user.organizationId,
        {
          title,
          description,
          priority,
          category
        }
      );

      logger.info('サポートチケット作成成功', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber
      });

      res.status(201).json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('サポートチケット作成エラー', {
        error,
        userId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * サポートチケット一覧を取得
   */
  async getTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new AppError('認証が必要です', 401);
      }

      const {
        page = 1,
        limit = 20,
        status,
        priority,
        category,
        searchTerm,
        organizationId,
        userId,
        sortBy,
        sortOrder
      } = req.query;

      logger.info('サポートチケット一覧取得リクエスト', {
        requesterId: user.id,
        requesterRole: user.currentRole,
        filters: { status, priority, category, searchTerm }
      });

      const result = await this.supportService.getTickets(
        user.id,
        user.currentRole,
        {
          organizationId: organizationId as string,
          userId: userId as string,
          status: status as TicketStatus,
          priority: priority as string,
          category: category as string,
          searchTerm: searchTerm as string,
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc'
        },
        {
          page: Number(page),
          limit: Number(limit)
        }
      );

      logger.info('サポートチケット一覧取得成功', {
        totalItems: result.pagination.totalItems,
        returnedItems: result.tickets.length
      });

      res.json({
        success: true,
        data: {
          tickets: result.tickets,
          total: result.pagination.totalItems,
          pagination: {
            ...result.pagination,
            total: result.pagination.totalItems,
            pages: result.pagination.totalPages
          }
        },
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('サポートチケット一覧取得エラー', {
        error,
        userId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * サポートチケット詳細を取得
   */
  async getTicketDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new AppError('認証が必要です', 401);
      }

      const { ticketId } = req.params;
      if (!ticketId) {
        throw new AppError('チケットIDが必要です', 400);
      }

      logger.info('サポートチケット詳細取得リクエスト', {
        requesterId: user.id,
        ticketId
      });

      const ticket = await this.supportService.getTicketDetail(
        user.id,
        user.currentRole,
        ticketId
      );

      logger.info('サポートチケット詳細取得成功', {
        ticketId: ticket.id
      });

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('サポートチケット詳細取得エラー', {
        error,
        userId: req.user?.id,
        ticketId: req.params.ticketId
      });
      next(error);
    }
  }

  /**
   * サポートチケットに返信
   */
  async replyToTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new AppError('認証が必要です', 401);
      }

      const { ticketId } = req.params;
      if (!ticketId) {
        throw new AppError('チケットIDが必要です', 400);
      }

      const { message: content, attachments } = req.body;

      logger.info('サポートチケット返信リクエスト', {
        senderId: user.id,
        ticketId
      });

      const message = await this.supportService.replyToTicket(
        user.id,
        user.currentRole,
        ticketId,
        {
          content,
          attachments
        }
      );

      logger.info('サポートチケット返信成功', {
        ticketId,
        messageId: message.id
      });

      res.status(200).json({
        success: true,
        data: message
      });
    } catch (error) {
      logger.error('サポートチケット返信エラー', {
        error,
        userId: req.user?.id,
        ticketId: req.params.ticketId
      });
      next(error);
    }
  }

  /**
   * サポートチケットのステータスを更新
   */
  async updateTicketStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new AppError('認証が必要です', 401);
      }

      const { ticketId } = req.params;
      if (!ticketId) {
        throw new AppError('チケットIDが必要です', 400);
      }

      const { status } = req.body;

      logger.info('サポートチケットステータス更新リクエスト', {
        requesterId: user.id,
        ticketId,
        newStatus: status
      });

      const ticket = await this.supportService.updateTicketStatus(
        user.id,
        user.currentRole,
        ticketId,
        status
      );

      logger.info('サポートチケットステータス更新成功', {
        ticketId: ticket.id,
        status: ticket.status
      });

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('サポートチケットステータス更新エラー', {
        error,
        userId: req.user?.id,
        ticketId: req.params.ticketId
      });
      next(error);
    }
  }

  /**
   * サポートチケット統計を取得
   */
  async getTicketStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new AppError('認証が必要です', 401);
      }

      const { organizationId } = req.query;

      logger.info('サポートチケット統計取得リクエスト', {
        requesterId: user.id,
        organizationId
      });

      const stats = await this.supportService.getTicketStats(
        user.id,
        user.currentRole,
        organizationId as string
      );

      logger.info('サポートチケット統計取得成功', {
        stats
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('サポートチケット統計取得エラー', {
        error,
        userId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * SuperAdmin用: サポートチケット一覧を取得
   */
  async getSuperAdminTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new AppError('認証が必要です', 401);
      }

      // SuperAdmin権限チェック
      if (user.currentRole !== UserRole.SUPER_ADMIN) {
        throw new AppError('このリソースへのアクセス権限がありません', 403);
      }

      const {
        page = 1,
        limit = 20,
        status,
        priority,
        category,
        searchTerm,
        organizationId
      } = req.query;

      logger.info('SuperAdminサポートチケット一覧取得リクエスト', {
        requesterId: user.id,
        filters: { status, priority, category, searchTerm, organizationId }
      });

      const result = await this.supportService.getTickets(
        user.id,
        user.currentRole,
        {
          organizationId: organizationId as string,
          status: status as TicketStatus,
          priority: priority as string,
          category: category as string,
          searchTerm: searchTerm as string
        },
        {
          page: Number(page),
          limit: Number(limit)
        }
      );

      logger.info('SuperAdminサポートチケット一覧取得成功', {
        totalItems: result.pagination.totalItems
      });

      res.json({
        success: true,
        data: {
          tickets: result.tickets,
          total: result.pagination.totalItems,
          pagination: {
            ...result.pagination,
            total: result.pagination.totalItems,
            pages: result.pagination.totalPages
          }
        },
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('SuperAdminサポートチケット一覧取得エラー', {
        error,
        userId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * SuperAdmin用: サポートチケットに返信
   */
  async superAdminReplyToTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new AppError('認証が必要です', 401);
      }

      // SuperAdmin権限チェック
      if (user.currentRole !== UserRole.SUPER_ADMIN) {
        throw new AppError('このリソースへのアクセス権限がありません', 403);
      }

      const { ticketId } = req.params;
      if (!ticketId) {
        throw new AppError('チケットIDが必要です', 400);
      }

      const { message: content, attachments } = req.body;

      logger.info('SuperAdminサポートチケット返信リクエスト', {
        senderId: user.id,
        ticketId,
        requestBody: req.body, // デバッグ用：リクエストボディ全体をログに記録
        hasContent: !!content,
        contentLength: content?.length || 0
      });

      const message = await this.supportService.replyToTicket(
        user.id,
        user.currentRole,
        ticketId,
        {
          content,
          attachments
        }
      );

      logger.info('SuperAdminサポートチケット返信成功', {
        ticketId,
        messageId: message.id
      });

      res.status(200).json({
        success: true,
        data: message
      });
    } catch (error) {
      logger.error('SuperAdminサポートチケット返信エラー', {
        error,
        userId: req.user?.id,
        ticketId: req.params.ticketId
      });
      next(error);
    }
  }

  /**
   * SuperAdmin用: サポートチケットステータスを更新
   */
  async superAdminUpdateTicketStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user } = req;
      if (!user) {
        throw new AppError('認証が必要です', 401);
      }

      // SuperAdmin権限チェック
      if (user.currentRole !== UserRole.SUPER_ADMIN) {
        throw new AppError('このリソースへのアクセス権限がありません', 403);
      }

      const { ticketId } = req.params;
      if (!ticketId) {
        throw new AppError('チケットIDが必要です', 400);
      }

      const { status } = req.body;

      logger.info('SuperAdminサポートチケットステータス更新リクエスト', {
        requesterId: user.id,
        ticketId,
        newStatus: status
      });

      const ticket = await this.supportService.updateTicketStatus(
        user.id,
        user.currentRole,
        ticketId,
        status
      );

      logger.info('SuperAdminサポートチケットステータス更新成功', {
        ticketId: ticket.id,
        status: ticket.status
      });

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('SuperAdminサポートチケットステータス更新エラー', {
        error,
        userId: req.user?.id,
        ticketId: req.params.ticketId
      });
      next(error);
    }
  }
}