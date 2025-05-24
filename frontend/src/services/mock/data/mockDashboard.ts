import type { 
  DashboardSummary, 
  TokenUsageDetail,
  UnassignedAppointment,
  ChartDataset
} from '../../../types';

// ダッシュボード概要データ
export const mockDashboardSummary: DashboardSummary = {
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

// トークン使用状況詳細データ
export const mockTokenUsageDetails: TokenUsageDetail[] = [
  { date: '4/1', usage: 5200, dailyTarget: 3333 },
  { date: '4/5', usage: 7800, dailyTarget: 3333 },
  { date: '4/10', usage: 12400, dailyTarget: 3333 },
  { date: '4/15', usage: 9600, dailyTarget: 3333 },
  { date: '4/20', usage: 14500, dailyTarget: 3333 },
  { date: '4/25', usage: 8740, dailyTarget: 3333 },
  { date: '4/26', usage: 5000, dailyTarget: 3333 },
];

// チャート用データセット
export const mockTokenUsageChartData: ChartDataset[] = [
  {
    label: 'トークン使用量',
    data: mockTokenUsageDetails.map(detail => ({
      label: detail.date,
      value: detail.usage,
    })),
    backgroundColor: '#ec407a',
    borderColor: '#ec407a',
  },
  {
    label: '日割り目安',
    data: mockTokenUsageDetails.map(detail => ({
      label: detail.date,
      value: detail.dailyTarget || 0,
    })),
    backgroundColor: 'transparent',
    borderColor: '#26a69a',
  },
];

// 未担当予約データ
export const mockUnassignedAppointments: UnassignedAppointment[] = [
  {
    id: 'app-001',
    clientName: '佐藤 美咲',
    serviceType: 'カット・カラー',
    startTime: '11:00',
    endTime: '12:30',
    element: '火',
  },
  {
    id: 'app-002',
    clientName: '田中 裕子',
    serviceType: 'パーマ・トリートメント',
    startTime: '13:30',
    endTime: '15:30',
    element: '土',
  },
  {
    id: 'app-003',
    clientName: '山本 健太',
    serviceType: 'メンズカット',
    startTime: '16:00',
    endTime: '16:45',
    element: '金',
  },
];

// 五行要素から色を取得するヘルパー関数
export const getElementColor = (element: string): string => {
  const colorMap: { [key: string]: string } = {
    '水': '#1976d2',
    '木': '#2e7d32',
    '火': '#c62828',
    '土': '#ef6c00',
    '金': '#757575',
  };
  return colorMap[element] || '#757575';
};

// 五行要素から背景色を取得するヘルパー関数
export const getElementBgColor = (element: string): string => {
  const bgColorMap: { [key: string]: string } = {
    '水': '#e3f2fd',
    '木': '#e8f5e9',
    '火': '#ffebee',
    '土': '#fff3e0',
    '金': '#f5f5f5',
  };
  return bgColorMap[element] || '#f5f5f5';
};