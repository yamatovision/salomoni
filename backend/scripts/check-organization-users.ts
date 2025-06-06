import mongoose from 'mongoose';
import { UserModel } from '../src/features/users/models/user.model';
import { UserRole, UserStatus } from '../src/types';
import { config } from 'dotenv';
import { resolve } from 'path';

// 環境変数の読み込み
config({ path: resolve(__dirname, '../.env') });

async function checkOrganizationUsers() {
  try {
    // MongoDBに接続
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // 特定の組織ID（実際の組織IDに置き換えてください）
    const organizationId = '684263a258abd6cbf5c63089';

    // 組織内の全ユーザーを取得
    const allUsers = await UserModel.find({ organizationId });
    console.log(`\n組織内の全ユーザー数: ${allUsers.length}`);
    
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  Role: ${user.role}, Status: ${user.status}`);
      console.log(`  Birth Date: ${user.birthDate || 'なし'}`);
      console.log(`  ID: ${user._id}`);
    });

    // アクティブなスタイリストのみ
    const stylists = await UserModel.find({ 
      organizationId,
      status: UserStatus.ACTIVE,
      role: UserRole.STYLIST
    });
    
    console.log(`\nアクティブなスタイリスト数: ${stylists.length}`);
    stylists.forEach(stylist => {
      console.log(`- ${stylist.name} (${stylist.email})`);
      console.log(`  Birth Date: ${stylist.birthDate || 'なし'}`);
    });

    // findByOrganizationメソッドの条件を再現
    const nonClientUsers = await UserModel.find({ 
      organizationId,
      status: UserStatus.ACTIVE,
      role: { $ne: 'client' as UserRole }
    });
    
    console.log(`\nクライアント以外のアクティブユーザー数: ${nonClientUsers.length}`);
    nonClientUsers.forEach(user => {
      console.log(`- ${user.name} (${user.role})`);
      console.log(`  Birth Date: ${user.birthDate || 'なし'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkOrganizationUsers();