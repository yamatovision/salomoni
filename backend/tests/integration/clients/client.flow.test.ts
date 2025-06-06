import request from 'supertest';
import app from '../../../src/index';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../utils/db-test-helper';
import { 
  createTestUserWithToken, 
  setupTestOrganizationWithOwner
} from '../../utils/test-auth-helper';
import { ClientModel } from '../../../src/features/clients/models/client.model';
import { UserRole, ClientCreateRequest, ClientUpdateRequest } from '../../../src/types';
import { MilestoneTracker } from '../../utils/MilestoneTracker';

describe('クライアント管理 統合テスト', () => {
  let ownerToken: string;
  let adminToken: string;
  let userToken: string;
  let organizationId: string;

  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // テスト用組織とOwnerを作成
    const ownerData = await setupTestOrganizationWithOwner();
    ownerToken = ownerData.ownerToken;
    organizationId = ownerData.organization.id;

    // Admin用組織とユーザーを作成
    const adminData = await createTestUserWithToken({
      email: 'admin-client@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
      organizationId,
    });
    adminToken = adminData.token;

    // 一般ユーザーを作成
    const userData = await createTestUserWithToken({
      email: 'user-client@test.com',
      password: 'password123',
      role: UserRole.USER,
      organizationId,
    });
    userToken = userData.token;
  });

  describe('POST /api/admin/clients - クライアント作成', () => {
    it('Adminがクライアントを作成できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      const clientData: ClientCreateRequest = {
        name: '山田花子',
        birthDate: '1990-05-15',
        gender: 'female',
        email: 'hanako@example.com',
        phoneNumber: '090-1234-5678',
        memo: 'テストクライアント',
      };

      tracker.setOperation('クライアント作成リクエスト');
      const response = await request(app)
        .post('/api/admin/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData);
      tracker.mark('レスポンス受信');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: clientData.name,
        email: clientData.email,
        gender: clientData.gender,
        organizationId,
      });
      expect(response.body.data.id).toBeDefined();
      tracker.mark('テスト完了');
      tracker.summary();
    });

    it('Ownerがクライアントを作成できる', async () => {
      const clientData: ClientCreateRequest = {
        name: '鈴木太郎',
        phoneNumber: '080-9876-5432',
      };

      const response = await request(app)
        .post('/api/admin/clients')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(clientData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(clientData.name);
    });

    it('一般ユーザーはクライアントを作成できない', async () => {
      const clientData: ClientCreateRequest = {
        name: '田中次郎',
        phoneNumber: '080-1234-5678',
      };

      const response = await request(app)
        .post('/api/admin/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send(clientData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('必須フィールドが不足している場合エラーになる', async () => {
      const response = await request(app)
        .post('/api/admin/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('クライアント名は必須です');
    });

    it('重複するメールアドレスでエラーになる', async () => {
      const clientData: ClientCreateRequest = {
        name: '重複テスト1',
        email: 'duplicate@example.com',
        phoneNumber: '080-2345-6789',
      };

      // 最初のクライアント作成
      await request(app)
        .post('/api/admin/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData);

      // 重複するメールで2番目のクライアント作成
      const response = await request(app)
        .post('/api/admin/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '重複テスト2',
          email: 'duplicate@example.com',
          phoneNumber: '080-3456-7890',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('既に登録されています');
    });

    it('生年月日が設定されている場合、四柱推命データが自動計算される', async () => {
      const clientData: ClientCreateRequest = {
        name: '四柱推命テスト',
        birthDate: '1985-03-20',
        gender: 'male',
        phoneNumber: '080-4567-8901',
      };

      const response = await request(app)
        .post('/api/admin/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // データベースから直接確認
      const client = await ClientModel.findById(response.body.data.id);
      expect(client?.fourPillarsDataId).toBeDefined();
    });
  });

  describe('GET /api/admin/clients - クライアント一覧取得', () => {
    beforeEach(async () => {
      // テスト用クライアントを複数作成
      const clients = [
        { name: '佐藤一郎', email: 'sato@example.com', gender: 'male' },
        { name: '高橋二郎', email: 'takahashi@example.com', gender: 'male' },
        { name: '伊藤三子', email: 'ito@example.com', gender: 'female' },
      ];

      for (const client of clients) {
        await ClientModel.create({ ...client, organizationId });
      }
    });

    it('クライアント一覧を取得できる', async () => {
      const response = await request(app)
        .get('/api/admin/clients')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clients).toHaveLength(3);
      expect(response.body.data.pagination).toMatchObject({
        currentPage: 1,
        totalItems: 3,
      });
    });

    it('検索条件でフィルタリングできる', async () => {
      const response = await request(app)
        .get('/api/admin/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ searchTerm: '佐藤' });

      expect(response.status).toBe(200);
      expect(response.body.data.clients).toHaveLength(1);
      expect(response.body.data.clients[0].name).toBe('佐藤一郎');
    });

    it('性別でフィルタリングできる', async () => {
      const response = await request(app)
        .get('/api/admin/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ gender: 'female' });

      expect(response.status).toBe(200);
      expect(response.body.data.clients).toHaveLength(1);
      expect(response.body.data.clients[0].name).toBe('伊藤三子');
    });

    it('ページネーションが正しく動作する', async () => {
      const response = await request(app)
        .get('/api/admin/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.clients).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        currentPage: 1,
        itemsPerPage: 2,
        hasNext: true,
      });
    });

    it('他組織のクライアントは取得できない', async () => {
      // 別組織を作成
      const otherOrgData = await setupTestOrganizationWithOwner();

      // 別組織にクライアントを作成
      await ClientModel.create({
        name: '他組織のクライアント',
        organizationId: otherOrgData.organization.id,
      });

      const response = await request(app)
        .get('/api/admin/clients')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.clients).toHaveLength(3); // 自組織の3件のみ
      expect(response.body.data.clients.every((c: any) => c.organizationId === organizationId)).toBe(true);
    });
  });

  describe('GET /api/clients/:id - クライアント詳細取得', () => {
    let clientId: string;

    beforeEach(async () => {
      const client = await ClientModel.create({
        name: '詳細取得テスト',
        organizationId,
        email: 'detail@example.com',
      });
      clientId = client._id.toString();
    });

    it('クライアント詳細を取得できる', async () => {
      const response = await request(app)
        .get(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: clientId,
        name: '詳細取得テスト',
        email: 'detail@example.com',
      });
    });

    it('一般ユーザーもクライアント詳細を取得できる', async () => {
      const response = await request(app)
        .get(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('存在しないIDでエラーになる', async () => {
      const response = await request(app)
        .get('/api/clients/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('クライアントが見つかりません');
    });

    it('他組織のクライアントは取得できない', async () => {
      // 別組織を作成
      const otherOrgData = await setupTestOrganizationWithOwner();

      // 別組織にクライアントを作成
      const otherClient = await ClientModel.create({
        name: '他組織のクライアント',
        organizationId: otherOrgData.organization.id,
      });

      const response = await request(app)
        .get(`/api/clients/${otherClient._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/clients/:id - クライアント更新', () => {
    let clientId: string;

    beforeEach(async () => {
      const client = await ClientModel.create({
        name: '更新テスト',
        organizationId,
        email: 'update@example.com',
      });
      clientId = client._id.toString();
    });

    it('クライアント情報を更新できる', async () => {
      const updateData: ClientUpdateRequest = {
        name: '更新後の名前',
        phoneNumber: '090-0000-0000',
        memo: '更新されたメモ',
      };

      const response = await request(app)
        .put(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: clientId,
        name: updateData.name,
        phoneNumber: updateData.phoneNumber,
        memo: updateData.memo,
      });
    });

    it('生年月日を更新すると四柱推命が再計算される', async () => {
      const updateData: ClientUpdateRequest = {
        birthDate: '1992-08-10',
      };

      const response = await request(app)
        .put(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      
      // データベースから直接確認
      const client = await ClientModel.findById(clientId);
      expect(client?.fourPillarsDataId).toBeDefined();
    });

    it('メールアドレスの重複でエラーになる', async () => {
      // 別のクライアントを作成
      await ClientModel.create({
        name: '別のクライアント',
        organizationId,
        email: 'existing@example.com',
      });

      const updateData: ClientUpdateRequest = {
        email: 'existing@example.com',
      };

      const response = await request(app)
        .put(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('既に登録されています');
    });

    it('一般ユーザーはクライアントを更新できない', async () => {
      const response = await request(app)
        .put(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: '不正な更新' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/clients/:id - クライアント削除', () => {
    let clientId: string;

    beforeEach(async () => {
      const client = await ClientModel.create({
        name: '削除テスト',
        organizationId,
      });
      clientId = client._id.toString();
    });

    it('クライアントを削除できる', async () => {
      const response = await request(app)
        .delete(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // データベースから削除されていることを確認
      const deletedClient = await ClientModel.findById(clientId);
      expect(deletedClient).toBeNull();
    });

    it('存在しないクライアントの削除でエラーになる', async () => {
      const response = await request(app)
        .delete('/api/clients/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('一般ユーザーはクライアントを削除できない', async () => {
      const response = await request(app)
        .delete(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/clients/daily - 本日の担当クライアント取得', () => {
    beforeEach(async () => {
      // 本日訪問のクライアントを作成
      const today = new Date();
      await ClientModel.create({
        name: '本日訪問予定',
        organizationId,
        lastVisitDate: today,
        visitCount: 1,
      });

      // 昨日訪問のクライアントを作成
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await ClientModel.create({
        name: '昨日訪問',
        organizationId,
        lastVisitDate: yesterday,
        visitCount: 1,
      });
    });

    it('本日の担当クライアントを取得できる', async () => {
      const response = await request(app)
        .get('/api/clients/daily')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('本日訪問予定');
    });

    it('日付を指定して取得できる', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const response = await request(app)
        .get('/api/clients/daily')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ date: yesterday.toISOString().split('T')[0] });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('昨日訪問');
    });

    it('認証なしではアクセスできない', async () => {
      const response = await request(app)
        .get('/api/clients/daily');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/clients/:id/visit - クライアント訪問記録', () => {
    let clientId: string;

    beforeEach(async () => {
      const client = await ClientModel.create({
        name: '訪問記録テスト',
        organizationId,
        visitCount: 0,
      });
      clientId = client._id.toString();
    });

    it('訪問情報を記録できる', async () => {
      const response = await request(app)
        .post(`/api/clients/${clientId}/visit`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.visitCount).toBe(1);
      expect(response.body.data.lastVisitDate).toBeDefined();
    });

    it('存在しないクライアントでエラーになる', async () => {
      const response = await request(app)
        .post('/api/clients/507f1f77bcf86cd799439011/visit')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    it('他組織のクライアントの訪問は記録できない', async () => {
      // 別組織を作成
      const otherOrgData = await setupTestOrganizationWithOwner();

      // 別組織にクライアントを作成
      const otherClient = await ClientModel.create({
        name: '他組織のクライアント',
        organizationId: otherOrgData.organization.id,
      });

      const response = await request(app)
        .post(`/api/clients/${otherClient._id}/visit`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量のクライアントでもページネーションが高速に動作する', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 100件のクライアントを作成
      tracker.setOperation('100件のクライアント作成');
      const clients = [];
      for (let i = 0; i < 100; i++) {
        clients.push({
          name: `テストクライアント${i}`,
          organizationId,
          email: `test${i}@example.com`,
          visitCount: Math.floor(Math.random() * 10),
        });
      }
      await ClientModel.insertMany(clients);
      tracker.mark('クライアント作成完了');

      // ページネーションでの取得
      tracker.setOperation('ページネーション取得');
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/admin/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 5, limit: 20 });
      const endTime = Date.now();
      tracker.mark('レスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.data.clients).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(1000); // 1秒以内

      tracker.summary();
    });
  });

  describe('GET /api/clients/my-clients - スタイリストの担当クライアント取得', () => {
    let stylistId: string;
    let clientIds: string[] = [];

    beforeEach(async () => {
      // スタイリストユーザーを作成
      const stylistData = await createTestUserWithToken({
        email: 'stylist-test@test.com',
        password: 'password123',
        role: UserRole.USER,
        organizationId,
      });
      stylistId = stylistData.user.id;
      userToken = stylistData.token;

      // テストクライアントを作成
      const clients = await Promise.all([
        ClientModel.create({
          name: 'クライアントA',
          organizationId,
          gender: 'female',
          birthDate: new Date('1990-01-01'),
        }),
        ClientModel.create({
          name: 'クライアントB',
          organizationId,
          gender: 'male',
          birthDate: new Date('1985-05-05'),
        }),
        ClientModel.create({
          name: 'クライアントC',
          organizationId,
          gender: 'female',
          birthDate: new Date('1995-10-10'),
        }),
      ]);
      clientIds = clients.map(c => c._id.toString());

      // 予約データを作成してスタイリストとクライアントを関連付け
      const { AppointmentModel } = await import('../../../src/features/appointments/models/appointment.model');
      await Promise.all([
        AppointmentModel.create({
          organizationId,
          clientId: clientIds[0],
          stylistId,
          scheduledAt: new Date(),
          duration: 60,
          services: ['カット'],
          status: 'completed',
        }),
        AppointmentModel.create({
          organizationId,
          clientId: clientIds[1],
          stylistId,
          scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1週間前
          duration: 90,
          services: ['カラー'],
          status: 'completed',
        }),
        // クライアントCは別のスタイリストが担当
        AppointmentModel.create({
          organizationId,
          clientId: clientIds[2],
          stylistId: 'other-stylist-id',
          scheduledAt: new Date(),
          duration: 120,
          services: ['パーマ'],
          status: 'scheduled',
        }),
      ]);
    });

    it('スタイリストが自分の担当クライアント一覧を取得できる', async () => {
      const response = await request(app)
        .get('/api/clients/my-clients')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clients).toHaveLength(2); // クライアントAとBのみ
      expect(response.body.data.clients[0].name).toBe('クライアントA');
      expect(response.body.data.clients[1].name).toBe('クライアントB');
      expect(response.body.data.pagination).toBeDefined();
    });

    it('管理者はアクセスできない', async () => {
      const response = await request(app)
        .get('/api/clients/my-clients')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('このAPIはスタイリストのみ利用可能です');
    });

    it('オーナーはアクセスできない', async () => {
      const response = await request(app)
        .get('/api/clients/my-clients')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('このAPIはスタイリストのみ利用可能です');
    });

    it('ページネーションが機能する', async () => {
      // 多数のクライアントを追加
      const moreClients = await Promise.all(
        Array(10).fill(null).map((_, i) => 
          ClientModel.create({
            name: `追加クライアント${i + 1}`,
            organizationId,
          })
        )
      );

      // 全てのクライアントに予約を作成
      const { AppointmentModel } = await import('../../../src/features/appointments/models/appointment.model');
      await Promise.all(
        moreClients.map((client, index) => 
          AppointmentModel.create({
            organizationId,
            clientId: client._id,
            stylistId,
            scheduledAt: new Date(Date.now() + (index + 1) * 60 * 60 * 1000), // 1時間ずつずらす
            duration: 60,
            services: ['カット'],
            status: 'scheduled',
          })
        )
      );

      // 1ページ目を取得（5件ずつ）
      const response1 = await request(app)
        .get('/api/clients/my-clients?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response1.status).toBe(200);
      expect(response1.body.data.clients).toHaveLength(5);
      expect(response1.body.data.pagination.hasNext).toBe(true);
      expect(response1.body.data.pagination.totalItems).toBe(12); // 2 + 10

      // 2ページ目を取得
      const response2 = await request(app)
        .get('/api/clients/my-clients?page=2&limit=5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response2.status).toBe(200);
      expect(response2.body.data.clients).toHaveLength(5);
      expect(response2.body.data.pagination.hasPrev).toBe(true);
    });

    it('担当クライアントがいない場合は空の配列を返す', async () => {
      // 新しいスタイリストを作成
      const newStylistData = await createTestUserWithToken({
        email: 'new-stylist@test.com',
        password: 'password123',
        role: UserRole.USER,
        organizationId,
      });

      const response = await request(app)
        .get('/api/clients/my-clients')
        .set('Authorization', `Bearer ${newStylistData.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clients).toHaveLength(0);
      expect(response.body.data.pagination.totalItems).toBe(0);
    });
  });
});