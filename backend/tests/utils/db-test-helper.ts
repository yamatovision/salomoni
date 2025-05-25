import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../../src/config/database';
import { logger } from '../../src/common/utils/logger';

let mongod: MongoMemoryServer | null = null;

/**
 * テスト用データベース接続ヘルパー
 */
export class DatabaseTestHelper {
  /**
   * テスト用インメモリMongoDBを起動して接続
   */
  static async connect(): Promise<void> {
    try {
      // 既存の接続があればクローズ
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      // インメモリMongoDBサーバーを起動
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      
      // 環境変数を一時的に上書き
      process.env.MONGODB_URI = uri;
      process.env.DB_NAME = 'salomoni-test';

      // データベースに接続
      await connectDatabase();
      
      logger.info('Test database connected');
    } catch (error) {
      logger.error('Failed to connect test database', error);
      throw error;
    }
  }

  /**
   * データベース接続を閉じてインメモリサーバーを停止
   */
  static async disconnect(): Promise<void> {
    try {
      await disconnectDatabase();
      
      if (mongod) {
        await mongod.stop();
        mongod = null;
      }
      
      logger.info('Test database disconnected');
    } catch (error) {
      logger.error('Failed to disconnect test database', error);
      throw error;
    }
  }

  /**
   * データベースをクリア（全コレクションを削除）
   */
  static async clearDatabase(): Promise<void> {
    try {
      const collections = mongoose.connection.collections;
      
      for (const key in collections) {
        const collection = collections[key];
        if (collection) {
          await collection.deleteMany({});
        }
      }
      
      logger.info('Test database cleared');
    } catch (error) {
      logger.error('Failed to clear test database', error);
      throw error;
    }
  }

  /**
   * 特定のコレクションをクリア
   */
  static async clearCollection(collectionName: string): Promise<void> {
    try {
      const collection = mongoose.connection.collection(collectionName);
      await collection.deleteMany({});
      
      logger.info(`Collection ${collectionName} cleared`);
    } catch (error) {
      logger.error(`Failed to clear collection ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * テストデータのシード投入
   */
  static async seedTestData(data: {
    collectionName: string;
    documents: any[];
  }[]): Promise<void> {
    try {
      for (const { collectionName, documents } of data) {
        const collection = mongoose.connection.collection(collectionName);
        
        if (documents.length > 0) {
          await collection.insertMany(documents);
          logger.info(`Seeded ${documents.length} documents to ${collectionName}`);
        }
      }
    } catch (error) {
      logger.error('Failed to seed test data', error);
      throw error;
    }
  }
}

/**
 * 本番データベースを使用したテスト用ヘルパー
 * ※テスト専用のデータベースを使用することを推奨
 */
export class ProductionDatabaseTestHelper {
  private static TEST_PREFIX = 'test_';

  /**
   * 本番データベースに接続（テスト用プレフィックス付き）
   */
  static async connect(): Promise<void> {
    try {
      // 環境変数から本番データベースURIを取得
      const prodUri = process.env.MONGODB_URI;
      if (!prodUri) {
        throw new Error('MONGODB_URI is not set');
      }

      // データベース名にテストプレフィックスを追加
      process.env.DB_NAME = `${this.TEST_PREFIX}${process.env.DB_NAME || 'salomoni'}`;

      await connectDatabase();
      
      logger.info('Connected to production database for testing');
    } catch (error) {
      logger.error('Failed to connect to production database', error);
      throw error;
    }
  }

  /**
   * テストデータをクリーンアップ
   */
  static async cleanup(): Promise<void> {
    try {
      // テストプレフィックスが付いたコレクションのみ削除
      if (!mongoose.connection.db) {
        throw new Error('Database connection not established');
      }
      
      const collections = await mongoose.connection.db.listCollections().toArray();
      
      for (const collection of collections) {
        if (collection.name.startsWith(this.TEST_PREFIX)) {
          await mongoose.connection.db.dropCollection(collection.name);
          logger.info(`Dropped test collection: ${collection.name}`);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup test data', error);
      throw error;
    }
  }
}

// 便利な関数を直接エクスポート
export const connectTestDatabase = DatabaseTestHelper.connect.bind(DatabaseTestHelper);
export const disconnectTestDatabase = DatabaseTestHelper.disconnect.bind(DatabaseTestHelper);
export const clearTestDatabase = DatabaseTestHelper.clearDatabase.bind(DatabaseTestHelper);
export const clearTestCollection = DatabaseTestHelper.clearCollection.bind(DatabaseTestHelper);
export const seedTestData = DatabaseTestHelper.seedTestData.bind(DatabaseTestHelper);

// 互換性のためのエイリアス
export const connectDB = connectTestDatabase;
export const clearDB = clearTestDatabase;
export const closeDB = disconnectTestDatabase;
export const setupTestDatabase = connectTestDatabase;
export const cleanupTestDatabase = disconnectTestDatabase;

// test-auth-helperから再エクスポート
export { createTestOrganizationWithOwner, createTestUserInOrganization } from './test-auth-helper';