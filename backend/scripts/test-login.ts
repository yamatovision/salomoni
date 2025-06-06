import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { UserModel } from '../src/features/users/models/user.model';

// 環境変数の読み込み
dotenv.config();

async function testLogin() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDBに接続しました');

    const email = 'superadmin@salomoni.jp';
    const password = 'superadmin123';

    // ユーザーを検索（パスワード含む）
    const user = await UserModel.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ ユーザーが見つかりません');
      return;
    }

    console.log('\n📧 ユーザー情報:');
    console.log('ID:', user._id);
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    console.log('Auth Methods:', user.authMethods);
    console.log('Password exists:', !!user.password);
    console.log('Password hash:', user.password ? user.password.substring(0, 20) + '...' : 'null');

    // パスワードを直接検証
    if (user.password) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log('\nパスワード検証結果:', isValid ? '✅ 正しい' : '❌ 間違い');
      
      // comparePasswordメソッドも試す
      const isValidMethod = await (user as any).comparePassword(password);
      console.log('comparePasswordメソッド結果:', isValidMethod ? '✅ 正しい' : '❌ 間違い');
    } else {
      console.log('\n❌ パスワードが設定されていません');
    }

    // findByEmailメソッドをテスト
    console.log('\n🔍 findByEmailメソッドのテスト:');
    const userByEmail = await (UserModel as any).findByEmail(email);
    console.log('findByEmailの結果:', userByEmail ? '✅ ユーザー見つかった' : '❌ ユーザー見つからない');
    if (userByEmail) {
      console.log('Password exists in findByEmail:', !!userByEmail.password);
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDBから切断しました');
  }
}

// スクリプトを実行
testLogin();