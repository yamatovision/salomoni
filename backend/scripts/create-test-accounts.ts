import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { UserModel } from '../src/features/users/models/user.model';
import { OrganizationModel } from '../src/features/organizations/models/organization.model';
import { UserRole, UserStatus, AuthMethod, OrganizationStatus } from '../src/types';

// 環境変数の読み込み
dotenv.config();

async function createTestAccounts() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDBに接続しました');

    // 1. 組織を確認または作成
    let organization = await OrganizationModel.findOne({ name: 'Salomoni Beauty Salon' });
    if (!organization) {
      organization = await OrganizationModel.create({
        name: 'Salomoni Beauty Salon',
        nameKana: 'サロモニビューティーサロン',
        email: 'info@salon.com',
        phone: '03-1234-5678',
        postalCode: '150-0001',
        prefecture: '東京都',
        city: '渋谷区',
        address: '神宮前1-1-1',
        status: OrganizationStatus.ACTIVE
      });
      console.log('✅ 組織を作成しました: Salomoni Beauty Salon');
    }

    // 2. テストアカウントを作成
    const testAccounts = [
      {
        email: 'superadmin@salomoni.jp',
        password: 'superadmin123',
        name: 'スーパー管理者',
        nameKana: 'スーパーカンリシャ',
        role: UserRole.SUPER_ADMIN,
        organizationId: null
      },
      {
        email: 'owner@salon.com',
        password: 'owner123',
        name: '山田 太郎',
        nameKana: 'ヤマダ タロウ',
        role: UserRole.OWNER,
        organizationId: organization._id
      },
      {
        email: 'admin@salon.com',
        password: 'admin123',
        name: '佐藤 花子',
        nameKana: 'サトウ ハナコ',
        role: UserRole.ADMIN,
        organizationId: organization._id
      },
      {
        email: 'stylist1@salon.com',
        password: 'stylist123',
        name: '鈴木 美咲',
        nameKana: 'スズキ ミサキ',
        role: UserRole.USER,
        organizationId: organization._id
      }
    ];

    for (const account of testAccounts) {
      let user = await UserModel.findOne({ email: account.email });
      
      if (user) {
        // 既存ユーザーのパスワードとロールを更新
        const hashedPassword = await bcrypt.hash(account.password, 10);
        user.password = hashedPassword;
        user.role = account.role;
        user.status = UserStatus.ACTIVE;
        user.authMethods = [AuthMethod.EMAIL];
        await user.save();
        console.log(`✅ 既存ユーザーを更新しました: ${account.email}`);
      } else {
        // 新規ユーザーを作成
        const hashedPassword = await bcrypt.hash(account.password, 10);
        user = await UserModel.create({
          ...account,
          password: hashedPassword,
          status: UserStatus.ACTIVE,
          authMethods: [AuthMethod.EMAIL]
        });
        console.log(`✅ 新規ユーザーを作成しました: ${account.email}`);
      }
    }

    console.log('\n📧 テストアカウント一覧:');
    console.log('================================');
    for (const account of testAccounts) {
      console.log(`Email: ${account.email}`);
      console.log(`Password: ${account.password}`);
      console.log(`Role: ${account.role}`);
      console.log('--------------------------------');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDBから切断しました');
  }
}

// スクリプトを実行
createTestAccounts();