import request from 'supertest';
import app from '../../../src/index';
import { DatabaseTestHelper } from '../../utils/db-test-helper';
import { TestAuthHelper } from '../../utils/test-auth-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { UserModel } from '../../../src/features/users/models/user.model';
import { UserRole, UserStatus } from '../../../src/types';

describe('ユーザー管理統合テスト', () => {
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

  describe('GET /api/users/me - 現在のユーザー情報取得', () => {
    it('認証済みユーザーは自分の情報を取得できる', async () => {
      tracker.setOperation('ユーザー情報取得テスト');
      
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${testUsers.stylist.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testUsers.stylist.user.id,
        email: testUsers.stylist.user.email,
        name: testUsers.stylist.user.name,
        role: testUsers.stylist.user.role,
      });
      tracker.mark('ユーザー情報取得成功');
    });

    it('認証なしではアクセスできない', async () => {
      const response = await request(app)
        .get('/api/users/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users - ユーザー一覧取得', () => {
    it('Adminは自組織のユーザー一覧を取得できる', async () => {
      tracker.setOperation('ユーザー一覧取得テスト');
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${testUsers.admin.token}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toHaveProperty('totalItems');
      
      // 自組織のユーザーのみが返されることを確認
      const users = response.body.data.users;
      users.forEach((user: any) => {
        expect(user.organizationId).toBe(testOrganization.id);
      });
      
      tracker.mark('ユーザー一覧取得成功');
    });

    it('ページネーションが正しく動作する', async () => {
      // 追加ユーザーを作成
      for (let i = 0; i < 15; i++) {
        await TestAuthHelper.createTestUser({
          email: `user${i}@example.com`,
          organizationId: testOrganization.id,
        });
      }

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${testUsers.admin.token}`)
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.currentPage).toBe(2);
      expect(response.body.data.pagination.hasNext).toBe(false);
      expect(response.body.data.pagination.hasPrev).toBe(true);
    });

    it('検索フィルタが正しく動作する', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${testUsers.admin.token}`)
        .query({ search: 'admin', role: UserRole.ADMIN });

      expect(response.status).toBe(200);
      const users = response.body.data.users;
      expect(users.length).toBeGreaterThan(0);
      users.forEach((user: any) => {
        expect(user.role).toBe(UserRole.ADMIN);
      });
    });

    it('一般ユーザーはアクセスできない', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${testUsers.stylist.token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id - ユーザー詳細取得', () => {
    it('ユーザーは自分の詳細情報を取得できる', async () => {
      tracker.setOperation('ユーザー詳細取得テスト');
      
      const response = await request(app)
        .get(`/api/users/${testUsers.stylist.user.id}`)
        .set('Authorization', `Bearer ${testUsers.stylist.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUsers.stylist.user.id);
      expect(response.body.data.email).toBe(testUsers.stylist.user.email);
      tracker.mark('ユーザー詳細取得成功');
    });

    it('Adminは同組織のユーザー詳細を取得できる', async () => {
      const response = await request(app)
        .get(`/api/users/${testUsers.stylist.user.id}`)
        .set('Authorization', `Bearer ${testUsers.admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUsers.stylist.user.id);
    });

    it('他組織のユーザー詳細は取得できない', async () => {
      // 別組織のユーザーを作成
      const otherOrg = await TestAuthHelper.createTestOrganization();
      const otherUser = await TestAuthHelper.createTestUser({
        email: 'other@example.com',
        organizationId: otherOrg.id,
      });

      const response = await request(app)
        .get(`/api/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${testUsers.admin.token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('他組織のユーザー情報は参照できません');
    });

    it('存在しないユーザーは404エラー', async () => {
      const response = await request(app)
        .get('/api/users/507f1f77bcf86cd799439011') // 有効だが存在しないObjectID
        .set('Authorization', `Bearer ${testUsers.admin.token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/invite - ユーザー招待', () => {
    it('Ownerは新しいユーザーを招待できる', async () => {
      tracker.setOperation('ユーザー招待テスト');
      
      const inviteData = {
        email: 'newuser@example.com',
        role: UserRole.USER,
        name: '新しいスタイリスト',
        department: '美容部',
        employeeNumber: 'EMP001',
      };

      const response = await request(app)
        .post('/api/users/invite')
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .send(inviteData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('inviteToken');
      expect(response.body.data).toHaveProperty('expiresAt');

      // データベース確認（招待トークンが作成される）
      const { InviteTokenModel } = await import('../../../src/features/auth/models/invite-token.model');
      const inviteToken = await InviteTokenModel.findOne({ email: inviteData.email });
      expect(inviteToken).toBeTruthy();
      expect(inviteToken?.organizationId.toString()).toBe(testOrganization.id);
      expect(inviteToken?.role).toBe(inviteData.role);
      tracker.mark('ユーザー招待成功');
    });

    it('Adminも新しいユーザーを招待できる', async () => {
      const response = await request(app)
        .post('/api/users/invite')
        .set('Authorization', `Bearer ${testUsers.admin.token}`)
        .send({
          email: 'admin-invited@example.com',
          role: UserRole.USER,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('一般ユーザーは招待できない', async () => {
      const response = await request(app)
        .post('/api/users/invite')
        .set('Authorization', `Bearer ${testUsers.stylist.token}`)
        .send({
          email: 'unauthorized@example.com',
          role: UserRole.USER,
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('既存のメールアドレスでは招待できない', async () => {
      const response = await request(app)
        .post('/api/users/invite')
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .send({
          email: testUsers.stylist.user.email,
          role: UserRole.USER,
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('既に登録されているメールアドレス');
    });
  });

  describe('GET /api/users - ユーザー一覧取得', () => {
    it('Ownerは自組織のユーザー一覧を取得できる', async () => {
      tracker.setOperation('ユーザー一覧取得テスト');
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // 組織内のユーザーのみ取得される
      expect(response.body.data.users.every((user: any) => 
        user.organizationId === testOrganization.id || !user.organizationId
      )).toBe(true);
      tracker.mark('ユーザー一覧取得成功');
    });

    it('検索フィルタが機能する', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .query({ 
          search: 'Admin',
          role: UserRole.ADMIN,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.users.every((user: any) => 
        user.role === UserRole.ADMIN
      )).toBe(true);
    });

    it('一般ユーザーは一覧を取得できない', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${testUsers.stylist.token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id - ユーザー詳細取得', () => {
    it('ユーザーは自分の詳細情報を取得できる', async () => {
      const response = await request(app)
        .get(`/api/users/${testUsers.stylist.user.id}`)
        .set('Authorization', `Bearer ${testUsers.stylist.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUsers.stylist.user.id);
    });

    it('管理者は同組織のユーザー情報を取得できる', async () => {
      const response = await request(app)
        .get(`/api/users/${testUsers.stylist.user.id}`)
        .set('Authorization', `Bearer ${testUsers.admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('他組織のユーザー情報は取得できない', async () => {
      // 別組織のユーザーを作成
      const otherOrg = await TestAuthHelper.createTestOrganization();
      const otherUser = await TestAuthHelper.createTestUser({
        organizationId: otherOrg.id,
      });

      const response = await request(app)
        .get(`/api/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('他組織のユーザー情報は参照できません');
    });
  });

  describe('PUT /api/users/:id - ユーザー更新', () => {
    it('ユーザーは自分の情報を更新できる', async () => {
      tracker.setOperation('ユーザー更新テスト');
      
      const updateData = {
        name: '更新後の名前',
        phone: '090-9999-8888',
        preferences: {
          notifications: {
            email: false,
            push: true,
          },
        },
      };

      const response = await request(app)
        .put(`/api/users/${testUsers.stylist.user.id}`)
        .set('Authorization', `Bearer ${testUsers.stylist.token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);

      // データベース確認
      const updated = await UserModel.findById(testUsers.stylist.user.id);
      expect(updated?.name).toBe(updateData.name);
      tracker.mark('ユーザー更新成功');
    });

    it('管理者は同組織のユーザー情報を更新できる', async () => {
      const response = await request(app)
        .put(`/api/users/${testUsers.stylist.user.id}`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .send({ department: '新部署' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/users/me/password - パスワード変更', () => {
    it('正しい現在のパスワードで変更できる', async () => {
      tracker.setOperation('パスワード変更テスト');
      
      const response = await request(app)
        .post('/api/users/me/password')
        .set('Authorization', `Bearer ${testUsers.stylist.token}`)
        .send({
          currentPassword: 'TestPassword123!',
          newPassword: 'NewSecurePass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // 新しいパスワードでログインできることを確認
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          method: 'email',
          email: testUsers.stylist.user.email,
          password: 'NewSecurePass123!',
        });

      expect(loginResponse.status).toBe(200);
      tracker.mark('パスワード変更成功');
    });

    it('間違った現在のパスワードでは変更できない', async () => {
      const response = await request(app)
        .post('/api/users/me/password')
        .set('Authorization', `Bearer ${testUsers.stylist.token}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewSecurePass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('現在のパスワードが正しくありません');
    });
  });

  describe('PATCH /api/users/:id/status - ユーザーステータス変更', () => {
    it('Ownerはユーザーステータスを変更できる', async () => {
      tracker.setOperation('ユーザーステータス変更テスト');
      
      const response = await request(app)
        .patch(`/api/users/${testUsers.stylist.user.id}/status`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .send({
          status: UserStatus.SUSPENDED,
          reason: 'テスト用の一時停止',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(UserStatus.SUSPENDED);
      tracker.mark('ステータス変更成功');
    });

    it('自分自身を無効化することはできない', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUsers.owner.user.id}/status`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .send({ status: UserStatus.INACTIVE });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('自分自身を無効化することはできません');
    });
  });

  describe('PATCH /api/users/:id/roles - ユーザーロール変更', () => {
    it('Ownerはユーザーロールを変更できる', async () => {
      tracker.setOperation('ユーザーロール変更テスト');
      
      const response = await request(app)
        .patch(`/api/users/${testUsers.stylist.user.id}/roles`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .send({ roles: [UserRole.USER, UserRole.ADMIN] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(UserRole.ADMIN);
      tracker.mark('ロール変更成功');
    });

    it('SuperAdminロールは一般Ownerが付与できない', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUsers.stylist.user.id}/roles`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .send({ roles: [UserRole.SUPER_ADMIN] });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('SuperAdminロールを付与する権限がありません');
    });

    it('最後のOwnerからOwnerロールを削除できない', async () => {
      // setupTestOrganizationWithOwnerで作成されたOwnerを削除して、testUsers.ownerだけを残す
      const setupOwner = await UserModel.findOne({ 
        organizationId: testOrganization.id, 
        role: UserRole.OWNER,
        _id: { $ne: testUsers.owner.user.id }
      });
      if (setupOwner) {
        await UserModel.findByIdAndDelete(setupOwner._id);
      }

      const response = await request(app)
        .patch(`/api/users/${testUsers.owner.user.id}/roles`)
        .set('Authorization', `Bearer ${testUsers.superAdmin.token}`)
        .send({ roles: [UserRole.ADMIN] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('組織には最低1人のOwnerが必要');
    });
  });

  describe('POST /api/users/:id/force-logout - 強制ログアウト', () => {
    it('管理者はユーザーを強制ログアウトできる', async () => {
      tracker.setOperation('強制ログアウトテスト');
      
      const response = await request(app)
        .post(`/api/users/${testUsers.stylist.user.id}/force-logout`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`)
        .send({ reason: 'セキュリティ上の理由' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('強制ログアウトしました');
      tracker.mark('強制ログアウト成功');
    });
  });

  describe('DELETE /api/users/:id - ユーザー削除', () => {
    it('Ownerはユーザーを削除できる', async () => {
      tracker.setOperation('ユーザー削除テスト');
      
      const response = await request(app)
        .delete(`/api/users/${testUsers.stylist.user.id}`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // データベース確認（論理削除）
      const deleted = await UserModel.findById(testUsers.stylist.user.id);
      expect(deleted?.status).toBe(UserStatus.INACTIVE);
      tracker.mark('ユーザー削除成功');
    });

    it('最後のOwnerは削除できない', async () => {
      // setupTestOrganizationWithOwnerで作成されたOwnerを削除して、testUsers.ownerだけを残す
      const setupOwner = await UserModel.findOne({ 
        organizationId: testOrganization.id, 
        role: UserRole.OWNER,
        _id: { $ne: testUsers.owner.user.id }
      });
      if (setupOwner) {
        await UserModel.findByIdAndDelete(setupOwner._id);
      }

      const response = await request(app)
        .delete(`/api/users/${testUsers.owner.user.id}`)
        .set('Authorization', `Bearer ${testUsers.superAdmin.token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('組織の最後のOwnerは削除できません');
    });
  });

  describe('GET /api/users/:id/token-usage - トークン使用量取得', () => {
    it('ユーザーは自分のトークン使用量を取得できる', async () => {
      const response = await request(app)
        .get(`/api/users/${testUsers.stylist.user.id}/token-usage`)
        .set('Authorization', `Bearer ${testUsers.stylist.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('current');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('resetDate');
    });

    it('管理者は他ユーザーのトークン使用量を取得できる', async () => {
      const response = await request(app)
        .get(`/api/users/${testUsers.stylist.user.id}/token-usage`)
        .set('Authorization', `Bearer ${testUsers.owner.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});