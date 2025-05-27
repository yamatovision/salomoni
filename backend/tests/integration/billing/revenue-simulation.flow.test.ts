import request from 'supertest';
import app from '../../../src';
import { UserModel } from '../../../src/features/users/models/user.model';
import { Plan } from '../../../src/features/plans/models/plan.model';
import { Invoice } from '../../../src/features/billing/models/invoice.model';
import { PaymentHistory } from '../../../src/features/billing/models/payment-history.model';
import { RevenueSimulationService } from '../../../src/features/billing/services/revenue-simulation.service';
import { DatabaseTestHelper as dbHelper } from '../../utils/db-test-helper';
import { generateTestToken } from '../../utils/test-auth-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { UserRole } from '../../../src/types';
import { PlanType, BillingCycle } from '../../../src/features/plans/models/plan.model';

describe('収益シミュレーションAPI統合テスト', () => {
  let superAdminToken: string;
  let ownerToken: string;
  let adminToken: string;
  let superAdminUser: any;
  let testOrganization: any;
  let owner: any;
  let admin: any;
  let tracker: MilestoneTracker;

  beforeAll(async () => {
    await dbHelper.connect();
    tracker = new MilestoneTracker();
  });

  afterAll(async () => {
    await dbHelper.clearDatabase();
    await dbHelper.disconnect();
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
    
    tracker.setOperation('テストデータ準備');
    // SuperAdminユーザーを作成
    superAdminUser = await UserModel.create({
      name: 'Super Admin',
      email: 'superadmin@system.com',
      password: 'superadmin123',
      role: UserRole.SUPER_ADMIN,
      status: 'active'
    });
    
    // テスト用オーナーを作成（組織なし）
    owner = await UserModel.create({
      name: 'Test Owner',
      email: 'owner@test.com',
      password: 'owner123',
      role: UserRole.OWNER,
      status: 'active'
    });
    
    // テスト用組織を作成
    const { OrganizationModel } = await import('../../../src/features/organizations/models/organization.model');
    testOrganization = await OrganizationModel.create({
      name: 'Test Organization',
      email: 'test@org.com',
      status: 'active',
      plan: 'standard',
      ownerId: owner._id.toString()
    });
    
    // オーナーに組織IDを設定
    owner.organizationId = testOrganization._id;
    await owner.save();
    
    // テスト用管理者を作成
    admin = await UserModel.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: UserRole.ADMIN,
      organizationId: testOrganization._id,
      status: 'active'
    });
    
    // 認証トークンを生成
    superAdminToken = generateTestToken({
      id: superAdminUser._id.toString(),
      userId: superAdminUser._id.toString(),
      email: superAdminUser.email,
      roles: [UserRole.SUPER_ADMIN],
      currentRole: UserRole.SUPER_ADMIN,
      organizationId: '',
      sessionId: 'test-session',
      platform: 'web'
    });
    
    ownerToken = generateTestToken({
      id: owner._id.toString(),
      userId: owner._id.toString(),
      email: owner.email,
      roles: [UserRole.OWNER],
      currentRole: UserRole.OWNER,
      organizationId: testOrganization._id.toString(),
      sessionId: 'test-session',
      platform: 'web'
    });
    
    adminToken = generateTestToken({
      id: admin._id.toString(),
      userId: admin._id.toString(),
      email: admin.email,
      roles: [UserRole.ADMIN],
      currentRole: UserRole.ADMIN,
      organizationId: testOrganization._id.toString(),
      sessionId: 'test-session',
      platform: 'web'
    });
    
    // デフォルトプランを初期化
    await RevenueSimulationService.initializeDefaultPlans();
    
    tracker.mark('テストデータ準備完了');
  });

  describe('GET /api/superadmin/revenue/simulation-data', () => {
    it('SuperAdminは収益シミュレーションデータを取得できる', async () => {
      tracker.setOperation('収益シミュレーションデータ取得');
      
      // 追加のテストデータを作成
      await createSampleRevenueData(testOrganization._id);
      
      const response = await request(app)
        .get('/api/superadmin/revenue/simulation-data')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
      
      tracker.mark('APIレスポンス受信');
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      const data = response.body.data;
      
      // 組織データの検証
      expect(data.currentOrganizations).toBeDefined();
      expect(data.currentOrganizations.total).toBeGreaterThanOrEqual(1);
      expect(data.currentOrganizations.active).toBeGreaterThanOrEqual(0);
      expect(data.currentOrganizations.byPlan).toBeDefined();
      
      // 収益履歴の検証
      expect(Array.isArray(data.revenueHistory)).toBe(true);
      expect(data.revenueHistory.length).toBeGreaterThan(0);
      
      // 成長指標の検証
      expect(data.growthMetrics).toBeDefined();
      expect(Array.isArray(data.growthMetrics.newOrganizationsTrend)).toBe(true);
      expect(Array.isArray(data.growthMetrics.churnRateTrend)).toBe(true);
      expect(typeof data.growthMetrics.averageChurnRate).toBe('number');
      expect(typeof data.growthMetrics.averageNewOrganizations).toBe('number');
      
      // トークン指標の検証
      expect(data.tokenMetrics).toBeDefined();
      expect(data.tokenMetrics.averagePurchaseByPlan).toBeDefined();
      expect(data.tokenMetrics.monthlyUsageStats).toBeDefined();
      
      // プラン価格の検証
      expect(data.planPricing).toBeDefined();
      expect(Array.isArray(data.planPricing.subscription)).toBe(true);
      expect(Array.isArray(data.planPricing.tokenPacks)).toBe(true);
      
      tracker.mark('検証完了');
      tracker.summary();
    });

    it('Ownerは収益シミュレーションデータにアクセスできない', async () => {
      const response = await request(app)
        .get('/api/superadmin/revenue/simulation-data')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('アクセス権限がありません');
    });

    it('Adminは収益シミュレーションデータにアクセスできない', async () => {
      const response = await request(app)
        .get('/api/superadmin/revenue/simulation-data')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('アクセス権限がありません');
    });

    it('認証なしでは収益シミュレーションデータにアクセスできない', async () => {
      const response = await request(app)
        .get('/api/superadmin/revenue/simulation-data')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('プラン管理API', () => {
    describe('GET /api/superadmin/plans', () => {
      it('プラン一覧を取得できる', async () => {
        tracker.setOperation('プラン一覧取得');
        
        const response = await request(app)
          .get('/api/superadmin/plans')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.plans)).toBe(true);
        expect(response.body.data.plans.length).toBeGreaterThan(0);
        expect(response.body.data.pagination).toBeDefined();
        
        tracker.mark('プラン一覧取得完了');
      });

      it('プランタイプでフィルタリングできる', async () => {
        const response = await request(app)
          .get('/api/superadmin/plans')
          .query({ type: PlanType.SUBSCRIPTION })
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        const plans = response.body.data.plans;
        expect(plans.every((p: any) => p.type === PlanType.SUBSCRIPTION)).toBe(true);
      });

      it('アクティブ状態でフィルタリングできる', async () => {
        const response = await request(app)
          .get('/api/superadmin/plans')
          .query({ isActive: true })
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        const plans = response.body.data.plans;
        expect(plans.every((p: any) => p.isActive === true)).toBe(true);
      });
    });

    describe('POST /api/superadmin/plans', () => {
      it('SuperAdminは新しいプランを作成できる', async () => {
        tracker.setOperation('新規プラン作成');
        
        const newPlan = {
          name: 'カスタムプラン',
          type: PlanType.SUBSCRIPTION,
          price: 29800,
          billingCycle: BillingCycle.MONTHLY,
          features: ['特別機能1', '特別機能2'],
          limits: {
            stylists: 50,
            clients: 1000,
            tokensPerMonth: 15000
          },
          displayOrder: 10
        };
        
        const response = await request(app)
          .post('/api/superadmin/plans')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(newPlan)
          .expect(201);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(newPlan.name);
        expect(response.body.data.price).toBe(newPlan.price);
        expect(response.body.data.limits).toEqual(newPlan.limits);
        
        tracker.mark('プラン作成完了');
      });

      it('トークンパックを作成できる', async () => {
        const tokenPack = {
          name: 'メガパック',
          type: PlanType.TOKEN_PACK,
          price: 50000,
          billingCycle: BillingCycle.ONE_TIME,
          tokenAmount: 60000,
          features: ['60000トークン', '20%ボーナス'],
          displayOrder: 20
        };
        
        const response = await request(app)
          .post('/api/superadmin/plans')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(tokenPack)
          .expect(201);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data.tokenAmount).toBe(tokenPack.tokenAmount);
      });

      it('必須フィールドが不足している場合はエラーを返す', async () => {
        const invalidPlan = {
          name: 'Invalid Plan',
          // type is missing
          price: 10000
        };
        
        const response = await request(app)
          .post('/api/superadmin/plans')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(invalidPlan)
          .expect(400);
        
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('プランタイプは必須です');
      });

      it('Ownerはプランを作成できない', async () => {
        const response = await request(app)
          .post('/api/superadmin/plans')
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({
            name: 'Test Plan',
            type: PlanType.SUBSCRIPTION,
            price: 10000,
            billingCycle: BillingCycle.MONTHLY
          })
          .expect(403);
        
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('プラン作成権限がありません');
      });
    });

    describe('PUT /api/superadmin/plans/:planId', () => {
      let testPlan: any;

      beforeEach(async () => {
        testPlan = await Plan.create({
          name: 'テストプラン',
          type: PlanType.SUBSCRIPTION,
          price: 15000,
          billingCycle: BillingCycle.MONTHLY,
          features: ['機能1'],
          limits: {
            stylists: 10,
            clients: 200,
            tokensPerMonth: 2000
          },
          displayOrder: 5
        });
      });

      it('SuperAdminはプランを更新できる', async () => {
        const updateData = {
          price: 18000,
          limits: {
            stylists: 15,
            clients: 300,
            tokensPerMonth: 3000
          }
        };
        
        const response = await request(app)
          .put(`/api/superadmin/plans/${testPlan._id}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send(updateData)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(response.body.data.price).toBe(updateData.price);
        expect(response.body.data.limits).toEqual(updateData.limits);
      });

      it('存在しないプランの更新はエラーを返す', async () => {
        const response = await request(app)
          .put('/api/superadmin/plans/123456789012345678901234')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({ price: 20000 })
          .expect(500);
        
        expect(response.body.success).toBe(false);
      });
    });

    describe('DELETE /api/superadmin/plans/:planId', () => {
      let testPlan: any;

      beforeEach(async () => {
        testPlan = await Plan.create({
          name: '削除テストプラン',
          type: PlanType.TOKEN_PACK,
          price: 5000,
          billingCycle: BillingCycle.ONE_TIME,
          tokenAmount: 5000,
          features: ['5000トークン']
        });
      });

      it('SuperAdminはプランを削除（論理削除）できる', async () => {
        const response = await request(app)
          .delete(`/api/superadmin/plans/${testPlan._id}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        
        // 論理削除の確認
        const deletedPlan = await Plan.findById(testPlan._id);
        expect(deletedPlan?.isActive).toBe(false);
      });
    });
  });
});

