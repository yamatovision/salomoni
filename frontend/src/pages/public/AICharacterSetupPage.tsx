import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Fade,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { WelcomeCard } from '../../components/features/ai-character-setup/WelcomeCard';
import { StepIndicator } from '../../components/features/ai-character-setup/StepIndicator';
import { ChatInterface } from '../../components/features/ai-character-setup/ChatInterface';
import { BirthDateForm } from '../../components/features/ai-character-setup/forms/BirthDateForm';
import { BirthPlaceForm } from '../../components/features/ai-character-setup/forms/BirthPlaceForm';
import { BirthTimeForm } from '../../components/features/ai-character-setup/forms/BirthTimeForm';
import { useAICharacterSetup } from '../../hooks/useAICharacterSetup';
import { useAuth } from '../../hooks/useAuth';
import type { SetupStep } from '../../components/features/ai-character-setup/types';

const AICharacterSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId?: string }>();
  const { hasAICharacter, checkingAICharacter } = useAuth();
  const {
    currentStep,
    setupData,
    messages,
    isProcessing,
    startSetup,
    handleTextInput,
    handleDateInput,
    handlePlaceInput,
    handleTimeInput,
  } = useAICharacterSetup(clientId);

  const [inputValue, setInputValue] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const steps: SetupStep[] = [
    {
      id: 'name',
      title: 'ステップ 1/6',
      question: 'まず、AIアシスタントにどんな名前をつけたいですか？\n\n例：「さくら」「アドバイザー田中」「ミミ」など、お好きな名前をどうぞ！',
      placeholder: '名前を入力してください...',
      inputType: 'text',
    },
    {
      id: 'birthdate',
      title: 'ステップ 2/6',
      question: 'より正確なアドバイスのために、あなたの生年月日を教えてください',
      inputType: 'date',
    },
    {
      id: 'birthplace',
      title: 'ステップ 3/6',
      question: '出生地を教えてください',
      inputType: 'place',
    },
    {
      id: 'birthtime',
      title: 'ステップ 4/6',
      question: '出生時間がわかる場合は教えてください。より詳細で正確な分析が可能になります。\n\nわからない場合は「わからない」を選択してください',
      inputType: 'time',
    },
    {
      id: 'personality',
      title: 'ステップ 5/6',
      question: 'どんな性格のアドバイザーがお好みですか？\n\n例：「優しくて親しみやすい人」「プロフェッショナルで詳しく教えてくれる人」「励ましながら背中を押してくれる人」',
      placeholder: 'どんな性格が良いか教えてください...',
      inputType: 'text',
    },
    {
      id: 'style',
      title: 'ステップ 6/6',
      question: 'どんなアドバイススタイルをお求めですか？\n\n例：「詳しく丁寧に」「励ましながら」「簡潔に要点だけ」「実用的なアドバイス重視」',
      placeholder: 'どんなスタイルが良いか教えてください...',
      inputType: 'text',
    },
  ];
  
  console.log('[AICharacterSetupPage] 現在のステップ:', currentStep, 'ステップID:', steps[currentStep]?.id);
  console.log('[AICharacterSetupPage] hasAICharacter:', hasAICharacter, 'checkingAICharacter:', checkingAICharacter);

  // AIキャラクターが既に設定されている場合はリダイレクト（クライアント用を除く）
  useEffect(() => {
    if (!clientId && !checkingAICharacter && hasAICharacter) {
      console.log('[AICharacterSetupPage] AIキャラクター設定済み - ダッシュボードへリダイレクト');
      navigate('/dashboard');
    }
  }, [hasAICharacter, checkingAICharacter, navigate, clientId]);

  useEffect(() => {
    // スクロール制御
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleStart = () => {
    setShowWelcome(false);
    startSetup();
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isProcessing) return;

    const currentStepData = steps[currentStep];
    if (currentStepData.inputType === 'text') {
      handleTextInput(currentStepData.id, inputValue);
      setInputValue('');
    }
  };

  const renderInputArea = () => {
    const currentStepData = steps[currentStep];

    switch (currentStepData.inputType) {
      case 'text':
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={currentStepData.placeholder}
              disabled={isProcessing}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&.Mui-focused fieldset': {
                    borderColor: '#E298A4',
                  },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing}
              sx={{
                bgcolor: '#E298A4',
                color: 'white',
                borderRadius: 2,
                px: 3,
                py: 1.5,
                boxShadow: '0 4px 12px rgba(226, 152, 164, 0.3)',
                '&:hover': {
                  bgcolor: '#D186A4',
                  transform: 'scale(1.05)',
                  boxShadow: '0 6px 20px rgba(226, 152, 164, 0.4)',
                },
                '&:disabled': {
                  bgcolor: '#ccc',
                },
              }}
            >
              送信
            </Button>
          </Box>
        );
      case 'date':
        return <BirthDateForm onSubmit={handleDateInput} />;
      case 'place':
        return <BirthPlaceForm onSubmit={handlePlaceInput} />;
      case 'time':
        return <BirthTimeForm onSubmit={handleTimeInput} />;
      default:
        return null;
    }
  };

  // AIキャラクターのチェック中はローディング表示
  if (checkingAICharacter) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)',
        }}
      >
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: '#374151',
            fontWeight: 500,
          }}
        >
          AIアシスタント作成
        </Typography>
        {!showWelcome && (
          <StepIndicator
            currentStep={currentStep}
            totalSteps={steps.length}
            stepTitle={steps[currentStep]?.title || ''}
          />
        )}
      </Box>

      {/* Main Content */}
      <Container
        maxWidth="md"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          py: 3,
          height: 'calc(100vh - 80px)',
        }}
      >
        {showWelcome ? (
          <WelcomeCard onStart={handleStart} />
        ) : (
          <>
            {/* Chat Area */}
            <Paper
              sx={{
                flex: 1,
                background: 'linear-gradient(180deg, #fafafa 0%, #f8fafc 100%)',
                borderRadius: 3,
                boxShadow: '0 4px 6px rgba(226, 152, 164, 0.1)',
                p: 2,
                mb: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <ChatInterface
                messages={messages}
                isProcessing={isProcessing}
              />
              <div ref={messagesEndRef} />
            </Paper>

            {/* Input Area */}
            {currentStep < steps.length && (
              <Fade in={true}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    boxShadow: '0 4px 6px rgba(226, 152, 164, 0.1)',
                    border: '1px solid rgba(226, 152, 164, 0.2)',
                    bgcolor: 'white',
                  }}
                >
                  {renderInputArea()}
                </Paper>
              </Fade>
            )}

            {/* Completion Card */}
            {currentStep >= steps.length && !isProcessing && (
              <Fade in={true}>
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #e0e7ff 100%)',
                    border: '1px solid rgba(226, 152, 164, 0.2)',
                    boxShadow: '0 6px 20px rgba(226, 152, 164, 0.15)',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
                    🎉 セットアップ完了！
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                    {setupData.name}があなたをお待ちしています
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => {
                      console.log('[AICharacterSetupPage] ダッシュボードへ移動');
                      window.location.href = '/dashboard';
                    }}
                    sx={{
                      bgcolor: '#F26A8D',
                      color: 'white',
                      borderRadius: 25,
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 15px rgba(242, 106, 141, 0.3)',
                      '&:hover': {
                        bgcolor: '#e11d48',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(242, 106, 141, 0.4)',
                      },
                    }}
                  >
                    チャットを開始
                  </Button>
                </Paper>
              </Fade>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default AICharacterSetupPage;