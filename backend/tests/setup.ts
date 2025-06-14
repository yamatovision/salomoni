import { disconnectDatabase } from '../src/config/database';
import dotenv from 'dotenv';

// .envファイルを読み込む
dotenv.config();

// テスト環境の設定
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // テスト時はエラーログのみ

// テストタイムアウトの設定
jest.setTimeout(30000);

// グローバルなテスト後処理
afterAll(async () => {
  // データベース接続をクリーンアップ
  await disconnectDatabase();
});