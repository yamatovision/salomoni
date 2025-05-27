import request from 'supertest';
import app from '../../../src/index';
import { connectTestDatabase, disconnectTestDatabase } from '../../utils/db-test-helper';
import { createTestUserWithToken } from '../../utils/test-auth-helper';
import { AICharacterModel } from '../../../src/features/ai-characters/models/ai-character.model';
import { AIMemoryModel } from '../../../src/features/ai-characters/models/ai-memory.model';
import { UserModel } from '../../../src/features/users/models/user.model';
import { AICharacterStyle, AIMemoryType, API_PATHS } from '../../../src/types';
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
        .post(API_PATHS.AI_CHARACTERS.CHARACTERS)
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
        .post(API_PATHS.AI_CHARACTERS.CHARACTERS)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('同じユーザーで複数のAIキャラクターは作成できない', async () => {
      // 1つ目を作成
      await request(app)
        .post(API_PATHS.AI_CHARACTERS.CHARACTERS)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '最初のAIパートナー',
        });

      // 2つ目を作成しようとする
      const response = await request(app)
        .post(API_PATHS.AI_CHARACTERS.CHARACTERS)
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
        .get(API_PATHS.AI_CHARACTERS.MY_CHARACTER)
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
        .put(API_PATHS.AI_CHARACTERS.CHARACTER(characterId))
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
        .post(API_PATHS.AI_CHARACTERS.CHARACTER_MEMORY(characterId))
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
        .post(API_PATHS.AI_CHARACTERS.CHARACTER_MEMORY(characterId))
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
        .get(API_PATHS.AI_CHARACTERS.CHARACTER_MEMORY(characterId))
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toBeDefined();
    });

    it('カテゴリでフィルタリングできる', async () => {
      const response = await request(app)
        .get(API_PATHS.AI_CHARACTERS.CHARACTER_MEMORY(characterId))
        .query({ category: 'preference' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('preference');
    });

    it('アクティブ状態でフィルタリングできる', async () => {
      const response = await request(app)
        .get(API_PATHS.AI_CHARACTERS.CHARACTER_MEMORY(characterId))
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
        .delete(API_PATHS.AI_CHARACTERS.CHARACTER(characterId))
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

  describe('AIキャラクターセットアップ統合テスト', () => {
    let newAuthToken: string;
    let newUserId: string;

    beforeEach(async () => {
      // セットアップ用の新規ユーザー作成（AIキャラクターなし）
      const testUser = await createTestUserWithToken({
        name: 'Setup Test User',
        email: `setup-${Date.now()}@test.com`,
      });
      newAuthToken = testUser.token;
      newUserId = testUser.user.id;
    });

    describe('GET /api/ai-characters/setup-status', () => {
      it('AIキャラクターが存在しない場合、needsSetup=trueを返す', async () => {
        tracker.setOperation('セットアップ状態確認（キャラクターなし）');
        tracker.mark('テスト開始');

        const response = await request(app)
          .get(API_PATHS.AI_CHARACTERS.SETUP_STATUS)
          .set('Authorization', `Bearer ${newAuthToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual({
          needsSetup: true,
          hasCharacter: false,
        });

        tracker.mark('検証完了');
      });

      it('AIキャラクターが存在する場合、needsSetup=falseを返す', async () => {
        // AIキャラクターを作成
        await AICharacterModel.create({
          name: '既存のAIパートナー',
          userId: newUserId,
        });

        const response = await request(app)
          .get(API_PATHS.AI_CHARACTERS.SETUP_STATUS)
          .set('Authorization', `Bearer ${newAuthToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual({
          needsSetup: false,
          hasCharacter: true,
        });
      });
    });

    describe('POST /api/ai-characters/process-natural-input', () => {
      it('性格の自然言語入力を処理できる', async () => {
        tracker.setOperation('自然言語処理（性格）');
        tracker.mark('テスト開始');

        const response = await request(app)
          .post(API_PATHS.AI_CHARACTERS.PROCESS_NATURAL_INPUT)
          .set('Authorization', `Bearer ${newAuthToken}`)
          .send({
            input: '優しくて親しみやすい、でもプロフェッショナル',
            field: 'personality'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          processedData: {
            softness: expect.any(Number),
            energy: expect.any(Number),
            formality: expect.any(Number),
          },
          confidence: expect.any(Number),
          originalInput: '優しくて親しみやすい、でもプロフェッショナル',
        });

        // 値の範囲チェック
        const { processedData } = response.body.data;
        expect(processedData.softness).toBeGreaterThanOrEqual(0);
        expect(processedData.softness).toBeLessThanOrEqual(100);
        expect(processedData.energy).toBeGreaterThanOrEqual(0);
        expect(processedData.energy).toBeLessThanOrEqual(100);
        expect(processedData.formality).toBeGreaterThanOrEqual(0);
        expect(processedData.formality).toBeLessThanOrEqual(100);

        tracker.mark('検証完了');
      });

      it('スタイルの自然言語入力を処理できる', async () => {
        const response = await request(app)
          .post(API_PATHS.AI_CHARACTERS.PROCESS_NATURAL_INPUT)
          .set('Authorization', `Bearer ${newAuthToken}`)
          .send({
            input: '明るくてフレンドリー、少し甘えた感じ',
            field: 'style'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          processedData: expect.any(Array),
          confidence: expect.any(Number),
          originalInput: '明るくてフレンドリー、少し甘えた感じ',
        });

        // スタイルフラグの検証
        const { processedData } = response.body.data;
        expect(Array.isArray(processedData)).toBe(true);
        expect(processedData.length).toBeGreaterThan(0);
        processedData.forEach((style: string) => {
          expect(Object.values(AICharacterStyle)).toContain(style);
        });
      });
    });

    describe('POST /api/ai-characters/setup', () => {
      it('完全なセットアップリクエストでAIキャラクターを作成できる', async () => {
        tracker.setOperation('AIキャラクターセットアップ');
        tracker.mark('テスト開始');

        const setupData = {
          name: '初期設定AIパートナー',
          birthDate: '1990-05-15',
          birthPlace: '東京都',
          birthTime: '14:30',
          personalityInput: '優しくて親しみやすい',
          styleInput: '明るくてフレンドリー',
          processedPersonality: {
            softness: 80,
            energy: 70,
            formality: 30,
          },
          processedStyle: [AICharacterStyle.CHEERFUL, AICharacterStyle.SOFT],
        };

        tracker.mark('APIリクエスト送信');
        const response = await request(app)
          .post(API_PATHS.AI_CHARACTERS.SETUP)
          .set('Authorization', `Bearer ${newAuthToken}`)
          .send(setupData);
        tracker.mark('APIレスポンス受信');

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          success: true,
          character: {
            name: setupData.name,
            userId: newUserId,
            styleFlags: setupData.processedStyle,
            personalityScore: setupData.processedPersonality,
          },
          sajuData: expect.any(Object),
          setupData: expect.objectContaining({
            name: setupData.name,
            birthDate: setupData.birthDate,
            birthPlace: setupData.birthPlace,
            birthTime: setupData.birthTime,
          }),
        });

        // ユーザー情報が更新されたことを確認
        const updatedUser = await UserModel.findById(newUserId);
        expect(updatedUser?.birthDate).toBeDefined();
        expect(updatedUser?.birthLocation).toBeDefined();
        expect(updatedUser?.birthTime).toBe('14:30');

        tracker.mark('検証完了');
        tracker.summary();
      });

      it('既にAIキャラクターが存在する場合はエラーになる', async () => {
        // AIキャラクターを作成
        await AICharacterModel.create({
          name: '既存のAIパートナー',
          userId: newUserId,
        });

        const response = await request(app)
          .post(API_PATHS.AI_CHARACTERS.SETUP)
          .set('Authorization', `Bearer ${newAuthToken}`)
          .send({
            name: '新しいAIパートナー',
            birthDate: '1990-05-15',
            birthPlace: '東京都',
            personalityInput: '優しい',
            styleInput: '明るい',
            processedPersonality: { softness: 70, energy: 60, formality: 40 },
            processedStyle: [AICharacterStyle.SOFT],
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('既に存在します');
      });

      it('出生時間がオプショナルであることを確認', async () => {
        const setupData = {
          name: '時間なしAIパートナー',
          birthDate: '1985-12-25',
          birthPlace: '大阪府',
          // birthTime を省略
          personalityInput: 'クールで冷静',
          styleInput: '大人っぽい',
          processedPersonality: {
            softness: 30,
            energy: 40,
            formality: 80,
          },
          processedStyle: [AICharacterStyle.COOL],
        };

        const response = await request(app)
          .post(API_PATHS.AI_CHARACTERS.SETUP)
          .set('Authorization', `Bearer ${newAuthToken}`)
          .send(setupData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);

        // デフォルト値が設定されることを確認
        const updatedUser = await UserModel.findById(newUserId);
        expect(updatedUser?.birthTime).toBe('00:00');
      });
    });

    describe('GET /api/saju/locations/japan', () => {
      it('日本の都道府県リストを取得できる', async () => {
        tracker.setOperation('都道府県リスト取得');
        
        const response = await request(app)
          .get(API_PATHS.SAJU_LOCATIONS.JAPAN)
          .set('Authorization', `Bearer ${newAuthToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.prefectures).toBeDefined();
        expect(Array.isArray(response.body.data.prefectures)).toBe(true);
        expect(response.body.data.prefectures.length).toBe(47);

        // いくつかの都道府県をチェック
        const prefectures = response.body.data.prefectures;
        expect(prefectures.find((p: any) => p.name === '東京都')).toBeDefined();
        expect(prefectures.find((p: any) => p.name === '大阪府')).toBeDefined();
        expect(prefectures.find((p: any) => p.name === '北海道')).toBeDefined();
        expect(prefectures.find((p: any) => p.name === '沖縄県')).toBeDefined();

        // 各都道府県の構造をチェック
        prefectures.forEach((prefecture: any) => {
          expect(prefecture).toHaveProperty('name');
          expect(prefecture).toHaveProperty('adjustmentMinutes');
          expect(typeof prefecture.name).toBe('string');
          expect(typeof prefecture.adjustmentMinutes).toBe('number');
        });
      });
    });
  });
});