#!/usr/bin/env node

/**
 * 離職リスクサマリーAPI確認スクリプト
 * 
 * 使用方法:
 * npx ts-node scripts/check-risk-summary.ts
 */

import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { API_PATHS } from '../src/types';

// .envファイルを読み込み
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

interface LoginCredentials {
  email: string;
  password: string;
  role: string;
}

interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// テスト用認証情報
const testCredentials: LoginCredentials[] = [
  { email: 'admin@salon.com', password: 'admin123', role: 'ADMIN' },
  { email: 'owner@salon.com', password: 'owner123', role: 'OWNER' },
  { email: 'superadmin@salomoni.jp', password: 'superadmin123', role: 'SUPER_ADMIN' },
  { email: 'stylist1@salon.com', password: 'stylist123', role: 'USER' }
];

/**
 * ログインしてトークンを取得
 */
async function login(credentials: LoginCredentials): Promise<string | null> {
  try {
    console.log(`\n🔐 ${credentials.role}でログイン中...`);
    const response = await axios.post(
      `${API_BASE_URL}${API_PATHS.AUTH.LOGIN}`,
      {
        email: credentials.email,
        password: credentials.password
      }
    );

    if (response.data.success && response.data.data.token) {
      console.log(`✅ ログイン成功`);
      return response.data.data.token;
    }
    return null;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    console.error(`❌ ログイン失敗:`, axiosError.response?.data?.error || axiosError.message);
    return null;
  }
}

/**
 * 離職リスクサマリーを取得
 */
async function getRiskSummary(token: string, role: string): Promise<void> {
  try {
    console.log(`\n📊 ${role}として離職リスクサマリーを取得中...`);
    const response = await axios.get(
      `${API_BASE_URL}${API_PATHS.ADMIN.STYLISTS_RISK_SUMMARY}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      console.log(`✅ 離職リスクサマリー取得成功:`);
      console.log(`   高リスク: ${response.data.data.high}人`);
      console.log(`   中リスク: ${response.data.data.medium}人`);
      console.log(`   低リスク: ${response.data.data.low}人`);
      console.log(`   合計: ${response.data.data.total}人`);
      
      // 合計の検証
      const sum = response.data.data.high + response.data.data.medium + response.data.data.low;
      if (sum === response.data.data.total) {
        console.log(`   ✅ 合計値が正しい`);
      } else {
        console.log(`   ❌ 合計値が不正: ${sum} != ${response.data.data.total}`);
      }
    }
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    if (axiosError.response?.status === 403) {
      console.log(`⚠️  ${role}は権限不足でアクセスできません（期待通り）`);
    } else {
      console.error(`❌ エラー:`, axiosError.response?.data?.error || axiosError.message);
      if (axiosError.response?.data?.details) {
        console.error(`   詳細:`, axiosError.response.data.details);
      }
    }
  }
}

/**
 * スタイリスト作成（テスト用）
 */
async function createTestStylists(token: string, count: number): Promise<void> {
  try {
    console.log(`\n👥 テスト用スタイリストを${count}人作成中...`);
    
    for (let i = 1; i <= count; i++) {
      const response = await axios.post(
        `${API_BASE_URL}${API_PATHS.USERS.INVITE}`,
        {
          email: `test-stylist-${Date.now()}-${i}@example.com`,
          name: `テストスタイリスト${i}`,
          role: 'user',
          employeeNumber: `TEST${i}`
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        console.log(`   ✅ スタイリスト${i}を作成しました`);
      }
    }
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    console.error(`❌ スタイリスト作成エラー:`, axiosError.response?.data?.error || axiosError.message);
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('='.repeat(60));
  console.log('離職リスクサマリーAPI確認スクリプト');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`エンドポイント: ${API_PATHS.ADMIN.STYLISTS_RISK_SUMMARY}`);

  // 各ロールでテスト
  for (const credentials of testCredentials) {
    const token = await login(credentials);
    if (token) {
      await getRiskSummary(token, credentials.role);
      
      // ADMINまたはOWNERの場合、テスト用スタイリストを作成して再度確認
      if (credentials.role === 'ADMIN' || credentials.role === 'OWNER') {
        await createTestStylists(token, 5);
        await getRiskSummary(token, credentials.role);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('テスト完了');
  console.log('='.repeat(60));
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  console.error('未処理のエラー:', error);
  process.exit(1);
});

// 実行
main().catch((error) => {
  console.error('スクリプトエラー:', error);
  process.exit(1);
});