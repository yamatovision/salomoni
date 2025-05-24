import React, { useState } from 'react';
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
import type {
  Invoice,
  PaymentMethod,
  TokenPackageDetail,
} from '../../types';
import {
  OrganizationPlan,
  TokenPackage,
  InvoiceStatus,
  PaymentMethodType,
} from '../../types';

// モックデータ
const mockPlanInfo = {
  plan: OrganizationPlan.PROFESSIONAL,
  monthlyFee: 18000,
  taxIncludedFee: 19800,
  renewalDate: new Date('2025-05-31'),
  nextBillingDate: new Date('2025-05-01'),
};

const mockTokenBalance = {
  current: 250,
  used: 750,
  total: 1000,
  lastChargeDate: new Date('2025-04-15'),
};

const mockTokenPackages: any[] = [
  {
    id: '1',
    package: TokenPackage.STANDARD,
    amount: 100,
    price: 10000,
    bonusTokens: 0,
    description: '100トークン',
  },
  {
    id: '2',
    package: TokenPackage.STANDARD,
    amount: 500,
    price: 48000,
    bonusTokens: 25,
    description: '500トークン + ボーナス25トークン',
  },
  {
    id: '3',
    package: TokenPackage.PREMIUM,
    amount: 1000,
    price: 95000,
    bonusTokens: 50,
    description: '1000トークン + ボーナス50トークン',
  },
];

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    organizationId: 'org_1',
    type: PaymentMethodType.CREDIT_CARD,
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
    createdAt: new Date('2025-01-15'),
  },
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv_001',
    invoiceNumber: 'SLM-2025-04-001',
    organizationId: 'org_1',
    amount: 19800,
    tax: 1800,
    subtotal: 18000,
    total: 19800,
    totalAmount: 19800,
    issueDate: new Date('2025-04-01'),
    status: InvoiceStatus.PAID,
    dueDate: new Date('2025-04-30'),
    paidAt: new Date('2025-04-28'),
    items: [],
    billingPeriod: { start: new Date('2025-04-01'), end: new Date('2025-04-30') },
    type: 'subscription' as 'subscription',
    paymentMethodId: '1', // Mock payment method ID
    createdAt: new Date('2025-04-01'),
    updatedAt: new Date('2025-04-28'),
  },
  {
    id: 'inv_002',
    invoiceNumber: 'SLM-2025-03-001',
    organizationId: 'org_1',
    amount: 19800,
    tax: 1800,
    subtotal: 18000,
    total: 19800,
    totalAmount: 19800,
    issueDate: new Date('2025-03-01'),
    status: InvoiceStatus.PAID,
    dueDate: new Date('2025-03-31'),
    paidAt: new Date('2025-03-28'),
    items: [],
    billingPeriod: { start: new Date('2025-03-01'), end: new Date('2025-03-31') },
    type: 'subscription' as 'subscription',
    paymentMethodId: '1', // Mock payment method ID
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2025-03-28'),
  },
];

