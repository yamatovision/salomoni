import request from 'supertest';
import app from '../../../src/index';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { createTestUserWithToken } from '../../utils/test-auth-helper';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../utils/db-test-helper';
import { UserRole } from '../../../src/types';

describe('四柱推命API統合テスト', () => {
  const tracker = new MilestoneTracker();
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    tracker.mark('テスト開始');
    tracker.setOperation('データベース接続');
    await connectTestDatabase();
    tracker.mark('データベース接続完了');

    tracker.setOperation('テストユーザー作成');
    const { user, token } = await createTestUserWithToken({
      email: `saju-test-${Date.now()}@example.com`,
      password: 'Test123!',
      name: '四柱推命テストユーザー',
      role: UserRole.USER
    });
    authToken = token;
    userId = user.id;
    tracker.mark('テストユーザー作成完了');
  });

  afterAll(async () => {
    tracker.setOperation('データクリーンアップ');
    await clearTestDatabase();
    await disconnectTestDatabase();
    tracker.mark('クリーンアップ完了');
    tracker.summary();
  });

  describe('POST /api/saju/calculate', () => {
    it('正常な四柱推命計算ができること', async () => {
      tracker.setOperation('四柱推命計算テスト');
      
      const requestData = {
        birthDate: '1990-05-15',
        birthTime: '14:30',
        timezone: 'Asia/Tokyo',
        location: {
          name: '東京',
          longitude: 139.6917,
          latitude: 35.6895
        }
      };

      const response = await request(app)
        .post('/api/saju/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData)
        .expect(200);

      tracker.mark('計算リクエスト完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      const result = response.body.data;
      expect(result.yearPillar).toBeDefined();
      expect(result.monthPillar).toBeDefined();
      expect(result.dayPillar).toBeDefined();
      expect(result.hourPillar).toBeDefined();
      expect(result.elementBalance).toBeDefined();
      expect(result.tenGods).toBeDefined();
      
      // 五行バランスの検証
      const { elementBalance } = result;
      expect(elementBalance.wood).toBeGreaterThanOrEqual(0);
      expect(elementBalance.fire).toBeGreaterThanOrEqual(0);
      expect(elementBalance.earth).toBeGreaterThanOrEqual(0);
      expect(elementBalance.metal).toBeGreaterThanOrEqual(0);
      expect(elementBalance.water).toBeGreaterThanOrEqual(0);
      
      tracker.mark('計算結果検証完了');
    });

    it('必須パラメータが不足している場合はエラーになること', async () => {
      const invalidData = {
        birthDate: '1990-05-15'
        // birthTime欠落
      };

      await request(app)
        .post('/api/saju/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('認証なしではアクセスできないこと', async () => {
      const requestData = {
        birthDate: '1990-05-15',
        birthTime: '14:30'
      };

      await request(app)
        .post('/api/saju/calculate')
        .send(requestData)
        .expect(401);
    });
  });

  describe('GET /api/saju/masters', () => {
    it('マスターデータを取得できること', async () => {
      tracker.setOperation('マスターデータ取得テスト');
      
      const response = await request(app)
        .get('/api/saju/masters')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      tracker.mark('マスターデータ取得完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      const masterData = response.body.data;
      expect(masterData.heavenlyStems).toBeDefined();
      expect(masterData.earthlyBranches).toBeDefined();
      expect(masterData.elements).toBeDefined();
      expect(masterData.tenGods).toBeDefined();
      
      // 天干の検証
      expect(masterData.heavenlyStems).toHaveLength(10);
      expect(masterData.heavenlyStems[0]).toHaveProperty('code');
      expect(masterData.heavenlyStems[0]).toHaveProperty('element');
      expect(masterData.heavenlyStems[0]).toHaveProperty('yinYang');
      
      // 地支の検証
      expect(masterData.earthlyBranches).toHaveLength(12);
      expect(masterData.earthlyBranches[0]).toHaveProperty('code');
      expect(masterData.earthlyBranches[0]).toHaveProperty('animal');
      
      tracker.mark('マスターデータ検証完了');
    });

    it('認証なしではアクセスできないこと', async () => {
      await request(app)
        .get('/api/saju/masters')
        .expect(401);
    });
  });

  describe('POST /api/saju/analyze', () => {
    it('追加分析を実行できること', async () => {
      tracker.setOperation('追加分析テスト');
      
      const requestData = {
        fourPillarsId: '507f1f77bcf86cd799439011', // ダミーID
        analysisType: 'personality',
        options: {
          detailed: true
        }
      };

      const response = await request(app)
        .post('/api/saju/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData)
        .expect(200);

      tracker.mark('追加分析完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.analysisType).toBe('personality');
      expect(response.body.data.result).toBeDefined();
      
      tracker.mark('追加分析検証完了');
    });

    it('無効な分析タイプではエラーになること', async () => {
      const invalidData = {
        fourPillarsId: '507f1f77bcf86cd799439011',
        analysisType: 'invalid_type'
      };

      await request(app)
        .post('/api/saju/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('POST /api/saju/compatibility', () => {
    it('相性診断を実行できること', async () => {
      tracker.setOperation('相性診断テスト');
      
      const requestData = {
        users: [
          {
            userId: userId,
            birthDate: '1990-05-15',
            birthTime: '14:30',
            timezone: 'Asia/Tokyo'
          },
          {
            userId: '507f1f77bcf86cd799439012',
            birthDate: '1992-08-20',
            birthTime: '09:15',
            timezone: 'Asia/Tokyo'
          }
        ]
      };

      const response = await request(app)
        .post('/api/saju/compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData)
        .expect(200);

      tracker.mark('相性診断完了');

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      
      const result = response.body.data;
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.details).toBeDefined();
      expect(result.advice).toBeDefined();
      
      // 詳細スコアの検証
      const { details } = result;
      expect(details.elementHarmony).toBeDefined();
      expect(details.yinYangBalance).toBeDefined();
      expect(details.tenGodCompatibility).toBeDefined();
      expect(details.lifePurpose).toBeDefined();
      
      tracker.mark('相性診断検証完了');
    });

    it('ユーザー数が2人でない場合はエラーになること', async () => {
      const invalidData = {
        users: [
          {
            userId: userId,
            birthDate: '1990-05-15',
            birthTime: '14:30'
          }
          // 1人のみ
        ]
      };

      await request(app)
        .post('/api/saju/compatibility')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('エッジケースのテスト', () => {
    it('閏年の2月29日生まれの計算ができること', async () => {
      const leapYearData = {
        birthDate: '2000-02-29',
        birthTime: '00:00',
        timezone: 'Asia/Tokyo'
      };

      const response = await request(app)
        .post('/api/saju/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(leapYearData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('日付境界での計算ができること', async () => {
      const midnightData = {
        birthDate: '1990-01-01',
        birthTime: '00:00',
        timezone: 'UTC'
      };

      const response = await request(app)
        .post('/api/saju/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(midnightData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('パフォーマンステスト', () => {
    it('複数の計算を連続実行できること', async () => {
      tracker.setOperation('パフォーマンステスト');
      
      const requests = [];
      for (let i = 0; i < 5; i++) {
        const requestData = {
          birthDate: `199${i}-05-15`,
          birthTime: '14:30',
          timezone: 'Asia/Tokyo'
        };
        
        requests.push(
          request(app)
            .post('/api/saju/calculate')
            .set('Authorization', `Bearer ${authToken}`)
            .send(requestData)
        );
      }

      const responses = await Promise.all(requests);
      tracker.mark('5件の計算完了');

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});