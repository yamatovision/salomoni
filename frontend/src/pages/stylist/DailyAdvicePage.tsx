import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  Avatar,
  Collapse,
  Stack,
  Fade,
  Zoom
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { 
  DailyAdviceData
} from '../../types';
import { FortuneCardCategory } from '../../types';
import { fortuneService } from '../../services';

// ページID: M-002

// スタイル付きコンポーネント
const HeaderBox = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
  padding: theme.spacing(3, 2, 5),
  textAlign: 'center',
  color: 'white',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30px',
    background: theme.palette.background.paper,
    borderRadius: '30px 30px 0 0',
  },
}));

const AIAvatar = styled(Avatar)(({ theme }) => ({
  width: 60,
  height: 60,
  backgroundColor: 'rgba(255,255,255,0.2)',
  border: '3px solid rgba(255,255,255,0.3)',
  margin: '0 auto',
  marginBottom: theme.spacing(2),
  fontSize: '24px',
}));

const FortuneCard = styled(Card)<{ expanded?: boolean }>(({ theme }) => ({
  borderRadius: '20px',
  padding: theme.spacing(2.5),
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  border: '1px solid #f1f5f9',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
  },
}));

const CardIcon = styled(Box)<{ gradient: { from: string; to: string } }>(({ gradient }) => ({
  width: 40,
  height: 40,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
  color: 'white',
  fontSize: '18px',
  marginRight: '12px',
}));

const PartnerCard = styled(FortuneCard)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
  color: 'white',
  border: 'none',
  '& .MuiTypography-root': {
    color: 'white',
  },
}));

const ExpandIcon = styled(ExpandMoreIcon)<{ expanded: boolean }>(({ expanded }) => ({
  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  transition: 'transform 0.3s',
}));

const DailyAdvicePage: React.FC = () => {
  const { user } = useAuth();
  const [adviceData, setAdviceData] = useState<DailyAdviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  console.log('[DailyAdvicePage] コンポーネント初期化', { 
    user, 
    currentPath: window.location.pathname,
    userRole: user?.role 
  });

  useEffect(() => {
    let mounted = true;
    
    // APIからデータを取得
    const loadAdviceData = async () => {
      console.log('[DailyAdvicePage] loadAdviceData - 開始', { userId: user?.id, mounted });
      try {
        if (!user?.id) {
          console.log('[DailyAdvicePage] loadAdviceData - ユーザーIDが無効');
          return;
        }
        
        if (!mounted) {
          console.log('[DailyAdvicePage] loadAdviceData - コンポーネントがアンマウントされています');
          return;
        }
        
        console.log('[DailyAdvicePage] loadAdviceData - API呼び出し前');
        const advice = await fortuneService.getDailyAdvice(user.id);
        console.log('[DailyAdvicePage] loadAdviceData - API呼び出し成功', advice);
        
        if (mounted) {
          setAdviceData(advice);
        }
      } catch (error: any) {
        console.error('[DailyAdvicePage] loadAdviceData - エラー発生:', {
          error,
          status: error?.response?.status,
          code: error?.response?.data?.code,
          message: error?.response?.data?.message
        });
        // エラーが発生してもリダイレクトは行わない
        // RoleBasedRedirectがAIキャラクターのチェックとリダイレクトを担当する
      } finally {
        console.log('[DailyAdvicePage] loadAdviceData - 完了', { mounted });
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAdviceData();
    
    // クリーンアップ関数
    return () => {
      mounted = false;
      console.log('[DailyAdvicePage] useEffect - クリーンアップ');
    };
  }, [user?.id]);

  const handleCardClick = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return dateObj.toLocaleDateString('ja-JP', options);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!adviceData) {
    return (
      <Container>
        <Typography>データの読み込みに失敗しました</Typography>
      </Container>
    );
  }

  const compatibilityCard = adviceData.cards.find(
    card => card.category === FortuneCardCategory.COMPATIBILITY_STYLIST
  );
  const otherCards = adviceData.cards.filter(
    card => card.category !== FortuneCardCategory.COMPATIBILITY_STYLIST
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* ヘッダー */}
        <HeaderBox>
          <Zoom in timeout={600}>
            <AIAvatar>{adviceData.aiCharacterAvatar || 'R'}</AIAvatar>
          </Zoom>
          <Fade in timeout={800}>
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                {adviceData.aiCharacterName}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                {formatDate(adviceData.date)}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                今日のアドバイス
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {adviceData.greetingMessage}
              </Typography>
            </Box>
          </Fade>
        </HeaderBox>

        {/* メインコンテンツ */}
        <Container sx={{ pt: 5, pb: 10, position: 'relative', zIndex: 1 }}>
          <Stack spacing={2}>
            {/* 通常のアドバイスカード */}
            {otherCards.map((card, index) => (
              <Fade in timeout={1000 + index * 100} key={card.id}>
                <FortuneCard
                  expanded={expandedCards.has(card.id)}
                  onClick={() => handleCardClick(card.id)}
                >
                  <Box display="flex" alignItems="center" mb={1}>
                    <CardIcon gradient={card.gradientColors || { from: '#ccc', to: '#999' }}>
                      {card.icon}
                    </CardIcon>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {card.title}
                      </Typography>
                    </Box>
                    <ExpandIcon expanded={expandedCards.has(card.id)} />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {card.shortAdvice}
                  </Typography>
                  
                  <Collapse in={expandedCards.has(card.id)}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mt: 1, lineHeight: 1.6 }}
                    >
                      {card.detailAdvice}
                    </Typography>
                  </Collapse>
                </FortuneCard>
              </Fade>
            ))}

            {/* 相性の良いスタイリストカード */}
            {compatibilityCard && adviceData.compatibleStylist && (
              <Fade in timeout={1800}>
                <PartnerCard>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CardIcon gradient={compatibilityCard.gradientColors || { from: '#F26A8D', to: '#e11d48' }}>
                      {compatibilityCard.icon}
                    </CardIcon>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {compatibilityCard.title}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="h6" fontWeight={700} mb={0.5}>
                    {adviceData.compatibleStylist.stylistName}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    {[...Array(5)].map((_, i) => (
                      <Typography
                        key={i}
                        component="span"
                        sx={{ 
                          color: i < adviceData.compatibleStylist!.compatibilityScore 
                            ? 'white' 
                            : 'rgba(255,255,255,0.3)',
                          fontSize: '16px'
                        }}
                      >
                        ★
                      </Typography>
                    ))}
                    <Typography variant="body2" sx={{ ml: 1, opacity: 0.9 }}>
                      相性度
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                    {adviceData.compatibleStylist.reason}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {adviceData.compatibleStylist.collaborationAdvice}
                  </Typography>
                </PartnerCard>
              </Fade>
            )}
          </Stack>
          
        </Container>
      </Box>
  );
};

export default DailyAdvicePage;