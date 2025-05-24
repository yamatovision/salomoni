import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Group as GroupIcon,
  Token as TokenIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Assessment as AssessmentIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import type { 
  PlanDetail, 
  TokenPlan,
} from '../../types';
import {
  OrganizationPlan,
  InvoiceStatus,
} from '../../types';
import { 
  mockPlans, 
  mockTokenPlans, 
  mockRevenueSimulation,
  mockInvoices,
  mockBillingSummary,
} from '../../services/mock/data/mockPlans';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';

// Chart.js設定
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`plan-tabpanel-${index}`}
      aria-labelledby={`plan-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SuperAdminPlansPage() {
  const [tabValue, setTabValue] = useState(0);
  const [editPlanDialog, setEditPlanDialog] = useState(false);
  const [editTokenDialog, setEditTokenDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null);
  const [selectedTokenPlan, setSelectedTokenPlan] = useState<TokenPlan | null>(null);
  const [simulationPeriod, setSimulationPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditPlan = (plan: PlanDetail) => {
    setSelectedPlan(plan);
    setEditPlanDialog(true);
  };

  const handleEditTokenPlan = (plan: TokenPlan) => {
    setSelectedTokenPlan(plan);
    setEditTokenDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  };

  // 収益シミュレーショングラフのデータ
  const chartData = {
    labels: mockRevenueSimulation.breakdown.map(item => item.month),
    datasets: [
      {
        label: 'サブスクリプション収益',
        data: mockRevenueSimulation.breakdown.map(item => item.subscriptionRevenue),
        borderColor: '#F26A8D',
        backgroundColor: 'rgba(242, 106, 141, 0.1)',
        tension: 0.4,
      },
      {
        label: 'トークン販売収益',
        data: mockRevenueSimulation.breakdown.map(item => item.tokenRevenue),
        borderColor: '#90caf9',
        backgroundColor: 'rgba(144, 202, 249, 0.1)',
        tension: 0.4,
      },
      {
        label: '合計収益',
        data: mockRevenueSimulation.breakdown.map(item => item.totalRevenue),
        borderColor: '#66bb6a',
        backgroundColor: 'rgba(102, 187, 106, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '収益予測グラフ',
      },
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return formatCurrency(Number(value));
          },
        },
      },
    },
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ color: '#F26A8D', fontWeight: 'bold' }}>
          課金・プラン管理
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
            },
            '& .Mui-selected': {
              color: '#F26A8D',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#F26A8D',
            },
          }}
        >
          <Tab icon={<TrendingUpIcon />} label="収益シミュレーション" />
          <Tab icon={<CreditCardIcon />} label="プラン設定" />
          <Tab icon={<ReceiptIcon />} label="請求管理" />
        </Tabs>

        {/* 収益シミュレーション */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* サマリーカード */}
            <Grid size={{ xs: 12 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Card sx={{ bgcolor: '#fce4ec' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AttachMoneyIcon sx={{ color: '#F26A8D', mr: 1 }} />
                        <Typography color="text.secondary" variant="body2">
                          月間収益予測
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ color: '#F26A8D', fontWeight: 'bold' }}>
                        {formatCurrency(mockRevenueSimulation.projectedRevenue.total / 12)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        前月比 +{mockRevenueSimulation.projectedGrowth.growthRate}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Card sx={{ bgcolor: '#e3f2fd' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <GroupIcon sx={{ color: '#2196f3', mr: 1 }} />
                        <Typography color="text.secondary" variant="body2">
                          アクティブ組織数
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                        {mockRevenueSimulation.projectedGrowth.organizations}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        新規: +{mockRevenueSimulation.assumptions.newOrganizationsPerMonth}/月
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Card sx={{ bgcolor: '#e8f5e9' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TokenIcon sx={{ color: '#4caf50', mr: 1 }} />
                        <Typography color="text.secondary" variant="body2">
                          トークン売上
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                        {formatCurrency(mockRevenueSimulation.projectedRevenue.tokenSales / 12)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        平均購入額: {formatCurrency(mockRevenueSimulation.assumptions.averageTokenPurchase)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Card sx={{ bgcolor: '#fff3e0' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AssessmentIcon sx={{ color: '#ff9800', mr: 1 }} />
                        <Typography color="text.secondary" variant="body2">
                          解約率
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                        {mockRevenueSimulation.assumptions.churnRate}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        業界平均: 5.0%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* 収益グラフ */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">収益予測</Typography>
                  <TextField
                    select
                    size="small"
                    value={simulationPeriod}
                    onChange={(e) => setSimulationPeriod(e.target.value as any)}
                    sx={{ width: 150 }}
                  >
                    <MenuItem value="monthly">月次</MenuItem>
                    <MenuItem value="quarterly">四半期</MenuItem>
                    <MenuItem value="yearly">年次</MenuItem>
                  </TextField>
                </Box>
                <Line data={chartData} options={chartOptions} />
              </Paper>
            </Grid>

            {/* プラン分布 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>プラン分布</Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="ベーシックプラン"
                      secondary={`${mockRevenueSimulation.assumptions.planDistribution[OrganizationPlan.STANDARD]}%`}
                    />
                    <Box sx={{ width: 100, ml: 2 }}>
                      <Box sx={{ 
                        height: 8, 
                        bgcolor: '#e0e0e0', 
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}>
                        <Box sx={{ 
                          width: `${mockRevenueSimulation.assumptions.planDistribution[OrganizationPlan.STANDARD]}%`,
                          height: '100%',
                          bgcolor: '#F26A8D',
                        }} />
                      </Box>
                    </Box>
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="スタンダードプラン"
                      secondary={`${mockRevenueSimulation.assumptions.planDistribution[OrganizationPlan.PROFESSIONAL]}%`}
                    />
                    <Box sx={{ width: 100, ml: 2 }}>
                      <Box sx={{ 
                        height: 8, 
                        bgcolor: '#e0e0e0', 
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}>
                        <Box sx={{ 
                          width: `${mockRevenueSimulation.assumptions.planDistribution[OrganizationPlan.PROFESSIONAL]}%`,
                          height: '100%',
                          bgcolor: '#2196f3',
                        }} />
                      </Box>
                    </Box>
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="プレミアムプラン"
                      secondary={`${mockRevenueSimulation.assumptions.planDistribution[OrganizationPlan.ENTERPRISE]}%`}
                    />
                    <Box sx={{ width: 100, ml: 2 }}>
                      <Box sx={{ 
                        height: 8, 
                        bgcolor: '#e0e0e0', 
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}>
                        <Box sx={{ 
                          width: `${mockRevenueSimulation.assumptions.planDistribution[OrganizationPlan.ENTERPRISE]}%`,
                          height: '100%',
                          bgcolor: '#4caf50',
                        }} />
                      </Box>
                    </Box>
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            {/* シミュレーション設定 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>シミュレーション前提条件</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="月間新規組織数"
                      type="number"
                      defaultValue={mockRevenueSimulation.assumptions.newOrganizationsPerMonth}
                      InputProps={{
                        endAdornment: <Typography variant="body2">組織/月</Typography>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="解約率"
                      type="number"
                      defaultValue={mockRevenueSimulation.assumptions.churnRate}
                      InputProps={{
                        endAdornment: <Typography variant="body2">%</Typography>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="平均トークン購入額"
                      type="number"
                      defaultValue={mockRevenueSimulation.assumptions.averageTokenPurchase}
                      InputProps={{
                        endAdornment: <Typography variant="body2">円/組織</Typography>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      sx={{ 
                        bgcolor: '#F26A8D',
                        '&:hover': { bgcolor: '#E91E63' },
                      }}
                    >
                      シミュレーション再計算
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* プラン設定 */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">サブスクリプションプラン</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ 
                bgcolor: '#F26A8D',
                '&:hover': { bgcolor: '#E91E63' },
              }}
            >
              新規プラン追加
            </Button>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {mockPlans.filter(plan => !plan.isHidden).map((plan) => (
              <Grid size={{ xs: 12, md: 4 }} key={plan.id}>
                <Card sx={{ height: '100%', position: 'relative' }}>
                  {plan.isPopular && (
                    <Chip 
                      label="人気" 
                      color="error" 
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        top: 16, 
                        right: 16,
                        bgcolor: '#F26A8D',
                      }}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                      {plan.displayName}
                    </Typography>
                    <Typography variant="h3" sx={{ color: '#F26A8D', mb: 2 }}>
                      {formatCurrency(plan.price)}
                      <Typography component="span" variant="body2" color="text.secondary">
                        /月
                      </Typography>
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <List dense>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <GroupIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={`最大${plan.features.maxStylists}名のスタイリスト`} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <GroupIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={`最大${plan.features.maxClients}名のクライアント`} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <TokenIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={`月間${plan.features.monthlyTokens.toLocaleString()}トークン`} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {plan.features.customBranding ? (
                            <CheckCircleIcon fontSize="small" color="success" />
                          ) : (
                            <CancelIcon fontSize="small" color="disabled" />
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary="カスタムブランディング"
                          primaryTypographyProps={{
                            color: plan.features.customBranding ? 'text.primary' : 'text.disabled',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {plan.features.apiAccess ? (
                            <CheckCircleIcon fontSize="small" color="success" />
                          ) : (
                            <CancelIcon fontSize="small" color="disabled" />
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary="API連携"
                          primaryTypographyProps={{
                            color: plan.features.apiAccess ? 'text.primary' : 'text.disabled',
                          }}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                  <CardActions>
                    <IconButton onClick={() => handleEditPlan(plan)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton>
                      <VisibilityIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">トークン追加購入プラン</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ 
                bgcolor: '#F26A8D',
                '&:hover': { bgcolor: '#E91E63' },
              }}
            >
              新規トークンプラン追加
            </Button>
          </Box>

          <Grid container spacing={3}>
            {mockTokenPlans.map((plan) => (
              <Grid size={{ xs: 12, md: 4 }} key={plan.id}>
                <Card sx={{ height: '100%', position: 'relative' }}>
                  {plan.isPopular && (
                    <Chip 
                      label="おすすめ" 
                      color="error" 
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        top: 16, 
                        right: 16,
                        bgcolor: '#F26A8D',
                      }}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                      {plan.displayName}
                    </Typography>
                    <Typography variant="h3" sx={{ color: '#4caf50', mb: 2 }}>
                      {formatCurrency(plan.price)}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {plan.tokenAmount.toLocaleString()}トークン
                    </Typography>
                    {plan.savingsPercentage && plan.savingsPercentage > 0 && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        {plan.savingsPercentage}%お得！
                      </Alert>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {plan.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton onClick={() => handleEditTokenPlan(plan)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton>
                      <VisibilityIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* 請求管理 */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      今月の売上
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#F26A8D', fontWeight: 'bold' }}>
                      {formatCurrency(mockBillingSummary.totalRevenue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      未払い金額
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                      {formatCurrency(mockBillingSummary.outstandingAmount)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      延滞金額
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                      {formatCurrency(mockBillingSummary.overdueAmount)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      支払い成功率
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                      {mockBillingSummary.paymentSuccessRate}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          <Paper sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">請求書一覧</Typography>
              <TextField
                select
                size="small"
                defaultValue="all"
                sx={{ width: 200 }}
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value={InvoiceStatus.PAID}>支払済み</MenuItem>
                <MenuItem value={InvoiceStatus.SENT}>送信済み</MenuItem>
                <MenuItem value={InvoiceStatus.OVERDUE}>延滞</MenuItem>
              </TextField>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>請求書番号</TableCell>
                    <TableCell>組織名</TableCell>
                    <TableCell>種別</TableCell>
                    <TableCell>金額</TableCell>
                    <TableCell>発行日</TableCell>
                    <TableCell>支払期限</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>アクション</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        {mockBillingSummary.topOrganizations[0]?.organizationName || '組織名'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={invoice.type === 'subscription' ? 'サブスク' : 'トークン'} 
                          size="small"
                          color={invoice.type === 'subscription' ? 'primary' : 'success'}
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>{new Date(invoice.issueDate).toLocaleDateString('ja-JP')}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString('ja-JP')}</TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            invoice.status === InvoiceStatus.PAID ? '支払済み' :
                            invoice.status === InvoiceStatus.SENT ? '送信済み' :
                            invoice.status === InvoiceStatus.OVERDUE ? '延滞' : invoice.status
                          }
                          size="small"
                          color={
                            invoice.status === InvoiceStatus.PAID ? 'success' :
                            invoice.status === InvoiceStatus.OVERDUE ? 'error' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>
      </Paper>

      {/* プラン編集ダイアログ */}
      <Dialog 
        open={editPlanDialog} 
        onClose={() => setEditPlanDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>プラン編集</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="プラン名"
              defaultValue={selectedPlan?.displayName}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="月額料金"
              type="number"
              defaultValue={selectedPlan?.price}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="最大スタイリスト数"
              type="number"
              defaultValue={selectedPlan?.features.maxStylists}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="最大クライアント数"
              type="number"
              defaultValue={selectedPlan?.features.maxClients}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="月間トークン数"
              type="number"
              defaultValue={selectedPlan?.features.monthlyTokens}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={<Switch defaultChecked={selectedPlan?.features.customBranding} />}
              label="カスタムブランディング"
              sx={{ mb: 1 }}
            />
            <FormControlLabel
              control={<Switch defaultChecked={selectedPlan?.features.apiAccess} />}
              label="API連携"
              sx={{ mb: 1 }}
            />
            <FormControlLabel
              control={<Switch defaultChecked={selectedPlan?.isPopular} />}
              label="人気プランとして表示"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPlanDialog(false)}>キャンセル</Button>
          <Button 
            variant="contained"
            sx={{ 
              bgcolor: '#F26A8D',
              '&:hover': { bgcolor: '#E91E63' },
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* トークンプラン編集ダイアログ */}
      <Dialog 
        open={editTokenDialog} 
        onClose={() => setEditTokenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>トークンプラン編集</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="プラン名"
              defaultValue={selectedTokenPlan?.displayName}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="価格"
              type="number"
              defaultValue={selectedTokenPlan?.price}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="トークン数"
              type="number"
              defaultValue={selectedTokenPlan?.tokenAmount}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="割引率（%）"
              type="number"
              defaultValue={selectedTokenPlan?.savingsPercentage}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="説明"
              multiline
              rows={3}
              defaultValue={selectedTokenPlan?.description}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={<Switch defaultChecked={selectedTokenPlan?.isPopular} />}
              label="おすすめとして表示"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTokenDialog(false)}>キャンセル</Button>
          <Button 
            variant="contained"
            sx={{ 
              bgcolor: '#F26A8D',
              '&:hover': { bgcolor: '#E91E63' },
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}