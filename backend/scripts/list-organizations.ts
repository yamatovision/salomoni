import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { OrganizationModel } from '../src/features/organizations/models/organization.model';
import { UserModel } from '../src/features/users/models/user.model';

// 環境変数の読み込み
dotenv.config();

async function listOrganizations() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDBに接続しました\n');

    // すべての組織を取得
    const organizations = await OrganizationModel.find().sort({ createdAt: -1 });
    console.log(`📊 総組織数: ${organizations.length}`);

    if (organizations.length > 0) {
      console.log('\n🏢 組織一覧:');
      console.log('=====================================');
      
      for (const org of organizations) {
        console.log(`ID: ${(org as any)._id.toString()}`);
        console.log(`Name: ${org.name}`);
        console.log(`Email: ${org.email}`);
        console.log(`Phone: ${org.phone}`);
        console.log(`Address: ${org.address}`);
        console.log(`Plan ID: ${org.planId}`);
        console.log(`Owner ID: ${org.ownerId}`);
        console.log(`Status: ${org.status}`);
        console.log(`Created: ${org.createdAt}`);
        
        // この組織に属するユーザーを検索
        const orgUsers = await UserModel.find({ organizationId: (org as any)._id });
        console.log(`\n  👥 所属ユーザー数: ${orgUsers.length}`);
        if (orgUsers.length > 0) {
          orgUsers.forEach(user => {
            console.log(`    - ${user.email} (${user.role})`);
          });
        }
        
        console.log('-------------------------------------');
      }
    } else {
      console.log('\n組織が存在しません');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDBから切断しました');
  }
}

// スクリプトを実行
listOrganizations();