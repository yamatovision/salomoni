// API接続層 - モック/実APIの切り替えを管理
import { AuthService } from './api/auth';
import { UserService } from './api/users';
import { ClientService } from './api/client';
import { StylistService } from './api/stylists';
import { SajuService } from './api/saju';
import { OrganizationService } from './api/organizations';
import { ChatService } from './api/chat';
import { AICharacterService } from './api/aiCharacter';
import { AppointmentService } from './api/appointments';
import { FortuneService } from './api/fortune';
import { BillingService } from './api/billing';
import { importService } from './api/import';
import { dashboardService } from './api/dashboard';
import { MockAuthService } from './mock/handlers/auth';
import { MockUserService } from './mock/handlers/users';
import { MockStylistService } from './mock/handlers/stylistService';
import { MockChatService } from './mock/handlers/chat';
import { MockAICharacterService } from './mock/handlers/aiCharacter';
// import { MockAppointmentService } from './mock/handlers/appointments';
// import { MockFortuneService } from './mock/handlers/fortune';

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
export const clientService = new ClientService(); // 実APIを使用
export const stylistService = USE_MOCK ? new MockStylistService() : new StylistService();
export const chatService = USE_MOCK ? new MockChatService() : new ChatService();
export const aiCharacterService = USE_MOCK ? new MockAICharacterService() : new AICharacterService();
export const appointmentService = new AppointmentService(); // 実APIを使用
export const fortuneService = new FortuneService(); // 実APIを使用
export const billingService = new BillingService(); // 実APIを使用

// 新規追加サービス（モックなし、実APIのみ）
export const sajuService = new SajuService();
export const organizationService = new OrganizationService();

// サポート関連サービス
export const supportService = USE_MOCK ? supportMock : supportAPI;

// インポートサービス（実APIのみ）
export { importService };

// ダッシュボードサービス（実APIのみ）
export { dashboardService };

// モック使用状態のエクスポート
export const isMockMode = USE_MOCK;