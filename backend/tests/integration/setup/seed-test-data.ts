import { connectDatabase, disconnectDatabase } from '../../../src/config/database';
import { OrganizationModel } from '../../../src/features/organizations/models/organization.model';
import { UserModel } from '../../../src/features/users/models/user.model';
import { logger } from '../../../src/common/utils/logger';
import type { UserRole, OrganizationStatus, OrganizationPlan } from '../../../src/types';

/**
 * テスト用データのシード投入スクリプト
 * 
 * 使用方法:
 * npx ts-node tests/integration/setup/seed-test-data.ts
 */

async function seedTestData() {
  try {
    logger.info('Starting test data seeding...');

    // データベースに接続
    await connectDatabase();

    // 既存データをクリア
    await OrganizationModel.deleteMany({});
    await UserModel.deleteMany({});
    logger.info('Cleared existing data');

    // SuperAdminユーザーを作成
    const superAdmin = new UserModel({
      email: 'superadmin@salomoni.jp',
      password: 'SuperAdmin123!',
      name: 'システム管理者',
      roles: ['superadmin' as UserRole],
      status: 'active',
      authMethods: ['email'],
    });
    await superAdmin.save();
    logger.info('Created SuperAdmin user');

    // テスト組織1を作成
    const org1 = new OrganizationModel({
      name: 'test-salon-1',
      displayName: 'テストサロン銀座店',
      email: 'ginza@test-salon.jp',
      phone: '03-1111-2222',
      address: '東京都中央区銀座1-2-3',
      status: 'active' as OrganizationStatus,
      ownerId: new mongoose.Types.ObjectId(),
      plan: 'standard' as OrganizationPlan,
      settings: {
        maxUsers: 20,
        features: {
          aiChat: true,
          fourPillars: true,
          appointments: true,
          clientManagement: true,
        },
      },
    });
    await org1.save();
    logger.info('Created organization 1');

    // 組織1のオーナーを作成
    const owner1 = new UserModel({
      email: 'owner1@test-salon.jp',
      password: 'Owner123!',
      name: '山田太郎',
      nameKana: 'ヤマダタロウ',
      roles: ['owner' as UserRole],
      status: 'active',
      organizationId: org1.id,
      authMethods: ['email'],
      phone: '090-1111-2222',
    });
    await owner1.save();

    // 組織1のオーナーIDを更新
    org1.ownerId = owner1.id;
    await org1.save();
    logger.info('Created owner for organization 1');

    // 組織1の管理者を作成
    const admin1 = new UserModel({
      email: 'admin1@test-salon.jp',
      password: 'Admin123!',
      name: '佐藤花子',
      nameKana: 'サトウハナコ',
      roles: ['admin' as UserRole],
      status: 'active',
      organizationId: org1.id,
      authMethods: ['email'],
      department: '店舗管理部',
    });
    await admin1.save();
    logger.info('Created admin for organization 1');

    // 組織1のスタイリストを複数作成
    const stylists = [
      {
        email: 'stylist1@test-salon.jp',
        name: '鈴木美香',
        nameKana: 'スズキミカ',
        department: 'カット部門',
      },
      {
        email: 'stylist2@test-salon.jp',
        name: '田中健一',
        nameKana: 'タナカケンイチ',
        department: 'カラー部門',
      },
      {
        email: 'stylist3@test-salon.jp',
        name: '伊藤さくら',
        nameKana: 'イトウサクラ',
        department: 'パーマ部門',
      },
    ];

    for (const stylistData of stylists) {
      const stylist = new UserModel({
        ...stylistData,
        password: 'Stylist123!',
        roles: ['user' as UserRole],
        status: 'active',
        organizationId: org1.id,
        authMethods: ['email'],
      });
      await stylist.save();
    }
    logger.info(`Created ${stylists.length} stylists for organization 1`);

    // テスト組織2を作成（小規模サロン）
    const org2 = new OrganizationModel({
      name: 'test-salon-2',
      displayName: 'アットホームサロン',
      email: 'info@athome-salon.jp',
      phone: '03-3333-4444',
      address: '東京都世田谷区1-2-3',
      status: 'active' as OrganizationStatus,
      ownerId: new mongoose.Types.ObjectId(),
      plan: 'basic' as OrganizationPlan,
      settings: {
        maxUsers: 5,
      },
    });
    await org2.save();

    // 組織2のオーナー（スタイリスト兼任）を作成
    const owner2 = new UserModel({
      email: 'owner2@athome-salon.jp',
      password: 'Owner123!',
      name: '高橋美由紀',
      nameKana: 'タカハシミユキ',
      roles: ['owner' as UserRole, 'user' as UserRole], // 複数ロール
      status: 'active',
      organizationId: org2.id,
      authMethods: ['email', 'line'],
      lineUserId: 'U1234567890abcdef',
    });
    await owner2.save();

    // 組織2のオーナーIDを更新
    org2.ownerId = owner2.id;
    await org2.save();
    logger.info('Created organization 2 with owner');

    // サマリー表示
    const orgCount = await OrganizationModel.countDocuments();
    const userCount = await UserModel.countDocuments();
    
    logger.info('Test data seeding completed!');
    logger.info(`Created ${orgCount} organizations`);
    logger.info(`Created ${userCount} users`);

    // 作成したテストアカウント情報を表示
    console.log('\n=== テストアカウント情報 ===');
    console.log('SuperAdmin:');
    console.log('  Email: superadmin@salomoni.jp');
    console.log('  Password: SuperAdmin123!');
    console.log('\nテストサロン銀座店:');
    console.log('  Owner - Email: owner1@test-salon.jp, Password: Owner123!');
    console.log('  Admin - Email: admin1@test-salon.jp, Password: Admin123!');
    console.log('  Stylists - Password: Stylist123!');
    console.log('\nアットホームサロン:');
    console.log('  Owner - Email: owner2@athome-salon.jp, Password: Owner123!');
    console.log('========================\n');

  } catch (error) {
    logger.error('Failed to seed test data', error);
    throw error;
  } finally {
    await disconnectDatabase();
  }
}

// mongoose import
import mongoose from 'mongoose';

// スクリプト実行
seedTestData().catch(console.error);