import mongoose from 'mongoose';
import { FourPillarsDataModel } from '../src/features/saju/models/four-pillars-data.model';
import { logger } from '../src/common/utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const userId = '68428da0e0fd17850082f240';

async function checkFourPillarsData() {
  try {
    // MongoDBに接続
    await mongoose.connect(process.env.MONGODB_URI!);
    logger.info('データベースに接続しました');

    // ユーザーの四柱推命データを検索
    logger.info(`\n===== ユーザー ${userId} の四柱推命データを検索 =====`);
    
    const fourPillarsData = await FourPillarsDataModel.findOne({ userId }).sort({ calculatedAt: -1 });
    
    if (fourPillarsData) {
      logger.info('四柱推命データが見つかりました:');
      console.log(JSON.stringify({
        _id: fourPillarsData._id,
        userId: fourPillarsData.userId,
        calculatedAt: fourPillarsData.calculatedAt,
        birthDate: fourPillarsData.birthDate,
        birthTime: fourPillarsData.birthTime,
        location: fourPillarsData.location,
        fourPillars: fourPillarsData.fourPillars ? {
          yearPillar: fourPillarsData.fourPillars.yearPillar,
          monthPillar: fourPillarsData.fourPillars.monthPillar,
          dayPillar: fourPillarsData.fourPillars.dayPillar,
          hourPillar: fourPillarsData.fourPillars.hourPillar,
        } : null,
        elementBalance: fourPillarsData.elementBalance,
      }, null, 2));
    } else {
      logger.error('四柱推命データが見つかりません');
    }

    // 全ての四柱推命データをカウント
    const totalCount = await FourPillarsDataModel.countDocuments({ userId });
    logger.info(`\n===== ユーザー ${userId} の四柱推命データ総数: ${totalCount} =====`);

    // 最新5件の四柱推命データを取得
    const recentData = await FourPillarsDataModel.find({ userId })
      .sort({ calculatedAt: -1 })
      .limit(5)
      .select('_id calculatedAt');

    if (recentData.length > 0) {
      logger.info('\n===== 最新5件の四柱推命データ =====');
      recentData.forEach((data, index) => {
        console.log(`${index + 1}. ID: ${data._id}, 計算日時: ${data.calculatedAt}`);
      });
    }

  } catch (error) {
    logger.error('エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('\nデータベース接続を閉じました');
  }
}

// スクリプトを実行
checkFourPillarsData();