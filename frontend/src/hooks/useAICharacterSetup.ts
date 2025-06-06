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

export const useAICharacterSetup = (clientId?: string) => {
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
      
      // ステップに応じたAIメッセージを表示
      setTimeout(() => {
        if (nextStep === 'birthdate') {
          addAIMessage('より正確なアドバイスのために、あなたの生年月日を教えてください');
        } else if (nextStep === 'birthplace') {
          addAIMessage('出生地を教えてください');
        } else if (nextStep === 'birthtime') {
          addAIMessage('出生時間がわかる場合は教えてください。より詳細で正確な分析が可能になります。\n\nわからない場合は「わからない」を選択してください');
        } else if (nextStep === 'personality') {
          addAIMessage('どんな性格のアドバイザーがお好みですか？\n\n例：「優しくて親しみやすい人」「プロフェッショナルで詳しく教えてくれる人」「励ましながら背中を押してくれる人」');
        } else if (nextStep === 'style') {
          addAIMessage('どんなアドバイススタイルをお求めですか？\n\n例：「詳しく丁寧に」「励ましながら」「簡潔に要点だけ」「実用的なアドバイス重視」');
        }
      }, 100);
    } else {
      console.log('[proceedToNextStep] 最終ステップに到達、セットアップを完了');
      completeSetup();
    }
  }, [currentStep, completeSetup, addAIMessage, setupData]);

  // Handle text input (name, personality, style)
  const handleTextInput = useCallback((field: string, value: string) => {
    console.log('[handleTextInput] field:', field, 'value:', value, 'currentStep:', currentStep, 'SETUP_STEPS.length:', SETUP_STEPS.length);
    addUserMessage(value);
    setSetupData((prev) => {
      const updatedData = { ...prev, [field]: value };
      console.log('[handleTextInput] updatedData:', updatedData);
      
      // 最終ステップ（style）の場合、更新されたデータで即座にセットアップを完了
      // currentStepは0ベースなので、5が最終ステップ
      if (field === 'style') {
        console.log('[handleTextInput] styleフィールド検出 - セットアップを実行');
        setTimeout(() => {
          completeSetupWithData(updatedData);
        }, 500);
      } else {
        setTimeout(() => {
          proceedToNextStep();
        }, 500);
      }
      
      return updatedData;
    });
  }, [addUserMessage, proceedToNextStep, currentStep, completeSetupWithData]);

  // Handle date input
  const handleDateInput = useCallback((data: BirthDateData) => {
    console.log('[handleDateInput] data:', data);
    const dateString = `${data.year}年${data.month}月${data.day}日`;
    addUserMessage(dateString);
    
    const formattedDate = `${data.year}-${data.month.toString().padStart(2, '0')}-${data.day.toString().padStart(2, '0')}`;
    console.log('[handleDateInput] formattedDate:', formattedDate);
    
    // 状態更新を行い、更新後の値を使ってログ出力
    setSetupData((prev) => {
      const updated = { ...prev, birthDate: formattedDate };
      console.log('[handleDateInput] updated setupData:', updated);
      
      // 状態更新後に次のステップへ進む
      setTimeout(() => {
        console.log('[handleDateInput] 状態更新完了後、次のステップへ進む');
        proceedToNextStep();
      }, 500);
      
      return updated;
    });
  }, [addUserMessage, proceedToNextStep]);

  // Handle place input
  const handlePlaceInput = useCallback((data: BirthPlaceData) => {
    console.log('[handlePlaceInput] data:', data);
    addUserMessage(data.location);
    
    setSetupData((prev) => {
      const updated = { ...prev, birthPlace: data.location };
      console.log('[handlePlaceInput] updated setupData:', updated);
      
      // 状態更新後に次のステップへ進む
      setTimeout(() => {
        console.log('[handlePlaceInput] 状態更新完了後、次のステップへ進む');
        proceedToNextStep();
      }, 500);
      
      return updated;
    });
  }, [addUserMessage, proceedToNextStep]);

  // Handle time input
  const handleTimeInput = useCallback((data: BirthTimeData) => {
    console.log('[handleTimeInput] data:', data);
    
    if (!data.hasTime) {
      addUserMessage('わからない');
      setSetupData((prev) => {
        const updated = { ...prev, birthTime: null };
        console.log('[handleTimeInput] updated setupData (no time):', updated);
        
        // 状態更新後に次のステップへ進む
        setTimeout(() => {
          console.log('[handleTimeInput] 状態更新完了後、次のステップへ進む');
          proceedToNextStep();
        }, 500);
        
        return updated;
      });
    } else {
      const timeString = `${data.hour!.toString().padStart(2, '0')}:${data.minute!.toString().padStart(2, '0')}`;
      addUserMessage(timeString);
      setSetupData((prev) => {
        const updated = { ...prev, birthTime: timeString };
        console.log('[handleTimeInput] updated setupData (with time):', updated);
        
        // 状態更新後に次のステップへ進む
        setTimeout(() => {
          console.log('[handleTimeInput] 状態更新完了後、次のステップへ進む');
          proceedToNextStep();
        }, 500);
        
        return updated;
      });
    }
  }, [addUserMessage, proceedToNextStep]);

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