import axios from 'axios';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

async function testLoginAPI() {
  console.log('🔍 ログインAPIテストを開始します...\n');

  const testAccounts = [
    { email: 'superadmin@salomoni.jp', password: 'superadmin123' },
    { email: 'owner@salon.com', password: 'owner123' },
    { email: 'admin@salon.com', password: 'admin123' },
    { email: 'stylist1@salon.com', password: 'stylist123' }
  ];

  // APIのベースURL
  const baseURL = 'http://localhost:3001';

  // まず、ヘルスチェック
  try {
    console.log('1️⃣ ヘルスチェック...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ ヘルスチェック成功:', healthResponse.data);
  } catch (error: any) {
    console.error('❌ ヘルスチェック失敗:', error.message);
  }

  // テストエンドポイント
  try {
    console.log('\n2️⃣ テストエンドポイント...');
    const testResponse = await axios.get(`${baseURL}/api/test`);
    console.log('✅ テストエンドポイント成功:', testResponse.data);
  } catch (error: any) {
    console.error('❌ テストエンドポイント失敗:', error.response?.data || error.message);
  }

  // 各アカウントでログインテスト
  for (const account of testAccounts) {
    console.log(`\n3️⃣ ログインテスト: ${account.email}`);
    
    try {
      const response = await axios.post(
        `${baseURL}/api/auth/login`,
        {
          email: account.email,
          password: account.password,
          method: 'email'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          validateStatus: () => true // 全てのステータスコードを受け入れる
        }
      );

      console.log(`   ステータス: ${response.status}`);
      console.log(`   レスポンス:`, JSON.stringify(response.data, null, 2));
      
      if (response.status === 200 && response.data.success) {
        console.log(`   ✅ ログイン成功`);
        console.log(`   アクセストークン: ${response.data.data.accessToken.substring(0, 20)}...`);
      } else {
        console.log(`   ❌ ログイン失敗`);
      }
    } catch (error: any) {
      console.error(`   ❌ エラー:`, error.message);
      if (error.response) {
        console.error(`   レスポンス:`, error.response.data);
      }
    }
  }

  // 無効な認証情報でのテスト
  console.log('\n4️⃣ 無効な認証情報でのテスト...');
  try {
    const response = await axios.post(
      `${baseURL}/api/auth/login`,
      {
        email: 'invalid@example.com',
        password: 'wrongpassword',
        method: 'email'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      }
    );

    console.log(`   ステータス: ${response.status}`);
    console.log(`   レスポンス:`, JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error(`   ❌ エラー:`, error.message);
  }

  console.log('\n✅ テスト完了');
}

// スクリプトを実行
testLoginAPI().catch(console.error);