import { AICharacterRepository } from '../repositories/ai-character.repository';
import { AIMemoryRepository } from '../repositories/ai-memory.repository';
import { 
  AICharacter, 
  AICharacterStyle, 
  UserProfile, 
  Client,
  AICharacterSetupStatus,
  AICharacterNaturalInputRequest,
  AICharacterNaturalInputResponse,
  AICharacterSetupRequest,
  AICharacterSetupResponse,
  PersonalityScore,
  JapanesePrefecture,
  JapanesePrefecturesResponse
} from '../../../types';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/middleware/errorHandler';
import OpenAI from 'openai';
import { UserRepository } from '../../users/repositories/user.repository';
import { SajuService } from '../../saju/services/saju.service';

export class AICharacterService {
  private aiCharacterRepository: AICharacterRepository;
  private aiMemoryRepository: AIMemoryRepository;
  private userRepository: UserRepository;
  private sajuService: SajuService;
  private openai: OpenAI;

  constructor() {
    this.aiCharacterRepository = new AICharacterRepository();
    this.aiMemoryRepository = new AIMemoryRepository();
    this.userRepository = new UserRepository();
    this.sajuService = new SajuService();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async createAICharacter(data: {
    name: string;
    userId?: string;
    clientId?: string;
    styleFlags?: AICharacterStyle[];
    personalityScore?: {
      softness: number;
      energy: number;
      formality: number;
    };
  }): Promise<AICharacter> {
    try {
      // userIdとclientIdの排他チェック
      if (!data.userId && !data.clientId) {
        throw new AppError('userIdまたはclientIdのいずれかは必須です', 400, 'MISSING_USER_OR_CLIENT');
      }
      if (data.userId && data.clientId) {
        throw new AppError('userIdとclientIdは同時に設定できません', 400, 'BOTH_USER_AND_CLIENT');
      }

      // 既存のAIキャラクターチェック
      if (data.userId) {
        const existing = await this.aiCharacterRepository.findByUserId(data.userId);
        if (existing) {
          throw new AppError('このユーザーのAIキャラクターは既に存在します', 400, 'AI_CHARACTER_EXISTS');
        }
      }
      if (data.clientId) {
        const existing = await this.aiCharacterRepository.findByClientId(data.clientId);
        if (existing) {
          throw new AppError('このクライアントのAIキャラクターは既に存在します', 400, 'AI_CHARACTER_EXISTS');
        }
      }

      // デフォルトの性格スコア設定
      const personalityScore = data.personalityScore || {
        softness: 50,
        energy: 50,
        formality: 50,
      };

      const aiCharacter = await this.aiCharacterRepository.create({
        ...data,
        personalityScore,
        styleFlags: data.styleFlags || [],
      });

      logger.info(`AIキャラクター作成完了: ${aiCharacter.id}`);
      return aiCharacter;
    } catch (error) {
      logger.error('AIキャラクター作成エラー:', error);
      throw error;
    }
  }

  async getAICharacterById(id: string): Promise<AICharacter | null> {
    try {
      return await this.aiCharacterRepository.findById(id);
    } catch (error) {
      logger.error('AIキャラクター取得エラー:', error);
      throw error;
    }
  }

  async getAICharacterByUserId(userId: string): Promise<AICharacter | null> {
    try {
      return await this.aiCharacterRepository.findByUserId(userId);
    } catch (error) {
      logger.error('ユーザーのAIキャラクター取得エラー:', error);
      throw error;
    }
  }

  async getAICharacterByClientId(clientId: string): Promise<AICharacter | null> {
    try {
      return await this.aiCharacterRepository.findByClientId(clientId);
    } catch (error) {
      logger.error('クライアントのAIキャラクター取得エラー:', error);
      throw error;
    }
  }

  async updateAICharacter(
    id: string,
    data: {
      name?: string;
      styleFlags?: AICharacterStyle[];
      personalityScore?: {
        softness?: number;
        energy?: number;
        formality?: number;
      };
    }
  ): Promise<AICharacter | null> {
    try {
      const existing = await this.aiCharacterRepository.findById(id);
      if (!existing) {
        return null;
      }

      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.styleFlags) updateData.styleFlags = data.styleFlags;
      
      if (data.personalityScore) {
        updateData.personalityScore = {
          ...existing.personalityScore,
          ...data.personalityScore,
        };
      }

      const updated = await this.aiCharacterRepository.update(id, updateData);
      
      if (updated) {
        logger.info(`AIキャラクター更新完了: ${id}`);
      }
      
      return updated;
    } catch (error) {
      logger.error('AIキャラクター更新エラー:', error);
      throw error;
    }
  }

