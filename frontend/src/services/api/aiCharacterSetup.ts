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
    const response = await apiClient.post(API_PATHS.AI_CHARACTERS.PROCESS_NATURAL_INPUT, {
      input,
      field,
    });
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
    // First, process natural language inputs
    const [personalityResult, styleResult] = await Promise.all([
      processNaturalInput(setupData.personality, 'personality'),
      processNaturalInput(setupData.style, 'style'),
    ]);

    // Then create the AI character
    const response = await apiClient.post(API_PATHS.AI_CHARACTERS.SETUP, {
      name: setupData.name,
      birthDate: setupData.birthDate,
      birthPlace: setupData.birthPlace,
      birthTime: setupData.birthTime,
      personalityInput: setupData.personality,
      styleInput: setupData.style,
      processedPersonality: personalityResult.processedData,
      processedStyle: styleResult.processedData,
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