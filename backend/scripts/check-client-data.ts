import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ClientModel } from '../src/features/clients/models/client.model';
import { UserModel } from '../src/features/users/models/user.model';
import { logger } from '../src/common/utils/logger';

dotenv.config();

async function checkClientData() {
  try {
    // MongoDB接続
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beauty-salon');
    logger.info('Connected to MongoDB');

    // 組織IDを取得（テスト用）
    const organizationId = '684263a258abd6cbf5c63089'; // ログから取得した組織ID

    // クライアントコレクションのデータを確認
    const clients = await ClientModel.find({ organizationId }).limit(5);
    logger.info('Client collection data:', {
      count: clients.length,
      firstClient: clients[0] ? {
        id: clients[0].id,
        name: clients[0].name,
        email: clients[0].email,
        birthDate: clients[0].birthDate,
        phoneNumber: clients[0].phoneNumber,
        collectionName: clients[0].collection.name,
        hasRole: 'role' in clients[0],
      } : null,
    });

    // ユーザーコレクションのデータを確認
    const users = await UserModel.find({ organizationId }).limit(5);
    logger.info('User collection data:', {
      count: users.length,
      firstUser: users[0] ? {
        id: users[0].id,
        name: users[0].name,
        email: users[0].email,
        role: users[0].role,
        collectionName: users[0].collection.name,
      } : null,
    });

    // コレクション名を確認
    const collections = await mongoose.connection.db.listCollections().toArray();
    logger.info('Database collections:', collections.map(c => c.name));

    // クライアントコレクションの全ドキュメント数を確認
    const clientCount = await ClientModel.countDocuments({});
    const userCount = await UserModel.countDocuments({});
    logger.info('Document counts:', { clientCount, userCount });

  } catch (error) {
    logger.error('Error checking client data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkClientData();