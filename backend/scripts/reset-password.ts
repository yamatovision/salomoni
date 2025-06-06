import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { UserModel } from '../src/features/users/models/user.model';

// 環境変数の読み込み
dotenv.config();

async function resetPassword() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDBに接続しました');

    const email = 'superadmin@salomoni.jp';
    const newPassword = 'superadmin123';

    // ユーザーを検索
    const user = await UserModel.findOne({ email });
    
    if (!user) {
      console.log('❌ ユーザーが見つかりません');
      return;
    }

    // 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('新しいパスワードハッシュ:', hashedPassword.substring(0, 20) + '...');

    // パスワードを更新
    user.password = hashedPassword;
    await user.save();
    console.log('✅ パスワードを更新しました');

    // 検証
    const updatedUser = await UserModel.findOne({ email }).select('+password');
    if (updatedUser && updatedUser.password) {
      const isValid = await bcrypt.compare(newPassword, updatedUser.password);
      console.log('検証結果:', isValid ? '✅ 正しい' : '❌ 間違い');
      
      // ハッシュの比較
      console.log('保存されたハッシュ:', updatedUser.password.substring(0, 20) + '...');
      console.log('ハッシュが一致:', hashedPassword === updatedUser.password);
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDBから切断しました');
  }
}

// スクリプトを実行
resetPassword();