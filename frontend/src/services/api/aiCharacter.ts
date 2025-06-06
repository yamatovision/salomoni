import { apiClient } from './apiClient';
import { API_PATHS } from '../../types';
import type {
  ApiResponse,
  AICharacter,
  AICharacterCreateRequest,
  AICharacterUpdateRequest,
  AIMemory,
  AIMemoryCreateRequest,
  AIMemoryCategory,
  PaginationParams,
} from '../../types';

export class AICharacterService {
  // AIキャラクター作成
  async createAICharacter(data: AICharacterCreateRequest): Promise<ApiResponse<AICharacter>> {
    try {
      const response = await apiClient.post<ApiResponse<AICharacter>>(
        API_PATHS.AI_CHARACTERS.CHARACTERS,
        data
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'AIキャラクターの作成に失敗しました',
      };
    }
  }

  // 自分のAIキャラクター取得
  async getMyAICharacter(): Promise<ApiResponse<AICharacter>> {
    try {
      const response = await apiClient.get<ApiResponse<AICharacter>>(
        API_PATHS.AI_CHARACTERS.MY_CHARACTER
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'AIキャラクターの取得に失敗しました',
      };
    }
  }

  // AIキャラクター詳細取得
  async getAICharacter(characterId: string): Promise<ApiResponse<AICharacter>> {
    try {
      const response = await apiClient.get<ApiResponse<AICharacter>>(
        API_PATHS.AI_CHARACTERS.CHARACTER(characterId)
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'AIキャラクターの取得に失敗しました',
      };
    }
  }

  // AIキャラクター更新
  async updateAICharacter(
    characterId: string,
    data: AICharacterUpdateRequest
  ): Promise<ApiResponse<AICharacter>> {
    try {
      const response = await apiClient.put<ApiResponse<AICharacter>>(
        API_PATHS.AI_CHARACTERS.CHARACTER(characterId),
        data
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'AIキャラクターの更新に失敗しました',
      };
    }
  }

  // AIキャラクター削除
  async deleteAICharacter(characterId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(
        API_PATHS.AI_CHARACTERS.CHARACTER(characterId)
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'AIキャラクターの削除に失敗しました',
      };
    }
  }

  // AIメモリ作成・更新
  async updateAIMemory(
    characterId: string,
    data: AIMemoryCreateRequest
  ): Promise<ApiResponse<AIMemory>> {
    try {
      const response = await apiClient.post<ApiResponse<AIMemory>>(
        API_PATHS.AI_CHARACTERS.CHARACTER_MEMORY(characterId),
        data
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'AIメモリの更新に失敗しました',
      };
    }
  }

  // AIメモリ取得
  async getAIMemory(
    characterId: string,
    params?: {
      category?: AIMemoryCategory;
      isActive?: boolean;
    } & PaginationParams
  ): Promise<ApiResponse<AIMemory[]>> {
    try {
      const response = await apiClient.get<ApiResponse<AIMemory[]>>(
        API_PATHS.AI_CHARACTERS.CHARACTER_MEMORY(characterId),
        { params }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'AIメモリの取得に失敗しました',
      };
    }
  }

  // クライアント用AIキャラクター設定状況確認
  async getClientSetupStatus(clientId: string): Promise<ApiResponse<{ hasAICharacter: boolean }>> {
    try {
      const response = await apiClient.get<ApiResponse<{ hasAICharacter: boolean }>>(
        API_PATHS.AI_CHARACTERS.CLIENT_SETUP_STATUS(clientId)
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'AIキャラクター設定状況の確認に失敗しました',
      };
    }
  }
}