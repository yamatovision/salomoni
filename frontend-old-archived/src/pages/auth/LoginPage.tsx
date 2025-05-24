import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Divider,
  Alert,
  Paper,
  IconButton,
  InputAdornment,
  Stack,
  useTheme
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { logger } from '../../utils/logger';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const theme = useTheme();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      showNotification('ログインしました', 'success');
    } catch (err) {
      logger.error('Login error', err as Error, {
        component: 'LoginPage',
        action: 'handleEmailLogin'
      });
      setError('メールアドレスまたはパスワードが正しくありません');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLineLogin = async () => {
    setError('');
    
    try {
      logger.info('LINE login initiated', {
        component: 'LoginPage',
        action: 'handleLineLogin'
      });

      // LINE認証URLを構築
      const lineChannelId = import.meta.env.VITE_LINE_CHANNEL_ID || '2007463446';
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/line/callback`);
      const state = Math.random().toString(36).substring(7); // CSRF対策用のランダム文字列
      
      // セッションストレージにstateを保存（CSRF対策）
      sessionStorage.setItem('line_auth_state', state);
      
      // LINE認証ページへリダイレクト
      const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
        `response_type=code&` +
        `client_id=${lineChannelId}&` +
        `redirect_uri=${redirectUri}&` +
        `state=${state}&` +
        `scope=profile%20openid%20email`;
      
      window.location.href = lineAuthUrl;
    } catch (error) {
      logger.error('LINE login initiation failed', error as Error, {
        component: 'LoginPage',
        action: 'handleLineLogin'
      });
      setError('LINE認証の開始に失敗しました');
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
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: 'white',
            boxShadow: '0 20px 60px rgba(242, 106, 141, 0.15)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              background: 'linear-gradient(135deg, #F26A8D, #fce7f3, #f3e8ff)',
              borderRadius: 3,
              zIndex: -1,
              opacity: 0.3,
            },
          }}
        >
          {/* ロゴセクション */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                margin: '0 auto',
                mb: 2,
                background: 'linear-gradient(135deg, #F26A8D 0%, #E298A4 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(242, 106, 141, 0.3)',
                position: 'relative',
              }}
            >
              <Typography
                sx={{
                  fontSize: 32,
                  fontWeight: 300,
                  color: 'white',
                  fontStyle: 'italic',
                }}
              >
                S
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 500, color: theme.palette.text.primary, mb: 1 }}>
              Salomoni
            </Typography>
            <Typography variant="body1" color="text.secondary">
              あなたの毎日に寄り添う<br />パートナーがここに
            </Typography>
          </Box>

          {/* エラーメッセージ */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* ログインボタン */}
          <Stack spacing={2} sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleLineLogin}
              sx={{
                backgroundColor: '#00C300',
                '&:hover': {
                  backgroundColor: '#00b300',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,195,0,0.3)',
                },
              }}
              startIcon={<Typography sx={{ fontSize: 20 }}>💬</Typography>}
            >
              LINEでログイン
            </Button>
          </Stack>

          {/* 区切り線 */}
          <Divider sx={{ my: 3 }}>または</Divider>

          {/* メールログインフォーム */}
          <Box component="form" onSubmit={handleEmailLogin}>
            <TextField
              fullWidth
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
              disabled={isLoading}
            />

            <TextField
              fullWidth
              label="パスワード"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mb: 2 }}
            >
              {isLoading ? 'ログイン中...' : 'メールでログイン'}
            </Button>
          </Box>

          {/* フッター */}
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            ログインすることで、
            <RouterLink
              to="/terms"
              style={{ color: theme.palette.primary.main, textDecoration: 'none' }}
            >
              利用規約
            </RouterLink>
            と
            <RouterLink
              to="/privacy"
              style={{ color: theme.palette.primary.main, textDecoration: 'none' }}
            >
              プライバシーポリシー
            </RouterLink>
            に同意したものとみなされます
          </Typography>
        </Paper>

        {/* 組織登録リンク */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            組織の新規登録は
            <RouterLink
              to="/register/organization"
              style={{
                color: theme.palette.primary.main,
                textDecoration: 'none',
                marginLeft: '4px',
              }}
            >
              こちら
            </RouterLink>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};