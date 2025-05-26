/**
 * ===== 型定義同期ガイドライン =====
 * 型ファイルは下記2つの同期された型ファイルが存在します。  
 *  - **フロントエンド**: `frontend/src/types/index.ts`
 *　 - **バックエンド**: `backend/src/types/index.ts`
 * 【基本原則】この/types/index.tsを更新したら、もう一方の/types/index.tsも必ず同じ内容に更新する
 * 
 * 【変更の責任】
 * - 型定義を変更した開発者は、両方のファイルを即座に同期させる責任を持つ
 * - 1つのtypes/index.tsの更新は禁止。必ず1つを更新したらもう一つも更新その場で行う
 * 
 * 【絶対に守るべき原則】
 * 1. フロントエンドとバックエンドで異なる型を作らない
 * 2. 同じデータ構造に対して複数の型を作らない
 * 3. 新しいプロパティは必ずオプショナルとして追加
 * 4. APIパスは必ずこのファイルで一元管理する
 * 5. コード内でAPIパスをハードコードしない
 * 6. 2つの同期されたtypes/index.tsを単一の真実源とする
 * 7. パスパラメータを含むエンドポイントは関数として提供する
 */

// ==========================================
// 基本型定義
// ==========================================

// 基本ID型
export type ID = string;

// タイムスタンプ関連
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// ページネーション
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// レスポンス共通構造
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, any>;
}

// エラーレスポンス
export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
}

// ==========================================
// APIパス定義（最優先）
// ==========================================

export const API_PATHS = {
  // 認証関連
  AUTH: {
    BASE: '/api/auth',
    LOGIN: '/api/auth/login',
    LOGIN_LINE: '/api/auth/login-line',
    LINE_CALLBACK: '/api/auth/line-callback',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    REGISTER: '/api/auth/register',
    REGISTER_ORGANIZATION: '/api/auth/register-organization',
    PASSWORD_RESET_REQUEST: '/api/auth/password-reset-request',
    VERIFY_RESET_TOKEN: '/api/auth/verify-reset-token',
    COMPLETE_PASSWORD_RESET: '/api/auth/complete-password-reset',
    VERIFY_INVITE: '/api/auth/verify-invite',
    COMPLETE_REGISTRATION: '/api/auth/complete-registration',
    INVITE: '/api/auth/invite',
  },

  // 組織関連
  ORGANIZATIONS: {
    BASE: '/api/organizations',
    LIST: '/api/organizations',
    CREATE: '/api/organizations',
    DETAIL: (orgId: string) => `/api/organizations/${orgId}`,
    UPDATE: (orgId: string) => `/api/organizations/${orgId}`,
    DELETE: (orgId: string) => `/api/organizations/${orgId}`,
    STATS: (orgId: string) => `/api/organizations/${orgId}/stats`,
    STATUS: (orgId: string) => `/api/organizations/${orgId}/status`,
    PLAN: (orgId: string) => `/api/organizations/${orgId}/plan`,
    MEMBERS: (orgId: string) => `/api/organizations/${orgId}/members`,
  },

  // ユーザー関連
  USERS: {
    BASE: '/api/users',
    LIST: '/api/users',
    CREATE: '/api/users',
    ME: '/api/users/me',
    DETAIL: (userId: string) => `/api/users/${userId}`,
    UPDATE: (userId: string) => `/api/users/${userId}`,
    DELETE: (userId: string) => `/api/users/${userId}`,
    PROFILE: '/api/users/profile',
    STYLISTS: '/api/users/stylists',
    INVITE: '/api/users/invite',
    FORCE_LOGOUT: (userId: string) => `/api/users/${userId}/force-logout`,
    TOKEN_USAGE: (userId: string) => `/api/users/${userId}/token-usage`,
  },

  // クライアント関連
  CLIENTS: {
    BASE: '/api/admin/clients',
    LIST: '/api/admin/clients',
    CREATE: '/api/admin/clients',
    DETAIL: (clientId: string) => `/api/clients/${clientId}`,
    UPDATE: (clientId: string) => `/api/clients/${clientId}`,
    DELETE: (clientId: string) => `/api/clients/${clientId}`,
    DAILY: '/api/clients/daily',
    VISIT: (clientId: string) => `/api/clients/${clientId}/visit`,
    FORTUNE: (clientId: string) => `/api/clients/${clientId}/fortune`,
    COMPATIBILITY: (clientId: string) => `/api/clients/${clientId}/compatibility`,
    CHAT: (clientId: string) => `/api/clients/${clientId}/chat`,
  },

  // 四柱推命関連
  SAJU: {
    BASE: '/api/saju',
    CALCULATE: '/api/saju/calculate',
    ANALYZE: '/api/saju/analyze',
    COMPATIBILITY: '/api/saju/compatibility',
    FORTUNE: '/api/saju/fortune',
    DAILY_ADVICE: '/api/saju/daily-advice',
    MASTERS: '/api/saju/masters',
    USER: (userId: string) => `/api/saju/user/${userId}`,
    CLIENT: (clientId: string) => `/api/saju/client/${clientId}`,
    COMPATIBILITY_ENHANCED: (userId1: string, userId2: string) => `/api/saju/compatibility/enhanced/${userId1}/${userId2}`,
    TEAM: (teamId: string) => `/api/saju/compatibility/team/${teamId}`,
  },

  // チャット関連
  CHAT: {
    BASE: '/api/chat',
    CONVERSATIONS: '/api/chat/conversations',
    MESSAGES: (conversationId: string) => `/api/chat/conversations/${conversationId}/messages`,
    SEND: (conversationId: string) => `/api/chat/conversations/${conversationId}/send`,
    SEND_MESSAGE: (conversationId: string) => `/api/chat/conversations/${conversationId}/send`,
    MEMORY: (characterId: string) => `/api/chat/characters/${characterId}/memory`,
    START: '/api/chat/conversations/start',
    END_CONVERSATION: (conversationId: string) => `/api/chat/conversations/${conversationId}/end`,
  },

  // AIキャラクター関連
  AI_CHARACTERS: {
    BASE: '/api/ai-characters',
    CHARACTERS: '/api/ai-characters',
    MY_CHARACTER: '/api/ai-characters/my-character',
    CHARACTER: (characterId: string) => `/api/ai-characters/${characterId}`,
    CHARACTER_MEMORY: (characterId: string) => `/api/ai-characters/${characterId}/memory`,
  },

  // 予約関連
  APPOINTMENTS: {
    BASE: '/api/appointments',
    DETAIL: (appointmentId: string) => `/api/appointments/${appointmentId}`,
    ASSIGN: (appointmentId: string) => `/api/appointments/${appointmentId}/assign`,
    MOVE: (appointmentId: string) => `/api/appointments/${appointmentId}/move`,
    CALENDAR_SYNC: '/api/appointments/calendar/sync',
  },

  // ダッシュボード関連
  DASHBOARD: {
    BASE: '/api/dashboard',
    SUMMARY: '/api/dashboard/summary',
    STATISTICS: '/api/dashboard/statistics',
  },

  // 請求関連
  BILLING: {
    BASE: '/api/billing',
    SUBSCRIPTION: '/api/billing/subscription',
    SUBSCRIPTION_CANCEL: (subscriptionId: string) => `/api/billing/subscription/${subscriptionId}/cancel`,
    PLANS: '/api/billing/plans',
    TOKEN: '/api/billing/token',
    HISTORY: '/api/billing/history',
    REFUND: (chargeId: string) => `/api/billing/refund/${chargeId}`,
    WEBHOOK: '/api/billing/webhook',
  },

  // 運勢関連
  FORTUNE: {
    BASE: '/api/fortune',
    DAILY: '/api/fortune/daily',
    WEEKLY: '/api/fortune/weekly',
    MONTHLY: '/api/fortune/monthly',
    COMPATIBILITY_TODAY: '/api/fortune/compatibility/today',
    DAILY_ADVICE: (userId: string) => `/api/fortune/users/${userId}/daily-advice`,
    STYLIST_FORTUNE: (userId: string) => `/api/fortune/stylists/${userId}/detail`,
    FORTUNE_CARDS: '/api/fortune/cards',
    REGENERATE_ADVICE: (userId: string) => `/api/fortune/users/${userId}/regenerate`,
  },

  // サポート関連
  SUPPORT: {
    BASE: '/api/support',
    TICKETS: '/api/support/tickets',
    TICKET_DETAIL: (ticketId: string) => `/api/support/tickets/${ticketId}`,
    CREATE: '/api/support/tickets',
    REPLY: (ticketId: string) => `/api/support/tickets/${ticketId}/messages`,
    UPDATE_STATUS: (ticketId: string) => `/api/support/tickets/${ticketId}/status`,
  },

  // 管理者向け
  ADMIN: {
    DASHBOARD: '/api/admin/dashboard',
    CLIENTS: '/api/admin/clients',
    STYLISTS: '/api/admin/stylists',
    APPOINTMENTS: '/api/admin/appointments',
    BULK_IMPORT: '/api/admin/import/bulk',
    SUPPORT_TICKETS: '/api/admin/support/tickets',
    SUPPORT_TICKET_DETAIL: (ticketId: string) => `/api/admin/support/tickets/${ticketId}`,
    SUPPORT_TICKET_REPLY: (ticketId: string) => `/api/admin/support/tickets/${ticketId}/reply`,
    // インポート関連
    IMPORT_UPLOAD: '/api/admin/import/upload',
    IMPORT_EXECUTE: '/api/admin/import/execute',
    IMPORT_HISTORY: '/api/admin/import/history',
    CALENDAR_CONNECT: '/api/admin/calendar/connect',
  },

  // オーナー向け（課金管理）
  OWNER: {
    BILLING_SUMMARY: '/api/owner/billing/summary',
    CHARGE_TOKENS: '/api/owner/billing/charge-tokens',
    INVOICES: '/api/owner/billing/invoices',
    PLAN: '/api/owner/billing/plan',
    PAYMENT_METHOD: '/api/owner/billing/payment-method',
    PAYMENT_HISTORY: '/api/owner/billing/payment-history',
  },

  // SuperAdmin向け
  SUPERADMIN: {
    ORGANIZATIONS: '/api/superadmin/organizations',
    ORGANIZATION_DETAIL: (orgId: string) => `/api/superadmin/organizations/${orgId}`,
    PLANS: '/api/superadmin/plans',
    PLAN_DETAIL: (planId: string) => `/api/superadmin/plans/${planId}`,
    REVENUE_SIMULATE: '/api/superadmin/revenue/simulate',
    INVOICES: '/api/superadmin/invoices',
    SUPPORT_TICKETS: '/api/superadmin/support/tickets',
    SUPPORT_TICKET_DETAIL: (ticketId: string) => `/api/superadmin/support/tickets/${ticketId}`,
    SUPPORT_TICKET_REPLY: (ticketId: string) => `/api/superadmin/support/tickets/${ticketId}/reply`,
    SUPPORT_TICKET_STATUS: (ticketId: string) => `/api/superadmin/support/tickets/${ticketId}/status`,
  },
} as const;

