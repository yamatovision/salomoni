// API接続層 - モック/実APIの切り替えを管理
import { AuthService } from './api/auth';
import { UserService } from './api/users';
import { ClientService } from './api/client';
import { StylistService } from './api/stylists';
import { MockAuthService } from './mock/handlers/auth';
import { MockUserService } from './mock/handlers/users';
import { MockClientService } from './mock/handlers/clients';
import { MockStylistService } from './mock/handlers/stylistService';

// サポート関連（モック/実API切り替え用）
import * as supportAPI from './api/support';
import * as supportMock from './mock/handlers/support';

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
export const clientService = USE_MOCK ? new MockClientService() : new ClientService();
export const stylistService = USE_MOCK ? new MockStylistService() : new StylistService();

// サポート関連サービス
export const supportService = USE_MOCK ? supportMock : supportAPI;

// モック使用状態のエクスポート
export const isMockMode = USE_MOCK;