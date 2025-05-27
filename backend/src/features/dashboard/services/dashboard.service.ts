import { DashboardRepository } from '../repositories/dashboard.repository';
import { DashboardSummary, DashboardChartData, TokenUsageDetail } from '../../../types';
import { logger } from '../../../common/utils/logger';
import { format } from 'date-fns';

export class DashboardService {
  private dashboardRepository: DashboardRepository;

  constructor() {
    this.dashboardRepository = new DashboardRepository();
  }

  /**
   * ダッシュボードサマリーデータを取得
   */
  async getDashboardSummary(organizationId: string): Promise<DashboardSummary> {
    try {
      logger.info('ダッシュボードサマリーを取得開始', { organizationId });

      // 並列でデータを取得してパフォーマンスを向上
      const [
        todayAppointments,
        totalClients,
        totalStylists,
        weeklyCompletedAppointments,
        monthlyTokenUsage,
        unassignedAppointments,
        tokenUsageHistory
      ] = await Promise.all([
        this.dashboardRepository.getTodayAppointmentsCount(organizationId),
        this.dashboardRepository.getTotalClientsCount(organizationId),
        this.dashboardRepository.getTotalStylistsCount(organizationId),
        this.dashboardRepository.getWeeklyCompletedAppointmentsCount(organizationId),
        this.dashboardRepository.getMonthlyTokenUsage(organizationId),
        this.dashboardRepository.getUnassignedAppointments(organizationId),
        this.dashboardRepository.getTokenUsageHistory(organizationId, 30)
      ]);

      // トークン使用率を計算
      const tokenUsagePercentage = monthlyTokenUsage.limit > 0 
        ? Math.round((monthlyTokenUsage.used / monthlyTokenUsage.limit) * 100)
        : 0;

      // データが不足している日付を補完
      const completeTokenUsageData = this.fillMissingDates(tokenUsageHistory, 30);

      // チャートデータを作成
      const tokenUsageChart = {
        labels: completeTokenUsageData.map(item => {
          const date = new Date(item.date);
          return format(date, 'M/d');
        }),
        dailyUsage: completeTokenUsageData.map(item => item.usage),
        cumulativeUsage: completeTokenUsageData.reduce((acc: number[], item, index) => {
          if (index === 0) {
            return [item.usage];
          }
          const lastValue = acc[acc.length - 1] || 0;
          return [...acc, lastValue + item.usage];
        }, [])
      };

      const summary: DashboardSummary = {
        todayAppointments,
        totalClients,
        totalStylists,
        weeklyCompletedAppointments,
        monthlyTokenUsage: {
          used: monthlyTokenUsage.used,
          limit: monthlyTokenUsage.limit,
          percentage: tokenUsagePercentage
        },
        unassignedAppointmentsCount: unassignedAppointments.length,
        unassignedAppointments,
        tokenUsageChart
      };

      logger.info('ダッシュボードサマリー取得成功', {
        organizationId,
        todayAppointments,
        totalClients,
        totalStylists,
        unassignedCount: unassignedAppointments.length,
        chartDataPoints: tokenUsageChart.labels.length
      });

      return summary;
    } catch (error) {
      logger.error('ダッシュボードサマリー取得エラー', {
        error,
        organizationId
      });
      throw error;
    }
  }

  /**
   * ダッシュボードチャートデータを取得
   */
  async getDashboardChartData(organizationId: string): Promise<DashboardChartData> {
    try {
      logger.info('ダッシュボードチャートデータを取得開始', { organizationId });

      // トークン使用履歴を取得（過去30日）
      const tokenUsageHistory = await this.dashboardRepository.getTokenUsageHistory(organizationId, 30);

      // データが不足している日付を補完
      const completeTokenUsageData = this.fillMissingDates(tokenUsageHistory, 30);

      // Chart.js用のフォーマットに変換
      const tokenUsageChart = {
        labels: completeTokenUsageData.map(item => {
          const date = new Date(item.date);
          return format(date, 'M/d');
        }),
        datasets: [{
          label: 'トークン使用量',
          data: completeTokenUsageData.map(item => ({
            label: item.date,
            value: item.usage
          })),
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          borderColor: 'rgba(255, 206, 86, 1)'
        }]
      };

      const chartData: DashboardChartData = {
        tokenUsageChart
      };

      logger.info('ダッシュボードチャートデータ取得成功', {
        organizationId,
        dataPoints: tokenUsageChart.labels.length
      });

      return chartData;
    } catch (error) {
      logger.error('ダッシュボードチャートデータ取得エラー', {
        error,
        organizationId
      });
      throw error;
    }
  }

  /**
   * 不足している日付のデータを0で補完
   */
  private fillMissingDates(data: TokenUsageDetail[], days: number): TokenUsageDetail[] {
    const dataMap = new Map(data.map(item => [item.date, item.usage]));
    const result: TokenUsageDetail[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      result.push({
        date: dateStr,
        usage: dataMap.get(dateStr) || 0
      });
    }

    return result;
  }

}