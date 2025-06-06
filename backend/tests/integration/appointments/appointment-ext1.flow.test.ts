import request from 'supertest';
import app from '../../../src';
import {
  connectDB,
  clearDB,
  closeDB,
} from '../../utils/db-test-helper';
import {
  createTestUserWithToken,
  createTestOrganization,
} from '../../utils/test-auth-helper';
import { ClientModel } from '../../../src/features/clients/models/client.model';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { UserRole, API_PATHS } from '../../../src/types';

describe('A-004-EXT1: 予約登録機能の改善 統合テスト', () => {
  let tracker: MilestoneTracker;
  let adminToken: string;
  let organizationId: string;
  let testClients: any[] = [];
  let testStylists: any[] = [];

  beforeAll(async () => {
    await connectDB();
    tracker = new MilestoneTracker();
    tracker.mark('テスト開始');
  });

  afterAll(async () => {
    await clearDB();
    await closeDB();
    tracker.summary();
  });

  beforeEach(async () => {
    await clearDB();
    tracker.setOperation('テストデータ準備');

    // テスト組織作成
    const org = await createTestOrganization();
    organizationId = org.id;

    // 管理者ユーザー作成
    const admin = await createTestUserWithToken(UserRole.ADMIN, organizationId);
    adminToken = admin.token;

    // テストクライアント作成（複数）
    testClients = [];
    for (let i = 1; i <= 3; i++) {
      const client = await ClientModel.create({
        organizationId,
        name: `テストクライアント${i}`,
        furigana: `てすとくらいあんと${i}`,
        email: `test${i}@example.com`,
        phoneNumber: `090-1234-567${i}`,
        birthDate: new Date(`199${i}-01-01`),
        gender: i % 2 === 0 ? 'male' : 'female',
      });
      testClients.push(client);
    }

    // テストスタイリスト作成（複数）
    testStylists = [];
    for (let i = 1; i <= 3; i++) {
      const stylist = await createTestUserWithToken(UserRole.USER, organizationId);
      testStylists.push(stylist.user);
    }

    tracker.mark('準備完了');
  });

  describe('既存クライアント選択機能', () => {
    it('管理者がクライアント一覧を取得できる', async () => {
      tracker.setOperation('クライアント一覧取得');

      const response = await request(app)
        .get(API_PATHS.CLIENTS.LIST)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clients).toHaveLength(3);
      
      // クライアント情報が正しく返されることを確認
      const client = response.body.data.clients[0];
      expect(client).toHaveProperty('id');
      expect(client).toHaveProperty('name');
      expect(client).toHaveProperty('phoneNumber');
      expect(client).toHaveProperty('gender');

      tracker.mark('クライアント一覧取得成功');
    });

    it('クライアント一覧は名前や電話番号で検索できる', async () => {
      tracker.setOperation('クライアント検索');

      // 名前で検索
      const nameResponse = await request(app)
        .get(API_PATHS.CLIENTS.LIST)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'クライアント2' });

      expect(nameResponse.status).toBe(200);
      expect(nameResponse.body.data.clients).toHaveLength(1);
      expect(nameResponse.body.data.clients[0].name).toBe('テストクライアント2');

      // 電話番号で検索
      const phoneResponse = await request(app)
        .get(API_PATHS.CLIENTS.LIST)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: '090-1234-5673' });

      expect(phoneResponse.status).toBe(200);
      expect(phoneResponse.body.data.clients).toHaveLength(1);
      expect(phoneResponse.body.data.clients[0].name).toBe('テストクライアント3');

      tracker.mark('クライアント検索成功');
    });

    it('既存クライアントを選択して予約を作成できる', async () => {
      tracker.setOperation('既存クライアント予約作成');

      const selectedClient = testClients[1];
      const selectedStylist = testStylists[0];

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const appointmentData = {
        clientId: selectedClient._id.toString(),
        stylistId: selectedStylist.id,
        scheduledAt: tomorrow.toISOString(),
        duration: 60,
        services: ['カット'],
        note: '既存クライアントからの予約',
      };

      const response = await request(app)
        .post(API_PATHS.APPOINTMENTS.BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clientId).toBe(selectedClient._id.toString());
      expect(response.body.data.stylistId).toBe(selectedStylist.id);

      tracker.mark('既存クライアント予約作成成功');
    });
  });

  describe('スタイリスト表示機能', () => {
    it('管理者がスタイリスト一覧を取得できる', async () => {
      tracker.setOperation('スタイリスト一覧取得');

      const response = await request(app)
        .get(API_PATHS.USERS.LIST)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ role: UserRole.USER });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // ページネーション付きレスポンスの確認
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.data).toHaveLength(3);
      
      // スタイリスト情報が正しく返されることを確認
      const stylist = response.body.data.data[0];
      expect(stylist).toHaveProperty('id');
      expect(stylist).toHaveProperty('name');
      expect(stylist).toHaveProperty('email');
      expect(stylist.role).toBe(UserRole.USER);

      tracker.mark('スタイリスト一覧取得成功');
    });

    it('スタイリストを選択して予約を作成できる', async () => {
      tracker.setOperation('スタイリスト選択予約作成');

      const selectedClient = testClients[0];
      const selectedStylist = testStylists[2];

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(16, 0, 0, 0);

      const appointmentData = {
        clientId: selectedClient._id.toString(),
        stylistId: selectedStylist.id,
        scheduledAt: tomorrow.toISOString(),
        duration: 90,
        services: ['カット', 'カラー'],
        note: 'スタイリスト指定の予約',
      };

      const response = await request(app)
        .post(API_PATHS.APPOINTMENTS.BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stylistId).toBe(selectedStylist.id);

      tracker.mark('スタイリスト選択予約作成成功');
    });

    it('USERロール以外のユーザーはスタイリスト一覧に表示されない', async () => {
      tracker.setOperation('ロールフィルタリング確認');

      // OWNER/ADMINユーザーを作成
      await createTestUserWithToken(UserRole.OWNER, organizationId);
      await createTestUserWithToken(UserRole.ADMIN, organizationId);

      const response = await request(app)
        .get(API_PATHS.USERS.LIST)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ role: UserRole.USER });

      expect(response.status).toBe(200);
      // USERロールのみが返される（3人のスタイリスト）
      expect(response.body.data.data).toHaveLength(3);
      response.body.data.data.forEach((user: any) => {
        expect(user.role).toBe(UserRole.USER);
      });

      tracker.mark('ロールフィルタリング確認成功');
    });
  });

  describe('統合フロー', () => {
    it('クライアント選択 → スタイリスト選択 → 予約作成の完全なフローが動作する', async () => {
      tracker.setOperation('統合フロー');

      // 1. クライアント一覧を取得
      const clientsResponse = await request(app)
        .get(API_PATHS.CLIENTS.LIST)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(clientsResponse.status).toBe(200);
      const clients = clientsResponse.body.data.clients;
      expect(clients.length).toBeGreaterThan(0);

      // 2. スタイリスト一覧を取得
      const stylistsResponse = await request(app)
        .get(API_PATHS.USERS.LIST)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ role: UserRole.USER });

      expect(stylistsResponse.status).toBe(200);
      const stylists = stylistsResponse.body.data.data;
      expect(stylists.length).toBeGreaterThan(0);

      // 3. 選択したクライアントとスタイリストで予約を作成
      const selectedClient = clients[0];
      const selectedStylist = stylists[0];

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(11, 0, 0, 0);

      const appointmentData = {
        clientId: selectedClient.id,
        stylistId: selectedStylist.id,
        scheduledAt: tomorrow.toISOString(),
        duration: 60,
        services: ['カット'],
        note: '統合フローテスト',
      };

      const appointmentResponse = await request(app)
        .post(API_PATHS.APPOINTMENTS.BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(appointmentData);

      expect(appointmentResponse.status).toBe(201);
      expect(appointmentResponse.body.success).toBe(true);
      expect(appointmentResponse.body.data.clientId).toBe(selectedClient.id);
      expect(appointmentResponse.body.data.stylistId).toBe(selectedStylist.id);

      tracker.mark('統合フロー成功');
    });
  });

  describe('エラーケース', () => {
    it('存在しないクライアントIDでは予約作成に失敗する', async () => {
      const response = await request(app)
        .post(API_PATHS.APPOINTMENTS.BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: '123456789012345678901234',
          stylistId: testStylists[0].id,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          duration: 60,
          services: ['カット'],
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('クライアントが見つかりません');
    });

    it('存在しないスタイリストIDでは予約作成に失敗する', async () => {
      const response = await request(app)
        .post(API_PATHS.APPOINTMENTS.BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClients[0]._id.toString(),
          stylistId: '123456789012345678901234',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          duration: 60,
          services: ['カット'],
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('スタイリストが見つかりません');
    });

    it('他組織のスタイリストは選択できない', async () => {
      const otherOrg = await createTestOrganization();
      const otherStylist = await createTestUserWithToken(UserRole.USER, otherOrg.id);

      const response = await request(app)
        .post(API_PATHS.APPOINTMENTS.BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clientId: testClients[0]._id.toString(),
          stylistId: otherStylist.user.id,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          duration: 60,
          services: ['カット'],
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('スタイリストが見つかりません');
    });
  });
});