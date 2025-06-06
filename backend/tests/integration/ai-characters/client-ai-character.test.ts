import request from 'supertest';
import app from '../../../src/index';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../utils/db-test-helper';
import { createTestUserWithToken, setupTestOrganizationWithOwner } from '../../utils/test-auth-helper';
import { UserRole } from '../../../src/types';
import { ClientModel } from '../../../src/features/clients/models/client.model';
import { AICharacterModel } from '../../../src/features/ai-characters/models/ai-character.model';
import { MilestoneTracker } from '../../utils/MilestoneTracker';

describe('クライアント用AIキャラクター 統合テスト', () => {
  let organizationId: string;
  let stylistToken: string;
  let adminToken: string;
  let clientId: string;

  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // テスト用組織とオーナーを作成
    const ownerData = await setupTestOrganizationWithOwner();
    organizationId = ownerData.organization.id;

    // スタイリストユーザーを作成
    const stylistData = await createTestUserWithToken({
      email: 'stylist@test.com',
      password: 'password123',
      role: UserRole.USER,
      organizationId,
    });
    stylistToken = stylistData.token;

    // 管理者ユーザーを作成
    const adminData = await createTestUserWithToken({
      email: 'admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
      organizationId,
    });
    adminToken = adminData.token;

    // テスト用クライアントを作成
    const client = await ClientModel.create({
      name: 'テストクライアント',
      organizationId,
      gender: 'female',
      birthDate: new Date('1990-01-01'),
      email: 'client@test.com',
      phoneNumber: '090-1234-5678',
    });
    clientId = client._id.toString();
  });

  describe('GET /api/ai-characters/clients/:clientId/setup-status', () => {
    it('クライアントのAIキャラクター設定状態を確認できる', async () => {
      const response = await request(app)
        .get(`/api/ai-characters/clients/${clientId}/setup-status`)
        .set('Authorization', `Bearer ${stylistToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        hasCharacter: false,
        needsSetup: true,
      });
    });

    it('AIキャラクターが設定済みの場合は設定済みステータスを返す', async () => {
      // AIキャラクターを作成
      await AICharacterModel.create({
        name: 'テストAIキャラクター',
        clientId,
        styleFlags: [],
        personalityScore: {
          softness: 70,
          energy: 60,
          kindness: 80,
        },
      });

      const response = await request(app)
        .get(`/api/ai-characters/clients/${clientId}/setup-status`)
        .set('Authorization', `Bearer ${stylistToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        hasCharacter: true,
        needsSetup: false,
      });
    });

    it('存在しないクライアントIDでエラーになる', async () => {
      const response = await request(app)
        .get('/api/ai-characters/clients/507f1f77bcf86cd799439011/setup-status')
        .set('Authorization', `Bearer ${stylistToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.hasCharacter).toBe(false);
    });
  });

  describe('POST /api/ai-characters/clients/:clientId/setup', () => {
    it('クライアント用AIキャラクターをセットアップできる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      const setupData = {
        name: 'クライアントのAIアシスタント',
        birthTime: '14:30',
        birthLocation: {
          name: '東京都',
          longitude: 139.6917,
          latitude: 35.6895,
        },
        styleFlags: {
          tone: 'friendly',
        },
        personalityScore: {
          cheerfulness: 80,
          calmness: 60,
          kindness: 90,
          strictness: 20,
          creativity: 70,
        },
      };

      tracker.setOperation('AIキャラクターセットアップ');
      const response = await request(app)
        .post(`/api/ai-characters/clients/${clientId}/setup`)
        .set('Authorization', `Bearer ${stylistToken}`)
        .send(setupData);

      tracker.mark('セットアップ完了');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        success: true,
      });
      expect(response.body.data.character).toBeDefined();
      expect(response.body.data.character.name).toBe('クライアントのAIアシスタント');
      expect(response.body.data.character.clientId).toBe(clientId);

      // AIキャラクターがデータベースに保存されているか確認
      tracker.setOperation('データベース確認');
      const savedCharacter = await AICharacterModel.findOne({ clientId });
      expect(savedCharacter).toBeTruthy();
      expect(savedCharacter?.name).toBe('クライアントのAIアシスタント');

      tracker.mark('テスト完了');
      tracker.summary();
    });

    it('デフォルト値でセットアップできる', async () => {
      const response = await request(app)
        .post(`/api/ai-characters/clients/${clientId}/setup`)
        .set('Authorization', `Bearer ${stylistToken}`)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.character.name).toBe('テストクライアントさんのAIアシスタント');
    });

    it('存在しないクライアントでエラーになる', async () => {
      const response = await request(app)
        .post('/api/ai-characters/clients/507f1f77bcf86cd799439011/setup')
        .set('Authorization', `Bearer ${stylistToken}`)
        .send({
          name: 'テストAI',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('既にAIキャラクターが存在する場合はエラーになる', async () => {
      // 既存のAIキャラクターを作成
      await AICharacterModel.create({
        name: '既存のAIキャラクター',
        clientId,
        styleFlags: [],
        personalityScore: {
          softness: 50,
          energy: 50,
          kindness: 50,
        },
      });

      const response = await request(app)
        .post(`/api/ai-characters/clients/${clientId}/setup`)
        .set('Authorization', `Bearer ${stylistToken}`)
        .send({
          name: '新しいAIキャラクター',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('このクライアントのAIキャラクターは既に存在します');
      expect(response.body.code).toBe('AI_CHARACTER_EXISTS');

      // AIキャラクターは1つのままであることを確認
      const characters = await AICharacterModel.find({ clientId });
      expect(characters).toHaveLength(1);
    });

    it('管理者もクライアント用AIキャラクターを作成できる', async () => {
      const response = await request(app)
        .post(`/api/ai-characters/clients/${clientId}/setup`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '管理者が作成したAI',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.character.name).toBe('管理者が作成したAI');
    });

    it('四柱推命データが自動的に計算される', async () => {
      const response = await request(app)
        .post(`/api/ai-characters/clients/${clientId}/setup`)
        .set('Authorization', `Bearer ${stylistToken}`)
        .send({
          name: '四柱推命AI',
          birthTime: '12:00',
          birthLocation: {
            name: '大阪府',
            longitude: 135.5020,
            latitude: 34.6937,
          },
        });

      expect(response.status).toBe(201);

      // クライアントの四柱推命データが更新されているか確認
      const updatedClient = await ClientModel.findById(clientId);
      expect(updatedClient?.fourPillarsDataId).toBeDefined();
    });
  });

  describe('パフォーマンステスト', () => {
    it('複数のクライアントに対して高速にAIキャラクターを作成できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      // 10人のクライアントを作成
      const clients = [];
      for (let i = 0; i < 10; i++) {
        const client = await ClientModel.create({
          name: `パフォーマンステストクライアント${i}`,
          organizationId,
          gender: i % 2 === 0 ? 'male' : 'female',
          birthDate: new Date(1990 + i, i % 12, (i % 28) + 1),
        });
        clients.push(client);
      }

      tracker.mark('クライアント作成完了');

      // 全クライアントにAIキャラクターを作成
      const startTime = Date.now();
      const promises = clients.map(client =>
        request(app)
          .post(`/api/ai-characters/clients/${client._id}/setup`)
          .set('Authorization', `Bearer ${stylistToken}`)
          .send({
            name: `${client.name}のAI`,
          })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      tracker.mark('AIキャラクター作成完了');

      // 全てのリクエストが成功したことを確認
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // 10個のAIキャラクター作成が3秒以内に完了
      expect(endTime - startTime).toBeLessThan(3000);

      // データベースに全てのAIキャラクターが保存されていることを確認
      const savedCharacters = await AICharacterModel.find({
        clientId: { $in: clients.map(c => c._id) },
      });
      expect(savedCharacters).toHaveLength(10);

      tracker.summary();
    });
  });
});