// ==========================================
// 認証関連
// ==========================================

// JWTペイロードの型定義
export interface JWTPayload {
  id: string; // userIdと同じ値（互換性のため）
  userId: string;
  email: string;
  roles: UserRole[];
  currentRole: UserRole;
  organizationId: string;
  sessionId: string;
  platform: 'mobile' | 'web';
  // 以下は自動的に追加されるフィールド
  iat?: number;
  exp?: number;
  jti?: string;
}

// 認証方法
export enum AuthMethod {
  LINE = 'line',
  EMAIL = 'email',
}

// ユーザーロール（5階層）
export enum UserRole {
  SUPER_ADMIN = 'superadmin',
  OWNER = 'owner',
  ADMIN = 'admin',
  STYLIST = 'stylist',
  USER = 'user',
  CLIENT = 'client',
}

// ユーザーステータス
export enum UserStatus {
  ACTIVE = 'active',        // アクティブ（通常状態）
  INACTIVE = 'inactive',    // 無効化（退職・退会）
  SUSPENDED = 'suspended',  // 一時停止（違反等）
  PENDING = 'pending'       // 招待承認待ち
}

// 認証リクエスト
export interface AuthRequest {
  method: AuthMethod;
  token?: string; // LINE認証トークン
  email?: string; // メール認証用
  password?: string; // メール認証用
  rememberMe?: boolean; // ログイン維持オプション
}

// 認証レスポンス
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  expiresIn: number;
}

// ログインリクエスト（メール認証用）
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// ログインレスポンス（AuthResponseと同じ）
export type LoginResponse = AuthResponse;

// パスワードリセットリクエスト
export interface PasswordResetRequest {
  email: string;
}

// パスワードリセット完了リクエスト
export interface PasswordResetCompleteRequest {
  token: string;
  newPassword: string;
}

// トークンリフレッシュレスポンス
export interface TokenRefreshResponse {
  accessToken: string;
  expiresIn: number;
}

// 組織登録リクエスト
export interface OrganizationRegisterRequest {
  organizationName: string;
  organizationDisplayName?: string;
  organizationPhone?: string;
  organizationAddress?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerPhone?: string;
  plan: OrganizationPlan;
  billingEmail?: string;
}

// スタッフ招待リクエスト
export interface StaffInviteRequest {
  email: string;
  role: UserRole.ADMIN | UserRole.USER;
  name?: string;
}

// 招待完了リクエスト
export interface InviteCompleteRequest {
  token: string;
  password: string;
  name?: string;
}

// ==========================================
// ユーザー関連
// ==========================================

// ユーザー基本情報
export interface UserBase {
  id: ID;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: ID;
  status: UserStatus;
}

// ユーザープロフィール
export interface UserProfile extends UserBase, Timestamps {
  birthDate?: Date;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  profileImage?: string;
  lastLoginAt?: Date;
  authMethods?: AuthMethod[];
  lineUserId?: string;
  employeeNumber?: string;
  department?: string;
  hireDate?: Date;
  refreshTokens?: string[];
  preferences?: Record<string, any>;
  aiCharacterId?: ID;
  tokenUsage?: number;
  _isMockData?: boolean; // モックデータ識別用
  // 互換性のためのプロパティ
  isActive?: boolean; // statusから派生
}

// User型のエイリアス（互換性のため）
export type User = UserProfile;

// ユーザー作成リクエスト
export interface UserCreateRequest {
  email: string;
  name: string;
  role: UserRole;
  organizationId?: ID;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  password?: string; // メール認証時のみ
  authMethods?: AuthMethod[];
}

// ユーザー更新リクエスト
export interface UserUpdateRequest {
  name?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  profileImage?: string;
  organizationId?: ID;
}

// ==========================================
// 組織関連
// ==========================================

