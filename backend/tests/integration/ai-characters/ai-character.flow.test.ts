import request from 'supertest';
import app from '../../../src/index';
import { connectTestDatabase, disconnectTestDatabase } from '../../utils/db-test-helper';
import { createTestUserWithToken } from '../../utils/test-auth-helper';
import { AICharacterModel } from '../../../src/features/ai-characters/models/ai-character.model';
import { AIMemoryModel } from '../../../src/features/ai-characters/models/ai-memory.model';
import { AICharacterStyle, AIMemoryType } from '../../../src/types';
import { MilestoneTracker } from '../../utils/MilestoneTracker';

describe('AIキャラクター・メモリ統合テスト', () => {
  const tracker = new MilestoneTracker();
  let authToken: string;
  let userId: string;
  let characterId: string;

  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    // データクリーンアップ
    await AICharacterModel.deleteMany({});
    await AIMemoryModel.deleteMany({});

    // テストユーザー作成
    const testUser = await createTestUserWithToken({
      name: 'Test Stylist',
      email: `stylist-${Date.now()}@test.com`,
    });
    authToken = testUser.token;
    userId = testUser.user.id;
  });

  describe('POST /api/chat/characters', () => {
    it('新規AIキャラクターを作成できる', async () => {
      tracker.setOperation('AIキャラクター作成');
      tracker.mark('テスト開始');

      const characterData = {
        name: 'テストAIパートナー',
        styleFlags: [AICharacterStyle.SOFT, AICharacterStyle.CARING],
        personalityScore: {
          softness: 80,
          energy: 60,
          formality: 30,
        },
      };

      tracker.mark('APIリクエスト送信');
      const response = await request(app)
        .post('/api/chat/characters')
        .set('Authorization', `Bearer ${authToken}`)
        .send(characterData);
      tracker.mark('APIレスポンス受信');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: characterData.name,
        userId,
        styleFlags: characterData.styleFlags,
        personalityScore: characterData.personalityScore,
      });
      expect(response.body.data.id).toBeDefined();

      characterId = response.body.data.id;
      tracker.mark('検証完了');
      tracker.summary();
    });

    it('必須フィールドがない場合はエラーになる', async () => {
      const response = await request(app)
        .post('/api/chat/characters')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('同じユーザーで複数のAIキャラクターは作成できない', async () => {
      // 1つ目を作成
      await request(app)
        .post('/api/chat/characters')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '最初のAIパートナー',
        });

      // 2つ目を作成しようとする
      const response = await request(app)
        .post('/api/chat/characters')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '2つ目のAIパートナー',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('既に存在します');
    });
  });

  describe('GET /api/chat/characters/me', () => {
    beforeEach(async () => {
      // テスト用AIキャラクターを作成
      const character = await AICharacterModel.create({
        name: 'テストAIパートナー',
        userId,
        styleFlags: [AICharacterStyle.CHEERFUL],
        personalityScore: {
          softness: 50,
          energy: 70,
          formality: 40,
        },
      });
      characterId = character._id.toString();
    });

    it('自分のAIキャラクターを取得できる', async () => {
      tracker.setOperation('AIキャラクター取得');
      const response = await request(app)
        .get('/api/chat/characters/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: characterId,
        name: 'テストAIパートナー',
        userId,
      });
    });
  });

  describe('PUT /api/chat/characters/:id', () => {
    beforeEach(async () => {
      const character = await AICharacterModel.create({
        name: '更新前のAIパートナー',
        userId,
        styleFlags: [AICharacterStyle.COOL],
        personalityScore: {
          softness: 30,
          energy: 50,
          formality: 70,
        },
      });
      characterId = character._id.toString();
    });

    it('AIキャラクターを更新できる', async () => {
      const updateData = {
        name: '更新後のAIパートナー',
        styleFlags: [AICharacterStyle.FLIRTY, AICharacterStyle.MYSTERIOUS],
        personalityScore: {
          softness: 90,
          energy: 80,
          formality: 20,
        },
      };

      const response = await request(app)
        .put(`/api/chat/characters/${characterId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(updateData);
    });
  });

  describe('POST /api/chat/characters/:characterId/memory', () => {
    beforeEach(async () => {
      const character = await AICharacterModel.create({
        name: 'メモリテスト用AIパートナー',
        userId,
      });
      characterId = character._id.toString();
    });

    it('AIメモリを作成できる', async () => {
      tracker.setOperation('AIメモリ作成');
      tracker.mark('テスト開始');

      const memoryData = {
        memoryType: AIMemoryType.EXPLICIT,
        content: 'ユーザーはコーヒーが好き',
        category: 'preference',
        confidence: 100,
      };

      tracker.mark('APIリクエスト送信');
      const response = await request(app)
        .post(`/api/chat/characters/${characterId}/memory`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(memoryData);
      tracker.mark('APIレスポンス受信');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        characterId,
        memoryType: memoryData.memoryType,
        content: memoryData.content,
        category: memoryData.category,
        confidence: memoryData.confidence,
        isActive: true,
      });
      tracker.mark('検証完了');
    });

    it('自動抽出タイプの場合、extractedFromが必須', async () => {
      const memoryData = {
        memoryType: AIMemoryType.AUTO,
        content: '自動抽出された情報',
        category: 'preference',
      };

      const response = await request(app)
        .post(`/api/chat/characters/${characterId}/memory`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(memoryData);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('抽出元');
    });
  });

  describe('GET /api/chat/characters/:characterId/memory', () => {
    beforeEach(async () => {
      const character = await AICharacterModel.create({
        name: 'メモリ取得テスト用AIパートナー',
        userId,
      });
      characterId = character._id.toString();

      // テスト用メモリを複数作成
      await AIMemoryModel.create([
        {
          characterId,
          memoryType: AIMemoryType.EXPLICIT,
          content: '好きな食べ物：ラーメン',
          category: 'preference',
          confidence: 100,
          isActive: true,
        },
        {
          characterId,
          memoryType: AIMemoryType.AUTO,
          content: '最近仕事で疲れている',
          category: 'characteristic',
          extractedFrom: '会話内容',
          confidence: 75,
          isActive: true,
        },
        {
          characterId,
          memoryType: AIMemoryType.EXPLICIT,
          content: '昔の記憶',
          category: 'experience',
          confidence: 100,
          isActive: false,
        },
      ]);
    });

    it('AIメモリ一覧を取得できる', async () => {
      tracker.setOperation('AIメモリ一覧取得');
      const response = await request(app)
        .get(`/api/chat/characters/${characterId}/memory`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toBeDefined();
    });

    it('カテゴリでフィルタリングできる', async () => {
      const response = await request(app)
        .get(`/api/chat/characters/${characterId}/memory`)
        .query({ category: 'preference' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('preference');
    });

    it('アクティブ状態でフィルタリングできる', async () => {
      const response = await request(app)
        .get(`/api/chat/characters/${characterId}/memory`)
        .query({ isActive: true })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((m: any) => m.isActive)).toBe(true);
    });
  });

  describe('DELETE /api/chat/characters/:id', () => {
    beforeEach(async () => {
      const character = await AICharacterModel.create({
        name: '削除テスト用AIパートナー',
        userId,
      });
      characterId = character._id.toString();

      // 関連するメモリも作成
      await AIMemoryModel.create({
        characterId,
        memoryType: AIMemoryType.EXPLICIT,
        content: '削除されるメモリ',
        category: 'other',
      });
    });

    it('AIキャラクターと関連メモリを削除できる', async () => {
      tracker.setOperation('AIキャラクター削除');
      tracker.mark('テスト開始');

      const response = await request(app)
        .delete(`/api/chat/characters/${characterId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // キャラクターが削除されたことを確認
      const character = await AICharacterModel.findById(characterId);
      expect(character).toBeNull();

      // 関連メモリも削除されたことを確認
      const memories = await AIMemoryModel.find({ characterId });
      expect(memories).toHaveLength(0);

      tracker.mark('検証完了');
      tracker.summary();
    });
  });
});