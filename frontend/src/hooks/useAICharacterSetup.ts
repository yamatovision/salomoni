import { useState, useCallback } from 'react';
import type {
  SetupData,
  Message,
  BirthDateData,
  BirthPlaceData,
  BirthTimeData,
} from '../components/features/ai-character-setup/types';
import { setupAICharacter, setupClientAICharacter } from '../services/api/aiCharacterSetup';
import { v4 as uuidv4 } from 'uuid';

const SETUP_STEPS = [
  'name',
  'birthdate',
  'birthplace',
  'birthtime',
  'personality',
  'style',
] as const;

export const useAICharacterSetup = (clientId?: string, stepQuestions?: string[]) => {
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
    console.log('[startSetup] セットアップ開始');
    // 最初の質問を表示
    if (stepQuestions && stepQuestions.length > 0) {
      addAIMessage(stepQuestions[0]);
    }
  }, [stepQuestions, addAIMessage]);

  // Complete setup with provided data
  const completeSetupWithData = useCallback(async (dataToUse: SetupData) => {
    console.log('[completeSetupWithData] 最終データ:', dataToUse);
    
    // データの検証
    if (!dataToUse.name || !dataToUse.birthDate || !dataToUse.birthPlace || !dataToUse.personality || !dataToUse.style) {
      console.error('[completeSetupWithData] 必須データが不足しています:', {
        name: dataToUse.name,
        birthDate: dataToUse.birthDate,
        birthPlace: dataToUse.birthPlace,
        personality: dataToUse.personality,
        style: dataToUse.style
      });
      addAIMessage('申し訳ございません。必要な情報が不足しています。もう一度最初からお試しください。');
      return;
    }
    
    setIsProcessing(true);
    
    // Show processing message
    setTimeout(() => {
      addAIMessage('素晴らしい回答をありがとうございます！今、あなたの情報を基にAIアシスタントを作成しています...');
    }, 500);

    try {
      // Call API to create AI character
      const result = clientId 
        ? await setupClientAICharacter(clientId, dataToUse)
        : await setupAICharacter(dataToUse);
      
      if (result.success) {
        setTimeout(() => {
          const completionMessage = `✨ 「${dataToUse.name}」の作成が完了しました！\n\n${dataToUse.name}は「${dataToUse.personality}」という性格で「${dataToUse.style}」なスタイルのアドバイザーとして設定されました。\n\n📅 生年月日: ${dataToUse.birthDate}\n📍 出生地: ${dataToUse.birthPlace}\n${dataToUse.birthTime ? '🕐 出生時間: ' + dataToUse.birthTime : ''}\n\n四柱推命の基本データも自動計算されました。これからあなたの美容とライフスタイルのサポートをさせていただきます！`;
          
          addAIMessage(completionMessage);
          setCurrentStep(SETUP_STEPS.length); // Mark as complete
          
          // 成功メッセージを表示
          addAIMessage(clientId 
            ? '3秒後にチャット画面へ移動します...' 
            : '3秒後にダッシュボードへ移動します...');
          
          // 3秒後にリダイレクト
          setTimeout(() => {
            console.log('[completeSetupWithData] リダイレクト実行');
            if (clientId) {
              // クライアント用の場合はチャット画面へ
              window.location.href = `/chat?clientId=${clientId}`;
            } else {
              // 通常の場合はダッシュボードへ
              window.location.href = '/dashboard';
            }
          }, 3000);
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
  }, [addAIMessage, clientId]);

  // Complete setup
  const completeSetup = useCallback(async () => {
    await completeSetupWithData(setupData);
  }, [setupData, completeSetupWithData]);

  // Go to next step
  const proceedToNextStep = useCallback(() => {
    console.log('[proceedToNextStep] 現在のステップ:', currentStep, '/', SETUP_STEPS.length - 1);
    console.log('[proceedToNextStep] 現在のステップ名:', SETUP_STEPS[currentStep]);
    console.log('[proceedToNextStep] 現在のsetupData:', setupData);
    
    if (currentStep < SETUP_STEPS.length - 1) {
      const nextStepIndex = currentStep + 1;
      const nextStep = SETUP_STEPS[nextStepIndex];
      console.log('[proceedToNextStep] 次のステップインデックス:', nextStepIndex);
      console.log('[proceedToNextStep] 次のステップ名:', nextStep);
      
      setCurrentStep(nextStepIndex);
      
      // 次のステップの質問を表示
      if (stepQuestions && stepQuestions[nextStepIndex]) {
        setTimeout(() => {
          addAIMessage(stepQuestions[nextStepIndex]);
        }, 100);
      }
      console.log('[proceedToNextStep] ステップ変更完了:', nextStep);
    } else {
      console.log('[proceedToNextStep] 最終ステップに到達、セットアップを完了');
      completeSetup();
    }
  }, [currentStep, completeSetup, addAIMessage, setupData, stepQuestions]);

  // Handle text input (name, personality, style)
  const handleTextInput = useCallback((field: string, value: string) => {
    console.log('[handleTextInput] field:', field, 'value:', value, 'currentStep:', currentStep, 'SETUP_STEPS.length:', SETUP_STEPS.length);
    addUserMessage(value);
    
    // 状態を更新
    const updatedData = { ...setupData, [field]: value };
    setSetupData(updatedData);
    console.log('[handleTextInput] updatedData:', updatedData);
    
    // setStateの外でタイマーを設定
    setTimeout(() => {
      if (field === 'style') {
        console.log('[handleTextInput] styleフィールド検出 - セットアップを実行');
        completeSetupWithData(updatedData);
      } else {
        proceedToNextStep();
      }
    }, 500);
  }, [addUserMessage, proceedToNextStep, currentStep, completeSetupWithData, setupData]);

  // Handle date input
  const handleDateInput = useCallback((data: BirthDateData) => {
    console.log('[handleDateInput] data:', data);
    const dateString = `${data.year}年${data.month}月${data.day}日`;
    addUserMessage(dateString);
    
    const formattedDate = `${data.year}-${data.month.toString().padStart(2, '0')}-${data.day.toString().padStart(2, '0')}`;
    console.log('[handleDateInput] formattedDate:', formattedDate);
    
    // 状態を更新
    const updated = { ...setupData, birthDate: formattedDate };
    setSetupData(updated);
    console.log('[handleDateInput] updated setupData:', updated);
    
    // setStateの外でタイマーを設定
    setTimeout(() => {
      console.log('[handleDateInput] 状態更新完了後、次のステップへ進む');
      proceedToNextStep();
    }, 500);
  }, [addUserMessage, proceedToNextStep, setupData]);

  // Handle place input
  const handlePlaceInput = useCallback((data: BirthPlaceData) => {
    console.log('[handlePlaceInput] data:', data);
    addUserMessage(data.location);
    
    // 状態を更新
    const updated = { ...setupData, birthPlace: data.location };
    setSetupData(updated);
    console.log('[handlePlaceInput] updated setupData:', updated);
    
    // setStateの外でタイマーを設定
    setTimeout(() => {
      console.log('[handlePlaceInput] 状態更新完了後、次のステップへ進む');
      proceedToNextStep();
    }, 500);
  }, [addUserMessage, proceedToNextStep, setupData]);

  // Handle time input
  const handleTimeInput = useCallback((data: BirthTimeData) => {
    console.log('[handleTimeInput] data:', data);
    
    let updated;
    if (!data.hasTime) {
      addUserMessage('わからない');
      updated = { ...setupData, birthTime: null };
      console.log('[handleTimeInput] updated setupData (no time):', updated);
    } else {
      const timeString = `${data.hour!.toString().padStart(2, '0')}:${data.minute!.toString().padStart(2, '0')}`;
      addUserMessage(timeString);
      updated = { ...setupData, birthTime: timeString };
      console.log('[handleTimeInput] updated setupData (with time):', updated);
    }
    
    // 状態を更新
    setSetupData(updated);
    
    // setStateの外でタイマーを設定
    setTimeout(() => {
      console.log('[handleTimeInput] 状態更新完了後、次のステップへ進む');
      proceedToNextStep();
    }, 500);
  }, [addUserMessage, proceedToNextStep, setupData]);

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