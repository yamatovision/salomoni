#!/usr/bin/env ts-node

/**
 * 日柱マスターデータ生成スクリプト
 * 10年分の日柱データを事前計算してデータベースに保存
 */

import { connect } from 'mongoose';
import { getDayPillar } from '../sajuengine_package/src/dayPillarCalculator';
import { DayPillarMasterModel } from '../src/features/fortune/models/day-pillar-master.model';
import dotenv from 'dotenv';

dotenv.config();

// 天干の五行と陰陽マッピング
const STEM_ELEMENTS: Record<string, { element: string; yinYang: string }> = {
  '甲': { element: '木', yinYang: '陽' },
  '乙': { element: '木', yinYang: '陰' },
  '丙': { element: '火', yinYang: '陽' },
  '丁': { element: '火', yinYang: '陰' },
  '戊': { element: '土', yinYang: '陽' },
  '己': { element: '土', yinYang: '陰' },
  '庚': { element: '金', yinYang: '陽' },
  '辛': { element: '金', yinYang: '陰' },
  '壬': { element: '水', yinYang: '陽' },
  '癸': { element: '水', yinYang: '陰' }
};

async function generateDayPillarMasterData() {
  try {
    // データベース接続
    await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('データベースに接続しました');

    // 生成期間の設定（現在から前後30年 = 60年間）
    const today = new Date();
    const startDate = new Date(today.getFullYear() - 30, 0, 1);  // 30年前の1月1日
    const endDate = new Date(today.getFullYear() + 30, 11, 31);  // 30年後の12月31日
    
    console.log(`生成期間: ${startDate.toISOString().split('T')[0]} から ${endDate.toISOString().split('T')[0]}`);
    
    let current = new Date(startDate);
    let count = 0;
    let skipCount = 0;
    const batchSize = 100;
    let batch = [];
    
    while (current <= endDate) {
      const dateString = current.toISOString().split('T')[0];
      
      // 既存データチェック
      const existing = await DayPillarMasterModel.findOne({ dateString });
      if (existing) {
        skipCount++;
        current.setDate(current.getDate() + 1);
        continue;
      }
      
      // 日柱計算
      const pillar = getDayPillar(current);
      const stemInfo = STEM_ELEMENTS[pillar.stem] || { element: '不明', yinYang: '不明' };
      
      const dayPillarData = {
        date: new Date(current),
        dateString,
        heavenlyStem: pillar.stem,
        earthlyBranch: pillar.branch,
        element: stemInfo.element,
        yinYang: stemInfo.yinYang,
        ganZhi: pillar.fullStemBranch,
        hiddenStems: pillar.hiddenStems,
        dayOfWeek: current.getDay()
      };
      
      batch.push(dayPillarData);
      
      // バッチ保存
      if (batch.length >= batchSize) {
        await DayPillarMasterModel.insertMany(batch);
        count += batch.length;
        console.log(`${count}件のデータを生成しました...`);
        batch = [];
      }
      
      // 次の日へ
      current.setDate(current.getDate() + 1);
    }
    
    // 残りのデータを保存
    if (batch.length > 0) {
      await DayPillarMasterModel.insertMany(batch);
      count += batch.length;
    }
    
    console.log(`\n生成完了:`);
    console.log(`- 新規生成: ${count}件`);
    console.log(`- スキップ: ${skipCount}件（既存データ）`);
    console.log(`- 合計日数: ${count + skipCount}件`);
    
    // サンプルデータの確認
    console.log('\n【サンプルデータ】');
    const samples = await DayPillarMasterModel.find()
      .sort({ date: 1 })
      .limit(5);
    
    samples.forEach(sample => {
      console.log(`${sample.dateString}: ${sample.ganZhi} (${sample.element}・${sample.yinYang})`);
    });
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// スクリプト実行
generateDayPillarMasterData();