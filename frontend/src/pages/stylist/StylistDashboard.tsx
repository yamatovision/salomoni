import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Avatar,
  Paper,
  Chip,
  Button,
  useTheme,
  Grid,
} from '@mui/material';
import {
  WbSunny,
  ContentCut,
  Chat,
  Star,
  ColorLens,
  AutoAwesome,
  Favorite,
  Group,
  Refresh,
  Schedule,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { logger } from '../../utils/logger';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

// 簡易的な運勢カード型定義（実際のAPIレスポンスに合わせて調整）
interface SimpleFortuneCard {
  id: string;
  category: string;
  title: string;
  content: string;
  detail?: string;
  order: number;
}

interface FortuneCardProps {
  card: SimpleFortuneCard;
  icon: React.ReactElement;
  gradient: string;
}

const FortuneCard = ({ card, icon, gradient }: FortuneCardProps) => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Avatar
            sx={{
              background: gradient,
              width: 40,
              height: 40,
              mr: 1.5,
            }}
          >
            {icon}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {card.title}
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 1, lineHeight: 1.5, color: 'text.primary' }}>
          {card.content}
        </Typography>
        {card.detail && (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
            {card.detail}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export const StylistDashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const {  } = useApi();
  const [loading, setLoading] = useState(true);
  const [fortuneCards, setFortuneCards] = useState<SimpleFortuneCard[]>([]);
  const [compatibleStylists, setCompatibleStylists] = useState<string[]>([]);

  useEffect(() => {
    fetchDailyFortune();
  }, []);

  const fetchDailyFortune = async () => {
    try {
      logger.info('Fetching daily fortune', {
        component: 'StylistDashboard',
        action: 'fetchDailyFortune',
      });

      setLoading(true);

      // TODO: 実際のAPIコールに置き換える
      const mockCards: SimpleFortuneCard[] = [
        {
          id: '1',
          category: 'general',
          title: '今日の運勢',
          content: '新しいスタイルへの挑戦が吉。お客様の隠れた魅力を引き出すチャンスです。',
          detail: '午後2時〜4時が特にクリエイティブな時間帯。大胆な提案をしてみましょう。',
          order: 1,
        },
        {
          id: '2',
          category: 'work',
          title: '仕事運',
          content: 'カウンセリング力が冴える日。お客様の本音を引き出せそう。',
          detail: '聞き上手になることで、リピート率アップのきっかけが掴めます。',
          order: 2,
        },
        {
          id: '3',
          category: 'communication',
          title: 'お客様との会話',
          content: '季節の変わり目の話題で盛り上がりそう。ヘアケアアドバイスも◎',
          detail: '髪質改善の提案が特に響きやすい日です。',
          order: 3,
        },
        {
          id: '4',
          category: 'focus',
          title: '今日の集中ポイント',
          content: 'カラーリングの提案が成功しやすい日。トレンドカラーをプッシュ！',
          detail: 'ハイライトやインナーカラーなど、遊び心のある提案が吉。',
          order: 4,
        },
        {
          id: '5',
          category: 'style',
          title: 'ラッキースタイリング',
          content: 'ウェーブスタイルが幸運を呼びます。パーマ提案のチャンス！',
          detail: '柔らかい質感の仕上がりを意識すると、お客様の満足度UP。',
          order: 5,
        },
        {
          id: '6',
          category: 'special',
          title: 'スペシャルアドバイス',
          content: '直感を信じて。ひらめいたアイデアは必ずメモを取りましょう。',
          detail: '新メニューや新技術のアイデアが湧きやすい日です。',
          order: 6,
        },
        {
          id: '7',
          category: 'self-care',
          title: 'セルフケア',
          content: '立ち仕事の疲れに注意。こまめなストレッチを心がけて。',
          detail: '特に腰と肩のケアを。施術の合間に軽い運動を。',
          order: 7,
        },
      ];

      const mockCompatible = ['田中さん', '佐藤さん', '山田さん'];

      setFortuneCards(mockCards);
      setCompatibleStylists(mockCompatible);

      logger.info('Daily fortune fetched successfully', {
        component: 'StylistDashboard',
        action: 'fetchDailyFortune',
        cardCount: mockCards.length,
      });
    } catch (error) {
      logger.error('Failed to fetch daily fortune', error as Error, {
        component: 'StylistDashboard',
        action: 'fetchDailyFortune',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchDailyFortune();
  };

  const getCardIcon = (category: string) => {
    const icons: Record<string, React.ReactElement> = {
      general: <WbSunny sx={{ fontSize: 20 }} />,
      work: <ContentCut sx={{ fontSize: 20 }} />,
      communication: <Chat sx={{ fontSize: 20 }} />,
      focus: <Star sx={{ fontSize: 20 }} />,
      style: <ColorLens sx={{ fontSize: 20 }} />,
      special: <AutoAwesome sx={{ fontSize: 20 }} />,
      'self-care': <Favorite sx={{ fontSize: 20 }} />,
    };
    return icons[category] || <Star sx={{ fontSize: 20 }} />;
  };

  const getCardGradient = (category: string) => {
    const gradients: Record<string, string> = {
      general: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
      work: 'linear-gradient(135deg, #f59e0b, #d97706)',
      communication: 'linear-gradient(135deg, #10b981, #059669)',
      focus: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      style: 'linear-gradient(135deg, #ec4899, #db2777)',
      special: 'linear-gradient(135deg, #f97316, #ea580c)',
      'self-care': 'linear-gradient(135deg, #06b6d4, #0891b2)',
    };
    return gradients[category] || 'linear-gradient(135deg, #60a5fa, #3b82f6)';
  };

  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* ヘッダー */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #F26A8D 0%, #f472b6 100%)',
          color: 'white',
          pt: 3,
          pb: 5,
          px: 2,
          textAlign: 'center',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30px',
            background: theme.palette.background.default,
            borderRadius: '30px 30px 0 0',
          },
        }}
      >
        <Avatar
          sx={{
            width: 60,
            height: 60,
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: '3px solid rgba(255,255,255,0.3)',
            margin: '0 auto',
            mb: 2,
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          {user?.aiCharacterId ? 'AI' : '✨'}
        </Avatar>
        <Typography variant="body1" sx={{ opacity: 0.9, mb: 0.5 }}>
          {user?.name}さんのAIパートナー
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
          {dateString}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          今日のアドバイス
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.4 }}>
          新しい一日の始まり。今日も素敵な笑顔で頑張りましょう！
        </Typography>
      </Box>

      {/* メインコンテンツ */}
      <Box sx={{ px: 2, pt: 5, pb: 3 }}>
        {/* 相性の良いスタイリスト */}
        <Paper
          sx={{
            background: 'linear-gradient(135deg, #F26A8D 0%, #f472b6 100%)',
            color: 'white',
            p: 2.5,
            mb: 3,
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Avatar
              sx={{
                background: 'rgba(255,255,255,0.2)',
                width: 40,
                height: 40,
                mr: 1.5,
              }}
            >
              <Group sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              相性の良いスタイリスト
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.5 }}>
            今日のあなたと特に相性が良いメンバーです
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {compatibleStylists.map((stylist, index) => (
              <Chip
                key={index}
                label={stylist}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                }}
              />
            ))}
          </Box>
        </Paper>

        {/* アドバイスカード */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            本日のアドバイス
          </Typography>
          <IconButton onClick={handleRefresh} color="primary">
            <Refresh />
          </IconButton>
        </Box>

        <Grid container spacing={2}>
          {fortuneCards.map((card) => (
            <Grid key={card.id} size={12}>
              <FortuneCard
                card={card}
                icon={getCardIcon(card.category)}
                gradient={getCardGradient(card.category)}
              />
            </Grid>
          ))}
        </Grid>

        {/* アクションボタン */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Schedule />}
            sx={{ py: 1.5 }}
          >
            本日の予約確認
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Chat />}
            sx={{ py: 1.5 }}
          >
            AIに相談
          </Button>
        </Box>
      </Box>
    </Box>
  );
};