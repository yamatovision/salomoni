import { API_PATHS } from '../../types';
import { apiClient } from './apiClient';
import type { SetupData } from '../../components/features/ai-character-setup/types';

/**
 * Check AI character setup status
 */
export const checkSetupStatus = async () => {
  try {
    const response = await apiClient.get(API_PATHS.AI_CHARACTERS.SETUP_STATUS);
    return response.data;
  } catch (error) {
    console.error('Failed to check setup status:', error);
    throw error;
  }
};

/**
 * Process natural language input for personality or style
 */
export const processNaturalInput = async (
  input: string,
  field: 'personality' | 'style'
) => {
  try {
    console.log('[processNaturalInput] 送信データ:', { input, field });
    const response = await apiClient.post(API_PATHS.AI_CHARACTERS.PROCESS_NATURAL_INPUT, {
      input,
      field,
    });
    console.log('[processNaturalInput] レスポンス:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to process natural input:', error);
    throw error;
  }
};

/**
 * Setup AI character with user data
 */
export const setupAICharacter = async (setupData: SetupData) => {
  try {
    console.log('[setupAICharacter] セットアップデータ:', setupData);
    
    // First, process natural language inputs
    const [personalityResult, styleResult] = await Promise.all([
      processNaturalInput(setupData.personality, 'personality'),
      processNaturalInput(setupData.style, 'style'),
    ]);

    console.log('[setupAICharacter] 処理結果:', {
      personalityResult,
      styleResult
    });

    // Extract processedData from the response
    const processedPersonality = personalityResult.data?.processedData || personalityResult.processedData;
    const processedStyle = styleResult.data?.processedData || styleResult.processedData;

    console.log('[setupAICharacter] 抽出された処理済みデータ:', {
      processedPersonality,
      processedStyle
    });

    // Then create the AI character with the correct data structure
    const response = await apiClient.post(API_PATHS.AI_CHARACTERS.SETUP, {
      name: setupData.name,
      birthDate: setupData.birthDate,
      birthPlace: setupData.birthPlace,
      birthTime: setupData.birthTime,
      personalityInput: setupData.personality,
      styleInput: setupData.style,
      processedPersonality: processedPersonality,
      processedStyle: processedStyle,
    });

    return response.data;
  } catch (error) {
    console.error('Failed to setup AI character:', error);
    throw error;
  }
};

/**
 * Get Japan prefecture list with time adjustments
 */
export const getJapanPrefectures = async () => {
  try {
    const response = await apiClient.get(API_PATHS.SAJU_LOCATIONS.JAPAN);
    return response.data;
  } catch (error) {
    console.error('Failed to get Japan prefectures:', error);
    throw error;
  }
};

/**
 * Setup AI character for a client
 */
export const setupClientAICharacter = async (clientId: string, setupData: SetupData) => {
  try {
    console.log('[setupClientAICharacter] クライアント用セットアップデータ:', { clientId, setupData });
    
    // First, process natural language inputs
    const [personalityResult, styleResult] = await Promise.all([
      processNaturalInput(setupData.personality, 'personality'),
      processNaturalInput(setupData.style, 'style'),
    ]);

    console.log('[setupClientAICharacter] 処理結果:', {
      personalityResult,
      styleResult
    });

    // Extract processedData from the response
    const processedPersonality = personalityResult.data?.processedData || personalityResult.processedData;
    const processedStyle = styleResult.data?.processedData || styleResult.processedData;

    console.log('[setupClientAICharacter] 抽出された処理済みデータ:', {
      processedPersonality,
      processedStyle
    });

    // Then create the AI character for the client with the correct data structure
    const requestData = {
      name: setupData.name,
      birthDate: setupData.birthDate,
      birthPlace: setupData.birthPlace,
      birthTime: setupData.birthTime,
      personalityInput: setupData.personality,
      styleInput: setupData.style,
      processedPersonality: processedPersonality,
      processedStyle: processedStyle,
    };
    
    console.log('[setupClientAICharacter] リクエストデータ:', requestData);
    console.log('[setupClientAICharacter] リクエストURL:', API_PATHS.AI_CHARACTERS.CLIENT_SETUP(clientId));
    
    const response = await apiClient.post(API_PATHS.AI_CHARACTERS.CLIENT_SETUP(clientId), requestData);

    return response.data;
  } catch (error: any) {
    console.error('Failed to setup client AI character:', error);
    if (error.response) {
      console.error('[setupClientAICharacter] エラーレスポンス:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    throw error;
  }
};