// 組織ステータス
export enum OrganizationStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  SUSPENDED = 'suspended',
  CANCELED = 'canceled',
}

// 組織プラン
export enum OrganizationPlan {
  STANDARD = 'standard',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

// 組織基本情報
export interface Organization extends Timestamps {
  id: ID;
  name: string;
  displayName?: string;
  ownerId: ID;
  status: OrganizationStatus;
  plan: OrganizationPlan;
  email: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  // 互換性のためのプロパティ
  adminUserId?: ID; // ownerIdのエイリアス
  planType?: string; // planのエイリアス
  isActive?: boolean; // statusから派生
  _isMockData?: boolean;
}

// 組織作成リクエスト
export interface OrganizationCreateRequest {
  name: string;
  ownerName: string;
  ownerEmail: string;
  plan: OrganizationPlan;
  billingEmail?: string;
}

// 組織更新リクエスト
export interface OrganizationUpdateRequest {
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  plan?: OrganizationPlan;
  status?: OrganizationStatus;
  settings?: Record<string, any>;
}

// 組織統計情報
export interface OrganizationStats {
  totalStylists: number;
  totalClients: number;
  activeStylists: number;
  monthlyAppointments: number;
  tokenUsage: number;
  tokenLimit: number;
}

// ==========================================
// クライアント関連
// ==========================================

// クライアント基本情報
export interface Client extends Timestamps {
  id: ID;
  organizationId: ID;
  name: string;
  birthDate?: Date;
  gender?: 'male' | 'female' | 'other';
  email?: string;
  phoneNumber?: string;
  memo?: string;
  lastVisitDate?: Date;
  visitCount: number;
}

// クライアント作成リクエスト
export interface ClientCreateRequest {
  name: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  email?: string;
  phoneNumber?: string;
  memo?: string;
}

// クライアント更新リクエスト
export interface ClientUpdateRequest {
  name?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  email?: string;
  phoneNumber?: string;
  memo?: string;
}

// クライアント検索フィルター
export interface ClientSearchFilter {
  searchTerm?: string;
  missingBirthDate?: boolean; // birthDateMissingから変更
  visitedThisMonth?: boolean;
  isFavorite?: boolean;
}

// ==========================================
// AIキャラクター関連
// ==========================================

// AIキャラクタースタイル
export enum AICharacterStyle {
  FLIRTY = 'flirty',       // 甘え・恋愛系
  COOL = 'cool',           // 冷静・大人系
  CHEERFUL = 'cheerful',   // 明るい・フレンドリー
  SOFT = 'soft',           // やさしい・癒し系
  CARING = 'caring',       // 甘えさせ系
  ONEESAN = 'oneesan',     // 姉御・甘えられ系
  MYSTERIOUS = 'mysterious', // 謎めいた系
}

// AIキャラクター基本情報
export interface AICharacter {
  id: ID;
  userId?: ID;
  clientId?: ID;
  name: string;
  styleFlags: AICharacterStyle[];
  personalityScore: {
    softness: number;    // 0-100: やさしさ度
    energy: number;      // 0-100: エネルギー度
    formality: number;   // 0-100: フォーマル度
  };
  personalityTraits?: PersonalityTrait[]; // オプショナル：性格特性配列
  communicationStyle?: string; // オプショナル：コミュニケーションスタイル
  createdAt: Date;
  lastInteractionAt?: Date;
}

// AIキャラクター作成リクエスト
export interface AICharacterCreateRequest {
  name: string;
  styleFlags: AICharacterStyle[];
  personalityScore?: {
    softness: number;
    energy: number;
    formality: number;
  };
  personalityTraits?: string[];
  communicationStyle?: string;
  backgroundStory?: string;
}

// AIキャラクター更新リクエスト
export interface AICharacterUpdateRequest {
  name?: string;
  styleFlags?: AICharacterStyle[];
  personalityScore?: {
    softness: number;
    energy: number;
    formality: number;
  };
}

// AIメモリタイプ
export enum AIMemoryType {
  EXPLICIT = 'explicit', // 明示的記憶
  AUTO = 'auto',        // 自動抽出
}

// AIメモリカテゴリー
export enum AIMemoryCategory {
  PERSONAL_INFO = 'personal_info',      // 個人情報
  PREFERENCES = 'preferences',          // 好み・嗜好
  RELATIONSHIPS = 'relationships',      // 人間関係
  EXPERIENCES = 'experiences',          // 経験・体験
  GOALS = 'goals',                     // 目標・願望
  EMOTIONS = 'emotions',               // 感情・気持ち
  HABITS = 'habits',                   // 習慣・癖
  WORK = 'work',                       // 仕事関連
  HEALTH = 'health',                   // 健康関連
  OTHER = 'other',                     // その他
}

// AIメモリ
export interface AIMemory {
  id: ID;
  characterId: ID;
  memoryType: AIMemoryType;
  content: string;
  category: string;
  type?: string; // オプショナル：メモリータイプ
  extractedFrom?: string;
  confidence?: number; // 0-100（自動抽出時）
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// AIメモリ作成リクエスト
export interface AIMemoryCreateRequest {
  characterId: ID;
  memoryType: AIMemoryType;
  content: string;
  category: AIMemoryCategory | string;
  type?: string;
  extractedFrom?: string;
  confidence?: number;
  isActive?: boolean;
  importance?: 'high' | 'medium' | 'low';
  relatedEntities?: string[];
  tags?: string[];
}

// AIメモリ更新リクエスト
export interface AIMemoryUpdateRequest {
  content?: string;
  category?: AIMemoryCategory | string;
  isActive?: boolean;
}

// ==========================================
// チャット関連
// ==========================================

// メッセージタイプ
export enum MessageType {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

// チャットメッセージ
export interface ChatMessage {
  id: ID;
  conversationId: ID;
  type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// 会話状態
export type ConversationState = 'active' | 'ended' | 'expired' | 'paused' | 'archived';

// 会話コンテキストタイプ
export type ConversationContextType = 'personal' | 'stylist_consultation' | 'client_direct';

// 会話セッション
export interface Conversation {
  id: ID;
  userId?: ID;
  clientId?: ID;
  aiCharacterId: ID;
  context: ConversationContextType;
  status?: ConversationState; // オプショナル：会話状態
  startedAt: Date;
  endedAt?: Date;
  updatedAt?: Date; // オプショナル：最終更新日時
  messageCount: number;
  memoryUpdates?: ID[]; // 更新されたメモリID配列
}

// 会話コンテキスト
export interface ConversationContext {
  clientInfo?: {
    name: string;
    recentTopics?: string[];
    preferences?: Record<string, any>;
  };
  stylistInfo?: {
    name: string;
    specialties?: string[];
  };
  sessionGoal?: string;
}

// 会話作成リクエスト
export interface ConversationCreateRequest {
  aiCharacterId: ID;
  context: ConversationContextType;
  initialContext?: ConversationContext;
  clientId?: ID; // オプショナル：クライアントID
}

// メッセージ送信リクエスト
export interface MessageSendRequest {
  content: string;
  metadata?: Record<string, any>;
}

// 会話開始レスポンス
export interface ConversationStartResponse {
  conversation: Conversation;
  aiCharacter: AICharacter;
  initialMessage?: ChatMessage;
  isNew?: boolean; // オプショナル：新規会話かどうか
}

// ==========================================
// 四柱推命関連
// ==========================================

// 五行要素
export enum FiveElements {
  WOOD = 'wood',   // 木
  FIRE = 'fire',   // 火
  EARTH = 'earth', // 土
  METAL = 'metal', // 金
  WATER = 'water', // 水
}

// 陰陽
export enum YinYang {
  YIN = 'yin',   // 陰
  YANG = 'yang', // 陽
}

// 四柱推命基本データ
export interface FourPillarsData {
  _id: ID;
  userId?: ID;
  clientId?: ID;
  birthDate: string;
  birthTime: string;
  location?: {
    name: string;
    longitude: number;
    latitude: number;
  };
  timezone: string;
  yearPillar: PillarData;
  monthPillar: PillarData;
  dayPillar: PillarData;
  hourPillar: PillarData;
  elementBalance: ElementBalance;
  tenGods: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  hiddenStems?: any;
  twelveFortunes?: any;
  kakukyoku?: string;
  yojin?: string[];
  calculatedAt: Date;
}

// 柱データ
export interface PillarData {
  heavenlyStem: string;    // 天干
  earthlyBranch: string;   // 地支
  element: string;         // 五行要素（string型に変更）
  yinYang: string;         // 陰陽（string型に変更）
}

// 五行バランス
export interface ElementBalance {
  wood: number;  // 木の比率
  fire: number;  // 火の比率
  earth: number; // 土の比率
  metal: number; // 金の比率
  water: number; // 水の比率
  mainElement?: FiveElements;
  isBalanced?: boolean;
}

// 四柱推命計算リクエスト
export interface FourPillarsCalculateRequest {
  birthDate: string; // ISO8601形式
  birthTime: string; // HH:mm形式
  timezone?: string;
  location?: {
    name: string;
    longitude: number;
    latitude: number;
  };
}

// 四柱推命分析リクエスト
export interface FourPillarsAnalyzeRequest {
  fourPillarsData: FourPillarsData;
  analysisType: 'personality' | 'element_balance' | 'ten_gods' | 'all';
}

// 相性計算リクエスト
export interface CompatibilityCalculateRequest {
  users: Array<{
    userId: ID;
    birthDate: string;
    birthTime: string;
    timezone?: string;
    location?: {
      name: string;
      longitude: number;
      latitude: number;
    };
  }>;
}

// 性格特性
export interface PersonalityTrait {
  trait: string;
  score: number; // 0-100
  description: string;
}

// 相性詳細
export interface CompatibilityDetail {
  userId1: ID;
  userId2: ID;
  score: number;
  relationship: string;
  advice: string;
}

// 相性診断結果
export interface CompatibilityResult {
  _id: ID;
  userIds: ID[];
  overallScore: number; // 0-100
  details: {
    elementHarmony: {
      score: number;
      description: string;
    };
    yinYangBalance: {
      score: number;
      description: string;
    };
    tenGodCompatibility: {
      score: number;
      description: string;
    };
    lifePurpose: {
      score: number;
      description: string;
    };
  };
  advice: string;
  challenges?: string[];
  strengths?: string[];
  calculatedAt: Date;
}

// 日運データ
export interface DailyFortune {
  id: ID;
  userId?: ID;
  clientId?: ID;
  date: Date;
  overallLuck: number; // 1-5
  workLuck: number; // 1-5
  relationshipLuck: number; // 1-5
  healthLuck: number; // 1-5
  luckyColor: string;
  luckyDirection: string;
  advice: string;
  warnings?: string[];
}

// ==========================================
// 運勢表示関連（fortune-display.html用）
// ==========================================

// 運勢カードカテゴリー
export enum FortuneCardCategory {
  OVERALL_FLOW = 'overall_flow',                    // 全体の流れ
  TECHNIQUE_FOCUS = 'technique_focus',              // 技術・施術の集中度
  CUSTOMER_COMMUNICATION = 'customer_communication', // 接客・対人コミュニケーション
  APPOINTMENT_REPEAT = 'appointment_repeat',         // 今日の指名・リピーター運
  LUCKY_STYLING = 'lucky_styling',                  // ラッキースタイリング
  LUCKY_ITEM = 'lucky_item',                        // ラッキーアイテム
  SELF_CARE = 'self_care',                          // セルフケア・体調アドバイス
  COMPATIBILITY_STYLIST = 'compatibility_stylist',   // 相性スタイリスト紹介
}

// 運勢カードアイコンテーマ
export enum FortuneCardIconTheme {
  WEATHER = 'weather',     // 天気系（🌤）
  SCISSORS = 'scissors',   // ハサミ系（✂️）
  CHAT = 'chat',          // チャット系（💬）
  TARGET = 'target',      // ターゲット系（💡）
  STYLE = 'style',        // スタイル系（🌈）
  SPARKLE = 'sparkle',    // キラキラ系（🎯）
  HEART = 'heart',        // ハート系（🧖‍♀️）
  PARTNER = 'partner',    // パートナー系（💞）
}

// 個別運勢カード
export interface FortuneCard {
  id: ID;
  category: FortuneCardCategory;
  iconTheme: FortuneCardIconTheme;
  icon: string;           // 絵文字アイコン
  title: string;          // カードタイトル
  shortAdvice: string;    // 短いアドバイス（展開前に表示）
  detailAdvice: string;   // 詳細アドバイス（展開後に表示）
  gradientColors: {       // アイコン背景のグラデーション色
    from: string;
    to: string;
  };
  color?: string;         // カードの色
  position: number;       // カードの位置
  isMainCard?: boolean;   // メインカードかどうか
}

// 相性スタイリスト情報
export interface CompatibleStylist {
  stylistId: ID;
  stylistName: string;
  compatibilityScore: number; // 1-5（星の数）
  reason: string;             // 相性が良い理由
  collaborationAdvice: string; // 協力・相談のアドバイス
}

// 今日のアドバイス全体データ
export interface DailyAdviceData {
  id: ID;
  userId: ID;
  date: Date;
  aiCharacterName: string;
  aiCharacterAvatar?: string;
  greetingMessage: string;     // 「今日も素敵な一日になりそうだね♡」など
  cards: FortuneCard[];        // 8枚のカード
  compatibleStylist?: CompatibleStylist; // 相性の良いスタイリスト
  createdAt: Date;
  expiresAt: Date;            // キャッシュ有効期限
}

// スタイリスト向け運勢詳細（四柱推命ベース）
export interface StylistFortuneDetail extends DailyFortune {
  stylistId: ID;
  
