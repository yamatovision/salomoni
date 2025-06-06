import { Request, Response, NextFunction } from 'express';
import { ClientService } from '../services/client.service';
import { SajuService } from '../../saju/services/saju.service';
import { logger } from '../../../common/utils/logger';
import '../../../common/middleware/auth'; // 型拡張のため
import {
  ClientCreateRequest,
  ClientUpdateRequest,
  ClientSearchFilter,
  PaginationParams,
  ApiResponse,
} from '../../../types';
import { AppError } from '../../../common/utils/errors';

export class ClientController {
  private clientService: ClientService;
  private sajuService: SajuService;

  constructor() {
    this.clientService = new ClientService();
    this.sajuService = new SajuService();
  }

  /**
   * クライアントとスタイリストの相性を取得
   * GET /api/admin/clients/:id/compatibility
   */
  getClientCompatibility = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientId = req.params.id;
      if (!clientId) {
        throw new AppError('クライアントIDが必要です', 400);
      }
      const user = req.user!;
      const organizationId = user.organizationId;

      logger.info('Getting client compatibility', {
        clientId,
        organizationId,
        userId: user.userId,
      });

      // クライアントの存在確認とアクセス権限チェック
      if (!organizationId) {
        throw new AppError('組織情報が取得できません', 400);
      }
      const client = await this.clientService.getClient(clientId, organizationId);
      if (!client) {
        throw new AppError('クライアントが見つかりません', 404);
      }

      // 組織内のスタイリストを取得
      const stylists = await this.clientService.getOrganizationStylists(organizationId);
      
      logger.info('Organization stylists', {
        organizationId,
        stylistCount: stylists.length,
        stylists: stylists.map(s => ({ id: s.id, name: s.name }))
      });

      // クライアントに生年月日があるかチェック
      if (!client.birthDate) {
        logger.warn('Client has no birth date, returning empty compatibility', { clientId });
        const response: ApiResponse<any> = {
          success: true,
          data: {
            clientId,
            clientName: client.name,
            compatibilities: [],
            message: 'クライアントの生年月日が登録されていないため、相性計算ができません。',
          },
        };
        res.json(response);
        return;
      }

      // 各スタイリストとの相性を計算
      const compatibilityResults = await Promise.all(
        stylists.map(async (stylist) => {
          try {
            if (!stylist.id) {
              logger.warn('Stylist has no ID, skipping compatibility calculation', { stylistName: stylist.name });
              return null;
            }
            const result = await this.sajuService.calculateTwoPersonCompatibility(clientId!, stylist.id);
            return {
              stylistId: stylist.id,
              stylistName: stylist.name,
              profileImage: stylist.profileImage,
              compatibilityScore: result.score,
              details: result.details,
            };
          } catch (error: any) {
            logger.error(`Failed to calculate compatibility for stylist ${stylist.id}`, { 
              error: error.message,
              clientId,
              stylistId: stylist.id
            });
            // 生年月日がない場合はnullを返す
            if (error.message?.includes('has no birth date')) {
              return null;
            }
            // その他のエラーは再スロー
            throw error;
          }
        })
      );

      // nullを除外してスコアでソート
      const validResults = compatibilityResults
        .filter(result => result !== null)
        .sort((a, b) => b!.compatibilityScore - a!.compatibilityScore);

      const response: ApiResponse<any> = {
        success: true,
        data: {
          clientId,
          clientName: client.name,
          compatibilities: validResults,
        },
      };

