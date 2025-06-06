#!/usr/bin/env ts-node

/**
 * 日運機能のテストスクリプト
 * 今日の日柱を計算し、サンプルユーザーとの相性を確認します
 */

import { getDayPillar } from '../sajuengine_package/src/dayPillarCalculator';

function getTodaysDayPillarInfo(): { stem: string; branch: string; element: string; yinYang: string } {
  const today = new Date();
  const todayPillar = getDayPillar(today);
  
  // 天干の五行と陰陽を判定
  const stemElements: Record<string, { element: string; yinYang: string }> = {
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
  
  const stemInfo = stemElements[todayPillar.stem] || { element: '不明', yinYang: '不明' };
  
  return {
    stem: todayPillar.stem,
    branch: todayPillar.branch,
    element: stemInfo.element,
    yinYang: stemInfo.yinYang
  };
}

function getElementRelationship(element1: string, element2: string): string {
  const relationships: Record<string, Record<string, string>> = {
    '木': { '木': '比和', '火': '相生', '土': '相剋', '金': '相剋', '水': '相生' },
    '火': { '木': '相生', '火': '比和', '土': '相生', '金': '相剋', '水': '相剋' },
    '土': { '木': '相剋', '火': '相生', '土': '比和', '金': '相生', '水': '相剋' },
    '金': { '木': '相剋', '火': '相剋', '土': '相生', '金': '比和', '水': '相生' },
    '水': { '木': '相生', '火': '相剋', '土': '相剋', '金': '相生', '水': '比和' }
  };
  
  return relationships[element1]?.[element2] || '不明';
}

// メイン処理
async function main() {
  console.log('=== 日運機能テスト ===\n');
  
  // 今日の日柱を計算
  const today = new Date();
  const todayInfo = getTodaysDayPillarInfo();
  
  console.log(`今日の日付: ${today.toLocaleDateString('ja-JP')}`);
  console.log(`今日の日柱: ${todayInfo.stem}${todayInfo.branch} (${todayInfo.element}・${todayInfo.yinYang})\n`);
  
  // サンプルユーザーとの相性を確認
  const sampleUsers = [
    { name: '木の陽の人', element: '木' },
    { name: '火の陰の人', element: '火' },
    { name: '土の陽の人', element: '土' },
    { name: '金の陰の人', element: '金' },
    { name: '水の陽の人', element: '水' }
  ];
  
  console.log('【各五行との相性】');
  sampleUsers.forEach(user => {
    const relationship = getElementRelationship(user.element, todayInfo.element);
    console.log(`${user.name} (${user.element}) との相性: ${relationship}`);
    
    if (relationship === '相生') {
      console.log('  → エネルギーが高まる良い日です。積極的に行動しましょう。');
    } else if (relationship === '相剋') {
      console.log('  → 少し注意が必要な日です。無理をせず、慎重に行動しましょう。');
    } else if (relationship === '比和') {
      console.log('  → 同じ五行の日です。自分らしさを大切に過ごしましょう。');
    }
    console.log('');
  });
  
  console.log('\n【システムプロンプトサンプル】');
  console.log('----------------------------------------');
  const samplePrompt = `
【今日の日運】
- 今日の日柱: ${todayInfo.stem}${todayInfo.branch} (${todayInfo.element}・${todayInfo.yinYang})
- あなたの日柱との相性: [ユーザーの五行により変化]
- 今日の五行: ${todayInfo.element}の気が強まる日

【日運のアドバイス】
- ${todayInfo.element}の気を活かすことを意識してください
- [相性に応じた個別アドバイス]`;
  
  console.log(samplePrompt);
}

main().catch(console.error);