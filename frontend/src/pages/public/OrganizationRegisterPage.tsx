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
  Avatar,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { OrganizationPlan } from '../../types';

// P-004: 組織登録ページ
export const OrganizationRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerOrganization } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // フォームデータ
  const [formData, setFormData] = useState({
    // Step 1: 組織情報
    organizationName: '',
    organizationNameKana: '',
    plan: OrganizationPlan.STANDARD,
    
    // Step 2: 管理者情報
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    confirmPassword: '',
    
    // Step 3: 連絡先情報（オプション）
    phoneNumber: '',
    address: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = ['組織情報', '管理者情報', '連絡先情報'];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // 組織情報
        if (!formData.organizationName) {
          newErrors.organizationName = '組織名を入力してください';
        }
        if (!formData.organizationNameKana) {
          newErrors.organizationNameKana = '組織名（カナ）を入力してください';
        } else if (!/^[ァ-ヶー]+$/.test(formData.organizationNameKana)) {
          newErrors.organizationNameKana = 'カタカナで入力してください';
        }
        break;

      case 1: // 管理者情報
        if (!formData.ownerName) {
          newErrors.ownerName = '氏名を入力してください';
        }
        if (!formData.ownerEmail) {
          newErrors.ownerEmail = 'メールアドレスを入力してください';
        } else if (!/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
          newErrors.ownerEmail = '有効なメールアドレスを入力してください';
        }
        if (!formData.ownerPassword) {
          newErrors.ownerPassword = 'パスワードを入力してください';
        } else if (formData.ownerPassword.length < 8) {
          newErrors.ownerPassword = 'パスワードは8文字以上で入力してください';
        }
        if (formData.ownerPassword !== formData.confirmPassword) {
          newErrors.confirmPassword = 'パスワードが一致しません';
        }
        break;

      case 2: // 連絡先情報（オプションなのでバリデーション不要）
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setLoading(true);
    setApiError(null);
    
    try {
      await registerOrganization({
        organizationName: formData.organizationName,
        organizationNameKana: formData.organizationNameKana,
        plan: formData.plan,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPassword: formData.ownerPassword,
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address || undefined,
      });
      
      // 登録成功後はログインページへ
      navigate('/auth/login');
    } catch (error: any) {
      setApiError(error.message || '組織登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="組織名"
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              error={!!errors.organizationName}
              helperText={errors.organizationName}
              disabled={loading}
              placeholder="例: サロン美容室"
            />
            <TextField
              fullWidth
              label="組織名（カナ）"
              value={formData.organizationNameKana}
              onChange={(e) => setFormData({ ...formData, organizationNameKana: e.target.value })}
              error={!!errors.organizationNameKana}
              helperText={errors.organizationNameKana}
              disabled={loading}
              placeholder="例: サロンビヨウシツ"
            />
            <TextField
              fullWidth
              select
              label="プラン"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value as OrganizationPlan })}
              disabled={loading}
            >
              <MenuItem value={OrganizationPlan.STANDARD}>
                スタンダード（5名まで - 月額9,800円）
              </MenuItem>
              <MenuItem value={OrganizationPlan.PROFESSIONAL}>
                プロフェッショナル（15名まで - 月額24,800円）
              </MenuItem>
              <MenuItem value={OrganizationPlan.ENTERPRISE}>
                エンタープライズ（無制限 - 月額36,000円）
              </MenuItem>
            </TextField>
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="管理者氏名"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              error={!!errors.ownerName}
              helperText={errors.ownerName}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="メールアドレス"
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
              error={!!errors.ownerEmail}
              helperText={errors.ownerEmail}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="パスワード"
              type={showPassword ? 'text' : 'password'}
              value={formData.ownerPassword}
              onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
              error={!!errors.ownerPassword}
              helperText={errors.ownerPassword || '8文字以上で設定してください'}
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
            />
            <TextField
              fullWidth
              label="パスワード（確認）"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              連絡先情報は後から設定することもできます
            </Typography>
            <TextField
              fullWidth
              label="電話番号（任意）"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              disabled={loading}
              placeholder="例: 03-1234-5678"
            />
            <TextField
              fullWidth
              label="住所（任意）"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={loading}
              multiline
              rows={2}
              placeholder="例: 東京都渋谷区..."
            />
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm">
        <Box
          sx={{
            mt: 8,
            mb: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
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

          <Typography component="h1" variant="h4" gutterBottom>
            組織新規登録
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Salomoni × Irohaで組織アカウントを作成
          </Typography>

          {/* エラーメッセージ */}
          {apiError && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {apiError}
            </Alert>
          )}

          {/* ステッパー */}
          <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* フォーム */}
          <Box sx={{ width: '100%' }}>
            {renderStepContent(activeStep)}

            {/* ボタン */}
            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
              <Button
                fullWidth
                onClick={handleBack}
                disabled={activeStep === 0 || loading}
              >
                戻る
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : '登録する'}
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading}
                >
                  次へ
                </Button>
              )}
            </Stack>
          </Box>

          {/* ログインリンク */}
          <Typography variant="body2" sx={{ mt: 4 }}>
            すでにアカウントをお持ちの方は
            <Link
              to="/auth/login"
              style={{
                color: '#E91E63',
                textDecoration: 'none',
                marginLeft: '0.5rem',
              }}
            >
              ログイン
            </Link>
          </Typography>
        </Box>
      </Container>
  );
};