import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  MenuItem,
  useTheme,
  Grid,
} from '@mui/material';
import { API_PATHS, OrganizationPlan } from '../../types';
import type { OrganizationRegisterRequest } from '../../types';
import { useApi } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import { logger } from '../../utils/logger';

const steps = ['組織情報', 'オーナー情報', 'プラン選択'];

const planDetails = {
  [OrganizationPlan.STANDARD]: {
    name: 'スタンダード',
    price: '¥9,800/月',
    features: ['スタイリスト5名まで', '基本機能', 'メールサポート'],
  },
  [OrganizationPlan.PROFESSIONAL]: {
    name: 'プロフェッショナル',
    price: '¥19,800/月',
    features: ['スタイリスト20名まで', '全機能利用可能', '優先サポート'],
  },
  [OrganizationPlan.ENTERPRISE]: {
    name: 'エンタープライズ',
    price: '¥36,000/月',
    features: ['スタイリスト無制限', '全機能利用可能', '専任サポート', 'カスタマイズ対応'],
  },
};

export const OrganizationRegisterPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<OrganizationRegisterRequest>({
    organizationName: '',
    organizationDisplayName: '',
    organizationPhone: '',
    organizationAddress: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerPhone: '',
    plan: OrganizationPlan.STANDARD,
    billingEmail: '',
  });

  const { apiCall } = useApi();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleNext = () => {
    if (validateStep()) {
      if (activeStep === steps.length - 1) {
        handleSubmit();
      } else {
        setActiveStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const validateStep = () => {
    setError('');
    
    switch (activeStep) {
      case 0: // 組織情報
        if (!formData.organizationName) {
          setError('組織名を入力してください');
          return false;
        }
        break;
      case 1: // オーナー情報
        if (!formData.ownerName || !formData.ownerEmail || !formData.ownerPassword) {
          setError('必須項目を入力してください');
          return false;
        }
        if (formData.ownerPassword.length < 8) {
          setError('パスワードは8文字以上で入力してください');
          return false;
        }
        break;
      case 2: // プラン選択
        if (!formData.plan) {
          setError('プランを選択してください');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      await apiCall(
        API_PATHS.AUTH.REGISTER_ORGANIZATION,
        {
          method: 'POST',
          data: formData,
        },
        { component: 'OrganizationRegisterPage', action: 'register' }
      );

      showNotification('組織の登録が完了しました', 'success');
      navigate('/login');
    } catch (err) {
      logger.error('Organization registration failed', err as Error, {
        component: 'OrganizationRegisterPage',
        action: 'handleSubmit',
      });
      setError('登録に失敗しました。入力内容を確認してください。');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3} {...{} as any}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="組織名（必須）"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                helperText="例：美容室サロモニ"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="組織表示名"
                value={formData.organizationDisplayName}
                onChange={(e) => setFormData({ ...formData, organizationDisplayName: e.target.value })}
                helperText="お客様に表示される名前"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="電話番号"
                value={formData.organizationPhone}
                onChange={(e) => setFormData({ ...formData, organizationPhone: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="住所"
                value={formData.organizationAddress}
                onChange={(e) => setFormData({ ...formData, organizationAddress: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3} {...{} as any}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="オーナー名（必須）"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="メールアドレス（必須）"
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                helperText="ログインに使用します"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="パスワード（必須）"
                type="password"
                value={formData.ownerPassword}
                onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                helperText="8文字以上で設定してください"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="電話番号"
                value={formData.ownerPhone}
                onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="請求先メールアドレス"
                type="email"
                value={formData.billingEmail}
                onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                helperText="請求書の送付先（省略時はオーナーのメールアドレス）"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3} {...{} as any}>
            <Grid size={12}>
              <TextField
                fullWidth
                select
                label="プラン選択"
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value as OrganizationPlan })}
              >
                {Object.entries(planDetails).map(([key, details]) => (
                  <MenuItem key={key} value={key}>
                    {details.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {formData.plan && (
              <Grid size={12}>
                <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
                  <Typography variant="h6" gutterBottom>
                    {planDetails[formData.plan].name}プラン
                  </Typography>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {planDetails[formData.plan].price}
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    {planDetails[formData.plan].features.map((feature, index) => (
                      <Typography component="li" key={index} variant="body2" sx={{ mb: 1 }}>
                        {feature}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 50%, #f3e8ff 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3 }}>
          {/* ヘッダー */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 500, color: theme.palette.text.primary, mb: 1 }}>
              組織新規登録
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Salomoniで美容サロンの運営を効率化しましょう
            </Typography>
          </Box>

          {/* ステッパー */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* エラーメッセージ */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* フォーム内容 */}
          <Box sx={{ mb: 4 }}>{renderStepContent()}</Box>

          {/* ボタン */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
            >
              戻る
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isLoading}
            >
              {activeStep === steps.length - 1
                ? isLoading
                  ? '登録中...'
                  : '登録する'
                : '次へ'}
            </Button>
          </Box>
        </Paper>

        {/* ログインリンク */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            すでにアカウントをお持ちの方は
            <RouterLink
              to="/login"
              style={{
                color: theme.palette.primary.main,
                textDecoration: 'none',
                marginLeft: '4px',
              }}
            >
              ログイン
            </RouterLink>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};