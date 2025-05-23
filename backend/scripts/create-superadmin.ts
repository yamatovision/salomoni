import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { UserModel } from '../src/features/users/models/user.model';
import { UserRole, UserStatus } from '../src/types';

// 環境変数の読み込み
dotenv.config();

async function createSuperAdmin() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDBに接続しました');

    // 既存のスーパーアドミンをチェック
    const existingAdmin = await UserModel.findOne({ 
      email: 'shiraishi.tatsuya@mikoto.co.jp' 
    });

    if (existingAdmin) {
      console.log('⚠️  このメールアドレスのユーザーは既に存在します');
      
      // パスワードとロールを更新
      const hashedPassword = await bcrypt.hash('aikakumei', 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.role = UserRole.SUPER_ADMIN;
      existingAdmin.status = UserStatus.ACTIVE;
      await existingAdmin.save();
      
      console.log('✅ 既存ユーザーをスーパーアドミンに更新しました');
    } else {
      // 新規作成
      const hashedPassword = await bcrypt.hash('aikakumei', 10);
      
      const superAdmin = new UserModel({
        email: 'shiraishi.tatsuya@mikoto.co.jp',
        password: hashedPassword,
        name: 'Tatsuya Shiraishi',
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        authMethods: ['email'],
      });

      await superAdmin.save();
      console.log('✅ スーパーアドミンユーザーを作成しました');
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
createSuperAdmin();