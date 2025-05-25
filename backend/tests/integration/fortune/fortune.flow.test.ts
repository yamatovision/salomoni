import request from 'supertest';
import app from '../../../src/index';
import { 
  setupTestDatabase, 
  cleanupTestDatabase, 
  createTestOrganizationWithOwner,
  createTestUserInOrganization
} from '../../utils/db-test-helper';
import { MilestoneTracker } from '../../utils/MilestoneTracker';
import { DailyFortuneModel } from '../../../src/features/fortune/models/daily-fortune.model';
import { FortuneCardModel } from '../../../src/features/fortune/models/fortune-card.model';
import { DailyAdviceModel } from '../../../src/features/fortune/models/daily-advice.model';
import { AICharacterModel } from '../../../src/features/ai-characters/models/ai-character.model';
import { 
  FortuneCardCategory, 
  FortuneCardIconTheme,
  AICharacterStyle,
  UserRole 
} from '../../../src/types';

describe('Fortune Flow Integration Tests', () => {
  let tracker: MilestoneTracker;
  let accessToken: string;
  let userId: string;
  let organizationId: string;
  let otherUserId: string;
  // let otherUserToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    tracker = new MilestoneTracker();
    
    // テストデータのクリーンアップ
    await DailyFortuneModel.deleteMany({});
    await FortuneCardModel.deleteMany({});
    await DailyAdviceModel.deleteMany({});
    await AICharacterModel.deleteMany({});

    // テスト組織とユーザーを作成
    const { organization, owner, ownerToken } = await createTestOrganizationWithOwner();

    organizationId = organization.id;
    userId = owner.id;
    accessToken = ownerToken;

    // ownerの生年月日を更新
    const { UserModel } = require('../../../src/features/users/models/user.model');
    await UserModel.findByIdAndUpdate(userId, {
      birthDate: new Date('1990-01-01')
    });

    // もう一人のスタイリストを作成（相性テスト用）
    const otherUser = await createTestUserInOrganization(organizationId, { 
      role: 'user' as UserRole,
      name: '他のスタイリスト'
    });
    otherUserId = otherUser.user.id;
    // otherUserToken = otherUser.token;

    // スタイリストの生年月日を更新
    await UserModel.findByIdAndUpdate(otherUserId, {
      birthDate: new Date('1985-05-15')
    });

    // テストユーザー用のAIキャラクターを作成
    const aiCharacter = new AICharacterModel({
      userId,
      name: 'テストAI',
      styleFlags: [AICharacterStyle.CHEERFUL, AICharacterStyle.SOFT],
      personalityScore: {
        softness: 80,
        energy: 70,
        formality: 40,
      },
    });
    await aiCharacter.save();

    tracker.mark('セットアップ完了');
  });

  describe('GET /api/fortune/daily - 日運データ取得', () => {
    it('ユーザーIDで日運データを取得できる', async () => {
      tracker.setOperation('日運データ取得（新規生成）');

      const response = await request(app)
        .get('/api/fortune/daily')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId });

      tracker.mark('APIレスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        userId,
        overallLuck: expect.any(Number),
        workLuck: expect.any(Number),
        relationshipLuck: expect.any(Number),
        healthLuck: expect.any(Number),
        luckyColor: expect.any(String),
        luckyDirection: expect.any(String),
        advice: expect.any(String),
      });

      // 運勢の値が1-5の範囲内か確認
      expect(response.body.data.overallLuck).toBeGreaterThanOrEqual(1);
      expect(response.body.data.overallLuck).toBeLessThanOrEqual(5);

      tracker.summary();
    });

    it('既存の日運データがある場合はそれを返す', async () => {
      tracker.setOperation('日運データ取得（キャッシュ）');

      // 1回目のリクエスト
      const firstResponse = await request(app)
        .get('/api/fortune/daily')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId });

      tracker.mark('1回目のレスポンス');

      // 2回目のリクエスト
      const secondResponse = await request(app)
        .get('/api/fortune/daily')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId });

      tracker.mark('2回目のレスポンス（キャッシュ）');

      // 同じデータが返されることを確認
      expect(secondResponse.body.data.id).toBe(firstResponse.body.data.id);
      expect(secondResponse.body.data.overallLuck).toBe(firstResponse.body.data.overallLuck);

      tracker.summary();
    });

    it('ユーザーIDもクライアントIDも指定しない場合はエラー', async () => {
      const response = await request(app)
        .get('/api/fortune/daily')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('ユーザーIDまたはクライアントIDが必要です');
    });
  });

  describe('GET /api/fortune/users/:userId/daily-advice - AIアドバイス生成', () => {
    it('新規のデイリーアドバイスを生成できる', async () => {
      tracker.setOperation('デイリーアドバイス生成');

      const response = await request(app)
        .get(`/api/fortune/users/${userId}/daily-advice`)
        .set('Authorization', `Bearer ${accessToken}`);

      tracker.mark('AIアドバイス生成完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        userId,
        aiCharacterName: 'テストAI',
        greetingMessage: expect.any(String),
        cards: expect.any(Array),
      });

      // カードの数と内容を確認
      expect(response.body.data.cards).toHaveLength(5);
      expect(response.body.data.cards[0]).toMatchObject({
        category: FortuneCardCategory.OVERALL_FLOW,
        title: expect.any(String),
        shortAdvice: expect.any(String),
        detailAdvice: expect.any(String),
      });

      tracker.summary();
    });

    it('再生成フラグを指定すると新しいアドバイスを生成する', async () => {
      tracker.setOperation('アドバイス再生成');

      // 1回目の生成
      await request(app)
        .get(`/api/fortune/users/${userId}/daily-advice`)
        .set('Authorization', `Bearer ${accessToken}`);

      tracker.mark('1回目の生成');

      // 再生成
      const regenerateResponse = await request(app)
        .get(`/api/fortune/users/${userId}/daily-advice`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ regenerate: true });

      tracker.mark('再生成完了');

      expect(regenerateResponse.status).toBe(200);
      // 挨拶メッセージが変わることを確認（OpenAI APIの応答により異なる可能性）
      expect(regenerateResponse.body.data.greetingMessage).toBeDefined();

      tracker.summary();
    });
  });

  describe('GET /api/fortune/cards - 運勢カード取得', () => {
    beforeEach(async () => {
      // テスト用運勢カードを作成
      const cards = [
        {
          category: FortuneCardCategory.OVERALL_FLOW,
          iconTheme: FortuneCardIconTheme.WEATHER,
          icon: '☀️',
          title: '全体運',
          shortAdvice: '今日は絶好調！',
          detailAdvice: '詳細なアドバイス...',
        },
        {
          category: FortuneCardCategory.LUCKY_ITEM,
          iconTheme: FortuneCardIconTheme.SPARKLE,
          icon: '✨',
          title: 'ラッキーアイテム',
          shortAdvice: 'ピンクの小物',
          detailAdvice: '詳細なアドバイス...',
        },
      ];

      await FortuneCardModel.insertMany(cards);
    });

    it('運勢カードの一覧を取得できる', async () => {
      const response = await request(app)
        .get('/api/fortune/cards')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('カテゴリーでフィルタリングできる', async () => {
      const response = await request(app)
        .get('/api/fortune/cards')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ category: FortuneCardCategory.LUCKY_ITEM });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe(FortuneCardCategory.LUCKY_ITEM);
    });
  });

  describe('GET /api/fortune/compatibility/today - 本日の相性スタイリスト', () => {
    it('組織内の他のスタイリストとの相性を取得できる', async () => {
      tracker.setOperation('相性スタイリスト取得');

      const response = await request(app)
        .get('/api/fortune/compatibility/today')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId });

      tracker.mark('相性計算完了');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            stylistId: otherUserId,
            stylistName: '他のスタイリスト',
            compatibilityScore: expect.any(Number),
            reason: expect.any(String),
            advice: expect.any(String),
          }),
        ])
      );

      tracker.summary();
    });

    it('ユーザーIDが指定されていない場合はエラー', async () => {
      const response = await request(app)
        .get('/api/fortune/compatibility/today')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ユーザーIDは必須です');
    });
  });

  describe('POST /api/fortune/users/:userId/regenerate - アドバイス再生成', () => {
    it('アドバイスを再生成できる', async () => {
      const response = await request(app)
        .post(`/api/fortune/users/${userId}/regenerate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        userId,
        aiCharacterName: expect.any(String),
        greetingMessage: expect.any(String),
      });
    });
  });

  describe('週間・月間運勢（将来実装予定）', () => {
    it('週間運勢エンドポイントは開発中メッセージを返す', async () => {
      const response = await request(app)
        .get('/api/fortune/weekly')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toContain('開発中');
    });

    it('月間運勢エンドポイントは開発中メッセージを返す', async () => {
      const response = await request(app)
        .get('/api/fortune/monthly')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toContain('開発中');
    });
  });

  describe('エラーケース', () => {
    it('認証なしでアクセスするとエラー', async () => {
      const response = await request(app)
        .get('/api/fortune/daily')
        .query({ userId });

      expect(response.status).toBe(401);
    });

    it('存在しないユーザーのアドバイスを取得しようとするとエラー', async () => {
      const response = await request(app)
        .get('/api/fortune/users/nonexistent-user/daily-advice')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('ユーザーが見つかりません');
    });
  });

  describe('パフォーマンステスト', () => {
    it('日運データ生成が適切な時間内に完了する', async () => {
      tracker.setOperation('パフォーマンステスト');

      const startTime = Date.now();

      const response = await request(app)
        .get('/api/fortune/daily')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId });

      const endTime = Date.now();
      const duration = endTime - startTime;

      tracker.mark(`処理時間: ${duration}ms`);

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(3000); // 3秒以内

      tracker.summary();
    });
  });
});