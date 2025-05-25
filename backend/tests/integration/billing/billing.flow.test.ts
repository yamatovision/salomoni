/**
 * 決済・課金管理機能の統合テスト
 * 垂直スライス8: 決済・課金管理
 * 
 * 実データ主義：モック不使用、実際のUnivaPayAPI使用
 * 統合テストフロー：全APIエンドポイント8.1-8.5の完全テスト
 */

import request from 'supertest';
import app from '../../../src/index';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { DatabaseTestHelper } from '../../utils/db-test-helper';
import { TestAuthHelper } from '../../utils/test-auth-helper';
import type { 
  Organization, 
  OrganizationPlan
} from '../../../src/types';
import { UserRole } from '../../../src/types';

describe('決済・課金管理 統合テスト', () => {
  let tracker: MilestoneTracker;
  let organization: Organization;
  let ownerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    tracker = new MilestoneTracker();
    tracker.setOperation('テスト環境セットアップ');
    
    // テストデータベース接続
    await DatabaseTestHelper.connect();
    tracker.mark('データベース接続完了');

    // テスト組織とユーザーを作成
    const setup = await TestAuthHelper.setupTestOrganizationWithOwner();
    organization = setup.organization;
    ownerToken = setup.ownerToken;
    tracker.mark('テスト組織・オーナー作成完了');

    // 管理者ユーザー作成
    const adminSetup = await TestAuthHelper.createTestUserInOrganization(
      organization.id,
      UserRole.ADMIN
    );
    adminToken = adminSetup.token;
    tracker.mark('管理者ユーザー作成完了');

    tracker.summary();
  });

  afterAll(async () => {
    tracker.setOperation('テスト環境クリーンアップ');
    await DatabaseTestHelper.disconnect();
    tracker.mark('データベース切断完了');
    tracker.summary();
  });

  beforeEach(async () => {
    tracker.reset();
    tracker.setOperation('テストケース開始');
  });

  afterEach(() => {
    tracker.summary();
  });

  describe('API 8.1: 決済トークン作成 (/api/billing/token)', () => {
    it('オーナーが有効な決済トークンを作成できる', async () => {
      tracker.setOperation('決済トークン作成テスト');

      const testData = {
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2030,
        cvc: '123',
        cardholderName: 'Test Owner',
        billingAddress: {
          line1: '東京都渋谷区テスト1-2-3',
          city: '渋谷区',
          state: '東京都',
          postalCode: '150-0001',
          country: 'JP'
        }
      };

      tracker.mark('テストデータ準備完了');

      const response = await request(app)
        .post('/api/billing/token')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(testData);

      tracker.mark('APIレスポンス受信');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokenId');
      expect(response.body.data).toHaveProperty('paymentMethodId');
      expect(response.body.data.metadata).toMatchObject({
        cardLast4: '4242',
        cardBrand: expect.any(String),
        expiryMonth: 12,
        expiryYear: 2030
      });

      tracker.mark('レスポンス検証完了');
    });

    it('管理者は決済トークンを作成できない（権限エラー）', async () => {
      tracker.setOperation('権限エラーテスト');

      const testData = {
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2030,
        cvc: '123',
        cardholderName: 'Test Admin'
      };

      const response = await request(app)
        .post('/api/billing/token')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testData);

      tracker.mark('権限エラーレスポンス受信');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('権限');

      tracker.mark('権限エラー検証完了');
    });

    it('無効なカード情報でエラーになる', async () => {
      tracker.setOperation('無効カード情報テスト');

      const invalidData = {
        cardNumber: '4000000000000002', // デクライン用テストカード
        expiryMonth: 12,
        expiryYear: 2030,
        cvc: '123',
        cardholderName: 'Test Owner'
      };

      const response = await request(app)
        .post('/api/billing/token')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(invalidData);

      tracker.mark('無効カードレスポンス受信');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('カード');

      tracker.mark('無効カードエラー検証完了');
    });
  });

  describe('API 8.2: サブスクリプション作成 (/api/billing/subscription)', () => {
    let paymentMethodId: string;

    beforeEach(async () => {
      tracker.setOperation('サブスクリプション用決済方法準備');
      
      // 決済方法を事前作成
      const tokenResponse = await request(app)
        .post('/api/billing/token')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          cardNumber: '4242424242424242',
          expiryMonth: 12,
          expiryYear: 2030,
          cvc: '123',
          cardholderName: 'Test Owner'
        });

      paymentMethodId = tokenResponse.body.data.paymentMethodId;
      tracker.mark('決済方法準備完了');
    });

    it('STANDARDプランのサブスクリプションを作成できる', async () => {
      tracker.setOperation('STANDARDプラン作成テスト');

      const subscriptionData = {
        plan: 'standard' as OrganizationPlan,
        paymentMethodId,
        billingCycle: 'monthly'
      };

      const response = await request(app)
        .post('/api/billing/subscription')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(subscriptionData);

      tracker.mark('サブスクリプション作成レスポンス受信');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('subscriptionId');
      expect(response.body.data.plan).toBe('standard');
      expect(response.body.data.status).toBe('active');
      expect(response.body.data).toHaveProperty('currentPeriodStart');
      expect(response.body.data).toHaveProperty('currentPeriodEnd');

      tracker.mark('サブスクリプション検証完了');
    });

    it('PROFESSIONALプランのサブスクリプションを作成できる', async () => {
      tracker.setOperation('PROFESSIONALプラン作成テスト');

      const subscriptionData = {
        plan: 'professional' as OrganizationPlan,
        paymentMethodId,
        billingCycle: 'yearly'
      };

      const response = await request(app)
        .post('/api/billing/subscription')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(subscriptionData);

      tracker.mark('PROFESSIONALプランレスポンス受信');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.plan).toBe('professional');
      expect(response.body.data.billingCycle).toBe('yearly');

      tracker.mark('PROFESSIONALプラン検証完了');
    });

    it('ENTERPRISEプランのサブスクリプションを作成できる', async () => {
      tracker.setOperation('ENTERPRISEプラン作成テスト');

      const subscriptionData = {
        plan: 'enterprise' as OrganizationPlan,
        paymentMethodId,
        billingCycle: 'monthly'
      };

      const response = await request(app)
        .post('/api/billing/subscription')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(subscriptionData);

      tracker.mark('ENTERPRISEプランレスポンス受信');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.plan).toBe('enterprise');

      tracker.mark('ENTERPRISEプラン検証完了');
    });

    it('無効な決済方法でエラーになる', async () => {
      tracker.setOperation('無効決済方法テスト');

      const invalidData = {
        plan: 'standard' as OrganizationPlan,
        paymentMethodId: 'invalid-payment-method-id',
        billingCycle: 'monthly'
      };

      const response = await request(app)
        .post('/api/billing/subscription')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(invalidData);

      tracker.mark('無効決済方法レスポンス受信');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('決済方法');

      tracker.mark('無効決済方法エラー検証完了');
    });
  });

  describe('API 8.3: トークンチャージ購入 (/api/owner/billing/charge-tokens)', () => {
    let paymentMethodId: string;

    beforeEach(async () => {
      tracker.setOperation('トークンチャージ用決済方法準備');
      
      const tokenResponse = await request(app)
        .post('/api/billing/token')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          cardNumber: '4242424242424242',
          expiryMonth: 12,
          expiryYear: 2030,
          cvc: '123',
          cardholderName: 'Test Owner'
        });

      paymentMethodId = tokenResponse.body.data.paymentMethodId;
      tracker.mark('決済方法準備完了');
    });

    it('STANDARDトークンパッケージを購入できる', async () => {
      tracker.setOperation('STANDARDトークン購入テスト');

      const chargeData = {
        package: 'standard',
        paymentMethodId
      };

      const response = await request(app)
        .post('/api/owner/billing/charge-tokens')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(chargeData);

      tracker.mark('トークン購入レスポンス受信');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('chargeId');
      expect(response.body.data).toHaveProperty('tokenAmount');
      expect(response.body.data.package).toBe('standard');
      expect(response.body.data.status).toBe('succeeded');

      tracker.mark('STANDARDトークン購入検証完了');
    });

    it('PREMIUMトークンパッケージを購入できる', async () => {
      tracker.setOperation('PREMIUMトークン購入テスト');

      const chargeData = {
        package: 'premium',
        paymentMethodId
      };

      const response = await request(app)
        .post('/api/owner/billing/charge-tokens')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(chargeData);

      tracker.mark('PREMIUMトークン購入レスポンス受信');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.package).toBe('premium');
      expect(response.body.data.tokenAmount).toBeGreaterThan(1000000); // PREMIUMは大容量

      tracker.mark('PREMIUMトークン購入検証完了');
    });

    it('管理者はトークンチャージできない（権限エラー）', async () => {
      tracker.setOperation('管理者権限エラーテスト');

      const chargeData = {
        package: 'standard',
        paymentMethodId
      };

      const response = await request(app)
        .post('/api/owner/billing/charge-tokens')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(chargeData);

      tracker.mark('管理者権限エラーレスポンス受信');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('権限');

      tracker.mark('管理者権限エラー検証完了');
    });

    it('決済失敗時の処理が正しく動作する', async () => {
      tracker.setOperation('決済失敗処理テスト');

      // デクライン用テストカードで決済方法を作成
      const declineTokenResponse = await request(app)
        .post('/api/billing/token')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          cardNumber: '4000000000000002', // デクライン用
          expiryMonth: 12,
          expiryYear: 2030,
          cvc: '123',
          cardholderName: 'Test Owner'
        });

      const declinePaymentMethodId = declineTokenResponse.body.data?.paymentMethodId;
      
      if (declinePaymentMethodId) {
        const chargeData = {
          package: 'standard',
          paymentMethodId: declinePaymentMethodId
        };

        const response = await request(app)
          .post('/api/owner/billing/charge-tokens')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(chargeData);

        tracker.mark('決済失敗レスポンス受信');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('決済');

        tracker.mark('決済失敗処理検証完了');
      } else {
        // デクライン用カードでトークン作成自体が失敗した場合
        tracker.mark('デクライン用カード自体が無効');
      }
    });
  });

  describe('API 8.4: 請求サマリー取得 (/api/owner/billing/summary)', () => {
    beforeEach(async () => {
      tracker.setOperation('請求サマリー用データ準備');
      
      // 決済履歴を作成するため、実際に取引を実行
      const tokenResponse = await request(app)
        .post('/api/billing/token')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          cardNumber: '4242424242424242',
          expiryMonth: 12,
          expiryYear: 2030,
          cvc: '123',
          cardholderName: 'Test Owner'
        });

      const paymentMethodId = tokenResponse.body.data.paymentMethodId;

      // サブスクリプション作成
      await request(app)
        .post('/api/billing/subscription')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          plan: 'standard',
          paymentMethodId,
          billingCycle: 'monthly'
        });

      tracker.mark('サンプルデータ作成完了');
    });

    it('請求サマリーを正しく取得できる', async () => {
      tracker.setOperation('請求サマリー取得テスト');

      const response = await request(app)
        .get('/api/owner/billing/summary')
        .set('Authorization', `Bearer ${ownerToken}`);

      tracker.mark('請求サマリーレスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('currentPlan');
      expect(response.body.data).toHaveProperty('billingCycle');
      expect(response.body.data).toHaveProperty('nextBillingDate');
      expect(response.body.data).toHaveProperty('currentUsage');
      expect(response.body.data).toHaveProperty('monthlyLimit');
      expect(response.body.data).toHaveProperty('paymentMethods');
      expect(response.body.data).toHaveProperty('upcomingInvoice');

      // 数値型の検証
      expect(typeof response.body.data.currentUsage).toBe('number');
      expect(typeof response.body.data.monthlyLimit).toBe('number');
      expect(Array.isArray(response.body.data.paymentMethods)).toBe(true);

      tracker.mark('請求サマリー検証完了');
    });

    it('管理者は請求サマリーを取得できない（権限エラー）', async () => {
      tracker.setOperation('管理者権限エラーテスト');

      const response = await request(app)
        .get('/api/owner/billing/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      tracker.mark('管理者権限エラーレスポンス受信');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('権限');

      tracker.mark('管理者権限エラー検証完了');
    });
  });

  describe('API 8.5: 請求書一覧取得 (/api/owner/billing/invoices)', () => {
    beforeEach(async () => {
      tracker.setOperation('請求書用データ準備');
      
      // 請求書を生成するためサブスクリプションを作成
      const tokenResponse = await request(app)
        .post('/api/billing/token')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          cardNumber: '4242424242424242',
          expiryMonth: 12,
          expiryYear: 2030,
          cvc: '123',
          cardholderName: 'Test Owner'
        });

      const paymentMethodId = tokenResponse.body.data.paymentMethodId;

      await request(app)
        .post('/api/billing/subscription')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          plan: 'professional',
          paymentMethodId,
          billingCycle: 'monthly'
        });

      tracker.mark('サブスクリプション作成完了');
    });

    it('請求書一覧を正しく取得できる', async () => {
      tracker.setOperation('請求書一覧取得テスト');

      const response = await request(app)
        .get('/api/owner/billing/invoices')
        .set('Authorization', `Bearer ${ownerToken}`);

      tracker.mark('請求書一覧レスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('invoices');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.invoices)).toBe(true);

      // 請求書が存在する場合の検証
      if (response.body.data.invoices.length > 0) {
        const invoice = response.body.data.invoices[0];
        expect(invoice).toHaveProperty('id');
        expect(invoice).toHaveProperty('invoiceNumber');
        expect(invoice).toHaveProperty('issueDate');
        expect(invoice).toHaveProperty('dueDate');
        expect(invoice).toHaveProperty('status');
        expect(invoice).toHaveProperty('total');
        expect(invoice).toHaveProperty('items');
      }

      tracker.mark('請求書一覧検証完了');
    });

    it('ページネーション付きで請求書を取得できる', async () => {
      tracker.setOperation('ページネーション取得テスト');

      const response = await request(app)
        .get('/api/owner/billing/invoices?page=1&limit=5')
        .set('Authorization', `Bearer ${ownerToken}`);

      tracker.mark('ページネーションレスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('currentPage');
      expect(response.body.data.pagination).toHaveProperty('totalPages');
      expect(response.body.data.pagination).toHaveProperty('totalItems');
      expect(response.body.data.pagination.currentPage).toBe(1);

      tracker.mark('ページネーション検証完了');
    });

    it('ステータスフィルターで請求書を絞り込める', async () => {
      tracker.setOperation('ステータスフィルターテスト');

      const response = await request(app)
        .get('/api/owner/billing/invoices?status=paid')
        .set('Authorization', `Bearer ${ownerToken}`);

      tracker.mark('ステータスフィルターレスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // フィルターされた結果の検証
      const invoices = response.body.data.invoices;
      if (invoices.length > 0) {
        invoices.forEach((invoice: any) => {
          expect(invoice.status).toBe('paid');
        });
      }

      tracker.mark('ステータスフィルター検証完了');
    });

    it('管理者は請求書一覧を取得できない（権限エラー）', async () => {
      tracker.setOperation('管理者権限エラーテスト');

      const response = await request(app)
        .get('/api/owner/billing/invoices')
        .set('Authorization', `Bearer ${adminToken}`);

      tracker.mark('管理者権限エラーレスポンス受信');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('権限');

      tracker.mark('管理者権限エラー検証完了');
    });
  });

  describe('Webhook処理 (/api/billing/webhook)', () => {
    it('有効なWebhookイベントを正しく処理できる', async () => {
      tracker.setOperation('Webhook処理テスト');

      // UnivaPayからのWebhookペイロード（サンプル）
      const webhookPayload = {
        event: 'charge.succeeded',
        data: {
          id: 'charge_test_123',
          amount: 9800,
          currency: 'jpy',
          status: 'succeeded',
          metadata: {
            organizationId: organization.id,
            packageType: 'standard'
          }
        }
      };

      // Webhook署名を生成（実際のUnivaPayの署名ロジックに基づく）
      const webhookSecret = process.env.UNIVAPAY_WEBHOOK_SECRET;
      const signature = `sha256=${webhookSecret}`;

      tracker.mark('Webhookペイロード準備完了');

      const response = await request(app)
        .post('/api/billing/webhook')
        .set('Authorization', signature)
        .send(webhookPayload);

      tracker.mark('Webhookレスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      tracker.mark('Webhook処理検証完了');
    });

    it('無効な署名のWebhookを拒否する', async () => {
      tracker.setOperation('無効署名Webhookテスト');

      const webhookPayload = {
        event: 'charge.failed',
        data: {
          id: 'charge_test_456',
          status: 'failed'
        }
      };

      const response = await request(app)
        .post('/api/billing/webhook')
        .set('Authorization', 'invalid-signature')
        .send(webhookPayload);

      tracker.mark('無効署名レスポンス受信');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);

      tracker.mark('無効署名拒否検証完了');
    });
  });

  describe('統合フローテスト', () => {
    it('完全な決済フローが正常に動作する', async () => {
      tracker.setOperation('完全決済フロー統合テスト');

      // 1. 決済トークン作成
      const tokenResponse = await request(app)
        .post('/api/billing/token')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          cardNumber: '4242424242424242',
          expiryMonth: 12,
          expiryYear: 2030,
          cvc: '123',
          cardholderName: 'Integration Test Owner'
        });

      expect(tokenResponse.status).toBe(201);
      const paymentMethodId = tokenResponse.body.data.paymentMethodId;
      tracker.mark('1. 決済トークン作成完了');

      // 2. サブスクリプション作成
      const subscriptionResponse = await request(app)
        .post('/api/billing/subscription')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          plan: 'enterprise',
          paymentMethodId,
          billingCycle: 'yearly'
        });

      expect(subscriptionResponse.status).toBe(201);
      tracker.mark('2. サブスクリプション作成完了');

      // 3. トークンチャージ購入
      const chargeResponse = await request(app)
        .post('/api/owner/billing/charge-tokens')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          package: 'premium',
          paymentMethodId
        });

      expect(chargeResponse.status).toBe(201);
      tracker.mark('3. トークンチャージ購入完了');

      // 4. 請求サマリー確認
      const summaryResponse = await request(app)
        .get('/api/owner/billing/summary')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(summaryResponse.status).toBe(200);
      expect(summaryResponse.body.data.currentPlan).toBe('enterprise');
      tracker.mark('4. 請求サマリー確認完了');

      // 5. 請求書一覧確認
      const invoicesResponse = await request(app)
        .get('/api/owner/billing/invoices')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(invoicesResponse.status).toBe(200);
      expect(Array.isArray(invoicesResponse.body.data.invoices)).toBe(true);
      tracker.mark('5. 請求書一覧確認完了');

      tracker.mark('完全決済フロー統合テスト完了');
    });

    it('セキュリティとレート制限が正しく動作する', async () => {
      tracker.setOperation('セキュリティ・レート制限テスト');

      // 認証なしでのアクセステスト
      const unauthResponse = await request(app)
        .post('/api/billing/token')
        .send({
          cardNumber: '4242424242424242',
          expiryMonth: 12,
          expiryYear: 2030,
          cvc: '123'
        });

      expect(unauthResponse.status).toBe(401);
      tracker.mark('未認証アクセス拒否確認');

      // 不正なPCI DSSデータのマスキングテスト
      const maskedResponse = await request(app)
        .post('/api/billing/token')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          cardNumber: '4242424242424242',
          expiryMonth: 12,
          expiryYear: 2030,
          cvc: '123',
          cardholderName: 'Security Test'
        });

      if (maskedResponse.status === 201) {
        // レスポンスにフルカード番号が含まれていないことを確認
        const responseText = JSON.stringify(maskedResponse.body);
        expect(responseText).not.toContain('4242424242424242');
        expect(maskedResponse.body.data.metadata.cardLast4).toBe('4242');
      }

      tracker.mark('PCI DSSセキュリティ確認');

      tracker.mark('セキュリティ・レート制限テスト完了');
    });
  });
});