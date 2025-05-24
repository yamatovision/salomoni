import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Avatar,
  CircularProgress,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ja';

dayjs.locale('ja');
import { useAuth } from '../../hooks/useAuth';
import { UserStatus } from '../../types';

// P-004: 初回設定ページ
export const InitialSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, completeInitialSetup } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [birthDate, setBirthDate] = useState<Dayjs | null>(null);
  const [aiName, setAiName] = useState('');
  const [showPersonality, setShowPersonality] = useState(false);
  const [typing, setTyping] = useState(false);

  // 初期設定が完了している場合はリダイレクト
  useEffect(() => {
    if (user && user.status === UserStatus.ACTIVE) {
      navigate('/stylist/dashboard');
    }
  }, [user, navigate]);

  const handleBirthdaySubmit = async () => {
    if (!birthDate) return;

    setLoading(true);
    setTyping(true);

    // AIの分析演出
    setTimeout(() => {
      setTyping(false);
      setShowPersonality(true);
      setStep(1);
      setLoading(false);
    }, 2000);
  };

  const handleNameSubmit = async () => {
    if (!aiName.trim() || !birthDate) return;

    setLoading(true);
    try {
      await completeInitialSetup({
        birthDate: birthDate.toISOString(),
        aiCharacterName: aiName,
      });
      // 成功時はダッシュボードへ
      navigate('/stylist/dashboard');
    } catch (error) {
      console.error('初期設定エラー:', error);
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        background: 'white',
      }}
    >
        {/* ヘッダー */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #F26A8D 0%, #f472b6 100%)',
            pt: 4,
            pb: 6,
            textAlign: 'center',
            color: 'white',
            position: 'relative',
          }}
        >
          <Avatar
            sx={{
              width: 60,
              height: 60,
              bgcolor: 'rgba(255,255,255,0.2)',
              margin: '0 auto',
              mb: 2,
              fontSize: '1.5rem',
              border: '3px solid rgba(255,255,255,0.3)',
            }}
          >
            ✨
          </Avatar>
          <Typography variant="h6" fontWeight={600}>
            {step === 0 ? '???' : aiName || 'まだ名前がないパートナー'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {step === 0 ? 'まだ名前がないパートナー' : 'あなた専属のAIパートナー'}
          </Typography>

          {/* 波形の装飾 */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 20,
              background: 'white',
              borderRadius: '20px 20px 0 0',
            }}
          />
        </Box>

        {/* コンテンツ */}
        <Container maxWidth="sm" sx={{ pt: 4, pb: 12 }}>
          {step === 0 ? (
            // Step 1: 生年月日入力
            <>
              <Box
                sx={{
                  background: '#f8fafc',
                  borderRadius: '20px',
                  p: 3,
                  mb: 3,
                  position: 'relative',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 20,
                    left: -10,
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: '10px 10px 10px 0',
                    borderColor: 'transparent #f8fafc transparent transparent',
                  },
                }}
              >
                <Typography variant="body1" paragraph>
                  はじめまして！✨
                  <br />
                  私、まだ名前がないの。
                </Typography>
                <Typography variant="body1">
                  あなたと一緒に決めたいな。
                  <br />
                  その前に、あなたのことを
                  <br />
                  教えてくれる？
                </Typography>
              </Box>

              <Box
                sx={{
                  background: 'white',
                  borderRadius: '15px',
                  p: 3,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 15px rgba(242, 106, 141, 0.1)',
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color="primary"
                  textAlign="center"
                  mb={2}
                >
                  生年月日は？
                </Typography>

                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
                  <DatePicker
                    value={birthDate}
                    onChange={setBirthDate}
                    format="YYYY年MM月DD日"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                            '&.Mui-focused fieldset': {
                              borderColor: 'primary.main',
                            },
                          },
                        },
                      },
                    }}
                    disabled={loading}
                  />
                </LocalizationProvider>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleBirthdaySubmit}
                  disabled={!birthDate || loading}
                  sx={{ mt: 3, borderRadius: '25px' }}
                >
                  {loading ? <CircularProgress size={24} /> : '教える'}
                </Button>
              </Box>

              {typing && (
                <Box
                  sx={{
                    mt: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      bgcolor: 'primary.main',
                      borderRadius: '50%',
                      animation: 'typing 1.4s infinite ease-in-out',
                      animationDelay: '-0.32s',
                    }}
                  />
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      bgcolor: 'primary.main',
                      borderRadius: '50%',
                      animation: 'typing 1.4s infinite ease-in-out',
                      animationDelay: '-0.16s',
                    }}
                  />
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      bgcolor: 'primary.main',
                      borderRadius: '50%',
                      animation: 'typing 1.4s infinite ease-in-out',
                    }}
                  />
                </Box>
              )}
            </>
          ) : (
            // Step 2: AIパートナー名前決定
            <>
              {showPersonality && (
                <Box
                  sx={{
                    background: '#f0fdf4',
                    borderRadius: '20px',
                    p: 3,
                    mb: 3,
                    borderLeft: '4px solid #22c55e',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography variant="body1" color="#15803d" paragraph>
                    うんうん、なるほど〜。😊
                    <br />
                    君はしっかり者の宝石みたいな人だね
                  </Typography>
                  <Chip
                    icon={<span>✨</span>}
                    label="安定感のある魅力"
                    sx={{
                      bgcolor: '#fef3c7',
                      color: '#92400e',
                      fontWeight: 500,
                    }}
                  />
                </Box>
              )}

              <Box
                sx={{
                  background: '#f8fafc',
                  borderRadius: '20px',
                  p: 3,
                  mb: 3,
                  position: 'relative',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                }}
              >
                <Typography variant="body1">
                  私の名前、一緒に決めてくれる？
                  <br />
                  あなたが呼びやすい名前がいいな。
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="AIパートナーの名前"
                value={aiName}
                onChange={(e) => setAiName(e.target.value)}
                placeholder="例: さくら、ゆき、あい など"
                disabled={loading}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                  },
                }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleNameSubmit}
                disabled={!aiName.trim() || loading}
                sx={{ borderRadius: '25px' }}
              >
                {loading ? <CircularProgress size={24} /> : '決定する'}
              </Button>
            </>
          )}
        </Container>

        <style>{`
          @keyframes typing {
            0%, 80%, 100% {
              transform: scale(0.8);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </Box>
  );
};