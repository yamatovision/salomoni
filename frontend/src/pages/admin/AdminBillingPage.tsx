import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  TextField,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { AdminLayout } from '../../layouts/AdminLayout';
import { billingService } from '../../services';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import type {
  Invoice,
  BillingSummary,
  TokenPackageItem,
} from '../../types';
import {
  OrganizationPlan,
  InvoiceStatus,
  PaymentMethodType,
} from '../../types';

const AdminBillingPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tokenPackages, setTokenPackages] = useState<TokenPackageItem[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any>(null);
  
  const [tokenChargeDialog, setTokenChargeDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [paymentMethodDialog, setPaymentMethodDialog] = useState(false);
  const [changePlanDialog, setChangePlanDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // カード情報入力用の状態
  const [cardData, setCardData] = useState({
    number: '',
    exp_month: '',
    exp_year: '',
    cvv: '',
    holder_name: '',
  });

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 並列でデータを取得
      const [summary, invoiceData, packages, plans] = await Promise.all([
        billingService.getBillingSummary(),
        billingService.getInvoices({ limit: 10 }),
        Promise.resolve(billingService.getTokenPackages()),
        Promise.resolve(billingService.getSubscriptionPlans()),
      ]);

      // デバッグログ
      console.log('[AdminBillingPage] loadBillingData results:', {
        summary,
        invoiceData,
        packages,
        plans
      });

      setBillingSummary(summary);
      // 安全にinvoicesを設定
      setInvoices(invoiceData?.invoices || []);
      setTokenPackages(packages || []);
      setSubscriptionPlans(plans || {});
      
      if (summary.subscription?.planType) {
        setSelectedPlan(summary.subscription.planType);
      }
    } catch (err) {
      console.error('請求データの取得に失敗しました:', err);
      setError('請求データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenCharge = async () => {
    if (!selectedPackage) {
      setError('パッケージを選択してください。');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // 決済トークンを作成
      const tokenResponse = await billingService.createToken({
        number: cardData.number.replace(/\s/g, ''),
        exp_month: parseInt(cardData.exp_month),
        exp_year: parseInt(cardData.exp_year),
        cvv: cardData.cvv,
        holder_name: cardData.holder_name,
      });

      // トークンチャージを実行
      const selectedPkg = tokenPackages.find(pkg => pkg.id === selectedPackage);
      if (!selectedPkg) {
        throw new Error('選択されたパッケージが見つかりません');
      }
      
      await billingService.chargeTokens({
        tokenPackage: selectedPackage as 'standard' | 'premium',
        paymentMethodId: tokenResponse.token,
        organizationId: user?.organizationId || '',
      });

      setSuccessMessage('トークンチャージが完了しました。');
      setTokenChargeDialog(false);
      
      // データを再読み込み
      await loadBillingData();
      
      // カード情報をリセット
      setCardData({
        number: '',
        exp_month: '',
        exp_year: '',
        cvv: '',
        holder_name: '',
      });
      setSelectedPackage('');
    } catch (err) {
      console.error('トークンチャージに失敗しました:', err);
      setError('トークンチャージに失敗しました。カード情報を確認してください。');
    } finally {
      setProcessing(false);
    }
  };

  const handlePlanChange = async () => {
    if (!selectedPlan || selectedPlan === billingSummary?.subscription?.planType) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      await billingService.changePlan(selectedPlan as 'basic' | 'standard' | 'premium');
      
      setSuccessMessage('プラン変更が完了しました。');
      setChangePlanDialog(false);
      
      // データを再読み込み
      await loadBillingData();
    } catch (err) {
      console.error('プラン変更に失敗しました:', err);
      setError('プラン変更に失敗しました。');
    } finally {
      setProcessing(false);
    }
  };

  const getPlanName = (plan: OrganizationPlan) => {
    switch (plan) {
      case OrganizationPlan.STANDARD:
        return 'スタンダードプラン';
      case OrganizationPlan.PROFESSIONAL:
        return 'プロフェッショナルプラン';
      case OrganizationPlan.ENTERPRISE:
        return 'エンタープライズプラン';
      default:
        return plan;
    }
  };

  const getInvoiceStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'success';
      case InvoiceStatus.SENT:
        return 'warning';
      case InvoiceStatus.OVERDUE:
        return 'error';
      case InvoiceStatus.CANCELED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getInvoiceStatusLabel = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return '支払済み';
      case InvoiceStatus.SENT:
        return '送信済み';
      case InvoiceStatus.OVERDUE:
        return '期限超過';
      case InvoiceStatus.CANCELED:
        return 'キャンセル';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom color="primary">
          請求・プラン管理
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* 現在のプラン */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  現在のプラン
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {billingSummary?.subscription?.planType && 
                      getPlanName(billingSummary.subscription.planType as unknown as OrganizationPlan)}
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="月額料金"
                        secondary={`¥${billingSummary?.subscription?.monthlyPrice?.toLocaleString() || 0}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="次回更新日"
                        secondary={billingSummary?.subscription?.nextBillingDate ?
                          new Date(billingSummary.subscription.nextBillingDate).toLocaleDateString('ja-JP') :
                          '-'
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="ステータス"
                        secondary={billingSummary?.subscription?.status || '-'}
                      />
                    </ListItem>
                  </List>
                  <Box sx={{ mt: 2 }}>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      fullWidth
                      onClick={() => setChangePlanDialog(true)}
                    >
                      プラン変更
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* トークン残高 */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  トークン残高
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h3" color="primary" align="center" gutterBottom>
                    {billingSummary?.tokenBalance?.current || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                    / {billingSummary?.tokenBalance?.total || 0} トークン
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      使用済み: {billingSummary?.tokenBalance?.used || 0} トークン
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      最終チャージ: {billingSummary?.tokenBalance?.lastChargeDate ?
                        new Date(billingSummary.tokenBalance.lastChargeDate).toLocaleDateString('ja-JP') :
                        '-'
                      }
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* トークン購入 */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  トークン購入
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setTokenChargeDialog(true)}
                >
                  トークンチャージ
                </Button>
              </Box>
              <Grid container spacing={2}>
                {tokenPackages.map((pkg) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pkg.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {pkg.name}
                        </Typography>
                        <Typography variant="h4" color="primary" gutterBottom>
                          ¥{pkg.price.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {pkg.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* 支払い方法 */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  支払い方法
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setPaymentMethodDialog(true)}
                >
                  支払い方法を追加
                </Button>
              </Box>
              <List>
                {billingSummary?.paymentMethods?.map((method) => (
                  <ListItem key={method.id}>
                    <CreditCardIcon sx={{ mr: 2 }} />
                    <ListItemText
                      primary={
                        method.type === PaymentMethodType.CREDIT_CARD ?
                          `${method.brand} •••• ${method.last4}` :
                          '銀行振込'
                      }
                      secondary={method.isDefault ? 'デフォルト' : ''}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" aria-label="edit">
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" aria-label="delete">
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* 請求書履歴 */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                請求書履歴
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>請求書番号</TableCell>
                      <TableCell>発行日</TableCell>
                      <TableCell>期限</TableCell>
                      <TableCell>金額</TableCell>
                      <TableCell>ステータス</TableCell>
                      <TableCell align="right">アクション</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices && invoices.length > 0 ? invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>
                          {new Date(invoice.issueDate).toLocaleDateString('ja-JP')}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.dueDate).toLocaleDateString('ja-JP')}
                        </TableCell>
                        <TableCell>¥{(invoice.totalAmount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={getInvoiceStatusLabel(invoice.status)}
                            color={getInvoiceStatusColor(invoice.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small">
                            <DownloadIcon />
                          </IconButton>
                          <IconButton size="small">
                            <PrintIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          請求書がありません
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* トークンチャージダイアログ */}
        <Dialog open={tokenChargeDialog} onClose={() => setTokenChargeDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>トークンチャージ</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
              <InputLabel>パッケージを選択</InputLabel>
              <Select
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value)}
                label="パッケージを選択"
              >
                {tokenPackages.map((pkg) => (
                  <MenuItem key={pkg.id} value={pkg.id}>
                    {pkg.name} - ¥{pkg.price.toLocaleString()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="subtitle2" gutterBottom>
              カード情報
            </Typography>
            <TextField
              fullWidth
              label="カード番号"
              value={cardData.number}
              onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="有効期限（月）"
                  placeholder="MM"
                  value={cardData.exp_month}
                  onChange={(e) => setCardData({ ...cardData, exp_month: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="有効期限（年）"
                  placeholder="YY"
                  value={cardData.exp_year}
                  onChange={(e) => setCardData({ ...cardData, exp_year: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="セキュリティコード"
              value={cardData.cvv}
              onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
              sx={{ mt: 2, mb: 2 }}
            />
            <TextField
              fullWidth
              label="カード名義人"
              value={cardData.holder_name}
              onChange={(e) => setCardData({ ...cardData, holder_name: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTokenChargeDialog(false)}>キャンセル</Button>
            <Button 
              onClick={handleTokenCharge} 
              variant="contained" 
              color="primary"
              disabled={processing || !selectedPackage}
            >
              {processing ? <CircularProgress size={24} /> : '購入する'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* プラン変更ダイアログ */}
        <Dialog open={changePlanDialog} onClose={() => setChangePlanDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>プラン変更</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {subscriptionPlans && Object.entries(subscriptionPlans).map(([key, plan]: [string, any]) => (
                <Grid size={{ xs: 12, md: 4 }} key={key}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedPlan === key ? 2 : 1,
                      borderColor: selectedPlan === key ? 'primary.main' : 'divider',
                    }}
                    onClick={() => setSelectedPlan(key)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {plan.name}
                      </Typography>
                      <Typography variant="h4" color="primary" gutterBottom>
                        ¥{plan.monthlyPrice.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        月額（税別）
                      </Typography>
                      <List dense>
                        {plan.features.map((feature: string, index: number) => (
                          <ListItem key={index}>
                            <ListItemText primary={`• ${feature}`} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChangePlanDialog(false)}>キャンセル</Button>
            <Button 
              onClick={handlePlanChange} 
              variant="contained" 
              color="primary"
              disabled={processing || !selectedPlan || selectedPlan === billingSummary?.subscription?.planType}
            >
              {processing ? <CircularProgress size={24} /> : 'プラン変更'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 支払い方法追加ダイアログ */}
        <Dialog open={paymentMethodDialog} onClose={() => setPaymentMethodDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>支払い方法を追加</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mt: 2 }}>
              この機能は現在開発中です。
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentMethodDialog(false)}>閉じる</Button>
          </DialogActions>
        </Dialog>

        {/* 成功メッセージ */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage('')}
          message={successMessage}
        />
      </Box>
    </AdminLayout>
  );
};

export default AdminBillingPage;