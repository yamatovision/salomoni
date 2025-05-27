import request from 'supertest';
import app from '../../../src/index';
import { TestAuthHelper } from '../../utils/test-auth-helper';
import { DatabaseTestHelper } from '../../utils/db-test-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { API_PATHS, UserRole } from '../../../src/types';
import { OrganizationModel } from '../../../src/features/organizations/models/organization.model';
import { Invoice } from '../../../src/features/billing/models/invoice.model';
import { Subscription } from '../../../src/features/billing/models/subscription.model';
import { PaymentHistory } from '../../../src/features/billing/models/payment-history.model';
import mongoose from 'mongoose';

describe('SuperAdmin 請求管理機能 統合テスト', () => {
  const tracker = new MilestoneTracker();
  let superAdminToken: string;
  let testOrganizationId: string;
  let testInvoiceId: string;

  beforeAll(async () => {
    tracker.mark('テスト環境初期化開始');
    await DatabaseTestHelper.connect();
    tracker.mark('データベース接続完了');
  });

  afterAll(async () => {
    tracker.mark('クリーンアップ開始');
    await DatabaseTestHelper.clearDatabase();
    await DatabaseTestHelper.disconnect();
    tracker.summary();
  });

  beforeEach(async () => {
    tracker.setOperation('テストデータ準備');
    
    // データクリーンアップ
    await Invoice.deleteMany({});
    await Subscription.deleteMany({});
    await PaymentHistory.deleteMany({});
    await OrganizationModel.deleteMany({ email: { $regex: /^test-billing-/ } });
    
    // SuperAdmin認証
    const { token } = await TestAuthHelper.createTestUserWithToken({ role: UserRole.SUPER_ADMIN });
    superAdminToken = token;
    
    // テスト用組織作成
    const testOrg = await OrganizationModel.create({
      name: 'Test Billing Organization',
      email: 'test-billing-org@example.com',
      ownerId: 'test-owner-id',
      address: '東京都渋谷区',
      contactPhone: '03-1234-5678',
      status: 'active',
      plan: 'professional'
    });
    testOrganizationId = (testOrg as any)._id.toString();
    
    // テスト用サブスクリプション作成
    const subscription = await Subscription.create({
      organizationId: testOrganizationId,
      plan: 'professional',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    
    // テスト用請求書作成
    const invoice = await Invoice.create({
      invoiceNumber: 'INV-2024-001',
      organizationId: testOrganizationId,
      subscriptionId: subscription._id,
      type: 'subscription',
      status: 'paid',
      subtotal: 5000,
      tax: 500,
      total: 5500,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      paidAt: new Date(),
      items: [{
        description: 'プロフェッショナルプラン',
        unitPrice: 5000,
        quantity: 1,
        amount: 5000
      }]
    });
    testInvoiceId = invoice._id.toString();
    
    // テスト用支払い履歴作成
    await PaymentHistory.create({
      organizationId: testOrganizationId,
      invoiceId: testInvoiceId,
      amount: 5500,
      status: 'success',
      paymentMethodId: new mongoose.Types.ObjectId(),
      univapayChargeId: 'test-univapay-charge-id'
    });
    
    tracker.mark('テストデータ準備完了');
  });

  describe('13.1 請求サマリー取得', () => {
    it('SuperAdminが全体の請求サマリーを取得できる', async () => {
      tracker.setOperation('請求サマリー取得');
      
      const response = await request(app)
        .get(API_PATHS.SUPERADMIN.BILLING_SUMMARY)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .query({ period: 'current_month' });
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        revenue: {
          total: expect.any(Number),
          subscription: expect.any(Number),
          tokenSales: expect.any(Number),
          monthlyGrowth: expect.any(Number),
          yearlyGrowth: expect.any(Number)
        },
        paymentStatus: {
          totalOutstanding: expect.any(Number),
          totalOverdue: expect.any(Number),
          successRate: expect.any(Number),
          failureCount: expect.any(Number)
        },
        topOrganizations: expect.any(Array),
        period: {
          start: expect.any(String),
          end: expect.any(String)
        }
      });
      
      tracker.mark('サマリー検証完了');
    });

    it('特定組織の請求サマリーを取得できる', async () => {
      tracker.setOperation('組織別請求サマリー取得');
      
      const response = await request(app)
        .get(API_PATHS.SUPERADMIN.BILLING_SUMMARY)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .query({ 
          period: 'current_month',
          organizationId: testOrganizationId
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.revenue.total).toBeGreaterThanOrEqual(0);
    });

    it('権限がない場合は403エラーを返す', async () => {
      tracker.setOperation('権限エラーテスト');
      
      const { token: userToken } = await TestAuthHelper.createTestUserWithToken({ role: UserRole.USER, organizationId: testOrganizationId });
      
      const response = await request(app)
        .get(API_PATHS.SUPERADMIN.BILLING_SUMMARY)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('13.3 請求書一覧取得', () => {
    it('SuperAdminが全組織の請求書一覧を取得できる', async () => {
      tracker.setOperation('請求書一覧取得');
      
      const response = await request(app)
        .get(API_PATHS.SUPERADMIN.BILLING_INVOICES)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .query({
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toMatchObject({
        total: expect.any(Number),
        pages: expect.any(Number),
        currentPage: 1,
        limit: 20
      });
      
      // 請求書データの検証
      const invoice = response.body.data[0];
      expect(invoice).toMatchObject({
        id: expect.any(String),
        invoiceNumber: expect.any(String),
        organizationId: expect.any(String),
        organizationName: expect.any(String),
        type: expect.any(String),
        status: expect.any(String),
        amount: expect.any(Number),
        issueDate: expect.any(String),
        dueDate: expect.any(String)
      });
      
      tracker.mark('請求書一覧検証完了');
    });

    it('ステータスでフィルタリングできる', async () => {
      tracker.setOperation('ステータスフィルタリング');
      
      // 未払い請求書を作成
      await Invoice.create({
        invoiceNumber: 'INV-2024-002',
        organizationId: testOrganizationId,
        type: 'one-time',
        status: 'draft',
        subtotal: 10000,
        tax: 1000,
        total: 11000,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [{
          description: 'AIトークン 10,000個',
          unitPrice: 10000,
          quantity: 1,
          amount: 10000
        }]
      });
      
      const response = await request(app)
        .get(API_PATHS.SUPERADMIN.BILLING_INVOICES)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .query({ status: 'paid' });
      
      expect(response.status).toBe(200);
      expect(response.body.data.every((inv: any) => inv.status === 'paid')).toBe(true);
    });

    it('日付範囲でフィルタリングできる', async () => {
      tracker.setOperation('日付範囲フィルタリング');
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();
      
      const response = await request(app)
        .get(API_PATHS.SUPERADMIN.BILLING_INVOICES)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('13.4 請求書詳細取得', () => {
    it('SuperAdminが請求書の詳細を取得できる', async () => {
      tracker.setOperation('請求書詳細取得');
      
      const response = await request(app)
        .get(API_PATHS.SUPERADMIN.BILLING_INVOICE_DETAIL(testInvoiceId))
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testInvoiceId,
        invoiceNumber: 'INV-2024-001',
        organizationId: testOrganizationId,
        type: 'subscription',
        status: 'paid',
        tax: 500,
        total: 5500,
        issueDate: expect.any(String),
        dueDate: expect.any(String),
        paidAt: expect.any(String),
        items: expect.any(Array),
        paymentHistory: expect.any(Array),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      
      // 支払い履歴の検証
      expect(response.body.data.paymentHistory).toHaveLength(1);
      expect(response.body.data.paymentHistory[0]).toMatchObject({
        amount: 5500,
        status: 'success',
        attemptDate: expect.any(String)
      });
      
      tracker.mark('請求書詳細検証完了');
    });

    it('存在しない請求書IDの場合は404エラーを返す', async () => {
      tracker.setOperation('存在しない請求書エラーテスト');
      
      const invalidId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(API_PATHS.SUPERADMIN.BILLING_INVOICE_DETAIL(invalidId))
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVOICE_NOT_FOUND');
    });
  });

  describe('Phase 3機能（未実装）', () => {
    it('請求書更新は501エラーを返す', async () => {
      tracker.setOperation('未実装機能テスト');
      
      const response = await request(app)
        .patch(API_PATHS.SUPERADMIN.BILLING_INVOICE_DETAIL(testInvoiceId))
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'canceled',
          notes: 'テストによるキャンセル'
        });
      
      expect(response.status).toBe(501);
      expect(response.body.code).toBe('NOT_IMPLEMENTED');
    });

    it('請求書再送信は501エラーを返す', async () => {
      const response = await request(app)
        .post(API_PATHS.SUPERADMIN.BILLING_INVOICE_RESEND(testInvoiceId))
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(response.status).toBe(501);
      expect(response.body.code).toBe('NOT_IMPLEMENTED');
    });
  });
});