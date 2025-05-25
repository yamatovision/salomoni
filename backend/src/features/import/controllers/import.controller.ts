import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ImportService } from '../services/import.service';
import { 
  ImportExecuteRequest,
  ImportHistoryFilter,
  PaginationParams,
  CalendarConnectionRequest,
  ApiResponse,
  ImportUploadResponse,
  ImportExecuteResponse,
  ImportHistory,
  CalendarSyncSettings,
  PaginationInfo
} from '../../../types';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/middleware/errorHandler';

// Multerの設定（メモリストレージ）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    // CSVファイルのみ許可
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('CSVファイルのみアップロード可能です') as any, false);
    }
  },
});

export class ImportController {
  private importService: ImportService;

  constructor() {
    this.importService = new ImportService();
  }

  // Multerミドルウェアを公開
  public uploadMiddleware = upload.single('file');

  /**
   * CSVファイルのアップロードとプレビュー
   * POST /api/admin/import/upload
   */
  uploadImportFile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info('[ImportController] CSVファイルアップロード開始', {
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        fileName: req.file?.originalname
      });

      if (!req.file) {
        throw new AppError(400, 'ファイルがアップロードされていません');
      }

      if (!req.user?.organizationId) {
        throw new AppError(400, '組織IDが取得できません');
      }

      const result = await this.importService.uploadImportFile(
        req.file,
        req.user.organizationId,
        req.user.id
      );

      const response: ApiResponse<ImportUploadResponse> = {
        success: true,
        data: result,
      };

      logger.info('[ImportController] CSVファイルアップロード成功', {
        fileId: result.fileId,
        recordCount: result.recordCount
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('[ImportController] CSVファイルアップロードエラー', error);
      next(error);
    }
  };

  /**
   * インポートの実行
   * POST /api/admin/import/execute
   */
  executeImport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info('[ImportController] インポート実行開始', {
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        fileId: req.body.fileId
      });

      if (!req.user?.organizationId) {
        throw new AppError(400, '組織IDが取得できません');
      }

      const importRequest: ImportExecuteRequest = req.body;

      const result = await this.importService.executeImport(
        importRequest,
        req.user.organizationId,
        req.user.id
      );

      const response: ApiResponse<ImportExecuteResponse> = {
        success: true,
        data: result,
      };

      logger.info('[ImportController] インポート実行成功', {
        importId: result.importId,
        processed: result.processed,
        success: result.success,
        failed: result.failed
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('[ImportController] インポート実行エラー', error);
      next(error);
    }
  };

  /**
   * インポート履歴の取得
   * GET /api/admin/import/history
   */
  getImportHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info('[ImportController] インポート履歴取得開始', {
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        query: req.query
      });

      if (!req.user?.organizationId) {
        throw new AppError(400, '組織IDが取得できません');
      }

      // フィルター条件の構築
      const filter: ImportHistoryFilter = {};
      if (req.query.method) {
        filter.method = req.query.method as any;
      }
      if (req.query.status) {
        filter.status = req.query.status as any;
      }
      if (req.query.dateFrom) {
        filter.dateFrom = new Date(req.query.dateFrom as string);
      }
      if (req.query.dateTo) {
        filter.dateTo = new Date(req.query.dateTo as string);
      }

      // ページネーション
      const pagination: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const { imports, total } = await this.importService.getImportHistory(
        req.user.organizationId,
        filter,
        pagination
      );

      // ページネーション情報の計算
      const currentPage = pagination.page || 1;
      const itemsPerPage = pagination.limit || 20;
      const totalPages = Math.ceil(total / itemsPerPage);

      const paginationInfo: PaginationInfo = {
        currentPage,
        totalPages,
        totalItems: total,
        itemsPerPage,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      };

      const response: ApiResponse<{
        imports: ImportHistory[];
        total: number;
        pagination: PaginationInfo;
      }> = {
        success: true,
        data: {
          imports,
          total,
          pagination: paginationInfo,
        },
      };

      logger.info('[ImportController] インポート履歴取得成功', {
        count: imports.length,
        total
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('[ImportController] インポート履歴取得エラー', error);
      next(error);
    }
  };

  /**
   * カレンダー連携の設定
   * POST /api/admin/calendar/connect
   */
  connectCalendar = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info('[ImportController] カレンダー連携設定開始', {
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        provider: req.body.provider
      });

      if (!req.user?.organizationId) {
        throw new AppError(400, '組織IDが取得できません');
      }

      const connectionRequest: CalendarConnectionRequest = req.body;

      const result = await this.importService.connectCalendar(
        connectionRequest,
        req.user.organizationId
      );

      const response: ApiResponse<CalendarSyncSettings> = {
        success: true,
        data: result,
      };

      logger.info('[ImportController] カレンダー連携設定成功', {
        provider: result.provider,
        calendarId: result.calendarId
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error('[ImportController] カレンダー連携設定エラー', error);
      next(error);
    }
  };
}