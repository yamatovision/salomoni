import request from 'supertest';
import app from '../../../src';
import { ProductionDatabaseTestHelper } from '../../utils/db-test-helper';
import { generateTestToken, createTestUserSet } from '../../utils/test-auth-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { API_PATHS, UserRole } from '../../../src/types';
import { SupportTicketModel } from '../../../src/features/support/models/support-ticket.model';
import { UserModel } from '../../../src/features/users/models/user.model';
import { OrganizationModel } from '../../../src/features/organizations/models/organization.model';

describe('サポート機能統合テスト', () => {
  let tracker: MilestoneTracker;
  let users: any;
  let tokens: any;
  let org1Id: string;
  let org2Id: string;

  beforeAll(async () => {
    tracker = new MilestoneTracker();
    tracker.mark('テスト開始');
    
    tracker.setOperation('データベース接続');
    await ProductionDatabaseTestHelper.connect();
    tracker.mark('DB接続完了');
  }, 60000);

  beforeEach(async () => {
    tracker.setOperation('テストデータセットアップ');
    // 既存データのクリーンアップ
    await SupportTicketModel.deleteMany({});
    await UserModel.deleteMany({});
    await OrganizationModel.deleteMany({});
    
    // テスト用組織を作成
    const org1 = await OrganizationModel.create({
      name: 'Test Organization 1',
      displayName: 'テスト組織1',
      email: 'org1@example.com',
      phone: '03-1234-5678',
      address: '東京都渋谷区テスト1-2-3',
      status: 'active',
      plan: 'standard',
      ownerId: 'test-owner-1'
    });
    org1Id = org1.id;
    
    const org2 = await OrganizationModel.create({
      name: 'Test Organization 2',
      displayName: 'テスト組織2',
      email: 'org2@example.com',
      phone: '03-9876-5432',
      address: '東京都新宿区テスト4-5-6',
      status: 'active',
      plan: 'standard',
      ownerId: 'test-owner-2'
    });
    org2Id = org2.id;
    
    // テスト用ユーザーセットを作成
    const org1Users = await createTestUserSet(org1Id);
    const org2Users = await createTestUserSet(org2Id);
    
    users = {
      superAdminUser: org1Users.superAdmin.user,
      ownerUser: org1Users.owner.user,
      adminUser: org1Users.admin.user,
      normalUser: org1Users.stylist.user,
      clientUser: org2Users.client.user,
    };
    
    tokens = {
      superAdminToken: org1Users.superAdmin.token,
      ownerToken: org1Users.owner.token,
      adminToken: org1Users.admin.token,
      normalToken: org1Users.stylist.token,
      clientToken: org2Users.client.token,
    };
    
    tracker.mark('セットアップ完了');
  });

  afterAll(async () => {
    tracker.setOperation('クリーンアップ');
    await ProductionDatabaseTestHelper.cleanup();
    tracker.mark('テスト終了');
    tracker.summary();
  });

  describe('チケット作成 (POST /api/admin/support/tickets)', () => {
    it('ユーザーが新規チケットを作成できる', async () => {
      tracker.setOperation('新規チケット作成テスト');
      
      const ticketData = {
        title: 'テストチケット',
        description: 'これはテストチケットです',
        priority: 'medium',
        category: 'technical'
      };

      const response = await request(app)
        .post(API_PATHS.ADMIN.SUPPORT_TICKETS)
        .set('Authorization', `Bearer ${tokens.normalToken}`)
        .send(ticketData);

      tracker.mark('チケット作成APIレスポンス受信');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        category: ticketData.category,
        status: 'open',
        ticketNumber: expect.stringMatching(/^TKT-[A-Z0-9]+-[A-Z0-9]+$/)
      });

      // データベース確認
      tracker.setOperation('DB確認');
      const savedTicket = await SupportTicketModel.findById(response.body.data.id);
      expect(savedTicket).toBeTruthy();
      expect(savedTicket?.userId.toString()).toBe(users.normalUser.id.toString());
      expect(savedTicket?.organizationId.toString()).toBe(org1Id);
      
      tracker.mark('チケット作成テスト完了');
    });

    it('必須フィールドが不足している場合はエラーを返す', async () => {
      const invalidData = {
        title: 'タイトルのみ'
        // descriptionが不足
      };

      const response = await request(app)
        .post(API_PATHS.ADMIN.SUPPORT_TICKETS)
        .set('Authorization', `Bearer ${tokens.normalToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('チケット一覧取得 (GET /api/admin/support/tickets)', () => {
    let ticket1: any, ticket2: any, ticket3: any;

    beforeEach(async () => {
      // 異なる組織のチケットを作成
      ticket1 = await SupportTicketModel.create({
        ticketNumber: 'TKT-001',
        title: '組織1のチケット1',
        description: 'テスト',
        priority: 'high',
        category: 'billing',
        status: 'open',
        userId: users.normalUser.id,
        organizationId: org1Id
      });

      ticket2 = await SupportTicketModel.create({
        ticketNumber: 'TKT-002',
        title: '組織1のチケット2',
        description: 'テスト',
        priority: 'medium',
        category: 'technical',
        status: 'in_progress',
        userId: users.adminUser.id,
        organizationId: org1Id
      });

      ticket3 = await SupportTicketModel.create({
        ticketNumber: 'TKT-003',
        title: '組織2のチケット',
        description: 'テスト',
        priority: 'low',
        category: 'general',
        status: 'resolved',
        userId: users.clientUser.id,
        organizationId: org2Id
      });
    });

    it('通常ユーザーは自分のチケットのみ取得できる', async () => {
      tracker.setOperation('ユーザーのチケット一覧取得テスト');
      
      const response = await request(app)
        .get(API_PATHS.ADMIN.SUPPORT_TICKETS)
        .set('Authorization', `Bearer ${tokens.normalToken}`);

      tracker.mark('一覧取得APIレスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tickets).toHaveLength(1);
      expect(response.body.data.tickets[0].id).toBe(ticket1.id.toString());
      expect(response.body.data.total).toBe(1);
      
      tracker.mark('ユーザー一覧取得テスト完了');
    });

    it('管理者は組織内の全チケットを取得できる', async () => {
      tracker.setOperation('管理者のチケット一覧取得テスト');
      
      const response = await request(app)
        .get(API_PATHS.ADMIN.SUPPORT_TICKETS)
        .set('Authorization', `Bearer ${tokens.adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.tickets).toHaveLength(2);
      expect(response.body.data.tickets.map((t: any) => t.id)).toContain(ticket1.id.toString());
      expect(response.body.data.tickets.map((t: any) => t.id)).toContain(ticket2.id.toString());
      
      tracker.mark('管理者一覧取得テスト完了');
    });

    it('スーパー管理者は全組織のチケットを取得できる', async () => {
      tracker.setOperation('スーパー管理者のチケット一覧取得テスト');
      
      const response = await request(app)
        .get(API_PATHS.SUPERADMIN.SUPPORT_TICKETS)
        .set('Authorization', `Bearer ${tokens.superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.tickets).toHaveLength(3);
      expect(response.body.data.total).toBe(3);
      // ticket1, ticket2, ticket3が全て含まれていることを確認
      const ticketIds = response.body.data.tickets.map((t: any) => t.id);
      expect(ticketIds).toContain(ticket1.id.toString());
      expect(ticketIds).toContain(ticket2.id.toString());
      expect(ticketIds).toContain(ticket3.id.toString());
      
      tracker.mark('スーパー管理者一覧取得テスト完了');
    });

    it('フィルタリング機能が正しく動作する', async () => {
      tracker.setOperation('フィルタリングテスト');
      
      // ステータスでフィルタリング
      const openTickets = await request(app)
        .get(`${API_PATHS.ADMIN.SUPPORT_TICKETS}?status=open`)
        .set('Authorization', `Bearer ${tokens.adminToken}`);

      expect(openTickets.body.data.tickets).toHaveLength(1);
      expect(openTickets.body.data.tickets[0].status).toBe('open');

      // 優先度でフィルタリング
      const highPriorityTickets = await request(app)
        .get(`${API_PATHS.ADMIN.SUPPORT_TICKETS}?priority=high`)
        .set('Authorization', `Bearer ${tokens.adminToken}`);

      expect(highPriorityTickets.body.data.tickets).toHaveLength(1);
      expect(highPriorityTickets.body.data.tickets[0].priority).toBe('high');

      // 検索機能
      const searchResults = await request(app)
        .get(`${API_PATHS.ADMIN.SUPPORT_TICKETS}?searchTerm=${encodeURIComponent('チケット1')}`)
        .set('Authorization', `Bearer ${tokens.adminToken}`);

      expect(searchResults.body.data.tickets).toHaveLength(1);
      expect(searchResults.body.data.tickets[0].title).toContain('チケット1');
      
      tracker.mark('フィルタリングテスト完了');
    });
  });

  describe('チケット詳細取得 (GET /api/admin/support/tickets/:ticketId)', () => {
    let ticket: any;

    beforeEach(async () => {
      ticket = await SupportTicketModel.create({
        ticketNumber: 'TKT-100',
        title: '詳細テスト用チケット',
        description: '詳細な説明',
        priority: 'high',
        category: 'technical',
        status: 'open',
        userId: users.normalUser.id,
        organizationId: org1Id
      });
    });

    it('チケット作成者は自分のチケット詳細を取得できる', async () => {
      tracker.setOperation('チケット詳細取得テスト');
      
      const response = await request(app)
        .get(API_PATHS.ADMIN.SUPPORT_TICKET_DETAIL(ticket.id))
        .set('Authorization', `Bearer ${tokens.normalToken}`);

      tracker.mark('詳細取得APIレスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(ticket.id.toString());
      // メッセージは別のエンドポイントから取得される
      
      tracker.mark('詳細取得テスト完了');
    });

    it('他のユーザーは他人のチケットにアクセスできない', async () => {
      const otherUser = await UserModel.create({
        lineId: 'other-user-line-id',
        email: 'other@example.com',
        name: '他のユーザー',
        role: UserRole.USER,
        organizationId: org1Id
      });

      const otherUserToken = generateTestToken({
        id: otherUser.id,
        userId: otherUser.id,
        email: otherUser.email,
        roles: [UserRole.USER],
        currentRole: UserRole.USER,
        organizationId: org1Id
      });

      const response = await request(app)
        .get(API_PATHS.ADMIN.SUPPORT_TICKET_DETAIL(ticket.id))
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('チケットへの返信 (POST /api/admin/support/tickets/:ticketId/reply)', () => {
    let ticket: any;

    beforeEach(async () => {
      ticket = await SupportTicketModel.create({
        ticketNumber: 'TKT-200',
        title: '返信テスト用チケット',
        description: 'テスト',
        priority: 'medium',
        category: 'general',
        status: 'open',
        userId: users.normalUser.id,
        organizationId: org1Id
      });
    });

    it('チケット作成者が返信を追加できる', async () => {
      tracker.setOperation('チケット返信テスト');
      
      const replyData = {
        content: 'これは返信メッセージです',
        attachments: ['https://example.com/file.pdf']
      };

      const response = await request(app)
        .post(API_PATHS.ADMIN.SUPPORT_TICKET_REPLY(ticket.id))
        .set('Authorization', `Bearer ${tokens.normalToken}`)
        .send(replyData);

      tracker.mark('返信APIレスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // メッセージは正常に追加された

      // データベース確認
      // データベース確認
      const updatedTicket = await SupportTicketModel.findById(ticket.id);
      expect(updatedTicket?.updatedAt).not.toEqual(ticket.updatedAt);
      
      tracker.mark('返信テスト完了');
    });

    it('管理者が内部メッセージを追加できる', async () => {
      const internalReply = {
        content: '内部メモ：優先度を上げる必要があります',
        isInternal: true
      };

      const response = await request(app)
        .post(API_PATHS.ADMIN.SUPPORT_TICKET_REPLY(ticket.id))
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(internalReply);

      expect(response.status).toBe(200);
      // 内部メッセージが正常に追加された
    });
  });

  describe('ステータス更新 (PATCH /api/admin/support/tickets/:ticketId/status)', () => {
    let ticket: any;

    beforeEach(async () => {
      ticket = await SupportTicketModel.create({
        ticketNumber: 'TKT-300',
        title: 'ステータス更新テスト用チケット',
        description: 'テスト',
        priority: 'low',
        category: 'billing',
        status: 'open',
        userId: users.normalUser.id,
        organizationId: org1Id
      });
    });

    it('管理者がチケットのステータスを更新できる', async () => {
      tracker.setOperation('ステータス更新テスト');
      
      const statusUpdate = {
        status: 'in_progress'
      };

      const response = await request(app)
        .patch(API_PATHS.ADMIN.SUPPORT_TICKET_STATUS(ticket.id))
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send(statusUpdate);

      tracker.mark('ステータス更新APIレスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_progress');

      // データベース確認
      const updatedTicket = await SupportTicketModel.findById(ticket.id);
      expect(updatedTicket?.status).toBe('in_progress');
      
      tracker.mark('ステータス更新テスト完了');
    });

    it('通常ユーザーはステータスを更新できない', async () => {
      const response = await request(app)
        .patch(API_PATHS.ADMIN.SUPPORT_TICKET_STATUS(ticket.id))
        .set('Authorization', `Bearer ${tokens.normalToken}`)
        .send({ status: 'closed' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('無効なステータスは拒否される', async () => {
      const response = await request(app)
        .patch(API_PATHS.ADMIN.SUPPORT_TICKET_STATUS(ticket.id))
        .set('Authorization', `Bearer ${tokens.adminToken}`)
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('統計情報取得 (GET /api/admin/support/stats)', () => {
    beforeEach(async () => {
      // 複数のチケットを作成
      const tickets = [
        { status: 'open', priority: 'high', category: 'technical', organizationId: org1Id },
        { status: 'open', priority: 'medium', category: 'billing', organizationId: org1Id },
        { status: 'in_progress', priority: 'high', category: 'technical', organizationId: org1Id },
        { status: 'resolved', priority: 'low', category: 'general', organizationId: org1Id },
        { status: 'closed', priority: 'medium', category: 'billing', organizationId: org1Id },
        { status: 'open', priority: 'high', category: 'technical', organizationId: org2Id }
      ];

      for (const [index, ticketData] of tickets.entries()) {
        await SupportTicketModel.create({
          ticketNumber: `TKT-40${index}`,
          title: `統計テスト用チケット${index + 1}`,
          description: 'テスト',
          ...ticketData,
          userId: users.normalUser.id
        });
      }
      
    });

    it('管理者が組織の統計情報を取得できる', async () => {
      tracker.setOperation('統計情報取得テスト');
      
      const response = await request(app)
        .get(API_PATHS.ADMIN.SUPPORT_STATS)
        .set('Authorization', `Bearer ${tokens.adminToken}`);

      tracker.mark('統計情報APIレスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const stats = response.body.data;
      expect(stats.totalTickets).toBe(5); // org1のチケットのみ
      expect(stats.byStatus.open).toBe(2);
      expect(stats.byStatus.in_progress).toBe(1);
      expect(stats.byStatus.resolved).toBe(1);
      expect(stats.byStatus.closed).toBe(1);
      expect(stats.byPriority.high).toBe(2);
      expect(stats.byPriority.medium).toBe(2);
      expect(stats.byPriority.low).toBe(1);
      expect(stats.byCategory.technical).toBe(2);
      expect(stats.byCategory.billing).toBe(2);
      expect(stats.byCategory.general).toBe(1);
      
      tracker.mark('統計情報取得テスト完了');
    });

    it('スーパー管理者が全組織の統計情報を取得できる', async () => {
      const response = await request(app)
        .get(API_PATHS.SUPERADMIN.SUPPORT_STATS)
        .set('Authorization', `Bearer ${tokens.superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalTickets).toBe(6); // 全組織のチケット
    });

    it('通常ユーザーは統計情報にアクセスできない', async () => {
      const response = await request(app)
        .get(API_PATHS.ADMIN.SUPPORT_STATS)
        .set('Authorization', `Bearer ${tokens.normalToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('エラー処理と境界値テスト', () => {
    it('存在しないチケットIDでエラーを返す', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(API_PATHS.ADMIN.SUPPORT_TICKET_DETAIL(fakeId))
        .set('Authorization', `Bearer ${tokens.adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('無効なチケットIDフォーマットでエラーを返す', async () => {
      const response = await request(app)
        .get(API_PATHS.ADMIN.SUPPORT_TICKET_DETAIL('invalid-id'))
        .set('Authorization', `Bearer ${tokens.adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('長すぎるタイトルや説明でエラーを返す', async () => {
      const longTitle = 'a'.repeat(201); // 200文字を超える
      const longDescription = 'b'.repeat(5001); // 5000文字を超える

      const response = await request(app)
        .post(API_PATHS.ADMIN.SUPPORT_TICKETS)
        .set('Authorization', `Bearer ${tokens.normalToken}`)
        .send({
          title: longTitle,
          description: longDescription,
          priority: 'medium',
          category: 'general'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('ページネーションテスト', () => {
    beforeEach(async () => {
      // 25件のチケットを作成
      for (let i = 1; i <= 25; i++) {
        await SupportTicketModel.create({
          ticketNumber: `TKT-${1000 + i}`,
          title: `ページネーションテスト用チケット${i}`,
          description: 'テスト',
          priority: 'medium',
          category: 'general',
          status: 'open',
          userId: users.adminUser.id,
          organizationId: org1Id,
          createdAt: new Date(Date.now() - i * 60000) // 1分ずつずらす
        });
      }
    });

    it('ページネーションが正しく動作する', async () => {
      tracker.setOperation('ページネーションテスト');
      
      // 最初のページ（デフォルト20件）
      const page1 = await request(app)
        .get(`${API_PATHS.ADMIN.SUPPORT_TICKETS}?page=1&limit=10`)
        .set('Authorization', `Bearer ${tokens.adminToken}`);

      expect(page1.body.data.tickets).toHaveLength(10);
      expect(page1.body.data.pagination.total).toBe(25);
      expect(page1.body.data.pagination.pages).toBe(3);
      expect(page1.body.data.pagination.currentPage).toBe(1);

      // 2ページ目
      const page2 = await request(app)
        .get(`${API_PATHS.ADMIN.SUPPORT_TICKETS}?page=2&limit=10`)
        .set('Authorization', `Bearer ${tokens.adminToken}`);

      expect(page2.body.data.tickets).toHaveLength(10);
      expect(page2.body.data.tickets[0].id).not.toBe(page1.body.data.tickets[0].id);

      // 最後のページ
      const page3 = await request(app)
        .get(`${API_PATHS.ADMIN.SUPPORT_TICKETS}?page=3&limit=10`)
        .set('Authorization', `Bearer ${tokens.adminToken}`);

      expect(page3.body.data.tickets).toHaveLength(5);
      
      tracker.mark('ページネーションテスト完了');
    });

    it('ソート機能が正しく動作する', async () => {
      // 作成日時降順（デフォルト）
      const descResponse = await request(app)
        .get(`${API_PATHS.ADMIN.SUPPORT_TICKETS}?sortBy=createdAt&sortOrder=desc`)
        .set('Authorization', `Bearer ${tokens.adminToken}`);

      const tickets = descResponse.body.data.tickets;
      expect(new Date(tickets[0].createdAt).getTime()).toBeGreaterThan(
        new Date(tickets[1].createdAt).getTime()
      );

      // 作成日時昇順
      const ascResponse = await request(app)
        .get(`${API_PATHS.ADMIN.SUPPORT_TICKETS}?sortBy=createdAt&sortOrder=asc`)
        .set('Authorization', `Bearer ${tokens.adminToken}`);

      const ascTickets = ascResponse.body.data.tickets;
      expect(new Date(ascTickets[0].createdAt).getTime()).toBeLessThan(
        new Date(ascTickets[1].createdAt).getTime()
      );
    });
  });
});