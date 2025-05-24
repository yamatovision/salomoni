import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Button } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { ROUTES } from '../../routes/routes';

// P-002: オンボーディングページ
export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const slides = [
    {
      id: 1,
      background: 'linear-gradient(135deg, #F26A8D 0%, #f472b6 100%)',
      color: 'white',
      icon: '✨',
      logo: 'S.',
      logoSubtitle: 'SALOMONI',
      title: '毎日、あなたのための\nパートナーがここに',
      subtitle: '忙しいスタイリストのあなたに\n寄り添う特別な存在',
      showHeart: true,
    },
    {
      id: 2,
      background: 'linear-gradient(135deg, #D1EAE2 0%, #a7f3d0 100%)',
      color: '#064e3b',
      visual: 'connection',
      title: 'AIがあなたの\nモチベーションを\n読み取りサポート',
      subtitle: '毎日の気持ちを理解して\n最適なアドバイスを提供',
    },
    {
      id: 3,
      background: 'linear-gradient(135deg, #C4C3D5 0%, #e2e8f0 100%)',
      color: '#334155',
      visual: 'naming',
      title: '一緒に名前をつける\nところから、\n物語が始まります',
      subtitle: 'あなただけの特別なパートナーを\n一緒に育てていきましょう',
    },
  ];

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate(ROUTES.public.login);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    navigate(ROUTES.public.login);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleMouseStart = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
  };

  const handleMouseEnd = (e: React.MouseEvent) => {
    touchEndX.current = e.clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && currentSlide < totalSlides - 1) {
        handleNext();
      } else if (diff < 0 && currentSlide > 0) {
        handlePrev();
      }
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseStart}
      onMouseUp={handleMouseEnd}
      sx={{
        minHeight: '100vh',
        background: currentSlideData.background,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        color: currentSlideData.color,
      }}
    >
      {/* メインコンテンツ */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          textAlign: 'center',
        }}
      >
        {/* スライド1: ロゴとアイコン */}
        {currentSlide === 0 && (
          <>
            <Typography
              sx={{
                fontSize: '36px',
                fontWeight: 700,
                mb: 1,
                letterSpacing: 2,
              }}
            >
              {currentSlideData.logo}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                mb: 4,
                letterSpacing: 1,
                opacity: 0.8,
              }}
            >
              {currentSlideData.logoSubtitle}
            </Typography>
            <Box
              sx={{
                width: 120,
                height: 120,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                border: '4px solid rgba(255,255,255,0.3)',
                position: 'relative',
                mb: 4,
              }}
            >
              {currentSlideData.icon}
              {currentSlideData.showHeart && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    fontSize: '24px',
                    animation: 'heartbeat 2s infinite',
                  }}
                >
                  💕
                </Box>
              )}
            </Box>
          </>
        )}

        {/* スライド2: AI接続ビジュアル */}
        {currentSlide === 1 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 5,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(6, 78, 59, 0.1)',
                border: '3px solid rgba(6, 78, 59, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              👩‍💼
            </Box>
            <Box
              sx={{
                flex: 1,
                height: 3,
                background: 'linear-gradient(90deg, #064e3b 0%, #F26A8D 100%)',
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                  animation: 'flow 2s infinite',
                },
              }}
            />
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(242, 106, 141, 0.2)',
                border: '3px solid rgba(242, 106, 141, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              ✨
            </Box>
          </Box>
        )}

        {/* スライド3: ネーミングビジュアル */}
        {currentSlide === 2 && (
          <Box sx={{ mb: 5 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                background: 'rgba(242, 106, 141, 0.1)',
                border: '3px dashed #F26A8D',
                borderRadius: '50%',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                animation: 'pulse 3s infinite',
              }}
            >
              ?
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              {['Mika', 'Ruka', 'Yui'].map((name, index) => (
                <Box
                  key={name}
                  sx={{
                    background: 'white',
                    px: 2,
                    py: 1,
                    borderRadius: '20px',
                    fontSize: '14px',
                    color: '#F26A8D',
                    fontWeight: 500,
                    border: '2px solid #F26A8D',
                    animation: `float 2s infinite ease-in-out`,
                    animationDelay: `${index * 0.5}s`,
                  }}
                >
                  {name}
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* タイトルとサブタイトル */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 2,
            lineHeight: 1.3,
            whiteSpace: 'pre-line',
          }}
        >
          {currentSlideData.title}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            opacity: 0.9,
            lineHeight: 1.6,
            whiteSpace: 'pre-line',
          }}
        >
          {currentSlideData.subtitle}
        </Typography>

        {/* スワイプヒント（最初のスライドのみ） */}
        {currentSlide === 0 && (
          <Typography
            sx={{
              position: 'absolute',
              bottom: 180,
              color: 'rgba(255,255,255,0.6)',
              fontSize: '14px',
              animation: 'fadeInOut 3s infinite',
            }}
          >
            ← スワイプしてみて
          </Typography>
        )}
      </Box>

      {/* ナビゲーションドット */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 120,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1.5,
        }}
      >
        {slides.map((_, index) => (
          <Box
            key={index}
            onClick={() => setCurrentSlide(index)}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: currentSlide === index
                ? currentSlideData.color
                : `${currentSlideData.color}33`,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: currentSlide === index ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
      </Box>

      {/* 下部アクション */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 40,
          left: 0,
          right: 0,
          px: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Button
          onClick={handleSkip}
          sx={{
            color: `${currentSlideData.color}99`,
            fontSize: '16px',
            '&:hover': {
              backgroundColor: 'transparent',
              color: currentSlideData.color,
            },
          }}
        >
          スキップ
        </Button>
        
        <Button
          onClick={handleNext}
          variant={currentSlide === totalSlides - 1 ? 'contained' : 'outlined'}
          sx={currentSlide === totalSlides - 1 ? {
            background: '#F26A8D',
            color: 'white',
            borderRadius: '30px',
            px: 4,
            py: 1.5,
            fontSize: '18px',
            fontWeight: 700,
            boxShadow: '0 6px 20px rgba(242, 106, 141, 0.4)',
            '&:hover': {
              background: '#e11d48',
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 25px rgba(242, 106, 141, 0.5)',
            },
          } : {
            borderColor: `${currentSlideData.color}33`,
            color: currentSlideData.color,
            borderRadius: '30px',
            px: 3,
            py: 1.5,
            fontSize: '16px',
            fontWeight: 600,
            background: `${currentSlideData.color}11`,
            '&:hover': {
              borderColor: `${currentSlideData.color}55`,
              background: `${currentSlideData.color}22`,
            },
          }}
        >
          {currentSlide === totalSlides - 1 ? 'はじめる' : '次へ'}
        </Button>
      </Box>

      {/* 矢印ナビゲーション（デスクトップ用） */}
      {currentSlide > 0 && (
        <IconButton
          onClick={handlePrev}
          sx={{
            position: 'absolute',
            left: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            color: currentSlideData.color,
            display: { xs: 'none', md: 'flex' },
          }}
        >
          <KeyboardArrowLeft fontSize="large" />
        </IconButton>
      )}
      {currentSlide < totalSlides - 1 && (
        <IconButton
          onClick={handleNext}
          sx={{
            position: 'absolute',
            right: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            color: currentSlideData.color,
            display: { xs: 'none', md: 'flex' },
          }}
        >
          <KeyboardArrowRight fontSize="large" />
        </IconButton>
      )}

      <style>
        {`
          @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }

          @keyframes flow {
            0% { left: -100%; }
            100% { left: 100%; }
          }

          @keyframes pulse {
            0%, 100% { 
              border-color: #F26A8D;
              box-shadow: 0 0 0 0 rgba(242, 106, 141, 0.4);
            }
            50% { 
              border-color: #f472b6;
              box-shadow: 0 0 0 20px rgba(242, 106, 141, 0);
            }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          @keyframes fadeInOut {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};