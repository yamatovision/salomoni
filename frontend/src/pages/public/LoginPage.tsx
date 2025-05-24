import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email as EmailIcon 
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { ROUTES } from '../../routes/routes';

// P-003: ログインページ
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, lineLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await login(formData.email, formData.password);
      console.log('[LoginPage] ログイン成功:', response.user.email, response.user.role);
      
      // ロールに応じたダッシュボードへ遷移
      switch (response.user.role) {
        case UserRole.SUPER_ADMIN:
          console.log('[LoginPage] SUPER_ADMIN: /superadmin/organizations へ遷移');
          navigate(ROUTES.superadmin.organizations);
          break;
        case UserRole.OWNER:
        case UserRole.ADMIN:
          console.log('[LoginPage] OWNER/ADMIN: /admin へ遷移');
          navigate(ROUTES.admin.dashboard);
          break;
        case UserRole.USER:
        case UserRole.STYLIST:
          console.log('[LoginPage] USER/STYLIST: /dashboard へ遷移');
          navigate(ROUTES.stylist.dashboard);
          break;
        default:
          console.log('[LoginPage] 不明なロール:', response.user.role, '/ へ遷移');
          navigate('/');
      }
    } catch (error: any) {
      setApiError(error.message || 'ログインに失敗しました');
      setLoading(false);
    }
  };

  const handleLineLogin = async () => {
    setApiError(null);
    setLoading(true);
    try {
      await lineLogin();
    } catch (error: any) {
      setApiError(error.message || 'LINE認証の開始に失敗しました');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 50%, #f3e8ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Box
          sx={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(242, 106, 141, 0.15)',
            p: 5,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              background: 'linear-gradient(135deg, #F26A8D, #fce7f3, #f3e8ff)',
              borderRadius: '24px',
              zIndex: -1,
              opacity: 0.3,
            },
          }}
        >
          {/* ロゴセクション */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                margin: '0 auto 20px',
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
                  fontSize: '32px',
                  fontWeight: 300,
                  color: 'white',
                  fontStyle: 'italic',
                  position: 'relative',
                  '&::before': {
                    content: '"S"',
                    position: 'absolute',
                    left: -3,
                    top: -3,
                    fontSize: '36px',
                    fontWeight: 400,
                    transform: 'rotate(-8deg)',
                  },
                }}
              >
                S
              </Typography>
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 500,
                color: '#374151',
                mb: 1,
                letterSpacing: 0.5,
              }}
            >
              Salomoni
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: '#6b7280',
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              あなたの毎日に寄り添う<br />パートナーがここに
            </Typography>
          </Box>

          {/* エラーメッセージ */}
          {apiError && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: '8px',
              }}
            >
              {apiError}
            </Alert>
          )}

          {/* ログイン方法 */}
          <Stack spacing={2} sx={{ mb: 4 }}>
            {/* LINE認証 */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleLineLogin}
              disabled={loading}
              sx={{
                backgroundColor: '#00C300',
                color: 'white',
                py: 2,
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 500,
                boxShadow: '0 4px 16px rgba(0,195,0,0.2)',
                '&:hover': {
                  backgroundColor: '#00b300',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,195,0,0.3)',
                },
                '&:disabled': {
                  backgroundColor: '#d1d5db',
                },
              }}
              startIcon={<Typography sx={{ fontSize: '20px' }}>💬</Typography>}
            >
              LINEでログイン
            </Button>
          </Stack>

          {/* 区切り線 */}
          <Divider sx={{ my: 4 }}>
            <Typography
              variant="body2"
              sx={{
                px: 2,
                color: '#9ca3af',
                fontWeight: 500,
              }}
            >
              または
            </Typography>
          </Divider>

          {/* メール認証フォーム */}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <Box>
                <Typography
                  component="label"
                  htmlFor="email"
                  sx={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    mb: 1,
                  }}
                >
                  メールアドレス
                </Typography>
                <TextField
                  fullWidth
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: '#fafafa',
                      '&:hover': {
                        backgroundColor: 'white',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        '& fieldset': {
                          borderColor: '#F26A8D',
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography
                  component="label"
                  htmlFor="password"
                  sx={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    mb: 1,
                  }}
                >
                  パスワード
                </Typography>
                <TextField
                  fullWidth
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="パスワードを入力"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={!!errors.password}
                  helperText={errors.password}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: '#fafafa',
                      '&:hover': {
                        backgroundColor: 'white',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                        '& fieldset': {
                          borderColor: '#F26A8D',
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !formData.email || !formData.password}
                sx={{
                  mt: 2,
                  py: 2,
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 500,
                  background: 'linear-gradient(135deg, #F26A8D 0%, #E298A4 100%)',
                  boxShadow: '0 4px 16px rgba(242, 106, 141, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(242, 106, 141, 0.4)',
                  },
                  '&:disabled': {
                    background: '#d1d5db',
                  },
                }}
                startIcon={<EmailIcon />}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'メールでログイン'}
              </Button>
            </Stack>
          </Box>

          {/* フッター */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                color: '#6b7280',
                fontSize: '12px',
                lineHeight: 1.5,
              }}
            >
              ログインすることで<br />
              <Link
                to="/terms"
                style={{
                  color: '#F26A8D',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                利用規約
              </Link>
              と
              <Link
                to="/privacy"
                style={{
                  color: '#F26A8D',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                プライバシーポリシー
              </Link>
              に同意したものとみなされます
            </Typography>
          </Box>

          {/* 新規登録リンク */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link
              to="/auth/register-organization"
              style={{
                color: '#F26A8D',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              組織を新規登録
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};