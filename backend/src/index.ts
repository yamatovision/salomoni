import dotenv from 'dotenv';
// 環境変数の読み込み（最初に実行）
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { connectDatabase } from './config/database';
import { errorHandler } from './common/middleware/errorHandler';
import { requestLogger } from './common/middleware/requestLogger';
import authRoutes from './features/auth/routes/auth.routes';
import userRoutes from './features/users/routes/user.routes';
import adminStylistRoutes from './features/users/routes/admin-stylist.routes';
import organizationRoutes from './features/organizations/routes/organization.routes';
import sajuRoutes from './features/saju/routes/saju.routes';
import { clientRoutes } from './features/clients/routes/client.routes';
import { aiCharacterRoutes } from './features/ai-characters/routes/ai-character.routes';
import { chatRoutes } from './features/chat/routes/chat.routes';
import { appointmentRoutes, adminAppointmentRoutes } from './features/appointments/routes/appointment.routes';
import { fortuneRoutes } from './features/fortune/routes/fortune.routes';
import billingRoutes from './features/billing/routes/billing.routes';
import superAdminBillingRoutes from './features/billing/routes/superadmin-billing.routes';
import importRoutes, { calendarRouter } from './features/import/routes/import.routes';
import dashboardRoutes from './features/dashboard/routes/dashboard.routes';
import supportRoutes, { superAdminSupportRouter } from './features/support/routes/support.routes';
import planRoutes from './features/plans/routes/plan.routes';
import { univapayService } from './features/billing/services/univapay.service';
import { logger } from './common/utils/logger';

const app = express();
const PORT = process.env.PORT || 8080;

// CORS設定
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || ['http://localhost:5173'];
logger.info('CORS設定:', { allowedOrigins, credentials: true });

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
}));

// ミドルウェアの設定
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

// ヘルスチェック
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// テストエンドポイント（レート制限前に配置）
app.get('/api/test', (_req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// レート制限（一時的にコメントアウト）
// app.use('/api/', rateLimiter);

// APIルート
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/saju', sajuRoutes);
app.use('/api', clientRoutes); // クライアント管理ルート（/api/admin/clients, /api/clients）
app.use('/api/chat', chatRoutes); // チャット・会話管理ルート
app.use('/api/ai-characters', (req, _res, next) => {
  logger.info(`AIキャラクタールート受信: ${req.method} ${req.path}`);
  next();
}, aiCharacterRoutes); // AIキャラクター・メモリ管理ルート
app.use('/api/appointments', appointmentRoutes); // 予約管理ルート
app.use('/api/admin', adminAppointmentRoutes); // 管理者用予約ルート
app.use('/api/fortune', fortuneRoutes); // 運勢・アドバイス管理ルート
app.use('/api/billing', billingRoutes); // 決済・課金管理ルート
app.use('/api/owner/billing', billingRoutes); // オーナー向け決済管理ルート
app.use('/api/admin/import', importRoutes); // データインポート管理ルート
app.use('/api/admin/calendar', calendarRouter); // カレンダー連携管理ルート
app.use('/api/admin/dashboard', dashboardRoutes); // ダッシュボード管理ルート
app.use('/api/admin/stylists', adminStylistRoutes); // 管理者用スタイリスト管理ルート
app.use('/api/admin/support', supportRoutes); // サポート管理ルート
app.use('/api/superadmin/support', superAdminSupportRouter); // SuperAdmin用サポート管理ルート
app.use('/api/superadmin/plans', planRoutes); // SuperAdmin用プラン管理ルート
app.use('/api/superadmin/revenue', billingRoutes); // SuperAdmin用収益シミュレーションルート
app.use('/api/superadmin/billing', superAdminBillingRoutes); // SuperAdmin用請求管理ルート

// エラーハンドリング
app.use(errorHandler);

// 404ハンドリング
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// サーバー起動
const startServer = async (): Promise<void> => {
  try {
    // データベース接続
    await connectDatabase();
    
    // Univapay設定の初期化
    try {
      univapayService.loadConfigFromEnv();
      logger.info('Univapay service initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('Univapay service initialization failed:', errorMessage);
    }
    
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      
      // デバッグ：登録されているミドルウェアを確認
      if (process.env.NODE_ENV !== 'production') {
        logger.debug('Registered middleware stack:');
        (app as any)._router.stack.forEach((layer: any, index: number) => {
          if (layer.route) {
            logger.debug(`  ${index}: Route ${layer.route.path}`);
          } else if (layer.name) {
            logger.debug(`  ${index}: Middleware ${layer.name}`);
          }
        });
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// テスト環境以外でアプリケーション起動
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    logger.error('Unhandled error during startup:', error);
    process.exit(1);
  });
}

export default app;