  // 美容業特化の運勢項目
  creativityLuck: number;      // 1-5: クリエイティビティ運
  precisionLuck: number;       // 1-5: 技術精度運
  communicationLuck: number;   // 1-5: コミュニケーション運
  salesLuck: number;          // 1-5: 販売・提案運
  
  // 時間帯別の運勢
  hourlyFortune: {
    morning: number;    // 1-5: 午前の運勢
    afternoon: number;  // 1-5: 午後の運勢
    evening: number;    // 1-5: 夕方の運勢
  };
  
  // 具体的なアドバイス
  technicalAdvice: string;     // 技術面のアドバイス
  customerServiceAdvice: string; // 接客面のアドバイス
  businessAdvice: string;      // ビジネス面のアドバイス
  
  // ラッキー要素
  luckyTechnique?: string;     // ラッキーな技術・スタイル
  luckyProduct?: string;       // ラッキーな商品・サービス
  luckyTimeSlot?: string;      // ラッキーな時間帯
  
  // 追加項目
  fortuneCards: FortuneCard[];
  compatibleColleagues: {
    userId: ID;
    name: string;
    compatibilityScore: number;
    advice: string;
  }[];
  todaysKeyPoints: string[];
  warningPoints?: string[];
}

// 週間運勢データ
export interface WeeklyFortune {
  id: ID;
  userId?: ID;
  clientId?: ID;
  weekStartDate: Date;
  weekEndDate: Date;
  overallTrend: string;        // 週全体の傾向
  bestDay: Date;              // 最も運勢の良い日
  challengingDay: Date;       // 注意が必要な日
  weeklyAdvice: string;       // 週間アドバイス
  dailyHighlights: {          // 各日のハイライト
    date: Date;
    highlight: string;
    luckLevel: number;      // 1-5
  }[];
}

// 月間運勢データ
export interface MonthlyFortune {
  id: ID;
  userId?: ID;
  clientId?: ID;
  year: number;
  month: number;
  overallTheme: string;       // 月のテーマ
  keyDates: {                 // 重要な日付
    date: Date;
    significance: string;
    advice: string;
  }[];
  monthlyGoals: string[];     // 月間目標
  focusAreas: string[];       // 注力すべき分野
}

// ==========================================
// 予約関連
// ==========================================

// 予約ステータス
export enum AppointmentStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  CANCELLED = 'cancelled', // 互換性のため
  NO_SHOW = 'no_show',
}

// 予約基本情報
export interface Appointment extends Timestamps {
  id: ID;
  organizationId: ID;
  clientId: ID;
  stylistId?: ID;
  scheduledAt: Date;
  duration: number; // 分単位
  services: string[];
  servicemenu?: string; // 互換性のために追加
  status: AppointmentStatus;
  note?: string;
  completedAt?: Date;
  canceledAt?: Date;
  amount?: number; // 金額（オプショナル）
}

// 予約作成リクエスト
export interface AppointmentCreateRequest {
  clientId: ID;
  stylistId?: ID;
  scheduledAt: string;
  duration: number;
  services: string[];
  note?: string;
}

// 予約更新リクエスト
export interface AppointmentUpdateRequest {
  stylistId?: ID;
  scheduledAt?: string;
  duration?: number;
  services?: string[];
  status?: AppointmentStatus;
  note?: string;
}

// ==========================================
// 課金・決済関連
// ==========================================

// 支払い方法タイプ
export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
}

// 支払い方法
export interface PaymentMethod {
  id: ID;
  organizationId: ID;
  type: PaymentMethodType;
  last4?: string;
  lastFourDigits?: string; // last4のエイリアス
  expiryMonth?: number;
  expiryYear?: number;
  expirationMonth?: number; // expiryMonthのエイリアス
  expirationYear?: number; // expiryYearのエイリアス
  brand?: string; // カードブランド（VISA, MasterCard等）
  cardBrand?: string; // brandのエイリアス
  isDefault: boolean;
  univapayTokenId?: string;
  createdAt: Date;
}

// サブスクリプション状態
export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  TRIALING = 'trialing',
}

// サブスクリプション
export interface Subscription {
  id: ID;
  organizationId: ID;
  plan: OrganizationPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  univapaySubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// トークン使用量
export interface TokenUsage {
  id: ID;
  organizationId: ID;
  userId: ID;
  endpoint: string;
  tokens: number;
  cost: number;
  timestamp: Date;
}

// トークンパッケージ
export enum TokenPackage {
  STANDARD = 'standard', // 1,000,000トークン
  PREMIUM = 'premium',   // 10,000,000トークン
}

// トークンパッケージ（API用）
export interface TokenPackageItem {
  id: string;
  name: string;
  tokens: number;
  price: number;
  description: string;
}


// ==========================================
// API認証要件情報
// ==========================================

// 認証が不要な公開エンドポイント
export const PUBLIC_ENDPOINTS = [
  API_PATHS.AUTH.LOGIN,
  API_PATHS.AUTH.LOGIN_LINE,
  API_PATHS.AUTH.REGISTER,
  API_PATHS.AUTH.REGISTER_ORGANIZATION,
  API_PATHS.AUTH.PASSWORD_RESET_REQUEST,
  API_PATHS.AUTH.VERIFY_RESET_TOKEN,
  API_PATHS.AUTH.COMPLETE_PASSWORD_RESET,
];

// ロール別アクセス制限
export const ROLE_RESTRICTED_ENDPOINTS = {
  [UserRole.SUPER_ADMIN]: [
    '/api/superadmin/**',
  ],
  [UserRole.OWNER]: [
    '/api/owner/**',
    API_PATHS.USERS.INVITE,
    API_PATHS.BILLING.SUBSCRIPTION,
    API_PATHS.BILLING.TOKEN,
  ],
  [UserRole.ADMIN]: [
    '/api/admin/**',
    API_PATHS.CLIENTS.BASE,
    API_PATHS.APPOINTMENTS.BASE,
  ],
  [UserRole.USER]: [
    API_PATHS.CHAT.CONVERSATIONS,
    API_PATHS.FORTUNE.DAILY,
    API_PATHS.CLIENTS.DAILY,
  ],
  [UserRole.CLIENT]: [
    '/api/clients/*/chat',
    '/api/clients/*/fortune',
  ],
};

// 認証エラーコード
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'AUTH001',
  TOKEN_EXPIRED = 'AUTH002',
  INSUFFICIENT_PERMISSIONS = 'AUTH003',
  RATE_LIMIT_EXCEEDED = 'AUTH004',
  PASSWORD_TOO_SHORT = 'AUTH005',
  USER_NOT_FOUND = 'AUTH006',
  ACCOUNT_LOCKED = 'AUTH007',
}

// ==========================================
// ダッシュボード・統計関連
// ==========================================

// ダッシュボード概要
export interface DashboardSummary {
  todayAppointments: number;
  totalClients: number;
  totalStylists: number;
  weeklyCompletedAppointments: number;
  monthlyTokenUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
  unassignedAppointmentsCount: number;
  unassignedAppointments?: UnassignedAppointment[];
  attendedClients?: number;
  cancelledAppointments?: number;
}

// トークン使用状況の詳細データ
export interface TokenUsageDetail {
  date: string;
  usage: number;
  dailyTarget?: number;
}

// トークン使用サマリー
export interface TokenUsageSummary {
  currentUsage: number;
  monthlyLimit: number;
  remainingTokens: number;
  usagePercentage: number;
  renewalDate: Date;
}

// 未担当予約
export interface UnassignedAppointment {
  id: ID;
  clientName: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  element: string;
}

// グラフデータポイント
export interface ChartDataPoint {
  label: string;
  value: number;
  date?: Date;
}

// グラフデータセット
export interface ChartDataset {
  label: string;
  data: ChartDataPoint[];
  backgroundColor?: string;
  borderColor?: string;
}

// ダッシュボードグラフデータ
export interface DashboardChartData {
  tokenUsageChart: {
    labels: string[];
    datasets: ChartDataset[];
  };
  appointmentTrendChart?: {
    labels: string[];
    datasets: ChartDataset[];
  };
  revenueTrendChart?: {
    labels: string[];
    datasets: ChartDataset[];
  };
}

// ==========================================
// スタイリスト管理拡張
// ==========================================

// 離職リスクレベル
export enum TurnoverRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// スタイリスト詳細情報
export interface StylistDetail extends UserProfile {
  yearsOfService: number;
  position: string;
  specialties: string[];
  turnoverRiskLevel: TurnoverRiskLevel;
  monthlyAppointments: number;
  performanceScore?: number;
}

// 離職リスク分析
export interface TurnoverRiskAnalysis {
  stylistId: ID;
  riskLevel: TurnoverRiskLevel;
  factors: string[];
  recommendedActions: string[];
  lastEvaluationDate: Date;
}

// スタイリストレポート
export interface StylistReport {
  stylistId: ID;
  reportPeriod: {
    start: Date;
    end: Date;
  };
  totalAppointments: number;
  clientSatisfactionScore?: number;
  revenueGenerated?: number;
  fourPillarsAnalysis?: FourPillarsData;
}

// ==========================================
// 予約管理拡張
// ==========================================

// 予約時間枠
export interface TimeSlot {
  id?: ID;
  startTime: string;
  endTime: string;
  appointments: Appointment[];
  capacity: number;
}

// カレンダー同期設定
export interface CalendarSyncSettings {
  enabled: boolean;
  syncInterval: '15min' | '30min' | '1hour' | 'manual';
  autoAssignEnabled: boolean;
  autoReflectChangesEnabled: boolean;
  enableMachineLearning: boolean;
}

// カレンダー同期ステータス
export interface CalendarSyncStatus {
  provider: 'google' | 'icloud' | 'outlook';
  connected: boolean;
  isConnected?: boolean; // connectedのエイリアス
  lastSyncAt?: Date;
  lastSyncTime?: Date; // lastSyncAtのエイリアス
  syncError?: string;
  nextSync?: Date;
  autoSync?: boolean;
  syncFrequency?: 'hourly' | 'daily' | 'weekly';
  status?: 'connected' | 'disconnected' | 'error';
  pendingMatches?: number;
  totalAppointments?: number;
  successfulClientMatches?: number;
  successfulStylistMatches?: number;
}

// 予約割り当て推奨
export interface AppointmentAssignmentRecommendation {
  appointmentId: ID;
  recommendedStylists: {
    stylistId: ID;
    compatibilityScore?: number;
    reason: string;
    isAvailable: boolean;
  }[];
}

// ==========================================
// SuperAdmin向け課金・プラン管理
// ==========================================

// プラン詳細情報
export interface PlanDetail {
  id: ID;
  name: string;
  displayName: string;
  plan: OrganizationPlan;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: {
    maxStylists: number;
    maxClients: number;
    monthlyTokens: number;
    supportLevel: 'basic' | 'standard' | 'premium' | 'enterprise';
    customBranding: boolean;
    apiAccess: boolean;
    dataExport: boolean;
    multiLocation: boolean;
    dedicatedSupport: boolean;
    customIntegration: boolean;
  };
  description?: string;
  isPopular?: boolean;
  isHidden?: boolean;
  trialDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

// プラン更新リクエスト
export interface PlanUpdateRequest {
  displayName?: string;
  price?: number;
  features?: Partial<PlanDetail['features']>;
  description?: string;
  isPopular?: boolean;
  isHidden?: boolean;
  trialDays?: number;
}

// トークンプラン（追加購入用）
export interface TokenPlan {
  id: ID;
  name: string;
  displayName: string;
  tokenAmount: number;
  price: number;
  pricePerToken: number;
  savingsPercentage?: number;
  description?: string;
  isPopular?: boolean;
  validityDays?: number; // トークンの有効期限（日数）
  createdAt: Date;
  updatedAt: Date;
}

// トークンプラン更新リクエスト
export interface TokenPlanUpdateRequest {
  displayName?: string;
  tokenAmount?: number;
  price?: number;
  description?: string;
  isPopular?: boolean;
  validityDays?: number;
}

// 収益シミュレーションリクエスト
export interface RevenueSimulationRequest {
  period: 'monthly' | 'quarterly' | 'yearly';
  assumptions: {
    newOrganizationsPerMonth: number;
    churnRate: number; // 解約率（%）
    averageTokenPurchase: number; // 組織あたりの平均トークン購入額
    planDistribution: {
      [key in OrganizationPlan]: number; // 各プランの割合（%）
    };
  };
}

// 収益シミュレーション結果
export interface RevenueSimulationResult {
  period: string;
  projectedRevenue: {
    subscription: number;
    tokenSales: number;
    total: number;
  };
  projectedGrowth: {
    organizations: number;
    revenue: number;
    growthRate: number;
  };
  breakdown: {
    month: string;
    subscriptionRevenue: number;
    tokenRevenue: number;
    totalRevenue: number;
    activeOrganizations: number;
    newOrganizations: number;
    churnedOrganizations: number;
  }[];
  assumptions: RevenueSimulationRequest['assumptions'];
}

// 請求管理フィルター
export interface BillingFilter {
  organizationId?: ID;
  status?: InvoiceStatus;
  dateFrom?: Date;
  dateTo?: Date;
  invoiceType?: 'subscription' | 'one-time' | 'token';
  minAmount?: number;
  maxAmount?: number;
}

// 請求サマリー
export interface BillingSummary {
  totalRevenue: number;
  subscriptionRevenue: number;
  tokenRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
  averageInvoiceValue: number;
  paymentSuccessRate: number;
  topOrganizations: {
    organizationId: ID;
    organizationName: string;
    totalSpent: number;
    lastPaymentDate: Date;
  }[];
  paymentMethods?: PaymentMethod[]; // 支払い方法リスト（オプショナル）
  subscription?: {
    planType: string;
    monthlyPrice: number;
    nextBillingDate: Date;
    status: string;
  };
  tokenBalance?: {
    current: number;
    total: number;
    used: number;
    lastChargeDate: Date;
  };
}

// 決済関連のリクエスト/レスポンス型
export interface CreateTokenResponse {
  token: string;
}

export interface ChargeTokensRequest {
  packageId: string;
  paymentToken: string;
}

export interface ChargeTokensResponse {
  success: boolean;
  chargeId?: string;
  tokens?: number;
}

export interface CreateSubscriptionRequest {
  planType: string;
  paymentMethodId?: string;
}

export interface CreateSubscriptionResponse {
  success: boolean;
  subscriptionId: string;
}

// ==========================================
// サポート管理
// ==========================================

// サポートチケットステータス
export enum TicketStatus {
  PENDING = 'pending',
  ANSWERED = 'answered',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  OPEN = 'open', // 未回答状態を追加
}

// サポートチケット
export interface SupportTicket extends Timestamps {
  id: ID;
  ticketNumber: string;
  organizationId: ID;
  userId: ID;
  title: string;
  description: string;
  status: TicketStatus;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  assignedTo?: ID;
  lastResponseAt?: Date;
  resolvedAt?: Date;
  messages?: SupportMessage[];
  user?: User;
  organization?: Organization;
  _isMockData?: boolean;
}

// サポートメッセージ
export interface SupportMessage extends Timestamps {
  id: ID;
  ticketId: ID;
  senderId: ID;
  senderType: 'user' | 'admin' | 'system';
  content: string;
  attachments?: string[];
  isStaff?: boolean; // 互換性のため
}

// サポートチケット関連の型定義（互換性のため）
export interface SupportTicketMessage extends SupportMessage {
  message?: string; // contentのエイリアス
}

export interface SupportTicketReplyInput {
  senderId: ID;
  message: string;
  isStaff: boolean;
  content?: string; // 互換性のため
  attachments?: string[];
}

export interface SupportTicketUpdateInput {
  status?: TicketStatus | 'open' | 'in_progress' | 'resolved'; // 文字列リテラルも受け入れる
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: ID;
  category?: string;
}

export interface SupportTicketCreateInput {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  userId: ID;
  organizationId: ID;
}

export interface SupportTicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  _isMockData?: boolean;
}

// ==========================================
// 請求・支払い管理拡張
// ==========================================

// APIトークンパッケージの詳細
export interface TokenPackageDetail {
  packageType: TokenPackage;
  price: number;
  amount?: number; // priceのエイリアス
  tokenAmount: number;
  bonusTokens?: number; // ボーナストークン数
  description: string;
  savingsPercentage?: number;
  validUntil?: Date;
}

// 請求書ステータス
export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELED = 'canceled',
}

