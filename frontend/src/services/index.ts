// API接続層 - モック/実APIの切り替えを管理
import { AuthService } from './api/auth';
import { UserService } from './api/users';
import { MockAuthService } from './mock/handlers/auth';
import { MockUserService } from './mock/handlers/users';

// 環境変数でモック使用を制御
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !import.meta.env.VITE_API_BASE_URL;

// モック使用時はコンソールに警告
if (USE_MOCK && import.meta.env.DEV) {
  console.warn('🔧 アプリケーションはモックモードで動作しています');
  console.warn('実際のAPIを使用するには、環境変数 VITE_API_BASE_URL を設定してください');
}

// サービスのエクスポート
export const authService = USE_MOCK ? new MockAuthService() : new AuthService();
export const userService = USE_MOCK ? new MockUserService() : new UserService();

// モック使用状態のエクスポート
export const isMockMode = USE_MOCK;