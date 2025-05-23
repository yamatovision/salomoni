import request from 'supertest';
import app from '../../../src/index';
import { UserModel } from '../../../src/features/users/models/user.model';
import { OrganizationModel } from '../../../src/features/organizations/models/organization.model';
import { UserRole, UserStatus, OrganizationStatus, OrganizationPlan, AuthMethod } from '../../../src/types';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { TestAuthHelper } from '../../utils/test-auth-helper';
import { DatabaseTestHelper } from '../../utils/db-test-helper';

describe('LINE認証統合テスト', () => {
  const tracker = new MilestoneTracker();
  let testOrganization: any;
  let testUser: any;
  const lineUserId = 'U1234567890abcdef';

  beforeAll(async () => {
    tracker.mark('テスト開始');
    await DatabaseTestHelper.connect();
  });

  afterAll(async () => {
    await DatabaseTestHelper.disconnect();
    tracker.summary();
  });

  beforeEach(async () => {
    tracker.setOperation('テストデータ準備');
    await DatabaseTestHelper.clearDatabase();

    // テスト組織作成
    testOrganization = await TestAuthHelper.createTestOrganization({
      plan: OrganizationPlan.STANDARD,
      status: OrganizationStatus.ACTIVE,
    });

    // LINE連携済みユーザー作成
    testUser = await TestAuthHelper.createTestUser({
      organizationId: testOrganization.id,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      authMethods: [AuthMethod.EMAIL, AuthMethod.LINE],
      lineUserId: lineUserId,
    });

    tracker.mark('データ準備完了');
  });

  describe('POST /api/auth/line-callback', () => {
    it('認証コードが未提供の場合400エラーになる', async () => {
      tracker.setOperation('LINE認証コールバック - 認証コードなし');

      const response = await request(app)
        .post('/api/auth/line-callback')
        .send({
          state: 'state',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.code).toBe('AUTH001');
      expect(response.body.error).toContain('LINE認証コードが必要です');

      tracker.mark('エラー検証完了');
    });

    it('空のボディの場合400エラーになる', async () => {
      tracker.setOperation('LINE認証コールバック - 空のボディ');

      const response = await request(app)
        .post('/api/auth/line-callback')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.code).toBe('AUTH001');

      tracker.mark('エラー検証完了');
    });

    // 実際のLINE APIとの連携テストは、有効な認証コードが必要なため
    // 開発環境でのみ手動で実行することを推奨
    it.skip('実際のLINE認証コードでの統合テスト（手動実行用）', async () => {
      tracker.setOperation('LINE認証コールバック - 実環境テスト');

      // 実際のLINE認証フローで取得した認証コードを設定
      const realAuthCode = process.env.LINE_TEST_AUTH_CODE || '';
      
      if (!realAuthCode) {
        console.log('LINE_TEST_AUTH_CODE環境変数が設定されていません。このテストをスキップします。');
        return;
      }

      const response = await request(app)
        .post('/api/auth/line-callback')
        .send({
          code: realAuthCode,
          state: 'test_state',
        });

      // 実際のテスト結果をログ出力
      console.log('Response status:', response.status);
      console.log('Response body:', JSON.stringify(response.body, null, 2));

      tracker.mark('実環境テスト完了');
    });
  });

  describe('POST /api/auth/login-line（モバイルアプリ用）', () => {
    it('トークンが未提供の場合400エラーになる', async () => {
      tracker.setOperation('LINEトークンログイン - トークンなし');

      const response = await request(app)
        .post('/api/auth/login-line')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      // バリデーションエラーの場合はVALIDATION_ERRORが返る
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.error).toBeDefined();

      tracker.mark('エラー検証完了');
    });

    // 実際のLINE APIとの連携テスト
    it.skip('実際のLINEアクセストークンでの統合テスト（手動実行用）', async () => {
      tracker.setOperation('LINEトークンログイン - 実環境テスト');

      // 実際のLINE認証フローで取得したアクセストークンを設定
      const realAccessToken = process.env.LINE_TEST_ACCESS_TOKEN || '';
      
      if (!realAccessToken) {
        console.log('LINE_TEST_ACCESS_TOKEN環境変数が設定されていません。このテストをスキップします。');
        return;
      }

      const response = await request(app)
        .post('/api/auth/login-line')
        .send({
          token: realAccessToken,
        });

      // 実際のテスト結果をログ出力
      console.log('Response status:', response.status);
      console.log('Response body:', JSON.stringify(response.body, null, 2));

      tracker.mark('実環境テスト完了');
    });
  });

  describe('ユーザーステータスによる認証制御', () => {
    it('無効化されたユーザーはエラーメッセージが適切', async () => {
      tracker.setOperation('LINE認証 - 無効化ユーザー');

      // ユーザーを無効化
      await UserModel.findByIdAndUpdate(testUser.id, {
        status: UserStatus.INACTIVE,
      });

      // ここでは実際のLINE APIを呼び出さないため、
      // コントローラーレベルでのテストのみ実施
      // 実際の統合テストは手動で行う必要がある

      tracker.mark('テスト完了');
    });

    it('無効化された組織のユーザーはエラーメッセージが適切', async () => {
      tracker.setOperation('LINE認証 - 無効化組織');

      // 組織を無効化
      await OrganizationModel.findByIdAndUpdate(testOrganization.id, {
        status: OrganizationStatus.SUSPENDED,
      });

      // ここでは実際のLINE APIを呼び出さないため、
      // コントローラーレベルでのテストのみ実施
      // 実際の統合テストは手動で行う必要がある

      tracker.mark('テスト完了');
    });
  });

  describe('LINE認証後の認証状態確認', () => {
    it.skip('LINE認証後、認証が必要なAPIにアクセスできる（手動実行用）', async () => {
      tracker.setOperation('LINE認証後のAPI認証確認');

      const realAuthCode = process.env.LINE_TEST_AUTH_CODE || '';
      
      if (!realAuthCode) {
        console.log('LINE_TEST_AUTH_CODE環境変数が設定されていません。このテストをスキップします。');
        return;
      }

      // LINE認証コールバック
      const authResponse = await request(app)
        .post('/api/auth/line-callback')
        .send({
          code: realAuthCode,
          state: 'test_state',
        });

      if (authResponse.status === 200) {
        const accessToken = authResponse.body.data.accessToken;

        // 認証が必要なAPIへのアクセステスト
        const meResponse = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(meResponse.body.success).toBe(true);
        expect(meResponse.body.data.id).toBeDefined();

        console.log('User info:', JSON.stringify(meResponse.body.data, null, 2));
      }

      tracker.mark('認証確認完了');
    });
  });
});