import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { logger } from '../../utils/logger';
import { API_PATHS, type ApiResponse, type AuthResponse } from '../../types';
import { useApi } from '../../hooks/useApi';

export const LineCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const api = useApi();

  useEffect(() => {
    handleLineCallback();
  }, []);

  const handleLineCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // エラーチェック
      if (error) {
        throw new Error(errorDescription || 'LINE認証がキャンセルされました');
      }

      if (!code || !state) {
        throw new Error('認証情報が不足しています');
      }

      // CSRF対策: stateの検証
      const savedState = sessionStorage.getItem('line_auth_state');
      if (state !== savedState) {
        throw new Error('不正なリクエストです');
      }
      sessionStorage.removeItem('line_auth_state');

      logger.info('LINE callback received', {
        component: 'LineCallbackPage',
        action: 'handleLineCallback'
      });

      // バックエンドAPIに認証コードを送信（セキュアな実装）
      const response = await api.post<ApiResponse<AuthResponse>>(API_PATHS.AUTH.LINE_CALLBACK, {
        code: code,
        state: state,
      });

      // ログイン処理
      if (response.success && response.data) {
        await login(response.data);
      }
      
      showNotification('LINE認証に成功しました', 'success');
    } catch (error) {
      logger.error('LINE callback error', error as Error, {
        component: 'LineCallbackPage',
        action: 'handleLineCallback'
      });
      
      const errorMessage = error instanceof Error ? error.message : 'LINE認証に失敗しました';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      
      // エラー時はログインページへリダイレクト
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 50%, #f3e8ff 100%)',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        {error ? (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              ログインページへリダイレクトします...
            </Typography>
          </>
        ) : (
          <>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              LINE認証を処理しています
            </Typography>
            <Typography variant="body2" color="text.secondary">
              しばらくお待ちください...
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};