import request from 'supertest';
import app from '../../../src/index';
import { DatabaseTestHelper } from '../../utils/db-test-helper';
import { TestAuthHelper } from '../../utils/test-auth-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { OrganizationModel } from '../../../src/features/organizations/models/organization.model';
import { OrganizationStatus, OrganizationPlan } from '../../../src/types';

describe('組織管理統合テスト', () => {
  const tracker = new MilestoneTracker();
  let testUsers: any;
  let testOrganization: any;

  beforeAll(async () => {
    tracker.setOperation('テスト環境セットアップ');
    await DatabaseTestHelper.connect();
    tracker.mark('データベース接続完了');
  });

  afterAll(async () => {
    tracker.setOperation('テスト環境クリーンアップ');
    await DatabaseTestHelper.disconnect();
    tracker.mark('クリーンアップ完了');
    tracker.summary();
  });

  beforeEach(async () => {
    await DatabaseTestHelper.clearDatabase();
    
    // テスト用組織とユーザーセットを作成
    tracker.setOperation('テストデータ準備');
    const setup = await TestAuthHelper.setupTestOrganizationWithOwner();
    testOrganization = setup.organization;
    testUsers = await TestAuthHelper.createTestUserSet(testOrganization.id);
    tracker.mark('テストデータ準備完了');
  });

  describe('GET /api/organizations - 組織一覧取得', () => {
    it('SuperAdminは全組織を取得できる', async () => {
      tracker.setOperation('組織一覧取得テスト（SuperAdmin）');
      
      // 追加の組織を作成
      await TestAuthHelper.createTestOrganization({ name: 'org2' });
      await TestAuthHelper.createTestOrganization({ name: 'org3' });

      const response = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${testUsers.superAdmin.token}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.organizations).toHaveLength(3);
      expect(response.body.data.pagination).toMatchObject({
        currentPage: 1,
        totalItems: 3,
        itemsPerPage: 10,
      });
      tracker.mark('組織一覧取得成功');
    });

    it('SuperAdmin以外は組織一覧にアクセスできない', async () => {
      const response = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${testUsers.owner.token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('フィルタとページネーションが機能する', async () => {
      // 複数の組織を作成
      for (let i = 0; i < 15; i++) {
        await TestAuthHelper.createTestOrganization({
          name: `org${i}`,
          status: i % 2 === 0 ? OrganizationStatus.ACTIVE : OrganizationStatus.SUSPENDED,
        });
      }

      // アクティブな組織のみ取得
      const response = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${testUsers.superAdmin.token}`)
        .query({ 
          page: 1, 
          limit: 5,
          status: OrganizationStatus.ACTIVE 
        });

      expect(response.status).toBe(200);
      expect(response.body.data.organizations.length).toBeLessThanOrEqual(5);
      expect(response.body.data.organizations.every((org: any) => 
        org.status === OrganizationStatus.ACTIVE
      )).toBe(true);
    });
  });

  describe('GET /api/organizations/:id - 組織詳細取得', () => {
    it('SuperAdminは任意の組織を取得できる', async () => {
      tracker.setOperation('組織詳細取得テスト');
      
      const response = await request(app)
        .get(`/api/organizations/${testOrganization.id}`)
        .set('Authorization', `Bearer ${testUsers.superAdmin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        name: testOrganization.name,
      });
      expect(response.body.data.id).toBe(testOrganization.id.toString());
      tracker.mark('組織詳細取得成功');
    });

    it('Ownerは自組織の情報を取得できる', async () => {
      const response = await request(app)
        .get(`/api/organizations/${testOrganization.id}`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('他組織の情報は取得できない', async () => {
      // 別の組織を作成
      const otherOrg = await TestAuthHelper.createTestOrganization({ name: 'other-org' });

      const response = await request(app)
        .get(`/api/organizations/${otherOrg.id}`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('存在しない組織IDではエラーになる', async () => {
      const response = await request(app)
        .get('/api/organizations/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${testUsers.superAdmin.token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('組織が見つかりません');
    });
  });

  describe('PUT /api/organizations/:id - 組織更新', () => {
    it('Ownerは自組織を更新できる', async () => {
      tracker.setOperation('組織更新テスト');
      
      const updateData = {
        name: '更新後のサロン名',
        phone: '03-9999-8888',
        address: '東京都新宿区新住所1-2-3',
      };

      const response = await request(app)
        .put(`/api/organizations/${testOrganization.id}`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(updateData);

      // データベース確認
      const updated = await OrganizationModel.findById(testOrganization.id);
      expect(updated?.name).toBe(updateData.name);
      tracker.mark('組織更新成功');
    });

    it('Adminは組織を更新できない', async () => {
      const response = await request(app)
        .put(`/api/organizations/${testOrganization.id}`)
        .set('Authorization', `Bearer ${testUsers.admin.token}`)
        .send({ name: '更新テスト' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('メールアドレスの重複は許可されない', async () => {
      // 別の組織を作成
      await TestAuthHelper.createTestOrganization({ 
        email: 'existing@example.com' 
      });

      const response = await request(app)
        .put(`/api/organizations/${testOrganization.id}`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .send({ email: 'existing@example.com' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('既に使用されているメールアドレス');
    });
  });

  describe('GET /api/organizations/:id/stats - 組織統計情報取得', () => {
    it('Ownerは自組織の統計情報を取得できる', async () => {
      tracker.setOperation('組織統計取得テスト');
      
      const response = await request(app)
        .get(`/api/organizations/${testOrganization.id}/stats`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        organizationId: expect.any(String),
        totalUsers: expect.any(Number),
        activeUsers: expect.any(Number),
        tokenUsage: expect.any(Object),
        turnoverRisk: expect.any(Object),
      });
      expect(response.body.data.organizationId).toBe(testOrganization.id.toString());
      tracker.mark('統計情報取得成功');
    });
  });

  describe('PATCH /api/organizations/:id/status - 組織ステータス変更', () => {
    it('SuperAdminは組織ステータスを変更できる', async () => {
      tracker.setOperation('組織ステータス変更テスト');
      
      const response = await request(app)
        .patch(`/api/organizations/${testOrganization.id}/status`)
        .set('Authorization', `Bearer ${testUsers.superAdmin.token}`)
        .send({ 
          status: OrganizationStatus.SUSPENDED,
          reason: 'テスト用の一時停止'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(OrganizationStatus.SUSPENDED);

      // データベース確認
      const updated = await OrganizationModel.findById(testOrganization.id);
      expect(updated?.status).toBe(OrganizationStatus.SUSPENDED);
      tracker.mark('ステータス変更成功');
    });

    it('Owner/Adminは組織ステータスを変更できない', async () => {
      const response = await request(app)
        .patch(`/api/organizations/${testOrganization.id}/status`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .send({ status: OrganizationStatus.SUSPENDED });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/organizations/:id/plan - 組織プラン変更', () => {
    it('Ownerは自組織のプランを変更できる', async () => {
      tracker.setOperation('組織プラン変更テスト');
      
      const response = await request(app)
        .patch(`/api/organizations/${testOrganization.id}/plan`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .send({ 
          plan: OrganizationPlan.PROFESSIONAL,
          immediate: true 
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.plan).toBe(OrganizationPlan.PROFESSIONAL);
      tracker.mark('プラン変更成功');
    });

    it('同じプランへの変更はエラーになる', async () => {
      const response = await request(app)
        .patch(`/api/organizations/${testOrganization.id}/plan`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .send({ plan: testOrganization.plan });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('既に同じプラン');
    });
  });

  describe('DELETE /api/organizations/:id - 組織削除', () => {
    it('SuperAdminは組織を削除できる', async () => {
      tracker.setOperation('組織削除テスト');
      
      const response = await request(app)
        .delete(`/api/organizations/${testOrganization.id}`)
        .set('Authorization', `Bearer ${testUsers.superAdmin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // データベース確認（論理削除）
      const deleted = await OrganizationModel.findById(testOrganization.id);
      expect(deleted?.status).toBe(OrganizationStatus.CANCELED);
      tracker.mark('組織削除成功');
    });

    it('Owner/Adminは組織を削除できない', async () => {
      const response = await request(app)
        .delete(`/api/organizations/${testOrganization.id}`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});