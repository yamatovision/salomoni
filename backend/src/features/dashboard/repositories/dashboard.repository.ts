import { startOfDay, startOfWeek, startOfMonth, subDays } from 'date-fns';
import { ClientModel } from '../../clients/models/client.model';
import { UserModel } from '../../users/models/user.model';
import { AppointmentModel } from '../../appointments/models/appointment.model';
import { TokenUsage } from '../../billing/models/token-usage.model';
import { UserRole, AppointmentStatus } from '../../../types';
import { logger } from '../../../common/utils/logger';

export class DashboardRepository {
  /**
   * 本日の予約数を取得
   */
  async getTodayAppointmentsCount(organizationId: string): Promise<number> {
    try {
      const today = startOfDay(new Date());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const count = await AppointmentModel.countDocuments({
        organizationId,
        scheduledAt: {
          $gte: today,
          $lt: tomorrow
        },
        status: { $ne: AppointmentStatus.CANCELED }
      });

      logger.debug('今日の予約数を取得', { organizationId, count });
      return count;
    } catch (error) {
      logger.error('今日の予約数取得エラー', error);
      throw error;
    }
  }

  /**
   * 総クライアント数を取得
   */
  async getTotalClientsCount(organizationId: string): Promise<number> {
    try {
      const count = await ClientModel.countDocuments({ organizationId });
      logger.debug('総クライアント数を取得', { organizationId, count });
      return count;
    } catch (error) {
      logger.error('総クライアント数取得エラー', error);
      throw error;
    }
  }

  /**
   * 総スタイリスト数を取得
   */
  async getTotalStylistsCount(organizationId: string): Promise<number> {
    try {
      const count = await UserModel.countDocuments({
        organizationId,
        role: { $in: [UserRole.USER, UserRole.STYLIST] },
        status: 'active'
      });
      logger.debug('総スタイリスト数を取得', { organizationId, count });
      return count;
    } catch (error) {
      logger.error('総スタイリスト数取得エラー', error);
      throw error;
    }
  }

  /**
   * 週間完了予約数を取得
   */
  async getWeeklyCompletedAppointmentsCount(organizationId: string): Promise<number> {
    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // 月曜始まり
      const now = new Date();

      const count = await AppointmentModel.countDocuments({
        organizationId,
        status: AppointmentStatus.COMPLETED,
        completedAt: {
          $gte: weekStart,
          $lte: now
        }
      });

      logger.debug('週間完了予約数を取得', { organizationId, count });
      return count;
    } catch (error) {
      logger.error('週間完了予約数取得エラー', error);
      throw error;
    }
  }

  /**
   * 月間トークン使用量を取得
   */
  async getMonthlyTokenUsage(organizationId: string): Promise<{ used: number; limit: number }> {
    try {
      const monthStart = startOfMonth(new Date());
      const now = new Date();

      const usageData = await TokenUsage.aggregate([
        {
          $match: {
            organizationId,
            timestamp: {
              $gte: monthStart,
              $lte: now
            }
          }
        },
        {
          $group: {
            _id: null,
            totalTokens: { $sum: '$tokens' }
          }
        }
      ]);

      const used = usageData[0]?.totalTokens || 0;
      
      // TODO: 組織のプランに基づいてリミットを取得
      // 現在は仮の値を設定
      const limit = 1000000; // 100万トークン

      logger.debug('月間トークン使用量を取得', { organizationId, used, limit });
      return { used, limit };
    } catch (error) {
      logger.error('月間トークン使用量取得エラー', error);
      throw error;
    }
  }

  /**
   * 未担当予約を取得
   */
  async getUnassignedAppointments(organizationId: string): Promise<any[]> {
    try {
      const today = startOfDay(new Date());
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      const appointments = await AppointmentModel.find({
        organizationId,
        stylistId: { $exists: false },
        scheduledAt: {
          $gte: today,
          $lte: endOfToday
        },
        status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.SCHEDULED] }
      })
      .populate('clientId', 'name')
      .sort({ scheduledAt: 1 })
      .limit(10);

      const formattedAppointments = appointments.map(apt => {
        const client = apt.clientId as any;
        const scheduledAt = new Date(apt.scheduledAt);
        const endTime = new Date(scheduledAt.getTime() + apt.duration * 60000);

        return {
          id: apt._id.toString(),
          clientName: client?.name || '不明',
          serviceType: apt.services.join(', ') || '未指定',
          startTime: scheduledAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          endTime: endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          element: '未実装' // TODO: クライアントの四柱推命データから取得
        };
      });

      logger.debug('未担当予約を取得', { organizationId, count: formattedAppointments.length });
      return formattedAppointments;
    } catch (error) {
      logger.error('未担当予約取得エラー', error);
      throw error;
    }
  }

  /**
   * トークン使用履歴を取得（グラフ用）
   */
  async getTokenUsageHistory(organizationId: string, days: number = 30): Promise<any[]> {
    try {
      const startDate = subDays(new Date(), days);
      
      const usageData = await TokenUsage.aggregate([
        {
          $match: {
            organizationId,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' }
            },
            totalTokens: { $sum: '$tokens' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]);

      const formattedData = usageData.map((item: {
        _id: { year: number; month: number; day: number };
        totalTokens: number;
      }) => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
        usage: item.totalTokens
      }));

      logger.debug('トークン使用履歴を取得', { organizationId, days, dataPoints: formattedData.length });
      return formattedData;
    } catch (error) {
      logger.error('トークン使用履歴取得エラー', error);
      throw error;
    }
  }
}