      logger.info('Compatibility calculation completed', {
        clientId,
        compatibilityCount: validResults.length,
        results: validResults.map(r => ({ 
          stylistName: r?.stylistName, 
          score: r?.compatibilityScore 
        }))
      });

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

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
        searchTerm: req.query.search as string || req.query.searchTerm as string,
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
        path: req.path,
        originalUrl: req.originalUrl,
      });

      const result = await this.clientService.getClients(
        organizationId,
        filters,
        pagination,
        sortBy,
        sortOrder
      );

      // デバッグ：取得したデータの確認
      logger.info('Clients fetched', {
        count: result.clients.length,
        firstClient: result.clients[0] ? {
          id: result.clients[0].id,
          name: result.clients[0].name,
          email: result.clients[0].email,
          hasRole: 'role' in result.clients[0],
        } : null,
      });

      const response: ApiResponse<any> = {
        success: true,
        data: {
          clients: result.clients,
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
   * 今日の予約でスタイリストに割り当てられたクライアント一覧取得
   * GET /api/clients/daily
   */
  getDailyClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId, currentRole } = req.user!;
      const { stylistId, date } = req.query;

      logger.info('Getting daily clients', {
        userId,
        organizationId,
        currentRole,
        stylistId: stylistId as string,
        date: date as string,
      });

      // ユーザーロールに応じてスタイリストIDを決定
      let targetStylistId: string | undefined;
      
      if (currentRole === 'user') {
        // スタイリスト（user）の場合は自分の予約のみ取得
        targetStylistId = userId;
      } else if (currentRole === 'admin' || currentRole === 'owner') {
        // 管理者・オーナーの場合は指定されたスタイリストまたは全員
        targetStylistId = stylistId as string;
      } else {
        res.status(403).json({
          success: false,
          error: 'アクセスが拒否されました',
          code: 'ACCESS_DENIED',
        });
        return;
      }

      const clients = await this.clientService.getDailyClients(
        organizationId,
        targetStylistId,
        date as string
      );

      const response: ApiResponse<any> = {
        success: true,
        data: clients,
      };

      res.json(response);
      return;
    } catch (error: any) {
      logger.error('Failed to get daily clients', {
        error,
        userId: req.user!.userId,
      });
      next(error);
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

  /**
   * スタイリストの担当クライアント一覧取得
   * GET /api/clients/my-clients
   */
  getMyClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId, currentRole } = req.user!;
      
      logger.info('Getting stylist clients', {
        userId,
        organizationId,
        currentRole,
      });

      // スタイリスト（userロール）以外はアクセス不可
      if (currentRole !== 'user') {
        res.status(403).json({
          success: false,
          error: 'このAPIはスタイリストのみ利用可能です',
          code: 'ACCESS_DENIED',
        });
        return;
      }

      const pagination: PaginationParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      };

      const result = await this.clientService.getMyClients(
        organizationId,
        userId,
        pagination
      );

      const response: ApiResponse<any> = {
        success: true,
        data: {
          clients: result.clients,
          pagination: result.pagination,
        },
      };

      res.json(response);
      return;
    } catch (error: any) {
      logger.error('Failed to get stylist clients', {
        error,
        userId: req.user!.userId,
      });
      next(error);
    }
  };

  /**
   * クライアントの四柱推命プロフィールを取得
   * GET /api/clients/:id/saju-profile
   */
  getClientSajuProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const organizationId = user.organizationId;
      const userId = user.userId;
      const clientId = req.params.id;
      if (!clientId) {
        res.status(400).json({
          success: false,
          error: 'クライアントIDが必要です',
          code: 'CLIENT_ID_REQUIRED',
        });
        return;
      }

      logger.info('Getting client saju profile', { clientId, userId, organizationId });

      // クライアントの存在確認とアクセス権限チェック
      if (!organizationId) {
        res.status(400).json({
          success: false,
          error: '組織情報が取得できません',
          code: 'ORGANIZATION_REQUIRED',
        });
        return;
      }
      const client = await this.clientService.getClient(clientId, organizationId);
      if (!client) {
        res.status(404).json({
          success: false,
          error: 'クライアントが見つかりません',
          code: 'CLIENT_NOT_FOUND',
        });
        return;
      }

      // 四柱推命プロフィールを取得
      const sajuProfile = await this.sajuService.getClientFourPillars(clientId!);

      const response: ApiResponse<any> = {
        success: true,
        data: sajuProfile,
      };

      res.json(response);
      return;
    } catch (error) {
      logger.error('Failed to get client saju profile', {
        error,
        userId: req.user!.userId,
        clientId: req.params.id,
      });
      next(error);
      return;
    }
  };
}