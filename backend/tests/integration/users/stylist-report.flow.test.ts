import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/index';
import { connectTestDatabase, clearTestDatabase, disconnectTestDatabase } from '../../utils/db-test-helper';
import { createTestOrganizationWithOwner, generateTestToken } from '../../utils/test-auth-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { UserRole, AppointmentStatus } from '../../../src/types';
import { UserModel } from '../../../src/features/users/models/user.model';
import { AppointmentModel } from '../../../src/features/appointments/models/appointment.model';
import { StylistReportModel } from '../../../src/features/users/models/stylist-report.model';
import { ClientModel } from '../../../src/features/clients/models/client.model';
import mongoose from 'mongoose';

describe('/api/admin/stylists/:id/report - スタイリストレポートAPI統合テスト', () => {
  let adminToken: string;
  let organizationId: string;
  let stylistId: string;
  let clientId: string;
  const tracker = new MilestoneTracker();

  beforeAll(async () => {
    tracker.mark('テスト開始');
    await connectTestDatabase();
    tracker.mark('データベース接続完了');
  });

  afterAll(async () => {
    await disconnectTestDatabase();
    tracker.summary();
  });

  beforeEach(async () => {
    tracker.setOperation('テスト準備');
    await clearTestDatabase();

    // テスト用組織とユーザーを作成
    const testOrg = await createTestOrganizationWithOwner();
    organizationId = testOrg.organization.id;
    adminToken = testOrg.ownerToken;

    // スタイリスト作成
    const stylist = await UserModel.create({
      email: 'stylist1@test.com',
      name: 'テストスタイリスト1',
      password: 'Test1234!',
      role: UserRole.USER,
      organizationId,
      birthDate: new Date('1990-01-01'),
      birthTime: '12:00',
      status: 'active'
    });
    stylistId = (stylist as any)._id.toString();

    // 別のスタイリスト作成
    await UserModel.create({
      email: 'stylist2@test.com',
      name: 'テストスタイリスト2',
      password: 'Test1234!',
      role: UserRole.USER,
      organizationId,
      status: 'active'
    });

    // テスト用クライアント作成
    const client = await ClientModel.create({
      name: 'テストクライアント',
      organizationId,
      phone: '090-1234-5678',
      birthDate: new Date('1985-05-15'),
      gender: 'female'
    });
    clientId = (client as any)._id.toString();

    tracker.mark('テストデータ作成完了');
  });

  describe('GET /api/admin/stylists/:id/report - レポート生成', () => {
    it('正常にスタイリストレポートを生成できる', async () => {
      tracker.setOperation('正常系テスト - レポート生成');

      // テスト用予約データを作成
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      // 完了済み予約を作成
      await AppointmentModel.create([
        {
          organizationId,
          clientId,
          stylistId,
          scheduledAt: new Date('2024-01-15 10:00'),
          duration: 60,
          services: ['カット'],
          status: AppointmentStatus.COMPLETED,
          amount: 5000
        },
        {
          organizationId,
          clientId,
          stylistId,
          scheduledAt: new Date('2024-01-20 14:00'),
          duration: 90,
          services: ['カット', 'カラー'],
          status: AppointmentStatus.COMPLETED,
          amount: 12000
        },
        // キャンセル済み予約（カウントされない）
        {
          organizationId,
          clientId,
          stylistId,
          scheduledAt: new Date('2024-01-25 11:00'),
          duration: 60,
          services: ['カット'],
          status: AppointmentStatus.CANCELED
        }
      ]);

      tracker.mark('予約データ作成完了');

      // レポート生成APIを呼び出し
      const response = await request(app)
        .get(`/api/admin/stylists/${stylistId}/report`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      tracker.mark('レポート生成API呼び出し完了');

      // レスポンスの検証
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const report = response.body.data;
      expect(report.stylistId).toBe(stylistId);
      expect(report.totalAppointments).toBe(3); // 全予約数
      expect(report.revenueGenerated).toBe(17000); // 完了済み予約の合計金額
      expect(report.reportPeriod.start).toBeDefined();
      expect(report.reportPeriod.end).toBeDefined();

      // 四柱推命データが含まれることを確認（生年月日があるため）
      expect(report.fourPillarsAnalysis).toBeDefined();

      tracker.mark('レポート内容検証完了');
    });

    it('既存のレポートがある場合は再利用される', async () => {
      tracker.setOperation('既存レポート再利用テスト');

      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-28');

      // 既存のレポートを作成
      await StylistReportModel.create({
        stylistId,
        reportPeriod: {
          start: startDate,
          end: endDate
        },
        totalAppointments: 10,
        revenueGenerated: 50000
      });

      tracker.mark('既存レポート作成完了');

      // レポート生成APIを呼び出し
      const response = await request(app)
        .get(`/api/admin/stylists/${stylistId}/report`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 既存のレポートが返されることを確認
      expect(response.body.data.totalAppointments).toBe(10);
      expect(response.body.data.revenueGenerated).toBe(50000);

      tracker.mark('既存レポート再利用確認完了');
    });

    it('他組織のスタイリストのレポートは生成できない', async () => {
      tracker.setOperation('権限エラーテスト - 他組織');

      // 別組織のスタイリストを作成
      const otherOrgId = new mongoose.Types.ObjectId();
      const otherOrgStylist = await UserModel.create({
        email: 'other-org-stylist@test.com',
        name: '他組織スタイリスト',
        password: 'Test1234!',
        role: UserRole.USER,
        organizationId: otherOrgId.toString(),
        status: 'active'
      });

      const response = await request(app)
        .get(`/api/admin/stylists/${(otherOrgStylist as any)._id}/report`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('権限がありません');

      tracker.mark('権限エラー確認完了');
    });

    it('必須パラメータが不足している場合はエラー', async () => {
      tracker.setOperation('バリデーションエラーテスト');

      // startDateなし
      const response1 = await request(app)
        .get(`/api/admin/stylists/${stylistId}/report`)
        .query({ endDate: '2024-01-31' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response1.body.success).toBe(false);

      // endDateなし
      const response2 = await request(app)
        .get(`/api/admin/stylists/${stylistId}/report`)
        .query({ startDate: '2024-01-01' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response2.body.success).toBe(false);

      tracker.mark('バリデーションエラー確認完了');
    });

    it('無効な日付形式の場合はエラー', async () => {
      tracker.setOperation('日付形式エラーテスト');

      const response = await request(app)
        .get(`/api/admin/stylists/${stylistId}/report`)
        .query({
          startDate: 'invalid-date',
          endDate: '2024-01-31'
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('有効なISO8601形式の日付');

      tracker.mark('日付形式エラー確認完了');
    });

    it('開始日が終了日より後の場合はエラー', async () => {
      tracker.setOperation('日付範囲エラーテスト');

      const response = await request(app)
        .get(`/api/admin/stylists/${stylistId}/report`)
        .query({
          startDate: '2024-01-31',
          endDate: '2024-01-01'
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('開始日は終了日より前');

      tracker.mark('日付範囲エラー確認完了');
    });

    it('存在しないスタイリストIDの場合は404エラー', async () => {
      tracker.setOperation('存在しないスタイリストテスト');

      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/admin/stylists/${nonExistentId}/report`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('スタイリストが見つかりません');

      tracker.mark('404エラー確認完了');
    });

    it('管理者以外のユーザーはアクセスできない', async () => {
      tracker.setOperation('権限エラーテスト - 一般ユーザー');

      // 既存のスタイリスト用のトークンを作成（新しいユーザーは作成しない）
      const stylistToken = generateTestToken({
        id: stylistId,
        userId: stylistId,
        email: 'stylist1@test.com',
        roles: [UserRole.USER],
        currentRole: UserRole.USER,
        organizationId
      });

      const response = await request(app)
        .get(`/api/admin/stylists/${stylistId}/report`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
        .set('Authorization', `Bearer ${stylistToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      tracker.mark('一般ユーザー権限エラー確認完了');
    });

    it('認証なしでアクセスできない', async () => {
      tracker.setOperation('認証エラーテスト');

      const response = await request(app)
        .get(`/api/admin/stylists/${stylistId}/report`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
        .expect(401);

      expect(response.body.success).toBe(false);

      tracker.mark('認証エラー確認完了');
    });
  });

  describe('大量データのパフォーマンステスト', () => {
    it('1000件の予約データでも正常に処理できる', async () => {
      tracker.setOperation('パフォーマンステスト - 大量データ');

      const startDate = new Date('2024-01-01');
      const appointments = [];

      // 1000件の予約データを生成
      for (let i = 0; i < 1000; i++) {
        appointments.push({
          organizationId,
          clientId,
          stylistId,
          scheduledAt: new Date(startDate.getTime() + i * 60 * 60 * 1000), // 1時間ずつずらす
          duration: 60,
          services: ['カット'],
          status: i % 3 === 0 ? AppointmentStatus.CANCELED : AppointmentStatus.COMPLETED,
          amount: i % 3 === 0 ? 0 : 5000
        });
      }

      await AppointmentModel.insertMany(appointments);
      tracker.mark('大量データ作成完了');

      const startTime = Date.now();
      const response = await request(app)
        .get(`/api/admin/stylists/${stylistId}/report`)
        .query({
          startDate: startDate.toISOString(),
          endDate: '2024-12-31'
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const executionTime = Date.now() - startTime;
      tracker.mark(`レポート生成完了 (実行時間: ${executionTime}ms)`);

      expect(response.body.data.totalAppointments).toBe(1000);
      expect(executionTime).toBeLessThan(5000); // 5秒以内に完了すること

      console.log(`大量データ処理時間: ${executionTime}ms`);
    });
  });
});