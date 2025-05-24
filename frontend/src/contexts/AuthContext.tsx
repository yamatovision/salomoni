import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { UserProfile } from '../types';
import { authService } from '../services';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  lineLogin: () => Promise<void>;
  handleLineCallback: (code: string, state?: string) => Promise<void>;
  registerOrganization: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  completeInitialSetup: (data: any) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初回マウント時に認証状態を確認
    refreshAuth();
  }, []);

  const refreshAuth = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      console.log('[AuthContext] refreshAuth - トークン:', token);
      if (token) {
        const userData = await authService.getCurrentUser();
        console.log('[AuthContext] refreshAuth - ユーザー取得成功:', userData.email);
        setUser(userData);
      } else {
        console.log('[AuthContext] refreshAuth - トークンなし');
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      console.log('[AuthContext] モックモードでログインしてください');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const lineLogin = async () => {
    // LINE認証のURLにリダイレクト
    window.location.href = '/api/auth/line';
  };

  const handleLineCallback = async (code: string, state?: string) => {
    // LINE認証コールバック処理
    try {
      const response = await authService.lineCallback(code, state);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      setUser(response.user);
    } catch (error) {
      console.error('LINE callback error:', error);
      throw error;
    }
  };

  const registerOrganization = async (data: any) => {
    // 組織登録処理
    try {
      const response = await authService.registerOrganization(data);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      setUser(response.user);
    } catch (error) {
      console.error('Organization registration error:', error);
      throw error;
    }
  };

  const completeInitialSetup = async (data: any) => {
    // 初期設定完了処理
    // TODO: 実装を追加
    console.log('Completing initial setup:', data);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      lineLogin, 
      handleLineCallback,
      registerOrganization,
      logout, 
      refreshAuth, 
      completeInitialSetup 
    }}>
      {children}
    </AuthContext.Provider>
  );
};