// 請求書
export interface Invoice extends Timestamps {
  id: ID;
  invoiceNumber: string;
  organizationId: ID;
  issueDate: Date;
  dueDate: Date;
  paidAt?: Date;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  amount?: number; // totalのエイリアス
  totalAmount?: number; // totalのエイリアス
  billingPeriod?: { start: Date; end: Date }; // 請求期間
  type?: 'subscription' | 'one-time' | 'token'; // 請求書の種類
  paymentMethodId?: ID;
}

// 請求書項目
export interface InvoiceItem {
  description: string;
  unitPrice: number;
  quantity: number;
  amount: number;
}

// 支払い履歴
export interface PaymentHistory extends Timestamps {
  id: ID;
  organizationId: ID;
  invoiceId: ID;
  amount: number;
  paymentMethodId: ID;
  status: 'success' | 'failed' | 'pending';
  failureReason?: string;
}

// ==========================================
// インポート関連
// ==========================================

// インポート方法
export enum ImportMethod {
  HOTPEPPER = 'hotpepper',
  SALON_ANSWER = 'salon_answer',
  GOOGLE_CALENDAR = 'google_calendar',
  CSV = 'csv',
}

// インポートステータス
export enum ImportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// インポート設定
export interface ImportSettings {
  method: ImportMethod;
  defaultMethod?: ImportMethod;
  apiKey?: string;
  autoCreateClients?: boolean;
  autoMapFields?: boolean;
  updateExisting?: boolean;
  skipDuplicates?: boolean;
  validateData?: boolean;
  matchingRules: {
    byName: boolean;
    byPhone: boolean;
    byEmail: boolean;
  };
}

