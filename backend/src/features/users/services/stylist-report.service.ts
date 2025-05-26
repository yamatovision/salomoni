import { StylistReportRepository } from '../repositories/stylist-report.repository';
import { AppointmentRepository } from '../../appointments/repositories/appointment.repository';
import { UserRepository } from '../repositories/user.repository';
import { SajuService } from '../../saju/services/saju.service';
import { StylistReport, ID, UserRole, AppointmentStatus } from '../../../types';
import { AppError } from '../../../common/utils/errors';
import { logger } from '../../../common/utils/logger';

export class StylistReportService {
  private stylistReportRepository: StylistReportRepository;
  private appointmentRepository: AppointmentRepository;
  private userRepository: UserRepository;
  private sajuService: SajuService;

  constructor() {
    this.stylistReportRepository = new StylistReportRepository();
    this.appointmentRepository = new AppointmentRepository();
    this.userRepository = new UserRepository();
    this.sajuService = new SajuService();
  }

  /**
   * スタイリストのレポートを生成
   */
  async generateReport(
    stylistId: ID,
    startDate: Date,
    endDate: Date,
    organizationId: ID
  ): Promise<StylistReport> {
    try {
      logger.info('Generating stylist report', {
        stylistId,
        startDate,
        endDate,
        organizationId
      });

      // スタイリストの存在確認とロール確認
      const stylist = await this.userRepository.findById(stylistId);
      if (!stylist) {
        throw new AppError('スタイリストが見つかりません', 404);
      }

      if (stylist.organizationId !== organizationId) {
        throw new AppError('このスタイリストにアクセスする権限がありません', 403);
      }

      if (![UserRole.USER, UserRole.STYLIST].includes(stylist.role)) {
        throw new AppError('指定されたユーザーはスタイリストではありません', 400);
      }

      // 既存のレポートを確認
      const existingReport = await this.stylistReportRepository.findByStylistAndPeriod(
        stylistId,
        startDate,
        endDate
      );

      if (existingReport) {
        logger.info('Returning existing report', { reportId: existingReport._id });
        return existingReport.toObject() as StylistReport;
      }

      // 期間内の予約データを集計
      const appointments = await this.appointmentRepository.findMany(
        {
          organizationId,
          stylistId,
          from: startDate,
          to: endDate
        },
        { page: 1, limit: 10000 } // 大量データ対応が必要な場合は改善が必要
      );

      // 統計を計算
      const totalAppointments = appointments.appointments.length;
      const completedAppointments = appointments.appointments.filter(
        (app: any) => app.status === AppointmentStatus.COMPLETED
      );

      // 売上計算（amountフィールドがある場合）
      const revenueGenerated = completedAppointments.reduce((total: number, app: any) => {
        return total + (app.amount || 0);
      }, 0);

      // 四柱推命分析を取得（オプショナル）
      let fourPillarsAnalysis;
      try {
        if (stylist.birthDate) {
          const sajuData = await this.sajuService.calculateFourPillars({
            birthDate: stylist.birthDate.toISOString(),
            birthTime: '12:00'
          });
          fourPillarsAnalysis = sajuData;
        }
      } catch (error) {
        logger.warn('Failed to get four pillars analysis', { error, stylistId });
        // 四柱推命の取得に失敗してもレポート生成は続行
      }

      // レポートデータを作成
      const reportData: Partial<StylistReport> = {
        stylistId,
        reportPeriod: {
          start: startDate,
          end: endDate
        },
        totalAppointments,
        revenueGenerated: revenueGenerated,
        fourPillarsAnalysis
      };

      // レポートを保存
      const savedReport = await this.stylistReportRepository.create(reportData);

      logger.info('Stylist report generated successfully', {
        reportId: savedReport._id,
        stylistId,
        totalAppointments
      });

      return savedReport.toObject() as StylistReport;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error generating stylist report', {
        error,
        stylistId,
        startDate,
        endDate
      });
      throw new AppError('レポートの生成に失敗しました', 500);
    }
  }

  /**
   * スタイリストの過去のレポート一覧を取得
   */
  async getReportHistory(
    stylistId: ID,
    organizationId: ID
  ): Promise<StylistReport[]> {
    try {
      logger.info('Getting report history for stylist', { stylistId });

      // スタイリストの存在確認とアクセス権確認
      const stylist = await this.userRepository.findById(stylistId);
      if (!stylist) {
        throw new AppError('スタイリストが見つかりません', 404);
      }

      if (stylist.organizationId !== organizationId) {
        throw new AppError('このスタイリストにアクセスする権限がありません', 403);
      }

      const reports = await this.stylistReportRepository.findByStylistId(stylistId);
      
      logger.info('Retrieved report history', {
        stylistId,
        reportCount: reports.length
      });

      return reports.map(report => report.toObject() as StylistReport);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting report history', { error, stylistId });
      throw new AppError('レポート履歴の取得に失敗しました', 500);
    }
  }

  /**
   * レポートIDでレポートを取得
   */
  async getReportById(
    reportId: ID,
    organizationId: ID
  ): Promise<StylistReport> {
    try {
      logger.info('Getting report by ID', { reportId });

      const report = await this.stylistReportRepository.findById(reportId);
      if (!report) {
        throw new AppError('レポートが見つかりません', 404);
      }

      // スタイリストの組織を確認
      const stylist = await this.userRepository.findById(report.stylistId);
      if (!stylist || stylist.organizationId !== organizationId) {
        throw new AppError('このレポートにアクセスする権限がありません', 403);
      }

      logger.info('Retrieved report successfully', { reportId });
      return report.toObject() as StylistReport;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting report by ID', { error, reportId });
      throw new AppError('レポートの取得に失敗しました', 500);
    }
  }
}