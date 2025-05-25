import { AIMemoryRepository } from '../repositories/ai-memory.repository';
import { AICharacterRepository } from '../repositories/ai-character.repository';
import { AIMemory, AIMemoryType, PaginationParams } from '../../../types';
import { logger } from '../../../common/utils/logger';

export class AIMemoryService {
  private aiMemoryRepository: AIMemoryRepository;
  private aiCharacterRepository: AICharacterRepository;

  constructor() {
    this.aiMemoryRepository = new AIMemoryRepository();
    this.aiCharacterRepository = new AICharacterRepository();
  }

  async createMemory(data: {
    characterId: string;
    memoryType: AIMemoryType;
    content: string;
    category: string;
    extractedFrom?: string;
    confidence?: number;
    isActive?: boolean;
  }): Promise<AIMemory> {
    try {
      // AIキャラクターの存在確認
      const characterExists = await this.aiCharacterRepository.exists(data.characterId);
      if (!characterExists) {
        throw new Error('指定されたAIキャラクターが存在しません');
      }

      // 自動抽出タイプの場合、extractedFromは必須
      if (data.memoryType === AIMemoryType.AUTO && !data.extractedFrom) {
        throw new Error('自動抽出タイプの場合、抽出元は必須です');
      }

      const memory = await this.aiMemoryRepository.create({
        ...data,
        confidence: data.confidence || (data.memoryType === AIMemoryType.EXPLICIT ? 100 : 80),
        isActive: data.isActive !== undefined ? data.isActive : true,
      });

      logger.info(`AIメモリ作成完了: ${memory.id}`);
      return memory;
    } catch (error) {
      logger.error('AIメモリ作成エラー:', error);
      throw error;
    }
  }

  async createBulkMemories(
    characterId: string,
    memories: Array<{
      memoryType: AIMemoryType;
      content: string;
      category: string;
      extractedFrom?: string;
      confidence?: number;
      isActive?: boolean;
    }>
  ): Promise<AIMemory[]> {
    try {
      // AIキャラクターの存在確認
      const characterExists = await this.aiCharacterRepository.exists(characterId);
      if (!characterExists) {
        throw new Error('指定されたAIキャラクターが存在しません');
      }

      const memoryData = memories.map(memory => ({
        characterId,
        ...memory,
        confidence: memory.confidence || (memory.memoryType === AIMemoryType.EXPLICIT ? 100 : 80),
        isActive: memory.isActive !== undefined ? memory.isActive : true,
      }));

      const createdMemories = await this.aiMemoryRepository.createBulk(memoryData);
      
      logger.info(`AIメモリ一括作成完了: ${createdMemories.length}件`);
      return createdMemories;
    } catch (error) {
      logger.error('AIメモリ一括作成エラー:', error);
      throw error;
    }
  }

  async getMemoriesByCharacterId(
    characterId: string,
    filters?: {
      category?: string;
      isActive?: boolean;
      memoryType?: string;
    },
    pagination?: PaginationParams
  ): Promise<{ memories: AIMemory[]; pagination: any }> {
    try {
      return await this.aiMemoryRepository.findByCharacterId(
        characterId,
        filters,
        pagination
      );
    } catch (error) {
      logger.error('AIメモリ取得エラー:', error);
      throw error;
    }
  }

  async getActiveMemories(characterId: string): Promise<AIMemory[]> {
    try {
      return await this.aiMemoryRepository.getActiveMemories(characterId);
    } catch (error) {
      logger.error('アクティブメモリ取得エラー:', error);
      throw error;
    }
  }

  async updateMemory(
    id: string,
    data: {
      content?: string;
      category?: string;
      confidence?: number;
      isActive?: boolean;
    }
  ): Promise<AIMemory | null> {
    try {
      const updated = await this.aiMemoryRepository.update(id, data);
      
      if (updated) {
        logger.info(`AIメモリ更新完了: ${id}`);
      }
      
      return updated;
    } catch (error) {
      logger.error('AIメモリ更新エラー:', error);
      throw error;
    }
  }

  async deactivateMemories(
    characterId: string,
    category?: string
  ): Promise<number> {
    try {
      const filter = category ? { category } : {};
      const count = await this.aiMemoryRepository.updateMany(
        characterId,
        filter,
        { isActive: false }
      );
      
      logger.info(`AIメモリ非アクティブ化完了: ${count}件`);
      return count;
    } catch (error) {
      logger.error('AIメモリ非アクティブ化エラー:', error);
      throw error;
    }
  }

  async deleteMemory(id: string): Promise<boolean> {
    try {
      const deleted = await this.aiMemoryRepository.delete(id);
      
      if (deleted) {
        logger.info(`AIメモリ削除完了: ${id}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error('AIメモリ削除エラー:', error);
      throw error;
    }
  }

  async extractMemoriesFromConversation(
    characterId: string,
    conversationContent: string
  ): Promise<AIMemory[]> {
    try {
      // TODO: ここでOpenAI APIを使用して会話内容からメモリを抽出する
      // 現在は仮実装
      const extractedMemories: AIMemory[] = [];
      
      // 例: 会話内容から好みを抽出
      if (conversationContent.includes('好き') || conversationContent.includes('いいな')) {
        const memory = await this.createMemory({
          characterId,
          memoryType: AIMemoryType.AUTO,
          content: '会話から抽出された好み情報',
          category: 'preference',
          extractedFrom: conversationContent.substring(0, 100),
          confidence: 75,
        });
        extractedMemories.push(memory);
      }
      
      return extractedMemories;
    } catch (error) {
      logger.error('会話からのメモリ抽出エラー:', error);
      throw error;
    }
  }

  async getMemoryContext(characterId: string, limit: number = 10): Promise<string> {
    try {
      const activeMemories = await this.getActiveMemories(characterId);
      
      // 信頼度の高い順に並べて、上位のメモリを取得
      const topMemories = activeMemories
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
        .slice(0, limit);
      
      // メモリをコンテキスト文字列に変換
      const context = topMemories
        .map(memory => `[${memory.category}] ${memory.content}`)
        .join('\n');
      
      return context;
    } catch (error) {
      logger.error('メモリコンテキスト生成エラー:', error);
      throw error;
    }
  }
}