import mongoose from 'mongoose';
import { UserModel } from '../src/features/users/models/user.model';
import { UserRole } from '../src/types';
import { config } from 'dotenv';
import { resolve } from 'path';

// 環境変数の読み込み
config({ path: resolve(__dirname, '../.env') });

async function fixStylistRoles() {
  try {
    // MongoDBに接続
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // role が 'user' のユーザーを 'stylist' に更新
    const userEmails = ['stylist1@salon.com', 'metav2icer@gmail.com'];
    
    for (const email of userEmails) {
      const user = await UserModel.findOne({ email });
      if (user) {
        console.log(`\n更新前: ${user.name} (${user.email}) - Role: ${user.role}`);
        
        user.role = UserRole.USER; // スタイリストはUSERロールとして扱う
        await user.save();
        
        console.log(`更新後: ${user.name} (${user.email}) - Role: ${user.role}`);
      }
    }

    // 確認
    console.log('\n=== 更新後の確認 ===');
    const stylists = await UserModel.find({ role: UserRole.STYLIST });
    console.log(`スタイリスト数: ${stylists.length}`);
    stylists.forEach(stylist => {
      console.log(`- ${stylist.name} (${stylist.email})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixStylistRoles();