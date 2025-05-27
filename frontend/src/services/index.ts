// API接続層 - 実APIサービスのエクスポート
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
import * as supportAPI from './api/support';

// サービスのエクスポート - 実APIのみ使用
export const authService = new AuthService();
export const userService = new UserService();
export const clientService = new ClientService();
export const stylistService = new StylistService();
export const chatService = new ChatService();
export const aiCharacterService = new AICharacterService();
export const appointmentService = new AppointmentService();
export const fortuneService = new FortuneService();
export const billingService = new BillingService();
export const sajuService = new SajuService();
export const organizationService = new OrganizationService();
export const supportService = supportAPI;

// インポートサービス
export { importService };

// ダッシュボードサービス
export { dashboardService };

// モック使用状態のエクスポート（後方互換性のため常にfalse）
export const isMockMode = false;