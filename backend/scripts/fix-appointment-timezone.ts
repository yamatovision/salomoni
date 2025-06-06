#!/usr/bin/env npx ts-node

/**
 * 予約データのタイムゾーン修正スクリプト
 * 
 * 問題: JST時間で作成されたつもりの予約がUTC時間として保存されている
 * 解決: 既存の予約時間を正しいUTC時間に修正する
 */

import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database';
import { AppointmentModel } from '../src/features/appointments/models/appointment.model';
import { logger } from '../src/common/utils/logger';

async function fixAppointmentTimezones() {
  logger.info('Starting appointment timezone fix script');
  
  // データベース接続
  await connectDatabase();
  
  try {
    // 組織IDを指定して予約を取得
    const organizationId = '68345d76c82f76700e30e44a';
    
    logger.info(`Fetching appointments for organization: ${organizationId}`);
    
    // 全予約を取得
    const appointments = await AppointmentModel.find({ organizationId });
    
    logger.info(`Found ${appointments.length} appointments to check`);
    
    for (const appointment of appointments) {
      const originalTime = new Date(appointment.scheduledAt);
      
      // JST時間として解釈されるべき時間を取得
      const jstHour = originalTime.getUTCHours(); // UTCとして保存された時間をJST時間として扱う
      
      logger.info(`Checking appointment ${appointment._id}:`, {
        originalScheduledAt: appointment.scheduledAt,
        originalHour: jstHour
      });
      
      // もし深夜の時間（0-6時）なら、おそらく誤った変換の結果
      if (jstHour >= 0 && jstHour <= 6) {
        // JST時間をUTC時間に正しく変換（JST + 9時間 = UTC）
        const correctUtcTime = new Date(originalTime);
        correctUtcTime.setUTCHours(jstHour + 9); // JST時間 + 9時間 = UTC時間
        
        logger.info(`Fixing appointment ${appointment._id}:`, {
          originalScheduledAt: appointment.scheduledAt,
          originalHour: jstHour,
          correctedScheduledAt: correctUtcTime.toISOString(),
          correctedHour: correctUtcTime.getUTCHours()
        });
        
        // 予約時間を更新
        await AppointmentModel.findByIdAndUpdate(appointment._id, {
          scheduledAt: correctUtcTime
        });
        
        logger.info(`Fixed appointment ${appointment._id} timezone`);
      } else {
        logger.info(`Appointment ${appointment._id} appears to have correct timezone (hour: ${jstHour})`);
      }
    }
    
    logger.info('Appointment timezone fix completed successfully');
    
  } catch (error) {
    logger.error('Error fixing appointment timezones:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// スクリプト実行
if (require.main === module) {
  fixAppointmentTimezones()
    .then(() => {
      logger.info('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Script failed:', error);
      process.exit(1);
    });
}

export { fixAppointmentTimezones };