// インポート履歴
export interface ImportHistory extends Timestamps {
  id: ID;
  organizationId: ID;
  method: ImportMethod;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  importErrors?: string[];
  importedBy: ID;
  fileName?: string;
  status: ImportStatus;
  startedAt?: Date;
  completedAt?: Date;
  mapping?: FieldMapping[];
}

// フィールドマッピング
export interface FieldMapping {
  sourceField: string;
  targetField: string;
  isEnabled: boolean;
  isRequired?: boolean;
  priority: 'standard' | 'recommended' | 'optional';
}

// インポートプレビューデータ
export interface ImportPreviewData {
  clients: ClientImportPreview[];
  summary: {
    total: number;
    new: number;
    update: number;
    errors: number;
  };
}

// クライアントインポートプレビュー
export interface ClientImportPreview {
  rowNumber: number;
  data: Partial<Client>;
  status: 'new' | 'update' | 'error';
  importErrors?: string[];
}

// インポートオプション
export interface ImportOptions {
  autoCreateClients?: boolean;
  updateExisting?: boolean;
  skipErrors?: boolean;
  dryRun?: boolean;
}

// インポートアップロードレスポンス
export interface ImportUploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  preview: ImportPreviewData;
  mapping: FieldMapping[];
}

// インポート実行リクエスト
export interface ImportExecuteRequest {
  fileId: string;
  mapping: FieldMapping[];
  options: ImportOptions;
}

