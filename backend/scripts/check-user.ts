import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '../src/features/users/models/user.model';
import bcrypt from 'bcryptjs';

// 環境変数の読み込み
dotenv.config();

async function checkUser() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDBに接続しました');

    // ユーザーを検索
    const user = await UserModel.findOne({ 
      email: 'shiraishi.tatsuya@mikoto.co.jp' 
    });

    if (user) {
      console.log('\n📧 ユーザー情報:');
      console.log('ID:', (user as any)._id.toString());
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Status:', user.status);
      console.log('Auth Methods:', user.authMethods);
      console.log('Created At:', user.createdAt);
      
      // パスワードの検証
      const isPasswordValid = await bcrypt.compare('aikakumei', user.password || '');
      console.log('\nパスワード検証結果:', isPasswordValid ? '✅ 正しい' : '❌ 間違い');
      
      if (!isPasswordValid) {
        // パスワードを再設定
        console.log('\nパスワードを再設定します...');
        const hashedPassword = await bcrypt.hash('aikakumei', 10);
        user.password = hashedPassword;
        await user.save();
        console.log('✅ パスワードを再設定しました');
      }
    } else {
      console.log('❌ ユーザーが見つかりません');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDBから切断しました');
  }
}

// スクリプトを実行
checkUser();