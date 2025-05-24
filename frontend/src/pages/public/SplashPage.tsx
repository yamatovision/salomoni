import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { ROUTES } from '../../routes/routes';

// P-001: スプラッシュページ
export const SplashPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1.5秒後にオンボーディング画面へ遷移
    const timer = setTimeout(() => {
      navigate(ROUTES.public.onboarding);
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #F26A8D 0%, #FF8FA3 50%, #FFB3C6 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景装飾 */}
      <Box sx={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}>
        <Box
          sx={{
            position: 'absolute',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            top: '20%',
            left: '10%',
            animation: 'float 6s ease-in-out infinite',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            top: '60%',
            right: '15%',
            animation: 'float 6s ease-in-out infinite',
            animationDelay: '2s',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            bottom: '30%',
            left: '20%',
            animation: 'float 6s ease-in-out infinite',
            animationDelay: '4s',
          }}
        />
      </Box>

      {/* メインロゴコンテナ */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          animation: 'fadeInUp 1s ease-out',
        }}
      >
        {/* Sロゴ */}
        <Typography
          sx={{
            fontSize: { xs: 100, sm: 120, md: 140 },
            fontWeight: 200,
            color: 'white',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            mb: 1,
            lineHeight: 1,
            letterSpacing: '-5px',
            '&::after': {
              content: '"."',
              color: 'white',
              fontWeight: 400,
            },
          }}
        >
          S
        </Typography>

        {/* SALOMONIテキスト */}
        <Typography
          sx={{
            color: 'white',
            fontSize: { xs: 20, sm: 24, md: 28 },
            fontWeight: 300,
            letterSpacing: 3,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            mb: 0.5,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          }}
        >
          SALOMONI
        </Typography>

        {/* サロモニ (ひらがな) */}
        <Typography
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: { xs: 12, sm: 14, md: 16 },
            fontWeight: 300,
            letterSpacing: 1,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          }}
        >
          サロモニ
        </Typography>
      </Box>

      {/* プログレスインジケーター */}
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: 60, sm: 80 },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[0, 0.3, 0.6].map((delay, index) => (
            <Box
              key={index}
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.4)',
                animation: `pulse 1.5s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          ))}
        </Box>
      </Box>

      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
              opacity: 0.3;
            }
            50% {
              transform: translateY(-20px);
              opacity: 0.6;
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 0.4;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
            }
          }
        `}
      </style>
    </Box>
  );
};