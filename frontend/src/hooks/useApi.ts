import { useState, useCallback } from 'react';
import axios, { type AxiosRequestConfig } from 'axios';
import { logger, type LogContext } from '../utils/logger';

// APIベースURL設定
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Axiosインスタンスの作成
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// トークンの設定
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // トークンリフレッシュロジックをここに実装
      logger.warn('Unauthorized access detected', {
        endpoint: error.config?.url,
        status: error.response?.status,
      });
    }
    return Promise.reject(error);
  }
);

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const apiCall = useCallback(async <T>(
    endpoint: string,
    options: AxiosRequestConfig = {},
    context: LogContext = {}
  ): Promise<T> => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('API Request Started', {
      ...context,
      endpoint,
      method: options.method || 'GET',
      requestId
    });
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient(endpoint, options);
      
      logger.info('API Request Completed', {
        ...context,
        endpoint,
        status: response.status,
        requestId
      });
      
      return response.data;
    } catch (err) {
      const error = err as Error;
      
      logger.error('API Request Failed', error, {
        ...context,
        endpoint,
        requestId
      });
      
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 便利メソッドの追加
  const post = useCallback(async <T>(
    endpoint: string,
    data?: any,
    context: LogContext = {}
  ): Promise<T> => {
    return apiCall<T>(endpoint, { method: 'POST', data }, context);
  }, [apiCall]);

  const get = useCallback(async <T>(
    endpoint: string,
    params?: any,
    context: LogContext = {}
  ): Promise<T> => {
    return apiCall<T>(endpoint, { method: 'GET', params }, context);
  }, [apiCall]);

  const put = useCallback(async <T>(
    endpoint: string,
    data?: any,
    context: LogContext = {}
  ): Promise<T> => {
    return apiCall<T>(endpoint, { method: 'PUT', data }, context);
  }, [apiCall]);

  const del = useCallback(async <T>(
    endpoint: string,
    context: LogContext = {}
  ): Promise<T> => {
    return apiCall<T>(endpoint, { method: 'DELETE' }, context);
  }, [apiCall]);

  return { apiCall, post, get, put, delete: del, loading, error };
};