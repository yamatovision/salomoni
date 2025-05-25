import { AICharacterModel } from '../models/ai-character.model';
import { AICharacter } from '../../../types';
import { logger } from '../../../common/utils/logger';

export class AICharacterRepository {
  async create(data: Partial<AICharacter>): Promise<AICharacter> {
    try {
      const aiCharacter = new AICharacterModel(data);
      await aiCharacter.save();
      return aiCharacter.toJSON() as AICharacter;
    } catch (error) {
      logger.error('AIキャラクター作成エラー:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<AICharacter | null> {
    try {
      const aiCharacter = await AICharacterModel.findById(id);
      return aiCharacter ? aiCharacter.toJSON() as AICharacter : null;
    } catch (error) {
      logger.error('AIキャラクター取得エラー:', error);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<AICharacter | null> {
    try {
      const aiCharacter = await AICharacterModel.findOne({ userId });
      return aiCharacter ? aiCharacter.toJSON() as AICharacter : null;
    } catch (error) {
      logger.error('ユーザーのAIキャラクター取得エラー:', error);
      throw error;
    }
  }

  async findByClientId(clientId: string): Promise<AICharacter | null> {
    try {
      const aiCharacter = await AICharacterModel.findOne({ clientId });
      return aiCharacter ? aiCharacter.toJSON() as AICharacter : null;
    } catch (error) {
      logger.error('クライアントのAIキャラクター取得エラー:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<AICharacter>): Promise<AICharacter | null> {
    try {
      const aiCharacter = await AICharacterModel.findByIdAndUpdate(
        id,
        { 
          ...data,
          lastInteractionAt: new Date(),
        },
        { new: true, runValidators: true }
      );
      return aiCharacter ? aiCharacter.toJSON() as AICharacter : null;
    } catch (error) {
      logger.error('AIキャラクター更新エラー:', error);
      throw error;
    }
  }

  async updateLastInteraction(id: string): Promise<void> {
    try {
      await AICharacterModel.findByIdAndUpdate(
        id,
        { lastInteractionAt: new Date() }
      );
    } catch (error) {
      logger.error('最終インタラクション更新エラー:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await AICharacterModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('AIキャラクター削除エラー:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await AICharacterModel.countDocuments({ _id: id });
      return count > 0;
    } catch (error) {
      logger.error('AIキャラクター存在確認エラー:', error);
      throw error;
    }
  }
}