// インポート実行レスポンス
export interface ImportExecuteResponse {
  importId: string;
  processed: number;
  success: number;
  failed: number;
  importErrors?: string[];
}

// インポートマッピング
export interface ImportMapping {
  id: ID;
  organizationId: ID;
  name: string;
  mapping: FieldMapping[];
  fields?: Record<string, string>;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// シンプルなフィールドマッピング
export interface SimpleImportMapping {
  fields: Record<string, string>;
}

// インポートファイル
export interface ImportFile {
  id: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  totalRows?: number;
  headers: string[];
  uploadedAt: Date;
  lastModified?: Date;
}

// インポート結果
export interface ImportResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errors?: string[];
}

// カレンダー統合
export interface CalendarIntegration {
  provider: 'google' | 'icloud' | 'outlook';
  connected: boolean;
  calendarId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  syncFrequency?: number | 'hourly' | 'daily' | 'weekly';
  autoSync?: boolean;
}

// インポート履歴フィルター
export interface ImportHistoryFilter {
  method?: ImportMethod;
  status?: ImportStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

// カレンダー連携設定
export interface CalendarConnectionRequest {
  provider: 'google' | 'icloud' | 'outlook';
  authCode: string;
  syncFrequency: number; // 分単位
}

// カレンダー同期ステータス
export interface CalendarSyncStatus {
  provider: 'google' | 'icloud' | 'outlook';
  connected: boolean;
  isConnected?: boolean; // connectedのエイリアス
  lastSyncAt?: Date;
  lastSyncTime?: Date; // lastSyncAtのエイリアス
  syncError?: string;
  nextSync?: Date;
  autoSync?: boolean;
  syncFrequency?: 'hourly' | 'daily' | 'weekly';
  status?: 'connected' | 'disconnected' | 'error';
  pendingMatches?: number;
  totalAppointments?: number;
  successfulClientMatches?: number;
  successfulStylistMatches?: number;
}

// カレンダー同期設定
export interface CalendarSyncSettings {
  provider: 'google' | 'icloud' | 'outlook';
  connected: boolean;
  calendarId?: string;
  syncFrequency: number;
  lastSyncAt?: Date;
  syncEnabled: boolean;
}

// ==========================================
// フィルター・検索条件
// ==========================================

// クライアント検索フィルター
export interface ClientSearchFilter {
  searchTerm?: string;
  gender?: 'male' | 'female' | 'other';
  birthDateFrom?: Date;
  birthDateTo?: Date;
  hasAppointmentInMonth?: boolean;
  isFavorite?: boolean;
  missingBirthDate?: boolean;
}

// スタイリスト検索フィルター
export interface StylistSearchFilter {
  searchTerm?: string;
  role?: string;
  riskLevel?: TurnoverRiskLevel;
  isActive?: boolean;
}

// 予約検索フィルター
export interface AppointmentSearchFilter {
  dateFrom?: Date;
  dateTo?: Date;
  status?: AppointmentStatus;
  stylistId?: ID;
  clientId?: ID;
  hasNoStylist?: boolean;
}

// ==========================================
// 四柱推命・占い拡張型定義
// ==========================================


// 拡張デイリー運勢
export interface DailyFortuneExtended extends DailyFortune {
  // 美容業界特化
  creativityLuck: number;
  communicationLuck: number;
  salesLuck: number;
  
  // ラッキー要素
  luckyTime: string;
  luckyNumber: number;
  
  // 詳細アドバイス
  generalAdvice: string;
  workAdvice: string;
  relationshipAdvice: string;
  healthAdvice: string;
  
  // 美容業界特化要素
  beautyElements: {
    techniques: string[];    // ラッキーな技術
    products: string[];      // ラッキーな商品
    colors: string[];        // ラッキーカラー（ヘアカラー等）
    styles: string[];        // ラッキースタイル
    customerTypes: string[]; // 相性の良い客層
  };
  
