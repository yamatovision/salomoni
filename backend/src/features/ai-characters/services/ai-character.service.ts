import { AICharacterRepository } from '../repositories/ai-character.repository';
import { AIMemoryRepository } from '../repositories/ai-memory.repository';
import { AICharacter, AICharacterStyle, UserProfile, Client } from '../../../types';
import { logger } from '../../../common/utils/logger';
import { AppError } from '../../../common/middleware/errorHandler';

export class AICharacterService {
  private aiCharacterRepository: AICharacterRepository;
  private aiMemoryRepository: AIMemoryRepository;

  constructor() {
    this.aiCharacterRepository = new AICharacterRepository();
    this.aiMemoryRepository = new AIMemoryRepository();
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
        throw new AppError(400, 'userIdまたはclientIdのいずれかは必須です', 'MISSING_USER_OR_CLIENT');
      }
      if (data.userId && data.clientId) {
        throw new AppError(400, 'userIdとclientIdは同時に設定できません', 'BOTH_USER_AND_CLIENT');
      }

      // 既存のAIキャラクターチェック
      if (data.userId) {
        const existing = await this.aiCharacterRepository.findByUserId(data.userId);
        if (existing) {
          throw new AppError(400, 'このユーザーのAIキャラクターは既に存在します', 'AI_CHARACTER_EXISTS');
        }
      }
      if (data.clientId) {
        const existing = await this.aiCharacterRepository.findByClientId(data.clientId);
        if (existing) {
          throw new AppError(400, 'このクライアントのAIキャラクターは既に存在します', 'AI_CHARACTER_EXISTS');
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
}