const AdminBillingPage: React.FC = () => {
  const [tokenPurchaseOpen, setTokenPurchaseOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackageDetail | null>(null);
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(mockPaymentMethods[0]?.id || '');

  const handleTokenPurchase = (pkg: TokenPackageDetail) => {
    setSelectedPackage(pkg);
    setTokenPurchaseOpen(true);
  };

  const handleTokenPurchaseConfirm = () => {
    // 実際にはAPIを呼び出してトークンを購入
    console.log('トークン購入:', selectedPackage);
    setTokenPurchaseOpen(false);
    setSelectedPackage(null);
  };

  const handlePaymentMethodAdd = () => {
    setPaymentMethodOpen(true);
  };

  const handleInvoiceDownload = (invoice: Invoice) => {
    // 実際にはAPIを呼び出して請求書をダウンロード
    console.log('請求書ダウンロード:', invoice.invoiceNumber);
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

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom color="primary">
          請求・プラン管理
        </Typography>

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
                    {getPlanName(mockPlanInfo.plan)}
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="月額料金"
                        secondary={`¥${mockPlanInfo.monthlyFee.toLocaleString()} (税込 ¥${mockPlanInfo.taxIncludedFee.toLocaleString()})`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="次回更新日"
                        secondary={mockPlanInfo.renewalDate.toLocaleDateString('ja-JP')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="次回請求日"
                        secondary={mockPlanInfo.nextBillingDate.toLocaleDateString('ja-JP')}
                      />
                    </ListItem>
                  </List>
                  <Box sx={{ mt: 2 }}>
                    <Button variant="outlined" color="primary" fullWidth>
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
                    {mockTokenBalance.current}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                    / {mockTokenBalance.total} トークン
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      使用済み: {mockTokenBalance.used} トークン
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      最終チャージ: {mockTokenBalance.lastChargeDate.toLocaleDateString('ja-JP')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* トークン購入 */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  トークン購入
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {mockTokenPackages.map((pkg) => (
                  <Grid key={pkg.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h5" color="primary" gutterBottom>
                          {pkg.amount}トークン
                        </Typography>
                        {pkg.bonusTokens > 0 && (
                          <Chip
                            label={`+${pkg.bonusTokens}ボーナス`}
                            color="secondary"
                            size="small"
                            sx={{ mb: 2 }}
                          />
                        )}
                        <Typography variant="h4" gutterBottom>
                          ¥{pkg.price.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {pkg.description}
                        </Typography>
                        <Button
                          variant="contained"
                          fullWidth
                          sx={{ mt: 2 }}
                          onClick={() => handleTokenPurchase(pkg)}
                        >
                          購入する
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* 支払い方法 */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  支払い方法
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handlePaymentMethodAdd}
                >
                  追加
                </Button>
              </Box>
              <List>
                {mockPaymentMethods.map((method) => (
                  <ListItem key={method.id}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CreditCardIcon />
                          <Typography>
                            VISA •••• {method.last4}
                          </Typography>
                          {method.isDefault && (
                            <Chip label="デフォルト" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={`有効期限: ${method.expiryMonth}/${method.expiryYear}`}
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

          {/* 請求履歴 */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  請求履歴
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>請求書番号</TableCell>
                      <TableCell>請求期間</TableCell>
                      <TableCell>種別</TableCell>
                      <TableCell align="right">金額</TableCell>
                      <TableCell>ステータス</TableCell>
                      <TableCell>支払日</TableCell>
                      <TableCell align="center">アクション</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>
                          {invoice.billingPeriod?.start.toLocaleDateString('ja-JP')} - {invoice.billingPeriod?.end.toLocaleDateString('ja-JP')}
                        </TableCell>
                        <TableCell>
                          {invoice.type === 'subscription' ? '月額プラン' : 'トークン購入'}
                        </TableCell>
                        <TableCell align="right">
                          ¥{invoice.totalAmount?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getInvoiceStatusLabel(invoice.status)}
                            color={getInvoiceStatusColor(invoice.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {invoice.paidAt ? invoice.paidAt.toLocaleDateString('ja-JP') : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleInvoiceDownload(invoice)}
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton size="small">
                            <PrintIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* トークン購入確認ダイアログ */}
        <Dialog open={tokenPurchaseOpen} onClose={() => setTokenPurchaseOpen(false)}>
          <DialogTitle>トークン購入確認</DialogTitle>
          <DialogContent>
            {selectedPackage && (
              <Box sx={{ py: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedPackage.amount}トークン
                  {(selectedPackage.bonusTokens ?? 0) > 0 && ` (+${selectedPackage.bonusTokens}ボーナス)`}
                </Typography>
                <Typography variant="h5" color="primary" gutterBottom>
                  ¥{selectedPackage.price.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedPackage.description}
                </Typography>
                <FormControl fullWidth sx={{ mt: 3 }}>
                  <InputLabel>支払い方法</InputLabel>
                  <Select
                    value={selectedPaymentMethod}
                    label="支払い方法"
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  >
                    {mockPaymentMethods.map((method) => (
                      <MenuItem key={method.id} value={method.id}>
                        VISA •••• {method.last4}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTokenPurchaseOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={handleTokenPurchaseConfirm}
              disabled={!selectedPaymentMethod}
            >
              購入する
            </Button>
          </DialogActions>
        </Dialog>

        {/* 支払い方法追加ダイアログ */}
        <Dialog open={paymentMethodOpen} onClose={() => setPaymentMethodOpen(false)}>
          <DialogTitle>支払い方法の追加</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              実装予定：クレジットカード情報の入力フォームがここに表示されます。
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentMethodOpen(false)}>
              キャンセル
            </Button>
            <Button variant="contained" disabled>
              追加する
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default AdminBillingPage;