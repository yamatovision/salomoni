import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '../src/features/users/models/user.model';
import { UserRole } from '../src/types';

// 環境変数の読み込み
dotenv.config();

async function listAllUsers() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDBに接続しました\n');

    // すべてのユーザーを取得
    const allUsers = await UserModel.find().sort({ createdAt: -1 });
    console.log(`📊 総ユーザー数: ${allUsers.length}`);

    // ロール別にグループ化
    const usersByRole = {
      SUPER_ADMIN: [] as any[],
      ADMIN: [] as any[],
      STYLIST: [] as any[],
      OTHER: [] as any[]
    };

    allUsers.forEach(user => {
      const userData = {
        id: (user as any)._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        authMethods: user.authMethods,
        organizationId: user.organizationId,
        createdAt: user.createdAt
      };

      switch (user.role) {
        case UserRole.SUPER_ADMIN:
          usersByRole.SUPER_ADMIN.push(userData);
          break;
        case UserRole.ADMIN:
          usersByRole.ADMIN.push(userData);
          break;
        case UserRole.STYLIST:
          usersByRole.STYLIST.push(userData);
          break;
        default:
          usersByRole.OTHER.push(userData);
      }
    });

    // SuperAdminユーザーの表示
    console.log('\n🔴 SuperAdminユーザー:');
    console.log('=====================================');
    if (usersByRole.SUPER_ADMIN.length > 0) {
      usersByRole.SUPER_ADMIN.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name}`);
        console.log(`Status: ${user.status}`);
        console.log(`Auth Methods: ${user.authMethods.join(', ')}`);
        console.log(`Created: ${user.createdAt}`);
        console.log('-------------------------------------');
      });
    } else {
      console.log('SuperAdminユーザーが存在しません');
    }

    // Adminユーザーの表示
    console.log('\n🟠 Adminユーザー:');
    console.log('=====================================');
    if (usersByRole.ADMIN.length > 0) {
      usersByRole.ADMIN.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name}`);
        console.log(`Status: ${user.status}`);
        console.log(`Organization ID: ${user.organizationId}`);
        console.log(`Created: ${user.createdAt}`);
        console.log('-------------------------------------');
      });
    } else {
      console.log('Adminユーザーが存在しません');
    }

    // Stylistユーザーの表示（最初の5件のみ）
    console.log('\n🟢 Stylistユーザー (最初の5件):');
    console.log('=====================================');
    if (usersByRole.STYLIST.length > 0) {
      usersByRole.STYLIST.slice(0, 5).forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name}`);
        console.log(`Status: ${user.status}`);
        console.log(`Organization ID: ${user.organizationId}`);
        console.log(`Created: ${user.createdAt}`);
        console.log('-------------------------------------');
      });
      if (usersByRole.STYLIST.length > 5) {
        console.log(`... 他 ${usersByRole.STYLIST.length - 5} 件のStylistユーザー`);
      }
    } else {
      console.log('Stylistユーザーが存在しません');
    }

    // アクティブなテストユーザーの検索
    console.log('\n🧪 テスト可能なアクティブユーザー:');
    console.log('=====================================');
    const activeTestUsers = allUsers.filter(user => 
      user.status === 'active' && 
      (user.email.includes('test') || user.email.includes('demo'))
    );
    
    if (activeTestUsers.length > 0) {
      activeTestUsers.forEach(user => {
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Status: ${user.status}`);
        console.log('-------------------------------------');
      });
    } else {
      console.log('テスト用のアクティブユーザーが見つかりません');
    }

    // その他のユーザー
    if (usersByRole.OTHER.length > 0) {
      console.log('\n⚪ その他のユーザー:');
      console.log('=====================================');
      usersByRole.OTHER.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name}`);
        console.log(`Role: ${user.role}`);
        console.log(`Status: ${user.status}`);
        console.log(`Created: ${user.createdAt}`);
        console.log('-------------------------------------');
      });
    }

    // 統計情報
    console.log('\n📈 統計情報:');
    console.log('=====================================');
    console.log(`SuperAdmin: ${usersByRole.SUPER_ADMIN.length}人`);
    console.log(`Admin: ${usersByRole.ADMIN.length}人`);
    console.log(`Stylist: ${usersByRole.STYLIST.length}人`);
    console.log(`その他: ${usersByRole.OTHER.length}人`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDBから切断しました');
  }
}

// スクリプトを実行
listAllUsers();