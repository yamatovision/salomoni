import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '../src/features/users/models/user.model';

// 環境変数の読み込み
dotenv.config();

async function fixPassword() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDBに接続しました');

    const accounts = [
      { email: 'superadmin@salomoni.jp', password: 'superadmin123' },
      { email: 'owner@salon.com', password: 'owner123' },
      { email: 'admin@salon.com', password: 'admin123' },
      { email: 'stylist1@salon.com', password: 'stylist123' }
    ];

    for (const account of accounts) {
      const user = await UserModel.findOne({ email: account.email });
      
      if (!user) {
        console.log(`❌ ユーザーが見つかりません: ${account.email}`);
        continue;
      }

      // パスワードを直接設定（pre-saveフックを通す）
      user.password = account.password;
      await user.save();
      
      console.log(`✅ パスワードを更新しました: ${account.email}`);
      
      // 検証
      const updatedUser = await UserModel.findOne({ email: account.email }).select('+password');
      if (updatedUser) {
        const isValid = await (updatedUser as any).comparePassword(account.password);
        console.log(`   検証結果: ${isValid ? '✅ 成功' : '❌ 失敗'}`);
      }
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDBから切断しました');
  }
}

// スクリプトを実行
fixPassword();