import request from 'supertest';
import app from '../../../src/index';
import { connectTestDatabase, disconnectTestDatabase } from '../../utils/db-test-helper';
import { createTestUserWithToken } from '../../utils/test-auth-helper';
import { AICharacterModel } from '../../../src/features/ai-characters/models/ai-character.model';
import { ConversationModel } from '../../../src/features/chat/models/conversation.model';
import { ChatMessageModel } from '../../../src/features/chat/models/chat-message.model';
import { AICharacterStyle, MessageType } from '../../../src/types';
import { MilestoneTracker } from '../../utils/MilestoneTracker';

describe('チャット・会話統合テスト', () => {
  const tracker = new MilestoneTracker();
  let authToken: string;
  let userId: string;
  let aiCharacterId: string;
  let conversationId: string;

  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    // データクリーンアップ
    await AICharacterModel.deleteMany({});
    await ConversationModel.deleteMany({});
    await ChatMessageModel.deleteMany({});

    // テストユーザー作成
    const testUser = await createTestUserWithToken({
      name: 'Test Stylist',
      email: `stylist-${Date.now()}@test.com`,
    });
    authToken = testUser.token;
    userId = testUser.user.id;

    // テスト用AIキャラクター作成
    const aiCharacter = await AICharacterModel.create({
      name: 'テストAIパートナー',
      userId,
      styleFlags: [AICharacterStyle.SOFT, AICharacterStyle.CARING],
      personalityScore: {
        softness: 80,
        energy: 60,
        formality: 30,
      },
    });
    aiCharacterId = aiCharacter._id.toString();
  });

  describe('POST /api/chat/conversations', () => {
    it('新規会話セッションを作成できる', async () => {
      tracker.setOperation('会話セッション作成');
      tracker.mark('テスト開始');

      const conversationData = {
        aiCharacterId,
        context: 'personal',
      };

      tracker.mark('APIリクエスト送信');
      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conversationData);
      tracker.mark('APIレスポンス受信');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        userId,
        aiCharacterId,
        context: 'personal',
        messageCount: 0,
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.startedAt).toBeDefined();
      expect(response.body.data.endedAt).toBeUndefined();

      conversationId = response.body.data.id;
      tracker.mark('検証完了');
      tracker.summary();
    });

    it('必須フィールドがない場合はエラーになる', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('client_directコンテキストはclientIdが必要', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          aiCharacterId,
          context: 'client_direct',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('client_directコンテキストの場合、clientIdは必須です');
    });
  });

  describe('GET /api/chat/conversations', () => {
    beforeEach(async () => {
      // テスト用会話を複数作成
      const conversations = await ConversationModel.create([
        {
          userId,
          aiCharacterId,
          context: 'personal',
          messageCount: 5,
          startedAt: new Date(Date.now() - 3600000), // 1時間前
        },
        {
          userId,
          aiCharacterId,
          context: 'stylist_consultation',
          messageCount: 3,
          startedAt: new Date(Date.now() - 7200000), // 2時間前
        },
        {
          userId,
          aiCharacterId,
          context: 'personal',
          messageCount: 10,
          startedAt: new Date(Date.now() - 86400000), // 1日前
          endedAt: new Date(Date.now() - 82800000), // 終了済み
        },
      ]);
      conversationId = conversations[0]?._id.toString() || '';
    });

    it('会話セッション一覧を取得できる', async () => {
      tracker.setOperation('会話一覧取得');
      const response = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toBeDefined();
    });

    it('コンテキストでフィルタリングできる', async () => {
      const response = await request(app)
        .get('/api/chat/conversations')
        .query({ context: 'personal' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data?.every((c: any) => c.context === 'personal')).toBe(true);
    });

    it('ページネーションが動作する', async () => {
      const response = await request(app)
        .get('/api/chat/conversations')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(response.body.pagination.hasNext).toBe(true);
    });
  });

  describe('POST /api/chat/conversations/:conversationId/send', () => {
    beforeEach(async () => {
      // アクティブな会話を作成
      const conversation = await ConversationModel.create({
        userId,
        aiCharacterId,
        context: 'personal',
        messageCount: 0,
        startedAt: new Date(),
      });
      conversationId = conversation._id.toString();
    });

    it('メッセージを送信してAI応答を受け取れる', async () => {
      tracker.setOperation('メッセージ送信');
      tracker.mark('テスト開始');

      const messageData = {
        content: '今日は仕事で疲れちゃった...',
      };

      tracker.mark('APIリクエスト送信');
      const response = await request(app)
        .post(`/api/chat/conversations/${conversationId}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData);
      tracker.mark('APIレスポンス受信');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userMessage).toMatchObject({
        conversationId,
        type: MessageType.USER,
        content: messageData.content,
      });
      expect(response.body.data.aiMessage).toMatchObject({
        conversationId,
        type: MessageType.AI,
      });
      expect(response.body.data.aiMessage.content).toBeTruthy();
      expect(response.body.data.aiMessage.content.length).toBeGreaterThan(0);

      // メッセージカウントが更新されているか確認
      const updatedConversation = await ConversationModel.findById(conversationId);
      expect(updatedConversation?.messageCount).toBe(2);

      tracker.mark('検証完了');
      tracker.summary();
    });

    it('存在しない会話IDの場合はエラーになる', async () => {
      const response = await request(app)
        .post('/api/chat/conversations/507f1f77bcf86cd799439011/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'テストメッセージ' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('会話が存在しません');
    });

    it('終了した会話にはメッセージを送信できない', async () => {
      // 会話を終了する
      await ConversationModel.findByIdAndUpdate(conversationId, { endedAt: new Date() });

      const response = await request(app)
        .post(`/api/chat/conversations/${conversationId}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'テストメッセージ' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('既に終了しています');
    });
  });

  describe('GET /api/chat/conversations/:conversationId/messages', () => {
    beforeEach(async () => {
      const conversation = await ConversationModel.create({
        userId,
        aiCharacterId,
        context: 'personal',
        messageCount: 6,
        startedAt: new Date(),
      });
      conversationId = conversation._id.toString();

      // テスト用メッセージを作成
      const messages = [];
      for (let i = 0; i < 6; i++) {
        messages.push({
          conversationId,
          type: i % 2 === 0 ? MessageType.USER : MessageType.AI,
          content: `メッセージ ${i + 1}`,
          createdAt: new Date(Date.now() - (6 - i) * 60000), // 1分ずつ遅れて作成
        });
      }
      await ChatMessageModel.create(messages);
    });

    it('会話履歴を取得できる', async () => {
      tracker.setOperation('会話履歴取得');
      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(6);
      expect(response.body.pagination).toBeDefined();

      // デフォルトは昇順
      expect(response.body.data[0].content).toBe('メッセージ 1');
      expect(response.body.data[5].content).toBe('メッセージ 6');
    });

    it('降順で取得できる', async () => {
      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}/messages`)
        .query({ order: 'desc' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0].content).toBe('メッセージ 6');
      expect(response.body.data[5].content).toBe('メッセージ 1');
    });

    it('ページネーションが動作する', async () => {
      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}/messages`)
        .query({ page: 2, limit: 3 })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.currentPage).toBe(2);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(response.body.pagination.hasPrev).toBe(true);
      expect(response.body.pagination.hasNext).toBe(false);
    });
  });

  describe('POST /api/chat/conversations/:conversationId/end', () => {
    beforeEach(async () => {
      const conversation = await ConversationModel.create({
        userId,
        aiCharacterId,
        context: 'personal',
        messageCount: 5,
        startedAt: new Date(),
      });
      conversationId = conversation._id.toString();
    });

    it('会話を終了できる', async () => {
      tracker.setOperation('会話終了');
      tracker.mark('テスト開始');

      const response = await request(app)
        .post(`/api/chat/conversations/${conversationId}/end`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.endedAt).toBeDefined();

      // 終了メッセージが作成されているか確認
      const messages = await ChatMessageModel.find({
        conversationId,
        type: MessageType.SYSTEM,
      });
      expect(messages).toHaveLength(1);
      expect(messages[0]?.content).toContain('会話が終了しました');

      tracker.mark('検証完了');
      tracker.summary();
    });
  });

  describe('POST /api/chat/start', () => {
    it('既存の会話がない場合、新規作成される', async () => {
      tracker.setOperation('チャット自動開始');
      const response = await request(app)
        .post('/api/chat/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          context: 'personal',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        userId,
        context: 'personal',
        messageCount: 0,
      });
      expect(response.body.data?.aiCharacterId).toBeDefined();
    });

    it('既存のアクティブな会話がある場合、それを返す', async () => {
      // アクティブな会話を作成
      const existingConversation = await ConversationModel.create({
        userId,
        aiCharacterId,
        context: 'personal',
        messageCount: 3,
        startedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/chat/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          context: 'personal',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(existingConversation._id.toString());
      expect(response.body.data.messageCount).toBe(3);
    });
  });
});