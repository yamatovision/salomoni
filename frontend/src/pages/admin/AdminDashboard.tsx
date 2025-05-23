import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Divider,
  Grid,
} from '@mui/material';
import {
  Event,
  People,
  ContentCut,
  CheckCircle,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useApi } from '../../hooks/useApi';
import type { DashboardSummary, UnassignedAppointment } from '../../types';
import { logger } from '../../utils/logger';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

// Chart.js登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactElement;
  color?: string;
}

const MetricCard = ({ title, value, icon, color = 'primary.main' }: MetricCardProps) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom sx={{ fontSize: 16, fontWeight: 500 }}>
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {value}
          </Typography>
        </Box>
        <Avatar
          sx={{
            bgcolor: `${color}15`,
            color: color,
            width: 48,
            height: 48,
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const ElementChip = ({ element }: { element: string }) => {
  const elementStyles = {
    '火': { bgcolor: '#ffebee', color: '#c62828' },
    '水': { bgcolor: '#e3f2fd', color: '#1976d2' },
    '木': { bgcolor: '#e8f5e9', color: '#2e7d32' },
    '土': { bgcolor: '#fff3e0', color: '#ef6c00' },
    '金': { bgcolor: '#f5f5f5', color: '#757575' },
  };

  const style = elementStyles[element as keyof typeof elementStyles] || elementStyles['金'];

  return (
    <Chip
      label={element}
      size="small"
      sx={{ ...style, fontWeight: 500 }}
    />
  );
};

export const AdminDashboard = () => {
  const {  } = useApi();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [unassignedAppointments, setUnassignedAppointments] = useState<UnassignedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenPeriod, setTokenPeriod] = useState('current');
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      logger.info('Fetching dashboard data', {
        component: 'AdminDashboard',
        action: 'fetchDashboardData',
      });

      setLoading(true);

      // 実際のAPIコールを置き換えてモックデータを使用
      // TODO: バックエンドAPI実装後に実際のAPIコールに変更
      const mockSummary: DashboardSummary = {
        todayAppointments: 15,
        totalClients: 485,
        totalStylists: 8,
        weeklyCompletedAppointments: 62,
        monthlyTokenUsage: {
          used: 63240,
          limit: 100000,
          percentage: 63.24,
        },
        unassignedAppointmentsCount: 3,
      };

      const mockUnassigned: UnassignedAppointment[] = [
        {
          id: '1',
          clientName: '佐藤 美咲',
          serviceType: 'カット・カラー',
          startTime: '11:00',
          endTime: '12:30',
          element: '火',
        },
        {
          id: '2',
          clientName: '田中 裕子',
          serviceType: 'パーマ・トリートメント',
          startTime: '13:30',
          endTime: '15:30',
          element: '土',
        },
        {
          id: '3',
          clientName: '山本 健太',
          serviceType: 'メンズカット',
          startTime: '16:00',
          endTime: '16:45',
          element: '金',
        },
      ];

      setSummary(mockSummary);
      setUnassignedAppointments(mockUnassigned);

      logger.info('Dashboard data fetched successfully', {
        component: 'AdminDashboard',
        action: 'fetchDashboardData',
      });
    } catch (error) {
      logger.error('Failed to fetch dashboard data', error as Error, {
        component: 'AdminDashboard',
        action: 'fetchDashboardData',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    setCheckedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const chartData = {
    labels: ['4/1', '4/5', '4/10', '4/15', '4/20', '4/25', '4/26'],
    datasets: [
      {
        label: 'トークン使用量',
        data: [5200, 7800, 12400, 9600, 14500, 8740, 5000],
        backgroundColor: '#ec407a',
        borderColor: '#ec407a',
        borderWidth: 1,
      },
      {
        label: '日割り目安',
        data: [3333, 3333, 3333, 3333, 3333, 3333, 3333],
        type: 'line' as const,
        backgroundColor: 'transparent',
        borderColor: '#26a69a',
        borderWidth: 2,
        pointBackgroundColor: '#26a69a',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 2,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.raw?.toLocaleString()} トークン`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'トークン数',
        },
      },
    },
  };

  const currentDate = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>
          ダッシュボード
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {currentDate}
        </Typography>
      </Box>

      {/* メトリクスカード */}
      <Grid container spacing={3} sx={{ mb: 3 }} {...{} as any}>
        <Grid item xs={12} sm={6} md={3} {...{} as any}>
          <MetricCard
            title="本日の予約数"
            value={summary?.todayAppointments || 0}
            icon={<Event />}
            color="#ec407a"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} {...{} as any}>
          <MetricCard
            title="全クライアント数"
            value={summary?.totalClients || 0}
            icon={<People />}
            color="#ab47bc"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} {...{} as any}>
          <MetricCard
            title="スタイリスト数"
            value={summary?.totalStylists || 0}
            icon={<ContentCut />}
            color="#29b6f6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} {...{} as any}>
          <MetricCard
            title="今週の施術完了数"
            value={summary?.weeklyCompletedAppointments || 0}
            icon={<CheckCircle />}
            color="#26a69a"
          />
        </Grid>
      </Grid>

      {/* チャートセクション */}
      <Grid container spacing={3} sx={{ mb: 3 }} {...{} as any}>
        <Grid item xs={12} md={8} {...{} as any}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  GPT-4oトークン使用状況
                </Typography>
                <FormControl size="small">
                  <Select
                    value={tokenPeriod}
                    onChange={(e) => setTokenPeriod(e.target.value)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="current">今月</MenuItem>
                    <MenuItem value="last">先月</MenuItem>
                    <MenuItem value="last3">過去3ヶ月</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ height: 250 }}>
                <Bar data={chartData as any} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4} {...{} as any}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 500, mb: 3 }}>
                月間使用量サマリー
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    使用量
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {summary?.monthlyTokenUsage.used.toLocaleString()} / {summary?.monthlyTokenUsage.limit.toLocaleString()}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={summary?.monthlyTokenUsage.percentage || 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'primary.main',
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                  残り {((summary?.monthlyTokenUsage.limit || 0) - (summary?.monthlyTokenUsage.used || 0)).toLocaleString()} トークン
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  プラン上限
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {summary?.monthlyTokenUsage.limit.toLocaleString()} トークン/月
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  更新日
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  2025/05/01
                </Typography>
              </Box>
              <Button
                fullWidth
                variant="contained"
                sx={{
                  bgcolor: 'secondary.light',
                  color: 'primary.dark',
                  '&:hover': {
                    bgcolor: 'secondary.main',
                  },
                }}
              >
                プランアップグレード
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 未担当予約リスト */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                本日の未担当予約
              </Typography>
              <Chip
                label={unassignedAppointments.length}
                size="small"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontWeight: 500,
                }}
              />
            </Box>
            <Button variant="outlined" color="primary">
              すべて割り当て
            </Button>
          </Box>
          <List>
            {unassignedAppointments.map((appointment) => (
              <ListItem
                key={appointment.id}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': {
                    borderBottom: 'none',
                  },
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    checked={checkedTasks.has(appointment.id)}
                    onChange={() => handleTaskToggle(appointment.id)}
                    sx={{
                      color: 'primary.main',
                      '&.Mui-checked': {
                        color: 'primary.main',
                      },
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={`${appointment.clientName} 様 - ${appointment.serviceType}`}
                  secondary={`${appointment.startTime} - ${appointment.endTime}`}
                  primaryTypographyProps={{
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                  secondaryTypographyProps={{
                    fontSize: 12,
                  }}
                />
                <ElementChip element={appointment.element} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};