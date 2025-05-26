import request from 'supertest';
// import { MongoMemoryServer } from 'mongodb-memory-server'; // 未使用のため削除
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { subDays } from 'date-fns';
import app from '../../../src/index';
import { UserModel } from '../../../src/features/users/models/user.model';
import { OrganizationModel } from '../../../src/features/organizations/models/organization.model';
import { ClientModel } from '../../../src/features/clients/models/client.model';
import { AppointmentModel } from '../../../src/features/appointments/models/appointment.model';
import { TokenUsage } from '../../../src/features/billing/models/token-usage.model';
import { UserRole, UserStatus, OrganizationStatus, OrganizationPlan, AppointmentStatus } from '../../../src/types';
import { MilestoneTracker } from '../../utils/MilestoneTracker';

describe('ダッシュボードAPI統合テスト', () => {
  let accessToken: string;
  let ownerUserId: string;
  let adminUserId: string;
  let stylistUserId: string;
  let organizationId: string;
  let tracker: MilestoneTracker;

  beforeAll(async () => {
    // MongoDB接続
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined');
    }
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    tracker = new MilestoneTracker();
    tracker.mark('テスト開始');

    // 既存データクリーンアップ
    tracker.setOperation('データクリーンアップ');
    await Promise.all([
      UserModel.deleteMany({}),
      OrganizationModel.deleteMany({}),
      ClientModel.deleteMany({}),
      AppointmentModel.deleteMany({}),
      TokenUsage.deleteMany({})
    ]);
    tracker.mark('クリーンアップ完了');

    // テスト組織作成
    tracker.setOperation('テストデータセットアップ');
    const organization = await OrganizationModel.create({
      name: 'ダッシュボードテストサロン',
      displayName: 'Dashboard Test Salon',
      email: 'test@dashboardsalon.com',
      status: OrganizationStatus.ACTIVE,
      plan: OrganizationPlan.PROFESSIONAL
    });
    organizationId = (organization._id as mongoose.Types.ObjectId).toString();

    // テストユーザー作成（オーナー）
    const ownerUser = await UserModel.create({
      email: 'owner@dashboardtest.com',
      password: 'password123',
      name: 'Test Owner',
      role: UserRole.OWNER,
      organizationId,
      status: UserStatus.ACTIVE
    });
    ownerUserId = (ownerUser._id as mongoose.Types.ObjectId).toString();
    organization.ownerId = ownerUserId;
    await organization.save();

    // 管理者ユーザー作成
    const adminUser = await UserModel.create({
      email: 'admin@dashboardtest.com',
      password: 'password123',
      name: 'Test Admin',
      role: UserRole.ADMIN,
      organizationId,
      status: UserStatus.ACTIVE
    });
    adminUserId = (adminUser._id as mongoose.Types.ObjectId).toString();

    // スタイリストユーザー作成
    const stylistUser = await UserModel.create({
      email: 'stylist@dashboardtest.com',
      password: 'password123',
      name: 'Test Stylist',
      role: UserRole.USER,
      organizationId,
      status: UserStatus.ACTIVE
    });
    stylistUserId = (stylistUser._id as mongoose.Types.ObjectId).toString();

    // テストクライアント作成
    const clientPromises = [];
    for (let i = 1; i <= 15; i++) {
      clientPromises.push(ClientModel.create({
        organizationId,
        name: `テストクライアント${i}`,
        email: `client${i}@test.com`,
        phoneNumber: `090-0000-00${String(i).padStart(2, '0')}`,
        visitCount: i
      }));
    }
    const clients = await Promise.all(clientPromises);
    if (clients.length === 0) throw new Error('No clients created');

    // テスト予約作成（今日の予約）
    const today = new Date();
    const appointmentPromises = [];
    
    // 今日の予約（8件）
    for (let i = 0; i < 8; i++) {
      const scheduledAt = new Date(today);
      scheduledAt.setHours(9 + i, 0, 0, 0);
      
      appointmentPromises.push(AppointmentModel.create({
        organizationId,
        clientId: ((clients[i]?._id || clients[0]!._id) as mongoose.Types.ObjectId),
        stylistId: i < 5 ? stylistUserId : undefined, // 5件は担当済み、3件は未担当
        scheduledAt,
        duration: 60,
        services: ['カット', 'カラー'],
        status: i < 2 ? AppointmentStatus.COMPLETED : AppointmentStatus.SCHEDULED
      }));
    }

    // 今週の完了予約（追加5件）
    for (let i = 0; i < 5; i++) {
      const scheduledAt = subDays(today, i + 1);
      appointmentPromises.push(AppointmentModel.create({
        organizationId,
        clientId: ((clients[8 + i]?._id || clients[0]!._id) as mongoose.Types.ObjectId),
        stylistId: stylistUserId,
        scheduledAt,
        duration: 90,
        services: ['パーマ', 'トリートメント'],
        status: AppointmentStatus.COMPLETED,
        completedAt: scheduledAt
      }));
    }

    await Promise.all(appointmentPromises);

    // トークン使用履歴作成（過去30日分）
    const tokenUsagePromises = [];
    for (let i = 0; i < 30; i++) {
      const timestamp = subDays(today, i);
      const dailyUsage = Math.floor(Math.random() * 50000) + 10000; // 10,000〜60,000トークン
      
      tokenUsagePromises.push(TokenUsage.create({
        organizationId,
        userId: ownerUserId,
        endpoint: '/api/chat/send',
        tokens: dailyUsage,
        cost: dailyUsage * 0.0001,
        timestamp
      }));
    }
    await Promise.all(tokenUsagePromises);

    // アクセストークン生成
    accessToken = jwt.sign(
      {
        id: ownerUserId,
        userId: ownerUserId,
        email: 'owner@dashboardtest.com',
        roles: [UserRole.OWNER],
        currentRole: UserRole.OWNER,
        organizationId,
        sessionId: 'test-session',
        platform: 'web'
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    tracker.mark('セットアップ完了');
  });

  afterEach(async () => {
    await Promise.all([
      UserModel.deleteMany({}),
      OrganizationModel.deleteMany({}),
      ClientModel.deleteMany({}),
      AppointmentModel.deleteMany({}),
      TokenUsage.deleteMany({})
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/admin/dashboard', () => {
    it('正常系：管理者ダッシュボードデータを取得できる', async () => {
      tracker.setOperation('ダッシュボードデータ取得');
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      tracker.mark('レスポンス受信');

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      const dashboardData = response.body.data;
      
      // 基本統計情報の検証
      expect(dashboardData.todayAppointments).toBe(8);
      expect(dashboardData.totalClients).toBe(15);
      expect(dashboardData.totalStylists).toBe(1);
      expect(dashboardData.weeklyCompletedAppointments).toBe(7); // 今日2件 + 今週5件
      
      // トークン使用状況の検証
      expect(dashboardData.monthlyTokenUsage).toBeDefined();
      expect(dashboardData.monthlyTokenUsage.used).toBeGreaterThan(0);
      expect(dashboardData.monthlyTokenUsage.limit).toBe(1000000);
      expect(dashboardData.monthlyTokenUsage.percentage).toBeGreaterThanOrEqual(0);
      expect(dashboardData.monthlyTokenUsage.percentage).toBeLessThanOrEqual(100);
      
      // 未担当予約の検証
      expect(dashboardData.unassignedAppointmentsCount).toBe(3);
      expect(dashboardData.unassignedAppointments).toHaveLength(3);
      expect(dashboardData.unassignedAppointments[0]).toHaveProperty('id');
      expect(dashboardData.unassignedAppointments[0]).toHaveProperty('clientName');
      expect(dashboardData.unassignedAppointments[0]).toHaveProperty('serviceType');
      expect(dashboardData.unassignedAppointments[0]).toHaveProperty('startTime');
      expect(dashboardData.unassignedAppointments[0]).toHaveProperty('endTime');
      
      // チャートデータの検証
      expect(dashboardData.charts).toBeDefined();
      expect(dashboardData.charts.tokenUsageChart).toBeDefined();
      expect(dashboardData.charts.tokenUsageChart.labels).toHaveLength(30);
      expect(dashboardData.charts.tokenUsageChart.datasets).toHaveLength(1);
      
      tracker.mark('検証完了');
      tracker.summary();
    });

    it('正常系：管理者権限でもアクセスできる', async () => {
      const adminToken = jwt.sign(
        {
          id: adminUserId,
          userId: adminUserId,
          email: 'admin@dashboardtest.com',
          roles: [UserRole.ADMIN],
          currentRole: UserRole.ADMIN,
          organizationId,
          sessionId: 'test-session',
          platform: 'web'
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('異常系：認証なしではアクセスできない', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('異常系：スタイリスト権限ではアクセスできない', async () => {
      const stylistToken = jwt.sign(
        {
          id: stylistUserId,
          userId: stylistUserId,
          email: 'stylist@dashboardtest.com',
          roles: [UserRole.USER],
          currentRole: UserRole.USER,
          organizationId,
          sessionId: 'test-session',
          platform: 'web'
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${stylistToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('権限がありません');
    });
  });

  describe('GET /api/admin/dashboard/stats', () => {
    it('正常系：統計情報のみを取得できる（軽量版）', async () => {
      tracker.setOperation('統計情報取得');
      const response = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      tracker.mark('レスポンス受信');

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      const statsData = response.body.data;
      
      // 基本統計情報の検証
      expect(statsData.todayAppointments).toBe(8);
      expect(statsData.totalClients).toBe(15);
      expect(statsData.totalStylists).toBe(1);
      expect(statsData.weeklyCompletedAppointments).toBe(7);
      
      // チャートデータが含まれていないことを確認
      expect(statsData.charts).toBeUndefined();
      
      tracker.mark('検証完了');
    });
  });

  describe('GET /api/admin/dashboard/token-usage-chart', () => {
    it('正常系：トークン使用状況チャートデータのみを取得できる', async () => {
      tracker.setOperation('チャートデータ取得');
      const response = await request(app)
        .get('/api/admin/dashboard/token-usage-chart')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      tracker.mark('レスポンス受信');

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      const chartData = response.body.data;
      
      // チャートデータの検証
      expect(chartData.labels).toHaveLength(30);
      expect(chartData.datasets).toHaveLength(1);
      expect(chartData.datasets[0].label).toBe('トークン使用量');
      expect(chartData.datasets[0].data).toHaveLength(30);
      
      // データポイントの形式検証
      chartData.datasets[0].data.forEach((dataPoint: any) => {
        expect(dataPoint).toHaveProperty('label');
        expect(dataPoint).toHaveProperty('value');
        expect(typeof dataPoint.value).toBe('number');
        expect(dataPoint.value).toBeGreaterThanOrEqual(0);
      });
      
      tracker.mark('検証完了');
      tracker.summary();
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量データでも適切な時間内にレスポンスを返す', async () => {
      tracker.setOperation('大量データ準備');
      
      // 追加で大量のクライアントと予約を作成
      const bulkClients = [];
      for (let i = 1; i <= 100; i++) {
        bulkClients.push({
          organizationId,
          name: `大量テストクライアント${i}`,
          email: `bulk${i}@test.com`,
          phoneNumber: `080-0000-${String(i).padStart(4, '0')}`,
          visitCount: i
        });
      }
      await ClientModel.insertMany(bulkClients);
      
      tracker.mark('大量データ作成完了');
      
      // パフォーマンス測定
      tracker.setOperation('ダッシュボードAPI呼び出し');
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      tracker.mark(`レスポンス受信（${responseTime}ms）`);
      
      // レスポンスタイムが2秒以内であることを確認
      expect(responseTime).toBeLessThan(2000);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalClients).toBe(115); // 15 + 100
      
      tracker.summary();
    });
  });

  describe('エッジケーステスト', () => {
    it('データが0件の場合でも正常に動作する', async () => {
      // すべてのデータを削除
      await Promise.all([
        ClientModel.deleteMany({ organizationId }),
        AppointmentModel.deleteMany({ organizationId }),
        TokenUsage.deleteMany({ organizationId })
      ]);

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.todayAppointments).toBe(0);
      expect(response.body.data.totalClients).toBe(0);
      expect(response.body.data.unassignedAppointmentsCount).toBe(0);
      expect(response.body.data.monthlyTokenUsage.used).toBe(0);
    });

    it('組織IDがない場合はエラーを返す', async () => {
      const invalidToken = jwt.sign(
        {
          id: ownerUserId,
          userId: ownerUserId,
          email: 'owner@dashboardtest.com',
          roles: [UserRole.OWNER],
          currentRole: UserRole.OWNER,
          // organizationId を意図的に省略
          sessionId: 'test-session',
          platform: 'web'
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('組織IDが指定されていません');
    });
  });
});