import { Router, Request, Response, NextFunction } from 'express';
import { ImportController } from '../controllers/import.controller';
import { authenticate, authorize } from '../../../common/middleware/auth';
import { 
  validateImportUpload,
  validateImportExecute,
  validateGetImportHistory,
  validateCalendarConnect
} from '../validators/import.validator';
import { handleValidationErrors } from '../../../common/middleware/validationHandler';
import { AppError } from '../../../common/middleware/errorHandler';
import { UserRole } from '../../../types';

const router = Router();
const importController = new ImportController();

// すべてのルートに認証を要求
router.use(authenticate);

// 管理者権限が必要なルート
router.use(authorize(UserRole.OWNER, UserRole.ADMIN));

/**
 * @route   POST /api/admin/import/upload
 * @desc    CSVファイルのアップロードとプレビュー
 * @access  Owner, Admin
 */
router.post(
  '/upload',
  (req: Request, res: Response, next: NextFunction) => {
    importController.uploadMiddleware(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError(400, 'ファイルサイズが大きすぎます（最大10MB）'));
        }
        // multerのファイルフィルターエラー
        if (err.message && err.message.includes('CSVファイル')) {
          return next(new AppError(400, err.message));
        }
        // その他のmulterエラー
        if (err.message) {
          return next(new AppError(400, err.message));
        }
        return next(new AppError(400, 'ファイルのアップロードに失敗しました'));
      }
      // ファイルがアップロードされたかチェック
      if (!req.file) {
        return next(new AppError(400, 'ファイルがアップロードされていません'));
      }
      next();
    });
  },
  ...validateImportUpload,
  handleValidationErrors,
  importController.uploadImportFile
);

/**
 * @route   POST /api/admin/import/execute
 * @desc    インポートの実行
 * @access  Owner, Admin
 */
router.post(
  '/execute',
  ...validateImportExecute,
  handleValidationErrors,
  importController.executeImport
);

/**
 * @route   GET /api/admin/import/history
 * @desc    インポート履歴の取得
 * @access  Owner, Admin
 */
router.get(
  '/history',
  ...validateGetImportHistory,
  handleValidationErrors,
  importController.getImportHistory
);

/**
 * @route   POST /api/admin/calendar/connect
 * @desc    カレンダー連携の設定
 * @access  Owner, Admin
 * @note    URLパスが異なるため、別途index.tsでマウント
 */
export const calendarRouter = Router();
calendarRouter.use(authenticate);
calendarRouter.use(authorize(UserRole.OWNER, UserRole.ADMIN));

calendarRouter.post(
  '/connect',
  ...validateCalendarConnect,
  handleValidationErrors,
  importController.connectCalendar
);

export default router;