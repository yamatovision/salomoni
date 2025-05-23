import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, AuthResponse, ApiResponse } from '../types';
import { API_PATHS } from '../types';
import { useApi, setAuthToken } from '../hooks/useApi';
import { logger } from '../utils/logger';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (dataOrEmail: AuthResponse | string, password?: string) => Promise<void>;
  loginWithLine: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { apiCall } = useApi();

  // ローカルストレージから認証情報を読み込む
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        setAuthToken(token);
        
        try {
          const userData = await apiCall<UserProfile>(
            API_PATHS.USERS.ME,
            { method: 'GET' },
            { component: 'AuthContext', action: 'initAuth' }
          );
          
          setUser(userData);
          logger.info('User authenticated from stored token', {
            component: 'AuthContext',
            userId: userData.id
          });
        } catch (error) {
          logger.error('Failed to authenticate with stored token', error as Error, {
            component: 'AuthContext'
          });
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setAuthToken(null);
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, [apiCall]);

  const login = async (dataOrEmail: AuthResponse | string, password?: string) => {
    try {
      // dataOrEmailがAuthResponseの場合（LINE認証コールバックから）
      if (typeof dataOrEmail === 'object' && 'user' in dataOrEmail && 'accessToken' in dataOrEmail) {
        const response = dataOrEmail;
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken || '');
        setAuthToken(response.accessToken);
        setUser(response.user);

        logger.info('Login successful (from callback)', {
          component: 'AuthContext',
          userId: response.user.id
        });

        // ロールに応じてリダイレクト
        switch (response.user.role) {
          case 'superadmin':
            navigate('/superadmin');
            break;
          case 'owner':
          case 'admin':
            navigate('/admin');
            break;
          case 'user':
            navigate('/dashboard');
            break;
          default:
            navigate('/');
        }
        return;
      }

      // 通常のメール/パスワードログイン
      const email = dataOrEmail as string;
      logger.info('Login attempt started', {
        component: 'AuthContext',
        action: 'login',
        email
      });

      const response = await apiCall<ApiResponse<AuthResponse>>(
        API_PATHS.AUTH.LOGIN,
        {
          method: 'POST',
          data: { 
            email, 
            password,
            method: 'email' // 認証方法を追加
          }
        },
        { component: 'AuthContext', action: 'login' }
      );

      if (!response.data) {
        throw new Error('Invalid response format');
      }

      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken || '');
      setAuthToken(response.data.accessToken);
      setUser(response.data.user);

      logger.info('Login successful', {
        component: 'AuthContext',
        userId: response.data.user.id
      });

      // ロールに応じてリダイレクト
      switch (response.data.user.role) {
        case 'superadmin':
          navigate('/superadmin');
          break;
        case 'owner':
        case 'admin':
          navigate('/admin');
          break;
        case 'user':
          navigate('/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      logger.error('Login failed', error as Error, {
        component: 'AuthContext',
        action: 'login'
      });
      throw error;
    }
  };

  const loginWithLine = async (token: string) => {
    try {
      logger.info('LINE login attempt started', {
        component: 'AuthContext',
        action: 'loginWithLine'
      });

      const response = await apiCall<ApiResponse<AuthResponse>>(
        API_PATHS.AUTH.LOGIN_LINE,
        {
          method: 'POST',
          data: { 
            token,
            method: 'line' // 認証方法を追加
          }
        },
        { component: 'AuthContext', action: 'loginWithLine' }
      );

      if (!response.data) {
        throw new Error('Invalid response format');
      }

      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken || '');
      setAuthToken(response.data.accessToken);
      setUser(response.data.user);

      logger.info('LINE login successful', {
        component: 'AuthContext',
        userId: response.data.user.id
      });

      // ロールに応じてリダイレクト
      switch (response.data.user.role) {
        case 'superadmin':
          navigate('/superadmin');
          break;
        case 'owner':
        case 'admin':
          navigate('/admin');
          break;
        case 'user':
          navigate('/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      logger.error('LINE login failed', error as Error, {
        component: 'AuthContext',
        action: 'loginWithLine'
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiCall(
        API_PATHS.AUTH.LOGOUT,
        { method: 'POST' },
        { component: 'AuthContext', action: 'logout' }
      );
    } catch (error) {
      logger.error('Logout API call failed', error as Error, {
        component: 'AuthContext',
        action: 'logout'
      });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setAuthToken(null);
      setUser(null);
      navigate('/login');
    }
  };

  const refreshToken = async () => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiCall<{ accessToken: string; expiresIn: number }>(
        API_PATHS.AUTH.REFRESH,
        {
          method: 'POST',
          data: { refreshToken: refreshTokenValue }
        },
        { component: 'AuthContext', action: 'refreshToken' }
      );

      localStorage.setItem('accessToken', response.accessToken);
      setAuthToken(response.accessToken);
      
      logger.info('Token refreshed successfully', {
        component: 'AuthContext'
      });
    } catch (error) {
      logger.error('Token refresh failed', error as Error, {
        component: 'AuthContext',
        action: 'refreshToken'
      });
      await logout();
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="認証情報を確認中..." />;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithLine, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};