import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '../src/features/users/models/user.model';
import { UserRole, UserStatus } from '../src/types';

// 環境変数の読み込み
dotenv.config();

async function resetSuperAdmin() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDBに接続しました');

    // 既存のユーザーを削除
    await UserModel.deleteOne({ 
      email: 'shiraishi.tatsuya@mikoto.co.jp' 
    });
    console.log('🗑️  既存のユーザーを削除しました');
    
    // 新しいユーザーを作成（pre saveフックが確実に動作）
    const superAdmin = new UserModel({
      email: 'shiraishi.tatsuya@mikoto.co.jp',
      password: 'aikakumei',
      name: 'Tatsuya Shiraishi',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      authMethods: ['email'],
    });

    await superAdmin.save();
    console.log('✅ 新しいスーパーアドミンユーザーを作成しました');
    
    // 検証
    const user = await (UserModel as any).findByEmail('shiraishi.tatsuya@mikoto.co.jp');
    if (user) {
      const isValid = await user.comparePassword('aikakumei');
      console.log('🔍 パスワード検証結果:', isValid ? '✅ 成功' : '❌ 失敗');
    }

    console.log('\n📧 ログイン情報:');
    console.log('Email: shiraishi.tatsuya@mikoto.co.jp');
    console.log('Password: aikakumei');
    console.log('Role: SUPER_ADMIN');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDBから切断しました');
  }
}

// スクリプトを実行
resetSuperAdmin();