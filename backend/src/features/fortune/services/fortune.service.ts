import { FortuneRepository } from '../repositories/fortune.repository';
import { sajuService } from '../../saju/services/saju.service';
import { OpenAIService } from '../../chat/services/openai.service';
import { UserRepository } from '../../users/repositories/user.repository';
// import { ClientRepository } from '../../clients/repositories/client.repository';
import { AICharacterRepository } from '../../ai-characters/repositories/ai-character.repository';
import {
  DailyFortune,
  FortuneCard,
  DailyAdviceData,
  FortuneCardCategory,
  FortuneCardIconTheme,
  ID,
  FourPillarsData,
  UserProfile,
  MessageType,
  ChatMessage,
} from '../../../types';
import { AppError } from '../../../common/utils/errors';
import { logger } from '../../../common/utils/logger';

export class FortuneService {
  private fortuneRepository: FortuneRepository;
  private openAIService: OpenAIService;
  private userRepository: UserRepository;
  // private clientRepository: ClientRepository;
  private aiCharacterRepository: AICharacterRepository;

  constructor() {
    this.fortuneRepository = new FortuneRepository();
    this.openAIService = new OpenAIService();
    this.userRepository = new UserRepository();
    // this.clientRepository = new ClientRepository();
    this.aiCharacterRepository = new AICharacterRepository();
  }

  /**
   * 日運データの取得または生成
   */
  async getDailyFortune(
    userId?: ID,
    clientId?: ID,
    date = new Date()
  ): Promise<DailyFortune> {
    try {
      // 既存の日運データを検索
      const existingFortune = await this.fortuneRepository.findDailyFortune(
        userId,
        clientId,
        date
      );

      if (existingFortune) {
        return existingFortune;
      }

      // 新規生成が必要
      if (!userId && !clientId) {
        throw new AppError('ユーザーIDまたはクライアントIDが必要です', 400, 'MISSING_ID');
      }

      // 四柱推命データを取得
      const fourPillarsData = await this.getFourPillarsData(userId, clientId);
      if (!fourPillarsData) {
        throw new AppError('四柱推命データが見つかりません', 404, 'FOURPILLARS_NOT_FOUND');
      }

      // 日運を計算
      const dailyFortune = await this.calculateDailyFortune(
        fourPillarsData,
        date,
        userId,
        clientId
      );

      // 保存して返す
      return await this.fortuneRepository.upsertDailyFortune(dailyFortune);
    } catch (error) {
      logger.error('[FortuneService] 日運データ取得エラー:', error);
      throw error;
    }
  }

