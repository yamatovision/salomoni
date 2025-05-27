import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
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
  CircularProgress,
  Snackbar,
} from '@mui/material';
import Grid from '@mui/material/Grid';
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
  RevenueSimulationData,
} from '../../types';
import {
  OrganizationPlan,
  InvoiceStatus,
} from '../../types';
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
import { planService, type Plan } from '../../services/api/plans';
import { BillingService } from '../../services/api/billing';
import { RevenueSimulator, defaultSimulationParams } from '../../utils/revenueSimulation';

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
  
  // API データ管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tokenPlans, setTokenPlans] = useState<Plan[]>([]);
  const [simulationData, setSimulationData] = useState<RevenueSimulationData | null>(null);
  const [simulator, setSimulator] = useState<RevenueSimulator | null>(null);
  const [simulationParams, setSimulationParams] = useState(defaultSimulationParams);
  
  const billingService = new BillingService();
  
  // データ取得
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // プラン一覧を取得
      const [subscriptionPlans, tokenPackPlans, simData] = await Promise.all([
        planService.getPlans({ type: 'subscription', isActive: true }),
        planService.getPlans({ type: 'token_pack', isActive: true }),
        billingService.getSimulationData(),
      ]);
      
      setPlans(subscriptionPlans.plans);
      setTokenPlans(tokenPackPlans.plans);
      setSimulationData(simData);
      setSimulator(new RevenueSimulator(simData));
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  

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

  const handleTogglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      await planService.updatePlan(planId, { isActive: !currentStatus });
      setSuccessMessage(`プランのステータスを${!currentStatus ? '有効' : '無効'}にしました`);
      loadData();
    } catch (err) {
      console.error('プランステータス更新エラー:', err);
      setError('プランのステータス更新に失敗しました');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  };

  // 収益シミュレーショングラフのデータを生成
  const getChartData = () => {
    if (!simulationData || !simulator) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // シミュレーション結果を取得
    const result = simulator.simulate(simulationParams);
    
    return {
      labels: result.projectedRevenue.map(item => item.month),
      datasets: [
        {
          label: 'サブスクリプション収益',
          data: result.projectedRevenue.map(item => item.subscriptionRevenue),
          borderColor: '#F26A8D',
          backgroundColor: 'rgba(242, 106, 141, 0.1)',
          tension: 0.4,
        },
        {
          label: 'トークン販売収益',
          data: result.projectedRevenue.map(item => item.tokenRevenue),
          borderColor: '#90caf9',
          backgroundColor: 'rgba(144, 202, 249, 0.1)',
          tension: 0.4,
        },
        {
          label: '合計収益',
          data: result.projectedRevenue.map(item => item.revenue),
          borderColor: '#66bb6a',
          backgroundColor: 'rgba(102, 187, 106, 0.1)',
          tension: 0.4,
        },
      ],
    };
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : simulationData && simulator ? (
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
                            月間収益実績
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: '#F26A8D', fontWeight: 'bold' }}>
                          {formatCurrency(
                            simulationData.revenueHistory?.[simulationData.revenueHistory.length - 1]?.revenue || 0
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          サブスク: {formatCurrency(
                            simulationData.revenueHistory?.[simulationData.revenueHistory.length - 1]?.subscriptionRevenue || 0
                          )}
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
                          {simulationData.currentOrganizations?.active || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          新規: {simulationData.growthMetrics?.averageNewOrganizations || 0}/月平均
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
                          {formatCurrency(
                            simulationData.revenueHistory?.[simulationData.revenueHistory.length - 1]?.tokenRevenue || 0
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          月間使用量: {simulationData.tokenMetrics?.monthlyUsageStats?.[0]?.usage.toLocaleString() || '0'}
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
                            平均解約率
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                          {simulationData.growthMetrics?.averageChurnRate || simulationData.growthMetrics?.churnRate || 0}%
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
                <Line data={getChartData()} options={chartOptions} />
              </Paper>
            </Grid>

            {/* プラン分布 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>プラン分布</Typography>
                <List>
                  {Object.entries(simulationData.currentOrganizations?.byPlan || {}).map(([plan, percentage]) => (
                    <ListItem key={plan}>
                      <ListItemText 
                        primary={
                          plan === OrganizationPlan.STANDARD ? 'ベーシックプラン' :
                          plan === OrganizationPlan.PROFESSIONAL ? 'スタンダードプラン' :
                          plan === OrganizationPlan.ENTERPRISE ? 'プレミアムプラン' : plan
                        }
                        secondary={`${percentage}%`}
                      />
                      <Box sx={{ width: 100, ml: 2 }}>
                        <Box sx={{ 
                          height: 8, 
                          bgcolor: '#e0e0e0', 
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}>
                          <Box sx={{ 
                            width: `${percentage}%`,
                            height: '100%',
                            bgcolor: 
                              plan === OrganizationPlan.STANDARD ? '#F26A8D' :
                              plan === OrganizationPlan.PROFESSIONAL ? '#2196f3' :
                              '#4caf50',
                          }} />
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
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
                      value={simulationParams.newOrganizationsPerMonth}
                      onChange={(e) => setSimulationParams({
                        ...simulationParams,
                        newOrganizationsPerMonth: Number(e.target.value),
                      })}
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
                      value={simulationParams.churnRate}
                      onChange={(e) => setSimulationParams({
                        ...simulationParams,
                        churnRate: Number(e.target.value),
                      })}
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
                      value={simulationParams.averageTokenPurchase}
                      onChange={(e) => setSimulationParams({
                        ...simulationParams,
                        averageTokenPurchase: Number(e.target.value),
                      })}
                      InputProps={{
                        endAdornment: <Typography variant="body2">円/組織</Typography>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      成長率: {simulationParams.growthRatePercent}%/月
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
          ) : null}
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
            {plans.map((plan) => (
              <Grid size={{ xs: 12, md: 4 }} key={plan._id || plan.id}>
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
                      {plan.name}
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
                        <ListItemText primary={`最大${plan.limits?.stylists || 0}名のスタイリスト`} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <GroupIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={`最大${plan.limits?.clients || 0}名のクライアント`} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <TokenIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={`月間${(plan.limits?.tokensPerMonth || 0).toLocaleString()}トークン`} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {Array.isArray(plan.features) && plan.features.includes('customBranding') ? (
                            <CheckCircleIcon fontSize="small" color="success" />
                          ) : (
                            <CancelIcon fontSize="small" color="disabled" />
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary="カスタムブランディング"
                          primaryTypographyProps={{
                            color: Array.isArray(plan.features) && plan.features.includes('customBranding') ? 'text.primary' : 'text.disabled',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {Array.isArray(plan.features) && plan.features.includes('apiAccess') ? (
                            <CheckCircleIcon fontSize="small" color="success" />
                          ) : (
                            <CancelIcon fontSize="small" color="disabled" />
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary="API連携"
                          primaryTypographyProps={{
                            color: Array.isArray(plan.features) && plan.features.includes('apiAccess') ? 'text.primary' : 'text.disabled',
                          }}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                  <CardActions>
                    <IconButton onClick={() => handleEditPlan(plan as any)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleTogglePlanStatus(plan._id || plan.id, plan.isActive)}>
                      {plan.isActive ? <VisibilityIcon /> : <VisibilityIcon color="disabled" />}
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
            {tokenPlans.map((plan) => (
              <Grid size={{ xs: 12, md: 4 }} key={plan._id || plan.id}>
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
                      {plan.name}
                    </Typography>
                    <Typography variant="h3" sx={{ color: '#4caf50', mb: 2 }}>
                      {formatCurrency(plan.price)}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {(plan.tokenAmount || 0).toLocaleString()}トークン
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
                    <IconButton onClick={() => handleEditTokenPlan(plan as any)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleTogglePlanStatus(plan._id || plan.id, plan.isActive)}>
                      {plan.isActive ? <VisibilityIcon /> : <VisibilityIcon color="disabled" />}
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* 請求管理 */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: 400,
            flexDirection: 'column',
            gap: 2
          }}>
            <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary">
              請求管理機能は現在開発中です
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 500 }}>
              SuperAdmin向けの請求管理APIはまだ実装されていません。
              各組織の請求書は組織のOwner権限で確認できます。
            </Typography>
          </Box>
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
              defaultValue={selectedPlan?.name}
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
              defaultValue={selectedTokenPlan?.name}
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

      {/* 成功メッセージ */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}