import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { authenticate, authorize, checkClientAccess } from '../../../common/middleware/auth';
import { validationHandler } from '../../../common/middleware/validationHandler';
import { 
  createClientSchema, 
  updateClientSchema, 
  searchClientsSchema,
  dailyClientsSchema 
} from '../validators/client.validator';
import { UserRole } from '../../../types';

const router = Router();
const clientController = new ClientController();

// 管理者向けルート（Owner/Admin権限必要）
// POST /api/admin/clients - 新規クライアント作成
router.post(
  '/admin/clients',
  authenticate,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  ...validationHandler(createClientSchema),
  clientController.createClient
);

// GET /api/admin/clients - クライアント一覧取得
router.get(
  '/admin/clients',
  authenticate,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  ...validationHandler(searchClientsSchema),
  clientController.getClients
);

// 一般ルート（全認証ユーザー向け）
// GET /api/clients/daily - 本日の担当クライアント取得
router.get(
  '/clients/daily',
  authenticate,
  ...validationHandler(dailyClientsSchema),
  clientController.getDailyClients
);

// GET /api/clients/my-clients - スタイリストの担当クライアント一覧取得
router.get(
  '/clients/my-clients',
  authenticate,
  clientController.getMyClients
);

// GET /api/clients/:id - クライアント詳細取得
router.get(
  '/clients/:id',
  authenticate,
  checkClientAccess,
  clientController.getClient
);

// PUT /api/clients/:id - クライアント更新
router.put(
  '/clients/:id',
  authenticate,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  checkClientAccess,
  ...validationHandler(updateClientSchema),
  clientController.updateClient
);

// DELETE /api/clients/:id - クライアント削除
router.delete(
  '/clients/:id',
  authenticate,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  checkClientAccess,
  clientController.deleteClient
);

// POST /api/clients/:id/visit - クライアント訪問記録
router.post(
  '/clients/:id/visit',
  authenticate,
  checkClientAccess,
  clientController.recordVisit
);

// GET /api/clients/:id/saju-profile - クライアント四柱推命プロフィール取得
router.get(
  '/clients/:id/saju-profile',
  authenticate,
  checkClientAccess,
  clientController.getClientSajuProfile
);

// GET /api/admin/clients/:id/compatibility - クライアントとスタイリストの相性取得
router.get(
  '/admin/clients/:id/compatibility',
  authenticate,
  authorize(UserRole.OWNER, UserRole.ADMIN),
  checkClientAccess,
  clientController.getClientCompatibility
);

export const clientRoutes = router;