// テスト用の収益データを作成する関数
async function createSampleRevenueData(organizationId: string) {
  // サンプル請求書を作成
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const invoiceDate = new Date(now);
    invoiceDate.setMonth(now.getMonth() - i);
    
    await Invoice.create({
      organizationId,
      invoiceNumber: `INV-${Date.now()}-${i}`,
      type: 'subscription',
      status: 'paid',
      amount: 9800,
      subtotal: 9800,
      tax: 0,
      total: 9800,
      issueDate: invoiceDate,
      dueDate: invoiceDate,
      paidAt: invoiceDate,
      items: [{
        description: 'Standard Plan',
        quantity: 1,
        unitPrice: 9800,
        amount: 9800
      }]
    });
  }
  
  // サンプル支払い履歴を作成
  // PaymentMethodを作成
  const { PaymentMethod } = await import('../../../src/features/billing/models/payment-method.model');
  const paymentMethod = await PaymentMethod.create({
    organizationId,
    type: 'credit_card',
    isDefault: true,
    metadata: {
      last4: '1234',
      brand: 'visa'
    }
  });
  
  for (let i = 0; i < 5; i++) {
    const paymentDate = new Date(now);
    paymentDate.setMonth(now.getMonth() - Math.floor(i / 2));
    
    // Invoiceを作成
    const invoice = await Invoice.create({
      organizationId,
      invoiceNumber: `INV-TOKEN-${Date.now()}-${i}`,
      type: 'token',
      status: 'paid',
      amount: 1000 + (i * 500),
      subtotal: 1000 + (i * 500),
      tax: 0,
      total: 1000 + (i * 500),
      issueDate: paymentDate,
      dueDate: paymentDate,
      paidAt: paymentDate,
      items: [{
        description: `Token Purchase ${i + 1}`,
        quantity: 1,
        unitPrice: 1000 + (i * 500),
        amount: 1000 + (i * 500)
      }]
    });
    
    await PaymentHistory.create({
      organizationId,
      invoiceId: invoice._id,
      paymentMethodId: paymentMethod._id,
      amount: 1000 + (i * 500),
      status: 'success',
      metadata: {
        tokenAmount: 1000000 * (i + 1)
      },
      createdAt: paymentDate
    });
  }
}