  async deleteAICharacter(id: string): Promise<boolean> {
    try {
      // 関連するメモリも削除
      await this.aiMemoryRepository.deleteByCharacterId(id);
      
      const deleted = await this.aiCharacterRepository.delete(id);
      
      if (deleted) {
        logger.info(`AIキャラクター削除完了: ${id}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error('AIキャラクター削除エラー:', error);
      throw error;
    }
  }

  async updateLastInteraction(id: string): Promise<void> {
    try {
      await this.aiCharacterRepository.updateLastInteraction(id);
    } catch (error) {
      logger.error('最終インタラクション更新エラー:', error);
      throw error;
    }
  }

  async getOrCreateAICharacter(
    user?: UserProfile,
    client?: Client
  ): Promise<AICharacter> {
    try {
      let aiCharacter: AICharacter | null = null;

      if (user) {
        aiCharacter = await this.getAICharacterByUserId(user.id);
        if (!aiCharacter) {
          // デフォルトのAIキャラクターを作成
          aiCharacter = await this.createAICharacter({
            name: 'AIパートナー',
            userId: user.id,
            styleFlags: [AICharacterStyle.SOFT, AICharacterStyle.CARING],
            personalityScore: {
              softness: 70,
              energy: 60,
              formality: 30,
            },
          });
        }
      } else if (client) {
        aiCharacter = await this.getAICharacterByClientId(client.id);
        if (!aiCharacter) {
          // クライアント用のデフォルトAIキャラクター
          aiCharacter = await this.createAICharacter({
            name: '美容AIアシスタント',
            clientId: client.id,
            styleFlags: [AICharacterStyle.CHEERFUL, AICharacterStyle.FLIRTY],
            personalityScore: {
              softness: 80,
              energy: 70,
              formality: 20,
            },
          });
        }
      } else {
        throw new Error('ユーザーまたはクライアント情報が必要です');
      }

      return aiCharacter;
    } catch (error) {
      logger.error('AIキャラクター取得/作成エラー:', error);
      throw error;
    }
  }

  // セットアップ関連メソッド
  async getSetupStatus(userId: string): Promise<AICharacterSetupStatus> {
    try {
      const character = await this.aiCharacterRepository.findByUserId(userId);
      return {
        needsSetup: !character,
        hasCharacter: !!character,
      };
    } catch (error) {
      logger.error('セットアップ状態確認エラー:', error);
      throw error;
    }
  }

  async processNaturalInput(request: AICharacterNaturalInputRequest): Promise<AICharacterNaturalInputResponse> {
    try {
      const systemPrompt = request.field === 'personality' 
        ? `あなたは性格分析の専門家です。ユーザーの性格の説明から、以下の3つの指標を0-100の数値で評価してください：
          - softness: やさしさ度（0=厳しい、100=とてもやさしい）
          - energy: エネルギー度（0=落ち着いている、100=とても活発）
          - formality: フォーマル度（0=カジュアル、100=とてもフォーマル）
          必ず以下のJSON形式で返答してください：
          {"softness": 数値, "energy": 数値, "formality": 数値}`
        : `あなたはAIキャラクタースタイル分析の専門家です。ユーザーのスタイルの説明から、最も適切なスタイルを以下から選択してください（複数選択可）：
          - flirty: 甘え・恋愛系
          - cool: 冷静・大人系
          - cheerful: 明るい・フレンドリー
          - soft: やさしい・癒し系
          - caring: 甘えさせ系
          - oneesan: 姉御・甘えられ系
          - mysterious: 謎めいた系
          必ず以下のJSON形式で返答してください：
          {"styles": ["選択されたスタイル1", "選択されたスタイル2"]}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: request.input }
        ],
        temperature: 0.7,
      });

      const messageContent = completion.choices[0]?.message?.content;
      if (!messageContent) {
        throw new AppError('AI response was empty', 500);
      }
      const result = JSON.parse(messageContent);
      
      let processedData: PersonalityScore | AICharacterStyle[];
      if (request.field === 'personality') {
        processedData = {
          softness: Math.min(100, Math.max(0, result.softness || 50)),
          energy: Math.min(100, Math.max(0, result.energy || 50)),
          formality: Math.min(100, Math.max(0, result.formality || 50)),
        };
      } else {
        const validStyles = Object.values(AICharacterStyle);
        processedData = (result.styles || result || [])
          .filter((style: string) => validStyles.includes(style as AICharacterStyle))
          .map((style: string) => style as AICharacterStyle);
        
        if ((processedData as AICharacterStyle[]).length === 0) {
          processedData = [AICharacterStyle.SOFT, AICharacterStyle.CARING];
        }
      }

