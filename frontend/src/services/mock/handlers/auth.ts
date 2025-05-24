import type { LoginResponse, UserProfile, AuthResponse, OrganizationRegisterRequest } from '../../../types';
import { mockUsers, mockPasswords } from '../data/mockUsers';

export class MockAuthService {
  private currentUser: UserProfile | null = null;

  constructor() {
    // ローカルストレージから既存のモックトークンを確認
    console.log('[MockAuthService] コンストラクタ実行');
    const mockToken = localStorage.getItem('accessToken');
    console.log('[MockAuthService] 既存トークン:', mockToken);
    
    // モックモードでは、実際のJWTトークンは無視して、モックトークンのみを処理
    if (mockToken && mockToken.startsWith('mock-token-')) {
      // mock-token-{userId} または mock-token-{userId}-{timestamp} の形式に対応
      const tokenParts = mockToken.replace('mock-token-', '').split('-');
      // タイムスタンプを除外してユーザーIDを再構築
      const userId = tokenParts.filter(part => !(/^\d{10,}$/.test(part))).join('-');
      
      console.log('[MockAuthService] 抽出されたユーザーID:', userId);
      this.currentUser = mockUsers.find(u => u.id === userId) || null;
      console.log('[MockAuthService] 初期ユーザー設定:', this.currentUser?.email);
    } else if (mockToken) {
      // 実際のJWTトークンが存在する場合はクリア（モックモードでは使用しない）
      console.log('[MockAuthService] 実際のJWTトークンを検出。モックモードのためクリアします。');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    console.warn('🔧 Using MOCK login');
    
    // 遅延をシミュレート
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = mockUsers.find(u => u.email === email);
    
    if (!user || mockPasswords[email] !== password) {
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    this.currentUser = user;
    
    const mockAccessToken = `mock-token-${user.id}`;
    const mockRefreshToken = `mock-refresh-${user.id}`;
    
    // モック用のトークンを保存（AuthContextと同じキー名を使用）
    localStorage.setItem('accessToken', mockAccessToken);
    localStorage.setItem('refreshToken', mockRefreshToken);

    return {
      user,
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      expiresIn: 3600,
    };
  }

  async logout(): Promise<void> {
    console.warn('🔧 Using MOCK logout');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    this.currentUser = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async getCurrentUser(): Promise<UserProfile> {
    console.warn('🔧 Using MOCK getCurrentUser');
    console.log('[MockAuthService] currentUser:', this.currentUser?.email);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (!this.currentUser) {
      console.error('[MockAuthService] currentUserが設定されていません');
      throw new Error('認証が必要です');
    }
    
    return this.currentUser;
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    console.warn('🔧 Using MOCK refresh');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // mock-refresh-{userId} の形式からユーザーIDを抽出
    const tokenParts = refreshToken.replace('mock-refresh-', '').split('-');
    const userId = tokenParts.join('-');
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('無効なリフレッシュトークンです');
    }
    
    this.currentUser = user;
    const newAccessToken = `mock-token-${user.id}-${Date.now()}`;
    
    return {
      user,
      accessToken: newAccessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  async lineCallback(_code: string, _state?: string): Promise<AuthResponse> {
    console.warn('🔧 Using MOCK LINE callback');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // LINEログインのモックレスポンス
    // 実際のLINE認証をシミュレート
    const mockLineUser = mockUsers[0]; // スタイリストユーザーを使用
    this.currentUser = mockLineUser;
    
    const mockAccessToken = `mock-token-${mockLineUser.id}`;
    const mockRefreshToken = `mock-refresh-${mockLineUser.id}`;
    
    localStorage.setItem('accessToken', mockAccessToken);
    localStorage.setItem('refreshToken', mockRefreshToken);
    
    return {
      user: mockLineUser,
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      expiresIn: 3600,
    };
  }

  async registerOrganization(data: OrganizationRegisterRequest): Promise<AuthResponse> {
    console.warn('🔧 Using MOCK organization registration');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 組織登録のモックレスポンス
    const newUser = mockUsers.find(u => u.email === data.ownerEmail) || mockUsers[1]; // 管理者ユーザーを使用
    this.currentUser = newUser;
    
    const mockAccessToken = `mock-token-${newUser.id}`;
    const mockRefreshToken = `mock-refresh-${newUser.id}`;
    
    localStorage.setItem('accessToken', mockAccessToken);
    localStorage.setItem('refreshToken', mockRefreshToken);
    
    return {
      user: newUser,
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      expiresIn: 3600,
    };
  }
}