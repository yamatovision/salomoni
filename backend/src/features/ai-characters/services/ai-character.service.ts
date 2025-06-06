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
  JapanesePrefecturesResponse,
  FourPillarsData
} from '../../../types';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/middleware/errorHandler';
import OpenAI from 'openai';
import { UserRepository } from '../../users/repositories/user.repository';
import { SajuService } from '../../saju/services/saju.service';
import { JAPAN_PREFECTURES_DATA } from '../../saju/services/prefecture-data';

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

      // 四柱推命データ計算・保存
      const sajuData = await this.sajuService.calculateFourPillars({
        birthDate: request.birthDate,
        birthTime: request.birthTime || '00:00',
        timezone: 'Asia/Tokyo',
        location: birthLocation,
      }, userId); // userIdを渡して保存

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
      // prefecture-data.tsから正確なデータを使用
      return { prefectures: JAPAN_PREFECTURES_DATA };
    } catch (error) {
      logger.error('都道府県リスト取得エラー:', error);
      throw error;
    }
  }

  // クライアント用AIキャラクターセットアップ状態確認
  async getClientSetupStatus(clientId: string): Promise<AICharacterSetupStatus> {
    try {
      logger.info(`クライアントAIキャラクター状態確認: clientId=${clientId}`);
      
      const aiCharacter = await this.aiCharacterRepository.findByClientId(clientId);
      
      if (aiCharacter) {
        logger.info(`クライアントAIキャラクター存在: ${aiCharacter.name}`);
        return {
          hasCharacter: true,
          needsSetup: false,
        };
      }
      
      logger.info('クライアントAIキャラクター未設定');
      return {
        hasCharacter: false,
        needsSetup: true,
      };
    } catch (error) {
      logger.error('クライアントセットアップ状態確認エラー:', error);
      throw error;
    }
  }

  // クライアント用AIキャラクターセットアップ
  async setupClientAICharacter(
    clientId: string,
    data: AICharacterSetupRequest
  ): Promise<AICharacterSetupResponse> {
    try {
      logger.info('クライアントAIキャラクターセットアップ開始', { clientId, data });

      // クライアント情報を取得
      const { ClientModel } = await import('../../clients/models/client.model');
      const client = await ClientModel.findById(clientId);
      
      if (!client) {
        throw new Error('クライアントが見つかりません');
      }

      // クライアント情報を更新（生年月日情報）
      logger.info('[DEBUG] クライアント情報更新前:', {
        clientId,
        existingBirthDate: client.birthDate,
        newBirthDate: data.birthDate,
        newBirthTime: data.birthTime,
        newBirthPlace: data.birthPlace,
      });

      // 生年月日情報が提供された場合、クライアント情報を更新
      if (data.birthDate) {
        const updateData: any = {
          birthDate: new Date(data.birthDate),
          birthTime: data.birthTime || '12:00',
        };

        // 出生地情報も更新
        if (data.birthPlace) {
          updateData.birthLocation = {
            name: data.birthPlace,
            longitude: 139.6917, // TODO: 実際の座標を取得
            latitude: 35.6895,
          };
        }

        await ClientModel.findByIdAndUpdate(clientId, updateData);
        logger.info('[DEBUG] クライアント情報更新完了:', updateData);

        // クライアント情報を再取得
        const updatedClient = await ClientModel.findById(clientId);
        if (updatedClient) {
          client.birthDate = updatedClient.birthDate;
          client.birthTime = updatedClient.birthTime;
          client.birthLocation = updatedClient.birthLocation;
        }
      }

      // AIキャラクター作成
      const aiCharacter = await this.createAICharacter({
        name: data.name || `${client.name}さんのAIアシスタント`,
        clientId,
        styleFlags: data.processedStyle || [],
        personalityScore: data.processedPersonality || {
          softness: 50,
          energy: 50,
          formality: 50,
        },
      });

      // 四柱推命データを保存/更新（生年月日情報がある場合）
      if (data.birthDate || client.birthDate) {
        try {
          // 最新の生年月日情報を使用
          const birthDateToUse = data.birthDate || client.birthDate?.toISOString().split('T')[0];
          const birthTimeToUse = data.birthTime || client.birthTime || '12:00';
          const birthPlaceToUse = data.birthPlace || client.birthLocation?.name || 'Tokyo';
          
          logger.info('[DEBUG] 四柱推命データ計算パラメータ:', {
            birthDate: birthDateToUse,
            birthTime: birthTimeToUse,
            birthPlace: birthPlaceToUse,
          });

          const fourPillarsData = await this.sajuService.calculateFourPillars({
            birthDate: birthDateToUse!,
            birthTime: birthTimeToUse,
            timezone: 'Asia/Tokyo',
            location: {
              name: birthPlaceToUse,
              longitude: client.birthLocation?.longitude || 139.6917,
              latitude: client.birthLocation?.latitude || 35.6895,
            },
          });

          // クライアントの四柱推命データIDを更新
          await ClientModel.findByIdAndUpdate(clientId, {
            fourPillarsDataId: fourPillarsData._id,
          });

          logger.info('クライアント四柱推命データ更新完了', {
            clientId,
            fourPillarsDataId: fourPillarsData._id,
          });
        } catch (error) {
          logger.error('クライアント四柱推命計算エラー:', error);
        }
      }

      // 最終的なクライアント情報を確認
      const finalClient = await ClientModel.findById(clientId);
      logger.info('[DEBUG] 最終的なクライアント情報:', {
        clientId,
        birthDate: finalClient?.birthDate,
        birthTime: finalClient?.birthTime,
        birthLocation: finalClient?.birthLocation,
        fourPillarsDataId: finalClient?.fourPillarsDataId,
      });

      return {
        success: true,
        character: aiCharacter,
        sajuData: {} as FourPillarsData, // TODO: 実際の四柱推命データを返す
        setupData: {
          name: data.name,
          birthDate: data.birthDate,
          birthPlace: data.birthPlace,
          birthTime: data.birthTime,
          personalityInput: data.personalityInput,
          styleInput: data.styleInput,
          processedPersonality: data.processedPersonality,
          processedStyle: data.processedStyle,
        },
      };
    } catch (error) {
      logger.error('クライアントAIキャラクターセットアップエラー:', error);
      throw error;
    }
  }
}