  /**
   * AIアドバイスの生成
   */
  async getDailyAdvice(
    userId: ID,
    date = new Date(),
    regenerate = false
  ): Promise<DailyAdviceData> {
    try {
      // 既存のアドバイスを検索（再生成でない場合）
      if (!regenerate) {
        const existingAdvice = await this.fortuneRepository.findDailyAdvice(userId, date);
        if (existingAdvice) {
          return existingAdvice;
        }
      }

      // ユーザー情報を取得
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
      }

      // AIキャラクターを取得
      logger.info(`AIキャラクター取得開始: userId=${userId}`);
      const aiCharacter = await this.aiCharacterRepository.findByUserId(userId);
      logger.info(`AIキャラクター取得結果: ${aiCharacter ? 'found' : 'not found'}`);
      if (!aiCharacter) {
        logger.error(`AIキャラクターが見つかりません: userId=${userId}`);
        throw new AppError('AIキャラクターが見つかりません', 404, 'AI_CHARACTER_NOT_FOUND');
      }

      // 日運データを取得
      const dailyFortune = await this.getDailyFortune(userId, undefined, date);

      // 運勢カードを生成
      const fortuneCards = await this.generateFortuneCards(dailyFortune, user);

      // 相性の良いスタイリストを取得
      const compatibleStylist = await this.findCompatibleStylist(userId, date);

      // 挨拶メッセージを生成
      const greetingMessage = await this.generateGreetingMessage(
        user,
        aiCharacter,
        dailyFortune
      );

      // デイリーアドバイスを構築
      const dailyAdvice: DailyAdviceData = {
        id: '',
        userId,
        date,
        aiCharacterName: aiCharacter.name,
        aiCharacterAvatar: undefined,
        greetingMessage,
        cards: fortuneCards,
        compatibleStylist,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
      };

      // 保存して返す
      return await this.fortuneRepository.upsertDailyAdvice(dailyAdvice);
    } catch (error) {
      logger.error('[FortuneService] デイリーアドバイス生成エラー:', error);
      throw error;
    }
  }

  /**
   * 運勢カードの取得
   */
  async getFortuneCards(category?: string, limit = 10): Promise<FortuneCard[]> {
    try {
      return await this.fortuneRepository.findFortuneCards(category, limit);
    } catch (error) {
      logger.error('[FortuneService] 運勢カード取得エラー:', error);
      throw error;
    }
  }

  /**
   * 本日の相性スタイリストの取得
   */
  async getCompatibilityToday(userId: ID, limit = 5): Promise<any[]> {
    try {
      // 組織内の他のスタイリストを取得
      const user = await this.userRepository.findById(userId);
      if (!user || !user.organizationId) {
        throw new AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
      }

      const stylists = await this.userRepository.findByOrganization(
        user.organizationId
      );

      // 自分を除外
      const otherStylists = stylists.filter((s: any) => s.id !== userId);

      // 各スタイリストとの相性を計算
      const compatibilityPromises = otherStylists.map(async (stylist: any) => {
        try {
          // 簡易的な相性スコア計算（実際はsajuServiceを使用）
          const score = Math.floor(Math.random() * 5) + 1;
          
          return {
            stylistId: stylist.id,
            stylistName: stylist.name,
            profileImage: stylist.profileImage,
            compatibilityScore: score,
            reason: this.generateCompatibilityReason(score),
            advice: this.generateCompatibilityAdvice(score),
          };
        } catch (error) {
          logger.error(`スタイリスト${stylist.id}との相性計算エラー:`, error);
          return null;
        }
      });

      const results = await Promise.all(compatibilityPromises);
      
      // nullを除外してソート
      return results
        .filter((r: any) => r !== null)
        .sort((a: any, b: any) => b!.compatibilityScore - a!.compatibilityScore)
        .slice(0, limit);
    } catch (error) {
      logger.error('[FortuneService] 相性スタイリスト取得エラー:', error);
      throw error;
    }
  }

  /**
   * 四柱推命データの取得
   */
  private async getFourPillarsData(
    userId?: ID,
    clientId?: ID
  ): Promise<FourPillarsData | null> {
    try {
      // ユーザーまたはクライアントの生年月日時を取得
      let birthDate: string | undefined;
      let birthTime = '12:00'; // デフォルト時刻

      if (userId) {
        const user = await this.userRepository.findById(userId);
        if (user?.birthDate) {
          birthDate = user.birthDate.toISOString().split('T')[0];
        }
      } else if (clientId) {
        // クライアントの場合、現在はorganizationIdが不明なのでスキップ
        // TODO: クライアント情報を取得する別の方法を実装
        logger.warn('[FortuneService] クライアントの四柱推命データ取得は未実装');
        return null;
      }

      if (!birthDate) {
        return null;
      }

      // 四柱推命を計算
      const fourPillarsData = await sajuService.calculateFourPillars({
        birthDate,
        birthTime,
        timezone: 'Asia/Tokyo',
      });

      // ユーザー/クライアントIDを設定
      if (userId) fourPillarsData.userId = userId;
      if (clientId) fourPillarsData.clientId = clientId;

      return fourPillarsData;
    } catch (error) {
      logger.error('[FortuneService] 四柱推命データ取得エラー:', error);
      return null;
    }
  }

  /**
   * 日運の計算
   */
  private async calculateDailyFortune(
    fourPillarsData: FourPillarsData,
    date: Date,
    userId?: ID,
    clientId?: ID
  ): Promise<DailyFortune> {
    // 五行バランスから運勢を計算（簡易版）
    const { elementBalance } = fourPillarsData;
    
    // 日付のシード値から一貫した乱数を生成
    const seed = date.getTime() + (userId || clientId || '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
    const random = (max: number) => ((seed * 9301 + 49297) % 233280) / 233280 * max;

    // 運勢の計算（1-5）
    const overallLuck = Math.floor(random(5)) + 1;
    const workLuck = Math.floor(random(5)) + 1;
    const relationshipLuck = Math.floor(random(5)) + 1;
    const healthLuck = Math.floor(random(5)) + 1;

    // ラッキーカラーとラッキー方位
    const colors = ['赤', '青', '黄', '緑', '白', '黒', 'ピンク', 'オレンジ'];
    const directions = ['北', '北東', '東', '南東', '南', '南西', '西', '北西'];
    
    const luckyColor = colors[Math.floor(random(colors.length))] || '赤';
    const luckyDirection = directions[Math.floor(random(directions.length))] || '北';

    // アドバイスの生成
    const advice = this.generateDailyAdvice(overallLuck, elementBalance);
    const warnings = overallLuck <= 2 ? ['今日は慎重に行動しましょう'] : [];

    return {
      id: '',
      userId,
      clientId,
      date,
      overallLuck,
      workLuck,
      relationshipLuck,
      healthLuck,
      luckyColor,
      luckyDirection,
      advice,
      warnings,
    };
  }

  /**
   * 運勢カードの生成
   */
  private async generateFortuneCards(
    dailyFortune: DailyFortune,
    _user: UserProfile
  ): Promise<FortuneCard[]> {
    const cards: FortuneCard[] = [];

    // 1. 全体の流れカード
    cards.push({
      id: '1',
      category: FortuneCardCategory.OVERALL_FLOW,
      iconTheme: FortuneCardIconTheme.WEATHER,
      icon: this.getFortuneIcon(dailyFortune.overallLuck),
      title: '今日の全体運',
      shortAdvice: `運勢レベル: ${dailyFortune.overallLuck}/5`,
      detailAdvice: dailyFortune.advice,
      gradientColors: { from: '#FFE0B2', to: '#FFCC80' },
      position: 0,
      isMainCard: true,
    });

    // 2. 技術・施術の集中度カード
    cards.push({
      id: '2',
      category: FortuneCardCategory.TECHNIQUE_FOCUS,
      iconTheme: FortuneCardIconTheme.SCISSORS,
      icon: '✂️',
      title: '技術・施術の集中度',
      shortAdvice: `仕事運: ${dailyFortune.workLuck}/5`,
      detailAdvice: this.generateTechniqueAdvice(dailyFortune.workLuck),
      gradientColors: { from: '#E1BEE7', to: '#CE93D8' },
      position: 1,
    });

    // 3. 接客・対人コミュニケーションカード
    cards.push({
      id: '3',
      category: FortuneCardCategory.CUSTOMER_COMMUNICATION,
      iconTheme: FortuneCardIconTheme.CHAT,
      icon: '💬',
      title: '接客運',
      shortAdvice: `対人運: ${dailyFortune.relationshipLuck}/5`,
      detailAdvice: this.generateCommunicationAdvice(dailyFortune.relationshipLuck),
      gradientColors: { from: '#C5E1A5', to: '#AED581' },
      position: 2,
    });

    // 4. ラッキーアイテムカード
    cards.push({
      id: '4',
      category: FortuneCardCategory.LUCKY_ITEM,
      iconTheme: FortuneCardIconTheme.SPARKLE,
      icon: '✨',
      title: 'ラッキーアイテム',
      shortAdvice: `ラッキーカラー: ${dailyFortune.luckyColor}`,
      detailAdvice: `今日のラッキーカラーは「${dailyFortune.luckyColor}」です。小物やアクセサリーに取り入れてみましょう。`,
      gradientColors: { from: '#F8BBD0', to: '#F48FB1' },
      position: 3,
    });

    // 5. セルフケアアドバイスカード
    cards.push({
      id: '5',
      category: FortuneCardCategory.SELF_CARE,
      iconTheme: FortuneCardIconTheme.HEART,
      icon: '❤️',
      title: 'セルフケア',
      shortAdvice: `健康運: ${dailyFortune.healthLuck}/5`,
      detailAdvice: this.generateSelfCareAdvice(dailyFortune.healthLuck),
      gradientColors: { from: '#FFCDD2', to: '#EF9A9A' },
      position: 4,
    });

    return cards;
  }

  /**
   * 相性の良いスタイリストを検索
   */
  private async findCompatibleStylist(
    userId: ID,
    _date: Date
  ): Promise<DailyAdviceData['compatibleStylist']> {
    try {
      const compatibleStylists = await this.getCompatibilityToday(userId, 1);
      if (compatibleStylists.length === 0) {
        return undefined;
      }

      const topStylist = compatibleStylists[0];
      return {
        stylistId: topStylist.stylistId,
        stylistName: topStylist.stylistName,
        compatibilityScore: topStylist.compatibilityScore,
        reason: topStylist.reason,
        collaborationAdvice: topStylist.advice,
      };
    } catch (error) {
      logger.error('[FortuneService] 相性スタイリスト検索エラー:', error);
      return undefined;
    }
  }

  /**
   * 挨拶メッセージの生成
   */
  private async generateGreetingMessage(
    _user: UserProfile,
    aiCharacter: any,
    dailyFortune: DailyFortune
  ): Promise<string> {
    try {
      const messages: ChatMessage[] = [
        {
          id: '1',
          conversationId: 'greeting',
          type: MessageType.USER,
          content: `今日の運勢を教えて。総合運は${dailyFortune.overallLuck}/5です。`,
          createdAt: new Date(),
        },
      ];

      const response = await this.openAIService.generateResponse({
        messages,
        aiCharacter,
        memoryContext: `ユーザー名: ${_user.name}`,
        contextType: 'personal',
      });

      return response;
    } catch (error) {
      // エラー時はデフォルトメッセージ
      return `${_user.name}さん、今日も素敵な一日になりそうだね♡`;
    }
  }

  // ヘルパーメソッド
  private getFortuneIcon(luck: number): string {
    const icons = ['☔', '🌧️', '⛅', '🌤️', '☀️'];
    return icons[luck - 1] || '🌤️';
  }

  private generateDailyAdvice(luck: number, _elementBalance: any): string {
    if (luck >= 4) {
      return '今日は絶好調！積極的に行動しましょう。';
    } else if (luck >= 3) {
      return 'バランスの取れた一日。着実に進めましょう。';
    } else {
      return '慎重に行動することで良い結果が得られます。';
    }
  }

  private generateTechniqueAdvice(luck: number): string {
    if (luck >= 4) {
      return '技術面で冴えている日。新しいスタイルに挑戦するのに最適です。';
    } else if (luck >= 3) {
      return '基本に忠実に。丁寧な施術を心がけましょう。';
    } else {
      return '今日はベーシックな施術を中心に。無理をしないことが大切です。';
    }
  }

  private generateCommunicationAdvice(luck: number): string {
    if (luck >= 4) {
      return 'お客様との会話が弾む日。積極的にコミュニケーションを取りましょう。';
    } else if (luck >= 3) {
      return '聞き上手になることで、お客様との関係が深まります。';
    } else {
      return '今日は聞き役に徹しましょう。お客様の話に耳を傾けることが大切です。';
    }
  }

  private generateSelfCareAdvice(luck: number): string {
    if (luck >= 4) {
      return '体調絶好調！エネルギッシュに活動できる日です。';
    } else if (luck >= 3) {
      return '適度な休憩を取りながら、無理のないペースで過ごしましょう。';
    } else {
      return '疲れを感じたら早めに休憩を。体調管理を優先しましょう。';
    }
  }

  private generateCompatibilityReason(score: number): string {
    const reasons = [
      '五行のバランスが完璧に調和しています',
      '陰陽のエネルギーが相互補完的です',
      '価値観や仕事のスタイルが似ています',
      'お互いの長所を引き出し合える関係です',
      '一緒にいると自然体でいられる相性です',
    ];
    const index = Math.max(0, Math.min(score - 1, reasons.length - 1));
    return reasons[index] ?? '価値観や仕事のスタイルが似ています';
  }

  private generateCompatibilityAdvice(score: number): string {
    const advices = [
      '素晴らしい相性！積極的に協力し合いましょう',
      '良好な相性です。お互いの意見を尊重し合いましょう',
      'バランスの取れた関係。適度な距離感を保ちましょう',
      '違いを認め合うことで、より良い関係が築けます',
      '相性の違いを成長の機会と捉えましょう',
    ];
    const index = Math.max(0, Math.min(5 - score, advices.length - 1));
    return advices[index] ?? 'バランスの取れた関係。適度な距離感を保ちましょう';
  }
}