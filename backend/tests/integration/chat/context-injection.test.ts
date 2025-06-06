import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../utils/db-test-helper';
import { setupTestOrganizationWithOwner, createTestUserWithToken } from '../../utils/test-auth-helper';
import { contextInjectionManager } from '../../../src/features/chat/services/context-injection';
import { ClientModel } from '../../../src/features/clients/models/client.model';
import { UserRole } from '../../../src/types';
import { MilestoneTracker } from '../../utils/MilestoneTracker';

describe('コンテキスト注入システム 統合テスト', () => {
  let organizationId: string;
  let userId: string;

  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // テスト用の組織とOwnerを作成
    const orgData = await setupTestOrganizationWithOwner();
    organizationId = orgData.organization.id;
    
    // スタイリストユーザーを作成
    const stylistData = await createTestUserWithToken({
      email: 'stylist@test.com',
      password: 'password123',
      name: '山田太郎',
      organizationId,
      role: UserRole.USER,
      birthDate: new Date('1990-01-01'),
    });
    userId = stylistData.user.id;

    // テスト用クライアントを作成
    await ClientModel.create({
      name: '佐藤花子',
      organizationId,
      gender: 'female',
      birthDate: new Date('1985-05-05'),
      lastVisitDate: new Date(),
    });

    await ClientModel.create({
      name: '佐藤健太',
      organizationId,
      gender: 'male',
      birthDate: new Date('1992-03-03'),
      lastVisitDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30日前
    });

    await ClientModel.create({
      name: '田中美咲',
      organizationId,
      gender: 'female',
      birthDate: new Date('1995-07-07'),
    });
  });

  describe('人物データプロバイダー', () => {
    it('人物名から情報を取得できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('テスト開始');

      const { enhancedMessage, injectedContexts } = await contextInjectionManager.injectContext(
        '佐藤花子さんについて相談したいです',
        { organizationId, userId, userRole: UserRole.USER }
      );

      tracker.mark('コンテキスト注入完了');

      expect(injectedContexts).toHaveLength(1);
      expect(injectedContexts[0]?.type).toBe('data');
      expect(enhancedMessage).toContain('佐藤花子さんの情報');
      expect(enhancedMessage).toContain('クライアント');
      expect(enhancedMessage).toContain('1985');

      tracker.summary();
    });

    it('同名の人物が複数いる場合は確認を求める', async () => {
      const { injectedContexts } = await contextInjectionManager.injectContext(
        '佐藤さんについて教えて',
        { organizationId, userId, userRole: UserRole.USER }
      );

      expect(injectedContexts).toHaveLength(1);
      expect(injectedContexts[0]?.type).toBe('clarification_needed');
      
      const clarification = injectedContexts[0];
      if (clarification && clarification.type === 'clarification_needed') {
        expect(clarification.message).toContain('複数の佐藤さんがいらっしゃいます');
        expect(clarification.options).toHaveLength(2);
        expect(clarification.options[0]?.name).toBe('佐藤花子');
        expect(clarification.options[1]?.name).toBe('佐藤健太');
      }
    });

    it('存在しない人物の場合は見つからないメッセージを返す', async () => {
      const { injectedContexts } = await contextInjectionManager.injectContext(
        '存在しない人について',
        { organizationId, userId, userRole: UserRole.USER }
      );

      expect(injectedContexts).toHaveLength(1);
      const context = injectedContexts[0];
      expect(context?.type).toBe('data');
      if (context && context.type === 'data') {
        expect(context.content).toContain('見つかりませんでした');
      }
    });

    it('スタイリストの情報も取得できる', async () => {
      const { enhancedMessage, injectedContexts } = await contextInjectionManager.injectContext(
        '山田太郎さんの四柱推命を見たい',
        { organizationId, userId, userRole: UserRole.USER }
      );

      expect(injectedContexts).toHaveLength(1);
      expect(injectedContexts[0]?.type).toBe('data');
      expect(enhancedMessage).toContain('山田太郎さんの情報');
      expect(enhancedMessage).toContain('スタイリスト');
      expect(enhancedMessage).toContain('1990');
    });

    it('複数の意図を含むメッセージを処理できる', async () => {
      const { enhancedMessage, injectedContexts } = await contextInjectionManager.injectContext(
        '田中美咲さんと山田太郎さんの相性について教えて',
        { organizationId, userId, userRole: UserRole.USER }
      );

      // 両方の人物情報が注入される
      expect(injectedContexts).toHaveLength(2);
      expect(enhancedMessage).toContain('田中美咲さんの情報');
      expect(enhancedMessage).toContain('山田太郎さんの情報');
    });

    it('敬称が異なっても同じ人物を認識できる', async () => {
      const variations = [
        '佐藤花子さんについて',
        '佐藤花子様について',
        '佐藤花子ちゃんについて',
        '佐藤花子について',
      ];

      for (const message of variations) {
        const { injectedContexts } = await contextInjectionManager.injectContext(
          message,
          { organizationId, userId, userRole: UserRole.USER }
        );

        expect(injectedContexts).toHaveLength(1);
        const context = injectedContexts[0];
        expect(context?.type).toBe('data');
        if (context && context.type === 'data') {
          expect(context.content).toContain('佐藤花子さんの情報');
        }
      }
    });

    it('組織外の人物情報は取得できない', async () => {
      // 別組織を作成
      const otherOrgData = await setupTestOrganizationWithOwner();
      
      // 別組織のクライアントを作成
      await ClientModel.create({
        name: '鈴木一郎',
        organizationId: otherOrgData.organization.id,
        gender: 'male',
      });

      const { injectedContexts } = await contextInjectionManager.injectContext(
        '鈴木一郎さんについて',
        { organizationId, userId, userRole: UserRole.USER }
      );

      expect(injectedContexts).toHaveLength(1);
      const context = injectedContexts[0];
      expect(context?.type).toBe('data');
      if (context && context.type === 'data') {
        expect(context.content).toContain('見つかりませんでした');
      }
    });

    it('最近の来店順でソートされる', async () => {
      const { injectedContexts } = await contextInjectionManager.injectContext(
        '佐藤さんについて',
        { organizationId, userId, userRole: UserRole.USER }
      );

      expect(injectedContexts).toHaveLength(1);
      const clarification = injectedContexts[0];
      expect(clarification?.type).toBe('clarification_needed');
      
      if (clarification && clarification.type === 'clarification_needed') {
        // 佐藤花子さん（本日来店）が先に表示される
        expect(clarification.options[0]?.name).toBe('佐藤花子');
        expect(clarification.options[0]?.displayText).toContain('本日来店');
        
        // 佐藤健太さん（30日前来店）が後に表示される
        expect(clarification.options[1]?.name).toBe('佐藤健太');
        expect(clarification.options[1]?.displayText).toContain('前来店');
      }
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量のクライアントでも高速に検索できる', async () => {
      const tracker = new MilestoneTracker();
      tracker.mark('データ準備開始');

      // 100人のクライアントを作成
      const clients = [];
      for (let i = 0; i < 100; i++) {
        clients.push({
          name: `テストクライアント${i}`,
          organizationId,
          gender: i % 2 === 0 ? 'male' : 'female',
          birthDate: new Date(1980 + (i % 40), i % 12, (i % 28) + 1),
        });
      }
      await ClientModel.insertMany(clients);

      tracker.mark('データ準備完了');

      const startTime = Date.now();
      const { injectedContexts } = await contextInjectionManager.injectContext(
        'テストクライアント50さんについて',
        { organizationId, userId, userRole: UserRole.USER }
      );
      const endTime = Date.now();

      tracker.mark('検索完了');

      expect(injectedContexts).toHaveLength(1);
      expect(injectedContexts[0]?.type).toBe('data');
      expect(endTime - startTime).toBeLessThan(500); // 500ms以内

      tracker.summary();
    });
  });
});