  // AIからの特別メッセージ
  aiSpecialMessage?: string;
}


// 天干マスター
export interface HeavenlyStemMaster {
  stem: string;           // 甲、乙、丙、丁、戊、己、庚、辛、壬、癸
  element: FiveElements;
  yinYang: YinYang;
  meaning: string;
  keywords: string[];
}

// 地支マスター
export interface EarthlyBranchMaster {
  branch: string;         // 子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥
  element: FiveElements;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  hiddenStems: string[];  // 蔵干
  meaning: string;
}

// 十神定義
export interface TenGodDefinition {
  name: string;           // 比肩、劫財、食神、傷官、偏財、正財、偏官、正官、偏印、印綬
  type: 'self' | 'output' | 'wealth' | 'power' | 'resource';
  characteristics: string[];
  beautyIndustryTraits: string[]; // 美容業界特化の特性
}

// 美容パーソナライズアドバイス
export interface BeautyPersonalizedAdvice {
  id: ID;
  clientId: ID;
  date: Date;
  
  // 体質・タイプ別アドバイス
  skinTypeAdvice: string;
  hairTypeAdvice: string;
  seasonalAdvice: string;
  
  // 五行に基づく推奨
  elementBasedRecommendations: {
    element: FiveElements;
    recommendations: string[];
  };
  
  // 今日のおすすめ
  todaysRecommendations: {
    treatment: string;
    product: string;
    style: string;
  };
}

// スタイリスト相性一覧
export interface StylistCompatibilityList {
  clientId: ID;
  compatibleStylists: {
    stylistId: ID;
    stylistName: string;
    profileImage?: string;
    compatibilityScore: number;
    mainReason: string;
    isRecommended: boolean;
  }[];
  lastCalculatedAt: Date;
}

// ==========================================
// チャットUI・状態管理
// ==========================================

// チャットUIの状態
export interface ChatUIState {
  isTyping: boolean;
  isRecording: boolean;
  isLoading: boolean;
  hasUnreadMessages: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

// チャット入力モード
export enum ChatInputMode {
  TEXT = 'text',
  VOICE = 'voice',
  EMOJI = 'emoji',
}

// チャットセッションの表示設定
export interface ChatDisplaySettings {
  showTimestamps: boolean;
  showReadReceipts: boolean;
  enableSoundEffects: boolean;
  theme: 'light' | 'dark' | 'auto';
}

// ==========================================
// AIキャラクターオンボーディング
// ==========================================

// オンボーディングステップ
export enum OnboardingStep {
  INTRODUCTION = 'introduction',
  COLLECT_BIRTHDATE = 'collect_birthdate',
  PERSONALITY_ANALYSIS = 'personality_analysis',
  NAME_SELECTION = 'name_selection',
  CUSTOMIZATION = 'customization',
  COMPLETION = 'completion',
}

// オンボーディング進行状況
export interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  userData: {
    birthDate?: string;
    preferredName?: string;
    selectedTraits?: AICharacterStyle[];
  };
  startedAt: Date;
  completedAt?: Date;
}

// 名前候補
export interface NameSuggestion {
  name: string;
  meaning?: string;
  personalityMatch: number; // 0-100
}

// ==========================================
// メッセージ拡張型
// ==========================================

// メッセージコンテンツタイプ
export enum MessageContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VOICE = 'voice',
  FORTUNE_CARD = 'fortune_card',
  QUICK_ACTION = 'quick_action',
  SYSTEM_NOTIFICATION = 'system_notification',
}

// リッチカードコンテンツ
export interface FortuneCardContent {
  type: 'daily_fortune' | 'compatibility' | 'advice';
  title: string;
  icon?: string;
  items: {
    label: string;
    value: string | number;
    color?: string;
  }[];
}

// クイックアクションボタン
export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  action: string;
  style?: 'primary' | 'secondary' | 'outline';
}

// 拡張メッセージ型
export interface ChatMessageExtended extends ChatMessage {
  contentType: MessageContentType;
  richContent?: {
    fortuneCard?: FortuneCardContent;
    quickActions?: QuickAction[];
    imageUrl?: string;
    voiceUrl?: string;
    duration?: number; // 音声メッセージの長さ（秒）
  };
  reactions?: {
    emoji: string;
    count: number;
    userReacted: boolean;
  }[];
  isEdited?: boolean;
  editedAt?: Date;
}

// ==========================================
// チャットセッション管理拡張
// ==========================================

// チャットコンテキストの詳細
export enum ChatContext {
  PERSONAL = 'personal',              // 個人的な相談
  STYLIST_CONSULTATION = 'stylist_consultation', // スタイリスト相談
  CLIENT_DIRECT = 'client_direct',    // お客様直接チャット
  ONBOARDING = 'onboarding',         // オンボーディング中
  DAILY_CHECK_IN = 'daily_check_in', // デイリーチェックイン
}


// 拡張会話セッション
export interface ConversationExtended extends Conversation {
  state: ConversationState;
  lastMessagePreview?: string;
  unreadCount: number;
  participants: {
    userId?: ID;
    clientId?: ID;
    aiCharacterId: ID;
  };
  tags?: string[];
  mood?: 'positive' | 'neutral' | 'negative' | 'mixed';
}

// セッション分析
export interface ConversationAnalytics {
  conversationId: ID;
  avgResponseTime: number;
  sentimentScore: number; // -1 to 1
  topicsCovered: string[];
  engagementLevel: 'high' | 'medium' | 'low';
  memoriesExtracted: number;
}

// ==========================================
// リアルタイム通信
// ==========================================

// WebSocket イベントタイプ
export enum WebSocketEventType {
  MESSAGE_RECEIVED = 'message_received',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  CONNECTION_ERROR = 'connection_error',
  RECONNECTING = 'reconnecting',
  RECONNECTED = 'reconnected',
}

// WebSocket メッセージ
export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: any;
  timestamp: Date;
  conversationId?: ID;
}

// タイピングインジケーター
export interface TypingIndicator {
  conversationId: ID;
  userId?: ID;
  aiCharacterId?: ID;
  isTyping: boolean;
  startedAt?: Date;
}

// リアルタイム接続状態
export interface RealtimeConnectionState {
  isConnected: boolean;
  lastPingTime?: Date;
  reconnectAttempts: number;
  activeConversations: ID[];
}

// ==========================================
// クライアント向けチャット専用
// ==========================================

// お客様向けAIの振る舞い設定
export interface ClientAIBehavior {
  responseDelay: number; // ミリ秒
  typingSpeed: number; // 文字/秒
  useEmoji: boolean;
  emojiFrequency: 'high' | 'medium' | 'low';
  formalityLevel: number; // 0-100
  proactiveMessaging: boolean;
}

// スタイリスト相談モード
export interface StylistConsultationMode {
  clientId: ID;
  stylistId: ID;
  topic: string;
  suggestedTalkingPoints: string[];
  clientMoodIndicator?: 'positive' | 'neutral' | 'negative';
  compatibilityScore?: number;
}

// デイリークライアント表示情報
export interface DailyClientDisplay {
  appointment: Appointment;
  client: Client;
  compatibility: {
    score: number;
    level: 'excellent' | 'good' | 'average';
    advice?: string;
  };
  aiMemorySummary?: string;
  isFirstVisit: boolean;
  lastInteraction?: {
    date: Date;
    summary: string;
  };
}

