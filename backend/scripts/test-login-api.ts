#!/usr/bin/env ts-node

/**
 * 実際のAPIエンドポイントでログインできるかテストするスクリプト
 * モックユーザーと同じ認証情報で本番APIにアクセスできることを確認
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// テスト用ユーザー情報
const testUsers = [
  {
    email: 'superadmin@salomoni.jp',
    password: 'superadmin123',
    expectedRole: 'superadmin',
    description: 'SuperAdmin'
  },
  {
    email: 'owner@salon.com',
    password: 'owner123',
    expectedRole: 'owner',
    description: 'サロンオーナー'
  },
  {
    email: 'admin@salon.com',
    password: 'admin123',
    expectedRole: 'admin',
    description: '管理者'
  },
  {
    email: 'stylist1@salon.com',
    password: 'stylist123',
    expectedRole: 'user',
    description: 'スタイリスト'
  },
];

interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      status: string;
      organizationId?: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}

async function testLogin(email: string, password: string): Promise<LoginResponse | null> {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/api/auth/login`,
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error(`❌ APIエラー: ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      console.error('❌ ネットワークエラー: APIサーバーに接続できません');
    } else {
      console.error('❌ エラー:', error.message);
    }
    return null;
  }
}

async function testUserInfo(accessToken: string) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/users/me`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('❌ ユーザー情報取得エラー:', error.response?.data?.message || error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 APIログインテストを開始します...');
  console.log(`📍 APIベースURL: ${API_BASE_URL}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const testUser of testUsers) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔐 テスト: ${testUser.description} (${testUser.email})`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // ログインテスト
    const loginResult = await testLogin(testUser.email, testUser.password);

    if (loginResult && loginResult.success) {
      successCount++;
      console.log('✅ ログイン成功！');
      console.log(`   - ユーザーID: ${loginResult.data.user.id}`);
      console.log(`   - 名前: ${loginResult.data.user.name}`);
      console.log(`   - ロール: ${loginResult.data.user.role}`);
      console.log(`   - ステータス: ${loginResult.data.user.status}`);
      
      if (loginResult.data.user.organizationId) {
        console.log(`   - 組織ID: ${loginResult.data.user.organizationId}`);
      }

      // ロールの確認
      if (loginResult.data.user.role === testUser.expectedRole) {
        console.log(`   ✅ ロールが正しく設定されています: ${testUser.expectedRole}`);
      } else {
        console.log(`   ⚠️  ロールが期待値と異なります: 期待値=${testUser.expectedRole}, 実際=${loginResult.data.user.role}`);
      }

      // アクセストークンのテスト
      console.log('\n   📡 アクセストークンのテスト...');
      const userInfo = await testUserInfo(loginResult.data.accessToken);
      
      if (userInfo && userInfo.success) {
        console.log('   ✅ アクセストークンが有効です');
        console.log(`   - /api/users/me からユーザー情報を取得できました`);
      } else {
        console.log('   ❌ アクセストークンでのAPI呼び出しに失敗しました');
      }

    } else {
      failCount++;
      console.log(`❌ ログイン失敗: ${testUser.email}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 テスト結果サマリー');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 成功: ${successCount}/${testUsers.length}`);
  console.log(`❌ 失敗: ${failCount}/${testUsers.length}`);
  
  if (successCount === testUsers.length) {
    console.log('\n🎉 すべてのユーザーでログインに成功しました！');
    console.log('✨ フロントエンドのモックユーザーと同じ認証情報で本番APIが使用できます。');
  } else {
    console.log('\n⚠️  一部のユーザーでログインに失敗しました。');
    console.log('📝 エラーログを確認してください。');
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}