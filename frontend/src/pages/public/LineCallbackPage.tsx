import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

// LINE認証コールバックページ
export const LineCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { handleLineCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // LINEからのエラーレスポンス
      if (error) {
        setError(errorDescription || 'LINE認証がキャンセルされました');
        setProcessing(false);
        return;
      }

      // 認証コードがない場合
      if (!code) {
        setError('認証コードが見つかりません');
        setProcessing(false);
        return;
      }

      try {
        // 認証コードをバックエンドに送信
        await handleLineCallback(code, state || undefined);
        // 成功時はAuthContextがリダイレクト処理を行う
      } catch (err: any) {
        setError(err.message || 'LINE認証の処理に失敗しました');
        setProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, handleLineCallback]);

  return (
    <Container maxWidth="sm">
        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* Salomoniロゴ */}
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              fontSize: '2.5rem',
              mb: 3,
            }}
          >
            S
          </Avatar>

          <Typography component="h1" variant="h5" gutterBottom>
            LINE認証処理中
          </Typography>

          {processing ? (
            <>
              <CircularProgress size={60} sx={{ mt: 4, mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                LINEアカウントの認証を処理しています...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                しばらくお待ちください
              </Typography>
            </>
          ) : error ? (
            <>
              <Alert severity="error" sx={{ mt: 4, width: '100%' }}>
                {error}
              </Alert>
              <Typography variant="body2" sx={{ mt: 2 }}>
                <a
                  href="/auth/login"
                  style={{
                    color: '#E91E63',
                    textDecoration: 'none',
                  }}
                >
                  ログインページに戻る
                </a>
              </Typography>
            </>
          ) : null}
        </Box>
      </Container>
  );
};