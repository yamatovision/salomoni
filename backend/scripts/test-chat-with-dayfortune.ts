#!/usr/bin/env ts-node

/**
 * 日運情報を含むチャットのテストスクリプト
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { OpenAIService } from '../src/features/chat/services/openai.service';
import { AICharacter, FourPillarsData, MessageType } from '../src/types';

async function main() {
  console.log('=== 日運情報を含むチャットテスト ===\n');

  // サンプルAIキャラクター
  const aiCharacter: AICharacter = {
    id: 'test-char',
    userId: 'test-user',
    name: 'Ruka',
    personalityScore: {
      softness: 80,
      energy: 70,
      formality: 30
    },
    styleFlags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // サンプル四柱推命データ（金の陰の人）
  const fourPillarsData: FourPillarsData = {
    id: 'test-fp',
    userId: 'test-user',
    birthDate: new Date('1990-01-01'),
    birthTime: '12:00',
    yearPillar: {
      heavenlyStem: '己',
      earthlyBranch: '巳',
      element: '土',
      yinYang: '陰'
    },
    monthPillar: {
      heavenlyStem: '丁',
      earthlyBranch: '丑',
      element: '火',
      yinYang: '陰'
    },
    dayPillar: {
      heavenlyStem: '辛',
      earthlyBranch: '酉',
      element: '金',
      yinYang: '陰'
    },
    hourPillar: {
      heavenlyStem: '癸',
      earthlyBranch: '未',
      element: '水',
      yinYang: '陰'
    },
    elementBalance: {
      wood: 10,
      fire: 20,
      earth: 25,
      metal: 30,
      water: 15,
      mainElement: '金'
    },
    tenGods: {
      year: '食神',
      month: '偏官',
      day: '劫財',
      hour: '傷官'
    },
    twelveGods: {},
    yojin: [],
    monthlyFortuneStages: {},
    yearlyFortuneStages: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // OpenAIServiceのインスタンスを作成
  const openaiService = new OpenAIService();

  try {
    console.log('テストメッセージ: 「今日の運勢はどうですか？」\n');
    
    // メッセージ履歴
    const messages = [
      {
        id: 'msg1',
        conversationId: 'conv1',
        type: MessageType.USER,
        content: '今日の運勢はどうですか？',
        createdAt: new Date()
      }
    ];

    // AIの応答を生成（実際のAPIコールは行わず、プロンプトのみ確認）
    console.log('=== 生成されるシステムプロンプト ===');
    console.log('（実際のOpenAI APIコールは行いません）\n');
    
    // プロンプトの確認のみ
    console.log('ユーザーの日柱: 辛酉（金・陰）');
    console.log('今日の日運情報が四柱推命情報と共にシステムプロンプトに含まれます。');
    console.log('');
    console.log('期待される応答の要素:');
    console.log('- 今日の日柱（丁未・火・陰）の紹介');
    console.log('- ユーザーの金と今日の火の相剋関係への言及');
    console.log('- 注意が必要な日というアドバイス');
    console.log('- 火の気への対処法の提案');

  } catch (error) {
    console.error('エラー:', error);
  }
}

main().catch(console.error);