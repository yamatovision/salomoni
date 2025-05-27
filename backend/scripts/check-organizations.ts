import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../src/config/database';
import { OrganizationModel } from '../src/features/organizations/models/organization.model';

async function checkOrganizations() {
  try {
    await connectDatabase();
    
    const organizations = await OrganizationModel.find({});
    console.log('=== 組織一覧 ===');
    console.log(`総数: ${organizations.length}`);
    
    organizations.forEach((org, index) => {
      console.log(`\n${index + 1}. ${org.name}`);
      console.log(`   ID: ${org._id}`);
      console.log(`   プラン: ${org.plan}`);
      console.log(`   ステータス: ${org.status}`);
      console.log(`   作成日: ${org.createdAt}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

checkOrganizations();