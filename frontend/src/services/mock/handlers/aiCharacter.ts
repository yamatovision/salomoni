import { mockAICharacters } from '../data/mockAICharacters';
import { mockAIMemories } from '../data/mockAIMemories';
import type {
  ApiResponse,
  AICharacter,
  AICharacterCreateRequest,
  AICharacterUpdateRequest,
  AIMemory,
  AIMemoryCreateRequest,
  AIMemoryCategory,
  PaginationParams,
} from '../../../types';

// モックの遅延時間
const MOCK_DELAY = 500;

export class MockAICharacterService {
  private async delay() {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  }

  // AIキャラクター作成
  async createAICharacter(data: AICharacterCreateRequest): Promise<ApiResponse<AICharacter>> {
    await this.delay();
    
    const newCharacter: AICharacter = {
      id: `char-${Date.now()}`,
      userId: 'user-001', // モックユーザーID
      name: data.name,
      styleFlags: data.styleFlags,
      personalityScore: data.personalityScore || {
        softness: 50,
        energy: 50,
        formality: 50,
      },
      personalityTraits: data.personalityTraits?.map(trait => ({
        trait,
        score: Math.floor(Math.random() * 40) + 60, // 60-100のランダムスコア
        description: `${trait}の特性を持っています`
      })),
      communicationStyle: data.communicationStyle,
      createdAt: new Date(),
      lastInteractionAt: new Date(),
    };
    
    return {
      success: true,
      data: newCharacter,
    };
  }

  // 自分のAIキャラクター取得
  async getMyAICharacter(): Promise<ApiResponse<AICharacter>> {
    await this.delay();
    
    const myCharacter = mockAICharacters[0]; // モックでは最初のキャラクターを返す
    
    if (!myCharacter) {
      return {
        success: false,
        error: 'AIキャラクターが見つかりません',
      };
    }
    
    return {
      success: true,
      data: myCharacter,
    };
  }

  // AIキャラクター詳細取得
  async getAICharacter(characterId: string): Promise<ApiResponse<AICharacter>> {
    await this.delay();
    
    const character = mockAICharacters.find((c: AICharacter) => c.id === characterId);
    
    if (!character) {
      return {
        success: false,
        error: 'AIキャラクターが見つかりません',
      };
    }
    
    return {
      success: true,
      data: character,
    };
  }

  // AIキャラクター更新
  async updateAICharacter(
    characterId: string,
    data: AICharacterUpdateRequest
  ): Promise<ApiResponse<AICharacter>> {
    await this.delay();
    
    const character = mockAICharacters.find((c: AICharacter) => c.id === characterId);
    
    if (!character) {
      return {
        success: false,
        error: 'AIキャラクターが見つかりません',
      };
    }
    
    // 更新処理をシミュレート
    Object.assign(character, data, { lastInteractionAt: new Date() });
    
    return {
      success: true,
      data: character,
    };
  }

  // AIキャラクター削除
  async deleteAICharacter(characterId: string): Promise<ApiResponse<void>> {
    await this.delay();
    
    const characterIndex = mockAICharacters.findIndex(c => c.id === characterId);
    
    if (characterIndex === -1) {
      return {
        success: false,
        error: 'AIキャラクターが見つかりません',
      };
    }
    
    // 削除処理をシミュレート
    mockAICharacters.splice(characterIndex, 1);
    
    return {
      success: true,
      data: undefined,
    };
  }

  // AIメモリ作成・更新
  async updateAIMemory(
    characterId: string,
    data: AIMemoryCreateRequest
  ): Promise<ApiResponse<AIMemory>> {
    await this.delay();
    
    const newMemory: AIMemory = {
      id: `mem-${Date.now()}`,
      characterId: characterId,
      memoryType: data.memoryType,
      category: data.category,
      content: data.content,
      extractedFrom: data.extractedFrom,
      confidence: data.confidence,
      isActive: data.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockAIMemories.push(newMemory);
    
    return {
      success: true,
      data: newMemory,
    };
  }

  // AIメモリ取得
  async getAIMemory(
    characterId: string,
    params?: {
      category?: AIMemoryCategory;
      isActive?: boolean;
    } & PaginationParams
  ): Promise<ApiResponse<AIMemory[]>> {
    await this.delay();
    
    let memories = mockAIMemories.filter((m: AIMemory) => m.characterId === characterId);
    
    // フィルタリング
    if (params?.category) {
      memories = memories.filter(m => m.category === params.category);
    }
    if (params?.isActive !== undefined) {
      memories = memories.filter(m => m.isActive === params.isActive);
    }
    
    // ページネーション
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    const paginatedMemories = memories.slice(start, start + limit);
    
    return {
      success: true,
      data: paginatedMemories,
      meta: {
        total: memories.length,
        page,
        limit,
        totalPages: Math.ceil(memories.length / limit),
      },
    };
  }
}