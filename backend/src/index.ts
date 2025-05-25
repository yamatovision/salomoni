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
import { rateLimiter } from './common/middleware/rateLimiter';
import authRoutes from './features/auth/routes/auth.routes';
import userRoutes from './features/users/routes/user.routes';
import organizationRoutes from './features/organizations/routes/organization.routes';
import sajuRoutes from './features/saju/routes/saju.routes';
import { clientRoutes } from './features/clients/routes/client.routes';
import { aiCharacterRoutes } from './features/ai-characters/routes/ai-character.routes';
import { chatRoutes } from './features/chat/routes/chat.routes';
import { appointmentRoutes, adminAppointmentRoutes } from './features/appointments/routes/appointment.routes';
import { fortuneRoutes } from './features/fortune/routes/fortune.routes';
import { logger } from './common/utils/logger';

const app = express();
const PORT = process.env.PORT || 8080;

// ミドルウェアの設定
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

// レート制限
app.use('/api/', rateLimiter);

// ヘルスチェック
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// APIルート
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/saju', sajuRoutes);
app.use('/api', clientRoutes); // クライアント管理ルート（/api/admin/clients, /api/clients）
app.use('/api/chat', chatRoutes); // チャット・会話管理ルート
app.use('/api/chat', aiCharacterRoutes); // AIキャラクター・メモリ管理ルート
app.use('/api/appointments', appointmentRoutes); // 予約管理ルート
app.use('/api/admin', adminAppointmentRoutes); // 管理者用予約ルート
app.use('/api/fortune', fortuneRoutes); // 運勢・アドバイス管理ルート

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
    
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
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