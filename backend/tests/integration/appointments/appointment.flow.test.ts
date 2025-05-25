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
import { AppointmentModel } from '../../../src/features/appointments/models/appointment.model';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { UserRole, AppointmentStatus } from '../../../src/types';

describe('予約・スケジュール管理 統合テスト', () => {
  let tracker: MilestoneTracker;
  let ownerToken: string;
  let adminToken: string;
  let stylistToken: string;
  let stylist2Token: string;
  let organizationId: string;
  let testClient: any;
  let stylistId: string;
  let stylist2Id: string;

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

    // テストユーザー作成
    const owner = await createTestUserWithToken(UserRole.OWNER, organizationId);
    ownerToken = owner.token;

    const admin = await createTestUserWithToken(UserRole.ADMIN, organizationId);
    adminToken = admin.token;

    const stylist = await createTestUserWithToken(UserRole.USER, organizationId);
    stylistToken = stylist.token;
    stylistId = stylist.user.id;

    const stylist2 = await createTestUserWithToken(UserRole.USER, organizationId);
    stylist2Token = stylist2.token;
    stylist2Id = stylist2.user.id;

    // テストクライアント作成
    testClient = await ClientModel.create({
      organizationId,
      name: 'テストクライアント',
      furigana: 'てすとくらいあんと',
      email: 'test@example.com',
      phone: '090-1234-5678',
      birthDate: new Date('1990-01-01'),
      gender: 'female',
    });

    tracker.mark('準備完了');
  });

  describe('POST /api/appointments - 新規予約作成', () => {
    const validAppointmentData = {
      clientId: '',
      scheduledAt: '',
      duration: 60,
      services: ['カット', 'カラー'],
      note: 'テスト予約',
    };

    beforeEach(() => {
      validAppointmentData.clientId = testClient._id.toString();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      validAppointmentData.scheduledAt = tomorrow.toISOString();
    });

    it('管理者が新規予約を作成できる', async () => {
      tracker.setOperation('管理者による予約作成');

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validAppointmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.clientId).toBe(validAppointmentData.clientId);
      expect(response.body.data.status).toBe(AppointmentStatus.SCHEDULED);
      expect(response.body.data.services).toEqual(validAppointmentData.services);

      tracker.mark('予約作成成功');
    });

    it('スタイリストを指定して予約を作成できる', async () => {
      const dataWithStylist = {
        ...validAppointmentData,
        stylistId,
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(dataWithStylist);

      expect(response.status).toBe(201);
      expect(response.body.data.stylistId).toBe(stylistId);
    });

    it('他組織のクライアントでは予約作成に失敗する', async () => {
      const otherOrg = await createTestOrganization();
      const otherClient = await ClientModel.create({
        organizationId: otherOrg.id,
        name: '他組織クライアント',
        furigana: 'たそしきくらいあんと',
        email: 'other@example.com',
        phone: '090-9876-5432',
        birthDate: new Date('1990-01-01'),
        gender: 'male',
      });

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validAppointmentData,
          clientId: otherClient._id.toString(),
        });

      // セキュリティのため、他組織のクライアントは存在しないものとして扱う
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('クライアントが見つかりません');
    });

    it('過去の日時では予約作成に失敗する', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validAppointmentData,
          scheduledAt: yesterday.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('現在時刻より後');
    });

    it('スタイリストは予約作成権限がない', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${stylistToken}`)
        .send(validAppointmentData);

      expect(response.status).toBe(403);
    });

    it('必須フィールドが不足している場合は失敗する', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scheduledAt: validAppointmentData.scheduledAt,
          duration: validAppointmentData.duration,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('クライアントIDは必須です');
    });
  });

  describe('GET /api/admin/appointments - 予約一覧取得', () => {
    beforeEach(async () => {
      // テスト用予約データ作成
      const appointments = [];
      for (let i = 0; i < 5; i++) {
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + i + 1);
        scheduledAt.setHours(10 + i, 0, 0, 0);

        appointments.push({
          organizationId,
          clientId: testClient._id.toString(),
          stylistId: i % 2 === 0 ? stylistId : stylist2Id,
          scheduledAt,
          duration: 60,
          services: ['カット'],
          status: AppointmentStatus.SCHEDULED,
        });
      }
      await AppointmentModel.insertMany(appointments);
    });

    it('管理者が全予約一覧を取得できる', async () => {
      tracker.setOperation('管理者による予約一覧取得');

      const response = await request(app)
        .get('/api/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.meta.pagination).toBeDefined();
      expect(response.body.meta.pagination.totalItems).toBe(5);

      tracker.mark('予約一覧取得成功');
    });

    it('スタイリストは自分の予約のみ取得できる', async () => {
      const response = await request(app)
        .get('/api/admin/appointments')
        .set('Authorization', `Bearer ${stylistToken}`)
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3); // 偶数インデックスの予約
      response.body.data.forEach((appointment: any) => {
        expect(appointment.stylistId).toBe(stylistId);
      });
    });

    it('ステータスでフィルタリングできる', async () => {
      // 1件をキャンセル済みに更新
      await AppointmentModel.findOneAndUpdate(
        { stylistId },
        { status: AppointmentStatus.CANCELED, canceledAt: new Date() }
      );

      const response = await request(app)
        .get('/api/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: AppointmentStatus.SCHEDULED });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(4);
    });

    it('日付範囲でフィルタリングできる', async () => {
      const from = new Date();
      from.setDate(from.getDate() + 2);
      from.setHours(0, 0, 0, 0);

      const to = new Date();
      to.setDate(to.getDate() + 4);
      to.setHours(23, 59, 59, 999);

      const response = await request(app)
        .get('/api/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          from: from.toISOString(),
          to: to.toISOString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3); // 2日後、3日後、4日後の予約
    });

    it('ページネーションが正しく動作する', async () => {
      const response = await request(app)
        .get('/api/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 2, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.pagination.currentPage).toBe(2);
      expect(response.body.meta.pagination.hasPrev).toBe(true);
    });
  });

  describe('GET /api/appointments/:id - 予約詳細取得', () => {
    let testAppointment: any;

    beforeEach(async () => {
      testAppointment = await AppointmentModel.create({
        organizationId,
        clientId: testClient._id.toString(),
        stylistId,
        scheduledAt: new Date(Date.now() + 86400000),
        duration: 60,
        services: ['カット'],
        status: AppointmentStatus.SCHEDULED,
      });
    });

    it('管理者が予約詳細を取得できる', async () => {
      tracker.setOperation('予約詳細取得');

      const response = await request(app)
        .get(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testAppointment._id.toString());
      expect(response.body.data.clientId).toBe(testClient._id.toString());

      tracker.mark('詳細取得成功');
    });

    it('担当スタイリストが自分の予約詳細を取得できる', async () => {
      const response = await request(app)
        .get(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${stylistToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testAppointment._id.toString());
    });

    it('他のスタイリストは予約詳細を取得できない', async () => {
      const response = await request(app)
        .get(`/api/appointments/${testAppointment._id}`)
        .set('Authorization', `Bearer ${stylist2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('他のスタイリストの予約');
    });

    it('存在しない予約IDでは404エラー', async () => {
      const response = await request(app)
        .get('/api/appointments/123456789012345678901234')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/appointments/:id/assign - スタイリスト割当', () => {
    let unassignedAppointment: any;

    beforeEach(async () => {
      unassignedAppointment = await AppointmentModel.create({
        organizationId,
        clientId: testClient._id.toString(),
        scheduledAt: new Date(Date.now() + 86400000),
        duration: 60,
        services: ['カット'],
        status: AppointmentStatus.SCHEDULED,
      });
    });

    it('管理者がスタイリストを割り当てできる', async () => {
      tracker.setOperation('スタイリスト割当');

      const response = await request(app)
        .post(`/api/appointments/${unassignedAppointment._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stylistId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stylistId).toBe(stylistId);

      tracker.mark('割当成功');
    });

    it('時間が重複する場合は割当に失敗する', async () => {
      // 同じ時間に既存の予約を作成
      await AppointmentModel.create({
        organizationId,
        clientId: testClient._id.toString(),
        stylistId,
        scheduledAt: unassignedAppointment.scheduledAt,
        duration: 60,
        services: ['パーマ'],
        status: AppointmentStatus.SCHEDULED,
      });

      const response = await request(app)
        .post(`/api/appointments/${unassignedAppointment._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stylistId });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('既に予約が入っています');
    });

    it('他組織のスタイリストは割当できない', async () => {
      const otherOrg = await createTestOrganization();
      const otherStylist = await createTestUserWithToken(UserRole.USER, otherOrg.id);

      const response = await request(app)
        .post(`/api/appointments/${unassignedAppointment._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stylistId: otherStylist.user.id });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('他の組織のスタイリスト');
    });

    it('キャンセル済み予約には割当できない', async () => {
      await AppointmentModel.findByIdAndUpdate(unassignedAppointment._id, {
        status: AppointmentStatus.CANCELED,
        canceledAt: new Date(),
      });

      const response = await request(app)
        .post(`/api/appointments/${unassignedAppointment._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stylistId });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('キャンセル済み');
    });
  });

  describe('PUT /api/appointments/:id/move - 予約時間変更', () => {
    let testAppointment: any;
    let newScheduledAt: Date;

    beforeEach(async () => {
      const originalTime = new Date();
      originalTime.setDate(originalTime.getDate() + 1);
      originalTime.setHours(10, 0, 0, 0);

      testAppointment = await AppointmentModel.create({
        organizationId,
        clientId: testClient._id.toString(),
        stylistId,
        scheduledAt: originalTime,
        duration: 60,
        services: ['カット'],
        status: AppointmentStatus.SCHEDULED,
      });

      newScheduledAt = new Date(originalTime);
      newScheduledAt.setHours(14, 0, 0, 0);
    });

    it('管理者が予約時間を変更できる', async () => {
      tracker.setOperation('予約時間変更');

      const response = await request(app)
        .put(`/api/appointments/${testAppointment._id}/move`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scheduledAt: newScheduledAt.toISOString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(new Date(response.body.data.scheduledAt).getTime()).toBe(
        newScheduledAt.getTime()
      );

      tracker.mark('時間変更成功');
    });

    it('所要時間も同時に変更できる', async () => {
      const response = await request(app)
        .put(`/api/appointments/${testAppointment._id}/move`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          scheduledAt: newScheduledAt.toISOString(),
          duration: 90,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.duration).toBe(90);
    });

    it('時間が重複する場合は変更に失敗する', async () => {
      // 変更先の時間に既存の予約を作成
      await AppointmentModel.create({
        organizationId,
        clientId: testClient._id.toString(),
        stylistId,
        scheduledAt: newScheduledAt,
        duration: 60,
        services: ['パーマ'],
        status: AppointmentStatus.SCHEDULED,
      });

      const response = await request(app)
        .put(`/api/appointments/${testAppointment._id}/move`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scheduledAt: newScheduledAt.toISOString(),
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('既に予約が入っています');
    });

    it('過去の日時には変更できない', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const response = await request(app)
        .put(`/api/appointments/${testAppointment._id}/move`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scheduledAt: yesterday.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('現在時刻より後');
    });
  });

  describe('POST /api/appointments/calendar/sync - カレンダー同期', () => {
    it('管理者がカレンダー同期を実行できる', async () => {
      tracker.setOperation('カレンダー同期');

      const response = await request(app)
        .post('/api/appointments/calendar/sync')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('開発中');

      tracker.mark('同期リクエスト成功');
    });

    it('スタイリストはカレンダー同期権限がない', async () => {
      const response = await request(app)
        .post('/api/appointments/calendar/sync')
        .set('Authorization', `Bearer ${stylistToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量の予約データでも適切な応答時間で処理される', async () => {
      tracker.setOperation('パフォーマンステスト');

      // 100件の予約データを作成
      const appointments = [];
      for (let i = 0; i < 100; i++) {
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + Math.floor(i / 10));
        scheduledAt.setHours(9 + (i % 10), 0, 0, 0);

        appointments.push({
          organizationId,
          clientId: testClient._id.toString(),
          stylistId: i % 2 === 0 ? stylistId : stylist2Id,
          scheduledAt,
          duration: 60,
          services: ['カット'],
          status: AppointmentStatus.SCHEDULED,
        });
      }
      await AppointmentModel.insertMany(appointments);

      tracker.mark('100件のデータ作成完了');

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ limit: 20 });

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(20);
      expect(responseTime).toBeLessThan(1000); // 1秒以内

      tracker.mark(`応答時間: ${responseTime}ms`);
    });
  });
});