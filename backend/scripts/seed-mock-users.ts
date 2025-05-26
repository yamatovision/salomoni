#!/usr/bin/env ts-node

/**
 * モックデータと同じユーザーを本番MongoDBに追加するスクリプト
 * フロントエンドのモックユーザーと同じデータを本番環境に作成し、
 * 実際にログインできることを確認する
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { UserModel, UserDocument } from '../src/features/users/models/user.model';
import { OrganizationModel, OrganizationDocument } from '../src/features/organizations/models/organization.model';
import { UserRole, UserStatus, AuthMethod, OrganizationStatus, OrganizationPlan } from '../src/types';

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salomoni';

// モックデータと同じユーザー情報
const mockUsers = [
  {
    email: 'superadmin@salomoni.jp',
    password: 'superadmin123',
    name: 'スーパー管理者',
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
  },
  {
    email: 'owner@salon.com',
    password: 'owner123',
    name: '山田 太郎',
    role: UserRole.OWNER,
    status: UserStatus.ACTIVE,
  },
  {
    email: 'admin@salon.com',
    password: 'admin123',
    name: '佐藤 花子',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  },
  {
    email: 'stylist1@salon.com',
    password: 'stylist123',
    name: '鈴木 美咲',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  },
];

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDBに接続しました');
  } catch (error) {
    console.error('❌ MongoDB接続エラー:', error);
    process.exit(1);
  }
}

async function createSuperAdmin() {
  try {
    const superAdminData = mockUsers.find(u => u.role === UserRole.SUPER_ADMIN);
    if (!superAdminData) {
      throw new Error('SuperAdminデータが見つかりません');
    }

    // 既存のSuperAdminを確認
    let superAdmin = await UserModel.findOne({ email: superAdminData.email });
    
    if (superAdmin) {
      console.log('✅ 既存のSuperAdminを使用します:', superAdmin.email);
      return superAdmin;
    }

    // SuperAdminを作成
    superAdmin = await UserModel.create({
      email: superAdminData.email,
      password: superAdminData.password,
      name: superAdminData.name,
      role: superAdminData.role,
      status: superAdminData.status,
      authMethods: [AuthMethod.EMAIL],
      preferences: {
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        language: 'ja',
        theme: 'auto',
      },
    });

    console.log('✅ SuperAdminを作成しました:', superAdmin.email);
    return superAdmin;
  } catch (error) {
    console.error('❌ SuperAdmin作成エラー:', error);
    throw error;
  }
}

async function createOwnerAndOrganization(): Promise<{ organization: OrganizationDocument; owner: UserDocument | null }> {
  try {
    const ownerData = mockUsers.find(u => u.role === UserRole.OWNER);
    if (!ownerData) {
      throw new Error('Ownerデータが見つかりません');
    }

    // 既存の組織を確認
    let organization = await OrganizationModel.findOne({ name: 'Salomoni Beauty Salon' });
    
    if (organization) {
      console.log('✅ 既存の組織を使用します:', organization.name);
      // 既存のOwnerも確認
      const existingOwner = await UserModel.findById(organization.ownerId);
      if (existingOwner) {
        console.log('✅ 既存のOwnerを使用します:', existingOwner.email);
      }
      return { organization, owner: existingOwner };
    }

    // Ownerユーザーを先に作成（組織IDなしで）
    let owner = await UserModel.findOne({ email: ownerData.email });
    
    if (!owner) {
      owner = await UserModel.create({
        email: ownerData.email,
        password: ownerData.password,
        name: ownerData.name,
        role: ownerData.role,
        status: ownerData.status,
        authMethods: [AuthMethod.EMAIL],
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          language: 'ja',
          theme: 'auto',
        },
      });
      console.log('✅ Ownerを作成しました:', owner.email);
    }

    // 組織を作成
    organization = await OrganizationModel.create({
      name: 'Salomoni Beauty Salon',
      displayName: 'Salomoni Beauty Salon',
      ownerId: owner.id,
      email: 'info@salomoni.jp',
      phone: '03-1234-5678',
      address: '東京都港区南青山3-12-6',
      status: OrganizationStatus.ACTIVE,
      plan: OrganizationPlan.ENTERPRISE,
      settings: {
        defaultWorkingHours: '10:00-20:00',
        allowLineAuth: true,
        autoAppointmentReminder: true,
      },
      metadata: {
        stylistCount: 3,
        monthlyTokenUsage: 0,
        tokenLimit: 3000000,
      },
    });

    console.log('✅ 組織を作成しました:', organization.name);

    // OwnerユーザーにorganizationIdを設定
    owner.organizationId = organization._id as any;
    await owner.save();
    console.log('✅ OwnerにorganizationIdを設定しました');

    return { organization, owner };
  } catch (error) {
    console.error('❌ Owner/組織作成エラー:', error);
    throw error;
  }
}

async function createRemainingUsers(organizationId: string) {
  console.log('\n👤 残りのユーザー作成を開始します...\n');

  // SuperAdminとOwner以外のユーザーを作成
  const remainingUsers = mockUsers.filter(u => 
    u.role !== UserRole.SUPER_ADMIN && u.role !== UserRole.OWNER
  );

  for (const userData of remainingUsers) {
    try {
      // 既存ユーザーの確認
      const existingUser = await UserModel.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  既存のユーザーをスキップ: ${userData.email}`);
        continue;
      }

      // ユーザー作成
      await UserModel.create({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        status: userData.status,
        organizationId: organizationId,
        authMethods: [AuthMethod.EMAIL],
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          language: 'ja',
          theme: 'auto',
        },
      });

      console.log(`✅ ユーザーを作成しました: ${userData.email} (${userData.role})`);

      // パスワード検証テスト
      const userWithPassword = await UserModel.findOne({ email: userData.email }).select('+password');
      if (userWithPassword) {
        const isPasswordValid = await userWithPassword.comparePassword(userData.password);
        console.log(`   パスワード検証: ${isPasswordValid ? '✅ OK' : '❌ NG'}`);
      }

    } catch (error: any) {
      console.error(`❌ ユーザー作成エラー (${userData.email}):`, error.message);
    }
  }
}

async function verifyLogin() {
  console.log('\n🔐 ログイン検証を開始します...\n');

  for (const userData of mockUsers) {
    try {
      const user = await UserModel.findOne({ email: userData.email }).select('+password');
      
      if (!user) {
        console.log(`❌ ユーザーが見つかりません: ${userData.email}`);
        continue;
      }

      const isPasswordValid = await user.comparePassword(userData.password);
      
      if (isPasswordValid) {
        console.log(`✅ ログイン成功: ${userData.email}`);
        console.log(`   - 名前: ${user.name}`);
        console.log(`   - ロール: ${user.role}`);
        console.log(`   - ステータス: ${user.status}`);
        if (user.organizationId) {
          console.log(`   - 組織ID: ${user.organizationId}`);
        }
      } else {
        console.log(`❌ ログイン失敗: ${userData.email} (パスワードが一致しません)`);
      }

    } catch (error: any) {
      console.error(`❌ ログイン検証エラー (${userData.email}):`, error.message);
    }
  }
}

async function main() {
  try {
    await connectDB();

    // 1. SuperAdminの作成
    await createSuperAdmin();

    // 2. Ownerと組織の作成
    const { organization } = await createOwnerAndOrganization();

    // 3. 残りのユーザー（Admin, Stylist）の作成
    await createRemainingUsers((organization as any)._id.toString());

    // 4. ログイン検証
    await verifyLogin();

    console.log('\n✅ すべての処理が完了しました');
    
    // 作成されたユーザー数を表示
    const userCount = await UserModel.countDocuments();
    console.log(`\n📊 総ユーザー数: ${userCount}`);

    // 組織数も表示
    const orgCount = await OrganizationModel.countDocuments();
    console.log(`📊 総組織数: ${orgCount}`);

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB接続を終了しました');
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}