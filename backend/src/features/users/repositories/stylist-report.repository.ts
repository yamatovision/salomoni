import { StylistReportModel, StylistReportDocument } from '../models/stylist-report.model';
import { StylistReport, ID } from '../../../types';
import { AppError } from '../../../common/utils/errors';
import { logger } from '../../../common/utils/logger';

export class StylistReportRepository {
  /**
   * レポートを作成
   */
  async create(reportData: Partial<StylistReport>): Promise<StylistReportDocument> {
    try {
      logger.info('Creating stylist report', { stylistId: reportData.stylistId });
      const report = new StylistReportModel(reportData);
      const savedReport = await report.save();
      logger.info('Stylist report created successfully', { 
        reportId: savedReport._id,
        stylistId: savedReport.stylistId 
      });
      return savedReport;
    } catch (error) {
      logger.error('Error creating stylist report', { error, reportData });
      throw new AppError('レポートの作成に失敗しました', 500);
    }
  }

  /**
   * IDでレポートを取得
   */
  async findById(reportId: ID): Promise<StylistReportDocument | null> {
    try {
      logger.info('Finding stylist report by ID', { reportId });
      const report = await StylistReportModel.findById(reportId);
      if (report) {
        logger.info('Stylist report found', { reportId });
      } else {
        logger.warn('Stylist report not found', { reportId });
      }
      return report;
    } catch (error) {
      logger.error('Error finding stylist report', { error, reportId });
      throw new AppError('レポートの取得に失敗しました', 500);
    }
  }

  /**
   * スタイリストIDと期間でレポートを検索
   */
  async findByStylistAndPeriod(
    stylistId: ID,
    startDate: Date,
    endDate: Date
  ): Promise<StylistReportDocument | null> {
    try {
      logger.info('Finding stylist report by stylist and period', {
        stylistId,
        startDate,
        endDate
      });

      const report = await StylistReportModel.findOne({
        stylistId,
        'reportPeriod.start': { $gte: startDate },
        'reportPeriod.end': { $lte: endDate }
      });

      if (report) {
        logger.info('Stylist report found for period', { 
          reportId: report._id,
          stylistId 
        });
      } else {
        logger.info('No stylist report found for period', { 
          stylistId,
          startDate,
          endDate 
        });
      }
      
      return report;
    } catch (error) {
      logger.error('Error finding stylist report by period', {
        error,
        stylistId,
        startDate,
        endDate
      });
      throw new AppError('レポートの検索に失敗しました', 500);
    }
  }

  /**
   * スタイリストIDで全レポートを取得
   */
  async findByStylistId(stylistId: ID): Promise<StylistReportDocument[]> {
    try {
      logger.info('Finding all reports for stylist', { stylistId });
      const reports = await StylistReportModel
        .find({ stylistId })
        .sort({ 'reportPeriod.start': -1 });

      logger.info('Found stylist reports', {
        stylistId,
        count: reports.length
      });

      return reports;
    } catch (error) {
      logger.error('Error finding stylist reports', { error, stylistId });
      throw new AppError('レポート一覧の取得に失敗しました', 500);
    }
  }

  /**
   * レポートを更新
   */
  async update(
    reportId: ID,
    updateData: Partial<StylistReport>
  ): Promise<StylistReportDocument | null> {
    try {
      logger.info('Updating stylist report', { reportId, updateData });
      
      const updatedReport = await StylistReportModel.findByIdAndUpdate(
        reportId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (updatedReport) {
        logger.info('Stylist report updated successfully', { reportId });
      } else {
        logger.warn('Stylist report not found for update', { reportId });
      }

      return updatedReport;
    } catch (error) {
      logger.error('Error updating stylist report', { error, reportId });
      throw new AppError('レポートの更新に失敗しました', 500);
    }
  }

  /**
   * レポートを削除
   */
  async delete(reportId: ID): Promise<boolean> {
    try {
      logger.info('Deleting stylist report', { reportId });
      
      const result = await StylistReportModel.findByIdAndDelete(reportId);
      
      if (result) {
        logger.info('Stylist report deleted successfully', { reportId });
        return true;
      } else {
        logger.warn('Stylist report not found for deletion', { reportId });
        return false;
      }
    } catch (error) {
      logger.error('Error deleting stylist report', { error, reportId });
      throw new AppError('レポートの削除に失敗しました', 500);
    }
  }
}