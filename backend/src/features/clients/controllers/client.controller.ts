import { Request, Response, NextFunction } from 'express';
import { ClientService } from '../services/client.service';
import { logger } from '../../../common/utils/logger';
import '../../../common/middleware/auth'; // 型拡張のため
import {
  ClientCreateRequest,
  ClientUpdateRequest,
  ClientSearchFilter,
  PaginationParams,
  ApiResponse,
} from '../../../types';

export class ClientController {
  private clientService: ClientService;

  constructor() {
    this.clientService = new ClientService();
  }

  /**
   * 新規クライアント作成
   * POST /api/admin/clients
   */
  createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.user!.organizationId as string;
      const data: ClientCreateRequest = req.body;

      logger.info('Creating client', {
        userId: req.user!.userId,
        organizationId,
        clientName: data.name,
      });

      const client = await this.clientService.createClient(organizationId, data);

      const response: ApiResponse<any> = {
        success: true,
        data: client,
      };

      res.status(201).json(response);
      return;
    } catch (error: any) {
      logger.error('Failed to create client', {
        error,
        userId: req.user!.userId,
      });

      if (error.message.includes('既に登録されています')) {
        res.status(409).json({
          success: false,
          error: error.message,
          code: 'CLIENT_DUPLICATE',
        });
        return;
      } else {
        next(error);
        return;
      }
    }
  };

  /**
   * クライアント一覧取得
   * GET /api/admin/clients
   */
  getClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.user!.organizationId as string;
      
      // クエリパラメータから検索条件を抽出
      const filters: ClientSearchFilter = {
        searchTerm: req.query.searchTerm as string,
        gender: req.query.gender as any,
        birthDateFrom: req.query.birthDateFrom ? new Date(req.query.birthDateFrom as string) : undefined,
        birthDateTo: req.query.birthDateTo ? new Date(req.query.birthDateTo as string) : undefined,
        hasAppointmentInMonth: req.query.hasAppointmentInMonth === 'true',
        isFavorite: req.query.isFavorite === 'true',
        missingBirthDate: req.query.missingBirthDate === 'true',
      };

      const pagination: PaginationParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      logger.info('Getting clients', {
        userId: req.user!.userId,
        organizationId,
        filters,
        pagination,
      });

      const result = await this.clientService.getClients(
        organizationId,
        filters,
        pagination,
        sortBy,
        sortOrder
      );

      const response: ApiResponse<any> = {
        success: true,
        data: result.clients,
        meta: {
          pagination: result.pagination,
        },
      };

      res.json(response);
      return;
    } catch (error) {
      logger.error('Failed to get clients', {
        error,
        userId: req.user!.userId,
      });
      next(error);
      return;
    }
  };

  /**
   * クライアント詳細取得
   * GET /api/clients/:id
   */
  getClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.user!.organizationId as string;
      const clientId = req.params.id;

      logger.info('Getting client details', {
        userId: req.user!.userId,
        organizationId,
        clientId,
      });

      if (!organizationId) {
        res.status(400).json({
          success: false,
          error: '組織情報が必要です',
          code: 'ORGANIZATION_REQUIRED',
        });
        return;
      }

      if (!clientId) {
        res.status(400).json({
          success: false,
          error: 'クライアントIDが必要です',
          code: 'CLIENT_ID_REQUIRED',
        });
        return;
      }

      const client = await this.clientService.getClient(clientId, organizationId);

      if (!client) {
        // 他組織のクライアントかどうかを確認
        const ClientModel = require('../models/client.model').ClientModel;
        const existingClient = await ClientModel.findById(clientId);
        
        if (existingClient && existingClient.organizationId !== organizationId) {
          res.status(403).json({
            success: false,
            error: 'このクライアントへのアクセス権限がありません',
            code: 'ACCESS_DENIED',
          });
          return;
        }
        
        res.status(404).json({
          success: false,
          error: 'クライアントが見つかりません',
          code: 'CLIENT_NOT_FOUND',
        });
        return;
      }

      const response: ApiResponse<any> = {
        success: true,
        data: client,
      };

      res.json(response);
      return;
    } catch (error) {
      logger.error('Failed to get client', {
        error,
        userId: req.user!.userId,
        clientId: req.params.id,
      });
      next(error);
      return;
    }
  };

  /**
   * クライアント更新
   * PUT /api/clients/:id
   */
  updateClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.user!.organizationId as string;
      const clientId = req.params.id;
      const data: ClientUpdateRequest = req.body;

      logger.info('Updating client', {
        userId: req.user!.userId,
        organizationId,
        clientId,
      });

      if (!organizationId) {
        res.status(400).json({
          success: false,
          error: '組織情報が必要です',
          code: 'ORGANIZATION_REQUIRED',
        });
        return;
      }

      if (!clientId) {
        res.status(400).json({
          success: false,
          error: 'クライアントIDが必要です',
          code: 'CLIENT_ID_REQUIRED',
        });
        return;
      }

      const client = await this.clientService.updateClient(
        clientId,
        organizationId,
        data
      );

      if (!client) {
        res.status(404).json({
          success: false,
          error: 'クライアントが見つかりません',
          code: 'CLIENT_NOT_FOUND',
        });
        return;
      }

      const response: ApiResponse<any> = {
        success: true,
        data: client,
      };

      res.json(response);
      return;
    } catch (error: any) {
      logger.error('Failed to update client', {
        error,
        userId: req.user!.userId,
        clientId: req.params.id,
      });

      if (error.message.includes('既に登録されています')) {
        res.status(409).json({
          success: false,
          error: error.message,
          code: 'CLIENT_DUPLICATE',
        });
        return;
      } else {
        next(error);
        return;
      }
    }
  };

  /**
   * クライアント削除
   * DELETE /api/clients/:id
   */
  deleteClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.user!.organizationId as string;
      const clientId = req.params.id;

      logger.info('Deleting client', {
        userId: req.user!.userId,
        organizationId,
        clientId,
      });

      if (!organizationId) {
        res.status(400).json({
          success: false,
          error: '組織情報が必要です',
          code: 'ORGANIZATION_REQUIRED',
        });
        return;
      }

      if (!clientId) {
        res.status(400).json({
          success: false,
          error: 'クライアントIDが必要です',
          code: 'CLIENT_ID_REQUIRED',
        });
        return;
      }

      const deleted = await this.clientService.deleteClient(clientId, organizationId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'クライアントが見つかりません',
          code: 'CLIENT_NOT_FOUND',
        });
        return;
      }

      const response: ApiResponse<any> = {
        success: true,
        data: { message: 'クライアントを削除しました' },
      };

      res.json(response);
      return;
    } catch (error) {
      logger.error('Failed to delete client', {
        error,
        userId: req.user!.userId,
        clientId: req.params.id,
      });
      next(error);
      return;
    }
  };

  /**
   * 本日の担当クライアント取得
   * GET /api/clients/daily
   */
  getDailyClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.user!.organizationId as string;
      const stylistId = req.query.stylistId as string | undefined;
      const date = req.query.date as string | undefined;

      logger.info('Getting daily clients', {
        userId: req.user!.userId,
        organizationId,
        stylistId,
        date,
      });

      const clients = await this.clientService.getDailyClients(
        organizationId,
        stylistId,
        date
      );

      const response: ApiResponse<any> = {
        success: true,
        data: clients,
      };

      res.json(response);
      return;
    } catch (error) {
      logger.error('Failed to get daily clients', {
        error,
        userId: req.user!.userId,
      });
      next(error);
      return;
    }
  };

  /**
   * クライアント訪問記録
   * POST /api/clients/:id/visit
   */
  recordVisit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = req.user!.organizationId as string;
      const clientId = req.params.id;

      logger.info('Recording client visit', {
        userId: req.user!.userId,
        organizationId,
        clientId,
      });

      if (!organizationId) {
        res.status(400).json({
          success: false,
          error: '組織情報が必要です',
          code: 'ORGANIZATION_REQUIRED',
        });
        return;
      }

      if (!clientId) {
        res.status(400).json({
          success: false,
          error: 'クライアントIDが必要です',
          code: 'CLIENT_ID_REQUIRED',
        });
        return;
      }

      const client = await this.clientService.recordVisit(clientId, organizationId);

      if (!client) {
        // 他組織のクライアントかどうかを確認
        const ClientModel = require('../models/client.model').ClientModel;
        const existingClient = await ClientModel.findById(clientId);
        
        if (existingClient && existingClient.organizationId !== organizationId) {
          res.status(403).json({
            success: false,
            error: 'このクライアントへのアクセス権限がありません',
            code: 'ACCESS_DENIED',
          });
          return;
        }
        
        res.status(404).json({
          success: false,
          error: 'クライアントが見つかりません',
          code: 'CLIENT_NOT_FOUND',
        });
        return;
      }

      const response: ApiResponse<any> = {
        success: true,
        data: client,
      };

      res.json(response);
      return;
    } catch (error) {
      logger.error('Failed to record client visit', {
        error,
        userId: req.user!.userId,
        clientId: req.params.id,
      });
      next(error);
      return;
    }
  };
}