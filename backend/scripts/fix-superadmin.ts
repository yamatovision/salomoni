import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import { UserModel } from '../src/features/users/models/user.model';

// 環境変数の読み込み
dotenv.config();

async function fixSuperAdmin() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDBに接続しました');

    // ユーザーを検索
    const user = await UserModel.findOne({ 
      email: 'shiraishi.tatsuya@mikoto.co.jp' 
    }).select('+password');

    if (user) {
      console.log('🔍 ユーザーを発見:', user.email);
      
      // bcryptjsを使用して正しくハッシュ化
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash('aikakumei', salt);
      
      console.log('🔐 新しいパスワードハッシュを生成しました');
      
      // パスワードを直接更新
      user.password = hashedPassword;
      await user.save();
      
      console.log('✅ パスワードを更新しました');
      
      // 検証
      const isValid = await bcryptjs.compare('aikakumei', user.password);
      console.log('🔍 パスワード検証結果:', isValid ? '✅ 成功' : '❌ 失敗');
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
fixSuperAdmin();