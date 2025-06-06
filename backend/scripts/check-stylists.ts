#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { UserModel } from '../src/features/users/models/user.model';
import { UserRole, UserStatus } from '../src/types';

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salomoni';

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDBに接続しました\n');

    // 全ユーザーを取得
    const allUsers = await UserModel.find({}).select('email name role status organizationId');
    console.log(`📊 総ユーザー数: ${allUsers.length}\n`);

    // ロール別に集計
    const roleCount: Record<string, number> = {};
    allUsers.forEach(user => {
      const role = user.role as string;
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    console.log('📊 ロール別ユーザー数:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count}人`);
    });
    console.log('');

    // 組織IDごとのユーザーを表示
    const orgUsers: Record<string, any[]> = {};
    allUsers.forEach(user => {
      const orgId = user.organizationId?.toString() || 'なし';
      if (!orgUsers[orgId]) {
        orgUsers[orgId] = [];
      }
      orgUsers[orgId].push(user);
    });

    console.log('📊 組織別ユーザー:');
    Object.entries(orgUsers).forEach(([orgId, users]) => {
      console.log(`\n組織ID: ${orgId}`);
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.name}) - ロール: ${user.role} - ステータス: ${user.status}`);
      });
    });

    // STYLISTロールのユーザーを検索
    console.log('\n🔍 STYLISTロールのユーザー検索:');
    const stylists = await UserModel.find({ role: UserRole.STYLIST });
    console.log(`  見つかった数: ${stylists.length}`);
    stylists.forEach(stylist => {
      console.log(`  - ${stylist.email} (${stylist.name})`);
    });

    // USERロールのユーザーを検索
    console.log('\n🔍 USERロールのユーザー検索:');
    const users = await UserModel.find({ role: UserRole.USER });
    console.log(`  見つかった数: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.name})`);
    });

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB接続を終了しました');
  }
}

if (require.main === module) {
  main().catch(console.error);
}