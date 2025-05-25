import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import app from '../../../src';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { 
  createTestOrganization, 
  createTestUser,
  generateTestToken
  // cleanupTestData 
} from '../../utils/test-auth-helper';
import { ImportHistoryModel } from '../../../src/features/import/models/import-history.model';
import { ImportFileModel } from '../../../src/features/import/models/import-file.model';
import { ImportMappingModel } from '../../../src/features/import/models/import-mapping.model';
import { ClientModel } from '../../../src/features/clients/models/client.model';
import { UserRole, ImportStatus, ImportMethod } from '../../../src/types';

describe('データインポート機能統合テスト', () => {
  let mongoServer: MongoMemoryServer;
  let tracker: MilestoneTracker;
  let testOrganization: any;
  let adminUser: any;
  let adminToken: string;
  let testCsvPath: string;

  beforeAll(async () => {
    tracker = new MilestoneTracker();
    tracker.mark('テストスイート開始');

    // MongoDB Memory Server起動
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // 既存の接続を閉じる
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // 新しい接続
    await mongoose.connect(mongoUri);
    tracker.mark('MongoDB接続完了');

    // テスト用CSV作成
    testCsvPath = path.join(__dirname, 'test-clients.csv');
    const csvContent = `名前,生年月日,性別,メール,電話番号,メモ
田中太郎,1990-01-01,男,tanaka@example.com,090-1234-5678,常連のお客様
山田花子,1985-05-15,女,yamada@example.com,080-9876-5432,髪が細い
佐藤次郎,1992-03-20,男,,,新規のお客様
鈴木美咲,1988-12-10,女,suzuki@example.com,070-1111-2222,
高橋健一,1995-07-30,その他,takahashi@example.com,090-3333-4444,カラーリング希望`;
    fs.writeFileSync(testCsvPath, csvContent, 'utf-8');
    tracker.mark('テストCSVファイル作成完了');
  });

  beforeEach(async () => {
    tracker.setOperation('各テスト前準備');
    
    // コレクションクリア
    await Promise.all([
      ImportHistoryModel.deleteMany({}),
      ImportFileModel.deleteMany({}),
      ImportMappingModel.deleteMany({}),
      ClientModel.deleteMany({})
    ]);

    // テストデータ作成
    testOrganization = await createTestOrganization({ name: 'import-test-org' });
    
    // 管理者ユーザー作成（ユニークなメールアドレスを使用）
    adminUser = await createTestUser({
      name: 'Import Admin',
      role: UserRole.ADMIN,
      organizationId: testOrganization.id
    });
    
    adminToken = generateTestToken({
      userId: adminUser.id,
      email: adminUser.email,
      roles: [adminUser.role],
      currentRole: adminUser.role,
      organizationId: adminUser.organizationId
    });
    tracker.mark('テストデータセットアップ完了');
  });

  afterEach(async () => {
    // await cleanupTestData();
  });

  afterAll(async () => {
    tracker.setOperation('テストスイート終了処理');
    
    // テストCSVファイル削除
    if (fs.existsSync(testCsvPath)) {
      fs.unlinkSync(testCsvPath);
    }
    
    await mongoose.disconnect();
    await mongoServer.stop();
    
    tracker.mark('クリーンアップ完了');
    tracker.summary();
  });

  describe('POST /api/admin/import/upload - CSVファイルアップロード', () => {
    it('正常にCSVファイルをアップロードできる', async () => {
      tracker.setOperation('CSVアップロードテスト（正常系）');

      const response = await request(app)
        .post('/api/admin/import/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', testCsvPath);
      
      if (response.status !== 200) {
        console.error('Upload failed:', response.status, response.body);
      }
      expect(response.status).toBe(200);

      tracker.mark('APIレスポンス受信');

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.fileId).toBeDefined();
      expect(response.body.data.fileName).toBe('test-clients.csv');
      expect(response.body.data.recordCount).toBe(5);
      expect(response.body.data.preview).toBeDefined();
      expect(response.body.data.preview.clients).toHaveLength(5);
      expect(response.body.data.preview.summary.total).toBe(5);
      expect(response.body.data.mapping).toBeDefined();
      expect(response.body.data.mapping.length).toBeGreaterThan(0);

      // ファイル情報がDBに保存されているか確認
      const savedFile = await ImportFileModel.findOne({ fileId: response.body.data.fileId });
      expect(savedFile).toBeDefined();
      expect(savedFile?.organizationId).toBe(testOrganization.id);

      tracker.mark('アップロードテスト完了');
    });

    it('CSVファイル以外をアップロードするとエラーになる', async () => {
      tracker.setOperation('CSVアップロードテスト（異常系：ファイル形式）');

      const textFile = path.join(__dirname, 'test.txt');
      fs.writeFileSync(textFile, 'This is not a CSV file', 'utf-8');

      try {
        await request(app)
          .post('/api/admin/import/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('file', textFile)
          .expect(400);
      } finally {
        fs.unlinkSync(textFile);
      }

      tracker.mark('ファイル形式エラーテスト完了');
    });

    it('ファイルなしでリクエストするとエラーになる', async () => {
      tracker.setOperation('CSVアップロードテスト（異常系：ファイルなし）');

      const response = await request(app)
        .post('/api/admin/import/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('ファイルがアップロードされていません');

      tracker.mark('ファイルなしエラーテスト完了');
    });

    it('認証なしでアクセスするとエラーになる', async () => {
      tracker.setOperation('CSVアップロードテスト（異常系：認証なし）');

      try {
        await request(app)
          .post('/api/admin/import/upload')
          .attach('file', testCsvPath)
          .expect(401);
      } catch (error: any) {
        // EPIPEエラーは認証失敗で接続が切断されたことを示すので許容
        if (error.code !== 'EPIPE') {
          throw error;
        }
      }

      tracker.mark('認証エラーテスト完了');
    });
  });

  describe('POST /api/admin/import/execute - インポート実行', () => {
    let fileId: string;
    let mapping: any[];

    beforeEach(async () => {
      // ファイルをアップロード
      const uploadResponse = await request(app)
        .post('/api/admin/import/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', testCsvPath);

      fileId = uploadResponse.body.data.fileId;
      mapping = uploadResponse.body.data.mapping;
    });

    it('正常にインポートを実行できる（自動作成モード）', async () => {
      tracker.setOperation('インポート実行テスト（正常系：自動作成）');

      const response = await request(app)
        .post('/api/admin/import/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fileId,
          mapping,
          options: {
            autoCreateClients: true,
            updateExisting: false,
            skipErrors: false,
            dryRun: false
          }
        })
        .expect(200);

      tracker.mark('APIレスポンス受信');

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.importId).toBeDefined();
      expect(response.body.data.processed).toBe(5);
      expect(response.body.data.success).toBe(5);
      expect(response.body.data.failed).toBe(0);

      // インポート履歴を確認
      const importHistory = await ImportHistoryModel.findById(response.body.data.importId);
      expect(importHistory).toBeDefined();
      expect(importHistory?.status).toBe(ImportStatus.COMPLETED);
      expect(importHistory?.successCount).toBe(5);

      // クライアントが作成されているか確認
      const clients = await ClientModel.find({ organizationId: testOrganization.id });
      expect(clients).toHaveLength(5);
      expect(clients.map(c => c.name)).toContain('田中太郎');
      expect(clients.map(c => c.name)).toContain('山田花子');

      tracker.mark('インポート実行テスト完了');
    });

    it('ドライランモードで実行できる', async () => {
      tracker.setOperation('インポート実行テスト（ドライランモード）');

      const response = await request(app)
        .post('/api/admin/import/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fileId,
          mapping,
          options: {
            autoCreateClients: true,
            updateExisting: false,
            skipErrors: false,
            dryRun: true
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.processed).toBe(5);
      expect(response.body.data.success).toBe(5);

      // ドライランなのでクライアントは作成されていないはず
      const clients = await ClientModel.find({ organizationId: testOrganization.id });
      expect(clients).toHaveLength(0);

      tracker.mark('ドライランテスト完了');
    });

    it('既存クライアントの更新ができる', async () => {
      tracker.setOperation('インポート実行テスト（既存更新）');

      // 既存クライアントを作成
      await ClientModel.create({
        organizationId: testOrganization.id,
        name: '田中太郎',
        email: 'old-tanaka@example.com',
        visitCount: 5
      });

      const response = await request(app)
        .post('/api/admin/import/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fileId,
          mapping,
          options: {
            autoCreateClients: true,
            updateExisting: true,
            skipErrors: false,
            dryRun: false
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(5);

      // 既存クライアントが更新されているか確認
      const updatedClient = await ClientModel.findOne({ 
        organizationId: testOrganization.id,
        name: '田中太郎'
      });
      expect(updatedClient?.email).toBe('tanaka@example.com'); // 更新されている
      expect(updatedClient?.visitCount).toBe(5); // 維持されている

      tracker.mark('既存更新テスト完了');
    });

    it('無効なファイルIDでエラーになる', async () => {
      tracker.setOperation('インポート実行テスト（異常系：無効なファイルID）');

      const response = await request(app)
        .post('/api/admin/import/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fileId: 'invalid-file-id',
          mapping,
          options: {
            autoCreateClients: true
          }
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('インポートファイルが見つかりません');

      tracker.mark('無効ファイルIDテスト完了');
    });
  });

  describe('GET /api/admin/import/history - インポート履歴取得', () => {
    beforeEach(async () => {
      // テスト用インポート履歴を作成
      await ImportHistoryModel.create([
        {
          organizationId: testOrganization.id,
          method: ImportMethod.CSV,
          totalRecords: 100,
          successCount: 90,
          failureCount: 10,
          importedBy: adminUser.id,
          fileName: 'test1.csv',
          status: ImportStatus.COMPLETED,
          startedAt: new Date('2023-01-01'),
          completedAt: new Date('2023-01-01')
        },
        {
          organizationId: testOrganization.id,
          method: ImportMethod.CSV,
          totalRecords: 50,
          successCount: 45,
          failureCount: 5,
          importedBy: adminUser.id,
          fileName: 'test2.csv',
          status: ImportStatus.FAILED,
          startedAt: new Date('2023-02-01'),
          completedAt: new Date('2023-02-01')
        },
        {
          organizationId: testOrganization.id,
          method: ImportMethod.GOOGLE_CALENDAR,
          totalRecords: 30,
          successCount: 30,
          failureCount: 0,
          importedBy: adminUser.id,
          status: ImportStatus.COMPLETED,
          startedAt: new Date('2023-03-01'),
          completedAt: new Date('2023-03-01')
        }
      ]);
    });

    it('インポート履歴一覧を取得できる', async () => {
      tracker.setOperation('インポート履歴取得テスト（正常系）');

      const response = await request(app)
        .get('/api/admin/import/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.imports).toHaveLength(3);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.currentPage).toBe(1);

      tracker.mark('履歴取得テスト完了');
    });

    it('フィルタリングができる（method）', async () => {
      tracker.setOperation('インポート履歴取得テスト（フィルタ：method）');

      const response = await request(app)
        .get('/api/admin/import/history')
        .query({ method: ImportMethod.CSV })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.imports).toHaveLength(2);
      expect(response.body.data.imports.every((imp: any) => imp.method === ImportMethod.CSV)).toBe(true);

      tracker.mark('methodフィルタテスト完了');
    });

    it('フィルタリングができる（status）', async () => {
      tracker.setOperation('インポート履歴取得テスト（フィルタ：status）');

      const response = await request(app)
        .get('/api/admin/import/history')
        .query({ status: ImportStatus.COMPLETED })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.imports).toHaveLength(2);
      expect(response.body.data.imports.every((imp: any) => imp.status === ImportStatus.COMPLETED)).toBe(true);

      tracker.mark('statusフィルタテスト完了');
    });

    it('日付範囲でフィルタリングができる', async () => {
      tracker.setOperation('インポート履歴取得テスト（フィルタ：日付範囲）');

      const response = await request(app)
        .get('/api/admin/import/history')
        .query({ 
          dateFrom: '2023-01-15',
          dateTo: '2023-02-15'
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.imports).toHaveLength(1);
      expect(response.body.data.imports[0].fileName).toBe('test2.csv');

      tracker.mark('日付フィルタテスト完了');
    });

    it('ページネーションができる', async () => {
      tracker.setOperation('インポート履歴取得テスト（ページネーション）');

      const response = await request(app)
        .get('/api/admin/import/history')
        .query({ page: 2, limit: 2 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.imports).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(2);
      expect(response.body.data.pagination.hasPrev).toBe(true);
      expect(response.body.data.pagination.hasNext).toBe(false);

      tracker.mark('ページネーションテスト完了');
    });
  });

  describe('POST /api/admin/calendar/connect - カレンダー連携', () => {
    it('カレンダー連携設定ができる', async () => {
      tracker.setOperation('カレンダー連携テスト（正常系）');

      const response = await request(app)
        .post('/api/admin/calendar/connect')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          provider: 'google',
          authCode: 'test-auth-code-123',
          syncFrequency: 30
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.provider).toBe('google');
      expect(response.body.data.connected).toBe(true);
      expect(response.body.data.syncFrequency).toBe(30);
      expect(response.body.data.calendarId).toBeDefined();

      tracker.mark('カレンダー連携テスト完了');
    });

    it('無効なプロバイダーでエラーになる', async () => {
      tracker.setOperation('カレンダー連携テスト（異常系：無効なプロバイダー）');

      const response = await request(app)
        .post('/api/admin/calendar/connect')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          provider: 'invalid-provider',
          authCode: 'test-auth-code',
          syncFrequency: 30
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.code).toBe('VALIDATION_ERROR');

      tracker.mark('無効プロバイダーテスト完了');
    });

    it('同期頻度の範囲チェックが機能する', async () => {
      tracker.setOperation('カレンダー連携テスト（異常系：同期頻度範囲外）');

      const response = await request(app)
        .post('/api/admin/calendar/connect')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          provider: 'google',
          authCode: 'test-auth-code',
          syncFrequency: 2 // 5分未満
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('同期頻度は5〜1440分の間である必要があります');
      expect(response.body.code).toBe('VALIDATION_ERROR');

      tracker.mark('同期頻度チェックテスト完了');
    });
  });

  describe('権限チェック', () => {
    let userToken: string;

    beforeEach(async () => {
      // 一般ユーザー作成（ユニークなメールアドレスを使用）
      const normalUser = await createTestUser({
        name: 'Normal User',
        role: UserRole.USER,
        organizationId: testOrganization.id
      });
      userToken = generateTestToken({
        userId: normalUser.id,
        email: normalUser.email,
        roles: [normalUser.role],
        currentRole: normalUser.role,
        organizationId: normalUser.organizationId
      });
    });

    it('一般ユーザーはインポート機能にアクセスできない', async () => {
      tracker.setOperation('権限チェックテスト');

      // アップロード - EPIPEエラーが発生する可能性があるためtry-catchで処理
      try {
        await request(app)
          .post('/api/admin/import/upload')
          .set('Authorization', `Bearer ${userToken}`)
          .attach('file', testCsvPath)
          .expect(403);
      } catch (error: any) {
        // EPIPEエラーは権限チェックで接続が切断されたことを示すので許容
        if (error.code !== 'EPIPE') {
          throw error;
        }
      }

      // 実行
      await request(app)
        .post('/api/admin/import/execute')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fileId: 'dummy',
          mapping: [],
          options: {}
        })
        .expect(403);

      // 履歴取得
      await request(app)
        .get('/api/admin/import/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      // カレンダー連携
      await request(app)
        .post('/api/admin/calendar/connect')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          provider: 'google',
          authCode: 'test',
          syncFrequency: 30
        })
        .expect(403);

      tracker.mark('権限チェックテスト完了');
    });
  });

  describe('エラーハンドリングとエッジケース', () => {
    it('空のCSVファイルをアップロードするとエラーになる', async () => {
      tracker.setOperation('エラーハンドリングテスト（空のCSV）');

      const emptyCsvPath = path.join(__dirname, 'empty.csv');
      fs.writeFileSync(emptyCsvPath, '', 'utf-8');

      try {
        const response = await request(app)
          .post('/api/admin/import/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('file', emptyCsvPath)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('CSVファイルにデータが含まれていません');
      } finally {
        fs.unlinkSync(emptyCsvPath);
      }

      tracker.mark('空CSVテスト完了');
    });

    it('大量データのインポートができる', async () => {
      tracker.setOperation('大量データインポートテスト');

      // 1000件のデータを含むCSVを作成
      const largeCsvPath = path.join(__dirname, 'large.csv');
      let csvContent = '名前,生年月日,性別,メール,電話番号,メモ\n';
      for (let i = 1; i <= 1000; i++) {
        csvContent += `テストユーザー${i},1990-01-01,男,test${i}@example.com,090-0000-${String(i).padStart(4, '0')},テストデータ${i}\n`;
      }
      fs.writeFileSync(largeCsvPath, csvContent, 'utf-8');

      try {
        // アップロード
        const uploadResponse = await request(app)
          .post('/api/admin/import/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('file', largeCsvPath)
          .expect(200);

        expect(uploadResponse.body.data.recordCount).toBe(1000);

        // インポート実行
        const importResponse = await request(app)
          .post('/api/admin/import/execute')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            fileId: uploadResponse.body.data.fileId,
            mapping: uploadResponse.body.data.mapping,
            options: {
              autoCreateClients: true,
              updateExisting: false,
              skipErrors: true,
              dryRun: false
            }
          })
          .expect(200);

        expect(importResponse.body.data.processed).toBe(1000);
        expect(importResponse.body.data.success).toBe(1000);

        // クライアントが作成されているか確認
        const clientCount = await ClientModel.countDocuments({ organizationId: testOrganization.id });
        expect(clientCount).toBe(1000);
      } finally {
        fs.unlinkSync(largeCsvPath);
      }

      tracker.mark('大量データインポートテスト完了');
    });
  });
});