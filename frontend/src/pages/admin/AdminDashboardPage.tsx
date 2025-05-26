import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  Chip,
  LinearProgress,
  Checkbox,
  Stack,
  Divider,
  Grid,
} from '@mui/material';
import {
  Event as EventIcon,
  People as PeopleIcon,
  ContentCut as ContentCutIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
// import { Line, Bar } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   ChartOptions,
// } from 'chart.js';
// 要素ごとの色を返す関数
const getElementColor = (element: string): string => {
  switch (element) {
    case '木': return '#4caf50';
    case '火': return '#f44336';
    case '土': return '#ff9800';
    case '金': return '#9e9e9e';
    case '水': return '#2196f3';
    default: return '#757575';
  }
};

// 要素ごとの背景色を返す関数（薄い色）
const getElementBgColor = (element: string): string => {
  switch (element) {
    case '木': return '#e8f5e9';
    case '火': return '#ffebee';
    case '土': return '#fff3e0';
    case '金': return '#f5f5f5';
    case '水': return '#e3f2fd';
    default: return '#f5f5f5';
  }
};
import { dashboardService } from '../../services';
import type { DashboardSummary } from '../../types';

// ページID: A-001

// Chart.js の設定
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// スタイル付きコンポーネント
const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fce4ec',
  color: theme.palette.primary.main,
}));

const ChartCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  height: '100%',
}));

const TaskCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  marginTop: theme.spacing(3),
}));

const ElementChip = styled(Chip)<{ element: string }>(({ element }) => ({
  backgroundColor: getElementBgColor(element),
  color: getElementColor(element),
  fontWeight: 500,
  fontSize: '12px',
}));

const QuickAccessCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  cursor: 'pointer',
  transition: 'all 0.3s',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
  },
}));

const AdminDashboardPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('今月');
  const [checkedTasks, setCheckedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await dashboardService.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('ダッシュボードデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // チャートオプション（Chart.jsが必要）
  // const chartOptions: any = {
  //   responsive: true,
  //   maintainAspectRatio: false,
  //   plugins: {
  //     legend: {
  //       position: 'top' as const,
  //     },
  //     tooltip: {
  //       callbacks: {
  //         label: (context: any) => {
  //           return `${context.dataset.label}: ${context.raw?.toLocaleString()} トークン`;
  //         },
  //       },
  //     },
  //   },
  //   scales: {
  //     y: {
  //       beginAtZero: true,
  //       title: {
  //         display: true,
  //         text: 'トークン数',
  //       },
  //     },
  //   },
  // };

  // チャートデータ（Chart.jsが必要）
  // const chartData = {
  //   labels: mockTokenUsageChartData[0].data.map(d => d.label),
  //   datasets: [
  //     {
  //       type: 'bar' as const,
  //       label: mockTokenUsageChartData[0].label,
  //       data: mockTokenUsageChartData[0].data.map(d => d.value),
  //       backgroundColor: mockTokenUsageChartData[0].backgroundColor,
  //       borderColor: mockTokenUsageChartData[0].borderColor,
  //       borderWidth: 1,
  //     },
  //     {
  //       type: 'line' as const,
  //       label: mockTokenUsageChartData[1].label,
  //       data: mockTokenUsageChartData[1].data.map(d => d.value),
  //       backgroundColor: mockTokenUsageChartData[1].backgroundColor,
  //       borderColor: mockTokenUsageChartData[1].borderColor,
  //       borderWidth: 2,
  //       pointRadius: 2,
  //     },
  //   ],
  // };

  const handleTaskCheck = (taskId: string) => {
    setCheckedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleAssignAll = () => {
    console.log('すべての予約を割り当て');
  };

  const quickAccessItems = [
    { icon: <PeopleIcon />, text: 'クライアント管理', color: '#ec407a', path: '/admin/clients' },
    { icon: <AssignmentIcon />, text: 'データインポート', color: '#ab47bc', path: '/admin/import' },
    { icon: <ContentCutIcon />, text: 'スタイリスト管理', color: '#29b6f6', path: '/admin/stylists' },
    { icon: <EventIcon />, text: '予約・担当管理', color: '#26a69a', path: '/admin/appointments' },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!dashboardStats) {
    return null;
  }

  return (
      <Box sx={{ flexGrow: 1 }}>
        {/* ヘッダー */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" color="primary">
            ダッシュボード
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('ja-JP', { 
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </Typography>
        </Box>

        {/* 統計カード */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      本日の予約数
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight={600}>
                      {dashboardStats.todayAppointments}
                    </Typography>
                  </Box>
                  <IconWrapper>
                    <EventIcon />
                  </IconWrapper>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      全クライアント数
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight={600}>
                      {dashboardStats.totalClients}
                    </Typography>
                  </Box>
                  <IconWrapper>
                    <PeopleIcon />
                  </IconWrapper>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      スタイリスト数
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight={600}>
                      {dashboardStats.totalStylists}
                    </Typography>
                  </Box>
                  <IconWrapper>
                    <ContentCutIcon />
                  </IconWrapper>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatsCard>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      今週の施術完了数
                    </Typography>
                    <Typography variant="h4" component="div" fontWeight={600}>
                      {dashboardStats.weeklyCompletedAppointments}
                    </Typography>
                  </Box>
                  <IconWrapper>
                    <CheckCircleIcon />
                  </IconWrapper>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
        </Grid>

        {/* チャートセクション */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <ChartCard>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">GPT-4oトークン使用状況</Typography>
                  <FormControl size="small">
                    <Select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                    >
                      <MenuItem value="今月">今月</MenuItem>
                      <MenuItem value="先月">先月</MenuItem>
                      <MenuItem value="過去3ヶ月">過去3ヶ月</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box height={250}>
                  {/* <Bar data={chartData} options={chartOptions} /> */}
                  <Typography color="text.secondary" align="center" sx={{ mt: 10 }}>
                    チャート表示にはchart.jsのインストールが必要です
                  </Typography>
                </Box>
              </CardContent>
            </ChartCard>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <ChartCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  月間使用量サマリー
                </Typography>
                <Box mt={3}>
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight={500}>
                        使用量
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {dashboardStats.monthlyTokenUsage.used.toLocaleString()} / {dashboardStats.monthlyTokenUsage.limit.toLocaleString()}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={dashboardStats.monthlyTokenUsage.percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#ec407a',
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" textAlign="right" mt={0.5}>
                      残り {(dashboardStats.monthlyTokenUsage.limit - dashboardStats.monthlyTokenUsage.used).toLocaleString()} トークン
                    </Typography>
                  </Box>

                  <Stack spacing={1.5} mb={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        プラン上限
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {dashboardStats.monthlyTokenUsage.limit.toLocaleString()} トークン/月
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        更新日
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        2025/05/01
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      backgroundColor: '#f8bbd0',
                      color: '#c2185b',
                      '&:hover': {
                        backgroundColor: '#f48fb1',
                      },
                    }}
                  >
                    プランアップグレード
                  </Button>
                </Box>
              </CardContent>
            </ChartCard>
          </Grid>
        </Grid>

        {/* 未担当予約リスト */}
        <TaskCard>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6">本日の未担当予約</Typography>
                <Chip
                  label={dashboardStats.unassignedAppointmentsCount}
                  color="error"
                  size="small"
                />
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={handleAssignAll}
              >
                すべて割り当て
              </Button>
            </Box>

            <Stack spacing={0} divider={<Divider />}>
              {(dashboardStats.unassignedAppointments || []).map((appointment) => (
                <Box
                  key={appointment.id}
                  display="flex"
                  alignItems="center"
                  py={1.5}
                >
                  <Checkbox
                    checked={checkedTasks.includes(appointment.id)}
                    onChange={() => handleTaskCheck(appointment.id)}
                    sx={{ mr: 1 }}
                  />
                  <Box flex={1}>
                    <Typography variant="body1" fontWeight={500}>
                      {appointment.clientName} 様 - {appointment.serviceType}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {appointment.startTime} - {appointment.endTime}
                    </Typography>
                  </Box>
                  <ElementChip
                    label={appointment.element}
                    element={appointment.element}
                    size="small"
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </TaskCard>

        {/* クイックアクセス */}
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            クイックアクセス
          </Typography>
          <Grid container spacing={2}>
            {quickAccessItems.map((item, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <QuickAccessCard>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      backgroundColor: item.color,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="body2" fontWeight={500}>
                    {item.text}
                  </Typography>
                </QuickAccessCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
  );
};

export default AdminDashboardPage;