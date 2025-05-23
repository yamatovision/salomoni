import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '../src/features/users/models/user.model';
import bcrypt from 'bcryptjs';

// 環境変数の読み込み
dotenv.config();

async function debugAuth() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDBに接続しました');

    const email = 'shiraishi.tatsuya@mikoto.co.jp';
    const password = 'aikakumei';

    // 全ユーザーを確認
    console.log('\n📋 全ユーザー一覧:');
    const allUsers = await UserModel.find({});
    allUsers.forEach(user => {
      console.log(`- Email: ${user.email}, Role: ${user.role}, Status: ${user.status}`);
    });

    // findByEmailメソッドをテスト
    console.log('\n🔍 findByEmailメソッドのテスト:');
    const userByEmail = await (UserModel as any).findByEmail(email);
    console.log('Result:', userByEmail ? `Found user: ${userByEmail.email}` : 'Not found');

    // 直接検索
    console.log('\n🔍 直接検索（大文字小文字を区別）:');
    const directUser = await UserModel.findOne({ email }).select('+password');
    console.log('Result:', directUser ? `Found user: ${directUser.email}` : 'Not found');

    // 小文字で検索
    console.log('\n🔍 小文字で検索:');
    const lowerUser = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');
    console.log('Result:', lowerUser ? `Found user: ${lowerUser.email}` : 'Not found');

    // パスワード検証
    if (directUser) {
      console.log('\n🔐 パスワード検証（直接検索したユーザー）:');
      const isValid = await bcrypt.compare(password, directUser.password || '');
      console.log('パスワード検証結果:', isValid ? '✅ 正しい' : '❌ 間違い');
      
      // comparePasswordメソッドも試す
      const isValidMethod = await (directUser as any).comparePassword(password);
      console.log('comparePasswordメソッドの結果:', isValidMethod ? '✅ 正しい' : '❌ 間違い');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDBから切断しました');
  }
}

// スクリプトを実行
debugAuth();