import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';

// Chart.jsのコンポーネントを一度だけ登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// グローバルなデフォルト設定
ChartJS.defaults.font.family = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
ChartJS.defaults.font.size = 12;
ChartJS.defaults.color = '#374151';
ChartJS.defaults.plugins.legend.display = true;
ChartJS.defaults.plugins.legend.position = 'bottom';

// 共通のチャートオプション
export const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 15,
        usePointStyle: true,
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      bodySpacing: 8,
      titleSpacing: 8,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('ja-JP').format(context.parsed.y);
          }
          return label;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 11,
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        font: {
          size: 11,
        },
        callback: function(value: any) {
          return new Intl.NumberFormat('ja-JP').format(value);
        },
      },
    },
  },
};

// カラーパレット
export const chartColors = {
  primary: '#3B82F6',
  secondary: '#10B981',
  tertiary: '#F59E0B',
  quaternary: '#EF4444',
  quinary: '#8B5CF6',
  senary: '#EC4899',
  // 透明度付き
  primaryAlpha: 'rgba(59, 130, 246, 0.1)',
  secondaryAlpha: 'rgba(16, 185, 129, 0.1)',
  tertiaryAlpha: 'rgba(245, 158, 11, 0.1)',
  quaternaryAlpha: 'rgba(239, 68, 68, 0.1)',
  quinaryAlpha: 'rgba(139, 92, 246, 0.1)',
  senaryAlpha: 'rgba(236, 72, 153, 0.1)',
};

// エクスポート
export { ChartJS };