      return {
        processedData,
        confidence: 0.9,
        originalInput: request.input,
      };
    } catch (error) {
      logger.error('自然言語処理エラー:', error);
      // フォールバック処理
      if (request.field === 'personality') {
        return {
          processedData: { softness: 50, energy: 50, formality: 50 },
          confidence: 0.3,
          originalInput: request.input,
        };
      } else {
        return {
          processedData: [AICharacterStyle.SOFT, AICharacterStyle.CARING],
          confidence: 0.3,
          originalInput: request.input,
        };
      }
    }
  }

  async setupAICharacter(userId: string, request: AICharacterSetupRequest): Promise<AICharacterSetupResponse> {
    try {
      // 既存チェック
      const existing = await this.aiCharacterRepository.findByUserId(userId);
      if (existing) {
        throw new AppError('AIキャラクターは既に存在します', 400, 'AI_CHARACTER_EXISTS');
      }

      // ユーザー情報を更新（生年月日、出生地、出生時間）
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
      }

      // 出生地情報の処理
      let birthLocation;
      if (request.birthPlace.includes('都') || request.birthPlace.includes('府') || 
          request.birthPlace.includes('県') || request.birthPlace.includes('道')) {
        // 日本の都道府県の場合、座標を取得（仮実装）
        birthLocation = {
          name: request.birthPlace,
          longitude: 139.6917, // 東京の座標をデフォルトとして使用
          latitude: 35.6895,
        };
      } else {
        // 海外の場合
        birthLocation = {
          name: request.birthPlace,
          longitude: 0,
          latitude: 0,
        };
      }

      // ユーザー情報更新
      await this.userRepository.update(userId, {
        birthDate: request.birthDate,
        birthTime: request.birthTime || '00:00',
        birthLocation,
      });

      // AIキャラクター作成
      const character = await this.aiCharacterRepository.create({
        userId,
        name: request.name,
        styleFlags: request.processedStyle,
        personalityScore: request.processedPersonality,
      });

      // 四柱推命データ計算
      const sajuData = await this.sajuService.calculateFourPillars({
        birthDate: request.birthDate,
        birthTime: request.birthTime || '00:00',
        timezone: 'Asia/Tokyo',
        location: birthLocation,
      });

      return {
        success: true,
        character: character,
        sajuData: sajuData,
        setupData: {
          name: request.name,
          birthDate: request.birthDate,
          birthPlace: request.birthPlace,
          birthTime: request.birthTime,
          personalityInput: request.personalityInput,
          styleInput: request.styleInput,
          processedPersonality: request.processedPersonality,
          processedStyle: request.processedStyle,
        },
      };
    } catch (error) {
      logger.error('AIキャラクターセットアップエラー:', error);
      throw error;
    }
  }

  async getJapanesePrefectures(): Promise<JapanesePrefecturesResponse> {
    try {
      // 日本の47都道府県と時差調整データ
      const prefectures: JapanesePrefecture[] = [
        { name: '北海道', adjustmentMinutes: 0 },
        { name: '青森県', adjustmentMinutes: 0 },
        { name: '岩手県', adjustmentMinutes: 0 },
        { name: '宮城県', adjustmentMinutes: 0 },
        { name: '秋田県', adjustmentMinutes: 0 },
        { name: '山形県', adjustmentMinutes: 0 },
        { name: '福島県', adjustmentMinutes: 0 },
        { name: '茨城県', adjustmentMinutes: 0 },
        { name: '栃木県', adjustmentMinutes: 0 },
        { name: '群馬県', adjustmentMinutes: 0 },
        { name: '埼玉県', adjustmentMinutes: 0 },
        { name: '千葉県', adjustmentMinutes: 0 },
        { name: '東京都', adjustmentMinutes: 0 },
        { name: '神奈川県', adjustmentMinutes: 0 },
        { name: '新潟県', adjustmentMinutes: 0 },
        { name: '富山県', adjustmentMinutes: 0 },
        { name: '石川県', adjustmentMinutes: 0 },
        { name: '福井県', adjustmentMinutes: 0 },
        { name: '山梨県', adjustmentMinutes: 0 },
        { name: '長野県', adjustmentMinutes: 0 },
        { name: '岐阜県', adjustmentMinutes: 0 },
        { name: '静岡県', adjustmentMinutes: 0 },
        { name: '愛知県', adjustmentMinutes: 0 },
        { name: '三重県', adjustmentMinutes: 0 },
        { name: '滋賀県', adjustmentMinutes: 0 },
        { name: '京都府', adjustmentMinutes: 0 },
        { name: '大阪府', adjustmentMinutes: 0 },
        { name: '兵庫県', adjustmentMinutes: 0 },
        { name: '奈良県', adjustmentMinutes: 0 },
        { name: '和歌山県', adjustmentMinutes: 0 },
        { name: '鳥取県', adjustmentMinutes: 0 },
        { name: '島根県', adjustmentMinutes: 0 },
        { name: '岡山県', adjustmentMinutes: 0 },
        { name: '広島県', adjustmentMinutes: 0 },
        { name: '山口県', adjustmentMinutes: 0 },
        { name: '徳島県', adjustmentMinutes: 0 },
        { name: '香川県', adjustmentMinutes: 0 },
        { name: '愛媛県', adjustmentMinutes: 0 },
        { name: '高知県', adjustmentMinutes: 0 },
        { name: '福岡県', adjustmentMinutes: 0 },
        { name: '佐賀県', adjustmentMinutes: 0 },
        { name: '長崎県', adjustmentMinutes: 0 },
        { name: '熊本県', adjustmentMinutes: 0 },
        { name: '大分県', adjustmentMinutes: 0 },
        { name: '宮崎県', adjustmentMinutes: 0 },
        { name: '鹿児島県', adjustmentMinutes: 0 },
        { name: '沖縄県', adjustmentMinutes: 0 },
      ];

      return { prefectures };
    } catch (error) {
      logger.error('都道府県リスト取得エラー:', error);
      throw error;
    }
  }
}