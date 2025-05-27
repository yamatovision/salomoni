import { useState, useCallback } from 'react';
import type {
  SetupData,
  Message,
  BirthDateData,
  BirthPlaceData,
  BirthTimeData,
} from '../components/features/ai-character-setup/types';
import { setupAICharacter } from '../services/api/aiCharacterSetup';
import { v4 as uuidv4 } from 'uuid';

const SETUP_STEPS = [
  'name',
  'birthdate',
  'birthplace',
  'birthtime',
  'personality',
  'style',
] as const;

export const useAICharacterSetup = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<SetupData>({
    name: '',
    birthDate: '',
    birthPlace: '',
    birthTime: null,
    personality: '',
    style: '',
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Add AI message
  const addAIMessage = useCallback((content: string) => {
    const message: Message = {
      id: uuidv4(),
      type: 'ai',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  // Add user message
  const addUserMessage = useCallback((content: string) => {
    const message: Message = {
      id: uuidv4(),
      type: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  // Start setup
  const startSetup = useCallback(() => {
    const firstQuestion = 'まず、AIアシスタントにどんな名前をつけたいですか？\n\n例：「さくら」「アドバイザー田中」「ミミ」など、お好きな名前をどうぞ！';
    addAIMessage(firstQuestion);
  }, [addAIMessage]);

  // Go to next step
  const proceedToNextStep = useCallback(() => {
    if (currentStep < SETUP_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeSetup();
    }
  }, [currentStep]);

  // Handle text input (name, personality, style)
  const handleTextInput = useCallback((field: string, value: string) => {
    addUserMessage(value);
    setSetupData((prev) => ({ ...prev, [field]: value }));
    
    setTimeout(() => {
      proceedToNextStep();
    }, 500);
  }, [addUserMessage, proceedToNextStep]);

  // Handle date input
  const handleDateInput = useCallback((data: BirthDateData) => {
    const dateString = `${data.year}年${data.month}月${data.day}日`;
    addUserMessage(dateString);
    
    const formattedDate = `${data.year}-${data.month.toString().padStart(2, '0')}-${data.day.toString().padStart(2, '0')}`;
    setSetupData((prev) => ({ ...prev, birthDate: formattedDate }));
    
    setTimeout(() => {
      proceedToNextStep();
    }, 500);
  }, [addUserMessage, proceedToNextStep]);

  // Handle place input
  const handlePlaceInput = useCallback((data: BirthPlaceData) => {
    addUserMessage(data.location);
    setSetupData((prev) => ({ ...prev, birthPlace: data.location }));
    
    setTimeout(() => {
      proceedToNextStep();
    }, 500);
  }, [addUserMessage, proceedToNextStep]);

  // Handle time input
  const handleTimeInput = useCallback((data: BirthTimeData) => {
    if (!data.hasTime) {
      addUserMessage('わからない');
      setSetupData((prev) => ({ ...prev, birthTime: null }));
    } else {
      const timeString = `${data.hour!.toString().padStart(2, '0')}:${data.minute!.toString().padStart(2, '0')}`;
      addUserMessage(timeString);
      setSetupData((prev) => ({ ...prev, birthTime: timeString }));
    }
    
    setTimeout(() => {
      proceedToNextStep();
    }, 500);
  }, [addUserMessage, proceedToNextStep]);

  // Complete setup
  const completeSetup = useCallback(async () => {
    setIsProcessing(true);
    
    // Show processing message
    setTimeout(() => {
      addAIMessage('素晴らしい回答をありがとうございます！今、あなたの情報を基にAIアシスタントを作成しています...');
    }, 500);

    try {
      // Call API to create AI character
      const result = await setupAICharacter(setupData);
      
      if (result.success) {
        setTimeout(() => {
          const completionMessage = `✨ 「${setupData.name}」の作成が完了しました！\n\n${setupData.name}は「${setupData.personality}」という性格で「${setupData.style}」なスタイルのアドバイザーとして設定されました。\n\n📅 生年月日: ${setupData.birthDate}\n📍 出生地: ${setupData.birthPlace}\n${setupData.birthTime ? '🕐 出生時間: ' + setupData.birthTime : ''}\n\n四柱推命の基本データも自動計算されました。これからあなたの美容とライフスタイルのサポートをさせていただきます！`;
          
          addAIMessage(completionMessage);
          setCurrentStep(SETUP_STEPS.length); // Mark as complete
        }, 2000);
      } else {
        throw new Error('Setup failed');
      }
    } catch (error) {
      console.error('Setup error:', error);
      addAIMessage('申し訳ございません。セットアップ中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsProcessing(false);
    }
  }, [setupData, addAIMessage]);

  return {
    currentStep,
    setupData,
    messages,
    isProcessing,
    startSetup,
    handleTextInput,
    handleDateInput,
    handlePlaceInput,
    handleTimeInput,
    completeSetup,
  };
};