import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  Avatar,
  IconButton,
  Collapse,
  Stack,
  Chip,
  Button,
  Divider,
  Fade,
  CircularProgress,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as AccessTimeIcon,
  Stars as StarsIcon,
  ChatBubble as ChatBubbleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { DailyClientDisplay } from '../../types';
import { mockDailyClientDisplays } from '../../services/mock/data/mockClients';
import { ROUTES } from '../../routes/routes';

// ページID: M-004

// スタイル付きコンポーネント
const PageContainer = styled(Box)(() => ({
  minHeight: '100vh',
  background: '#fafafa',
}));

const Header = styled(AppBar)(({ theme }) => ({
  background: theme.palette.primary.main,
  boxShadow: '0 2px 12px rgba(242, 106, 141, 0.15)',
}));

const SummaryCards = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(3),
}));

const StatCard = styled(Card)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  borderRadius: 16,
  textAlign: 'center',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  border: '1px solid #f5f5f5',
}));

const ClientCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  marginBottom: theme.spacing(1.5),
  overflow: 'hidden',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
  },
}));

const ClientAvatar = styled(Avatar)(({ theme }) => ({
  width: 45,
  height: 45,
  backgroundColor: theme.palette.primary.main,
  fontWeight: 500,
  fontSize: '1.1rem',
  boxShadow: '0 2px 8px rgba(242, 106, 141, 0.25)',
}));

const CompatibilityBadge = styled(Chip)<{ level: 'excellent' | 'good' | 'average' }>(({ theme, level }) => ({
  fontWeight: 500,
  fontSize: '0.8rem',
  '& .MuiChip-icon': {
    fontSize: '0.9rem',
  },
  ...(level === 'excellent' && {
    backgroundColor: theme.palette.primary.main,
    color: 'white',
  }),
  ...(level === 'good' && {
    backgroundColor: 'rgba(242, 106, 141, 0.6)',
    color: 'white',
  }),
  ...(level === 'average' && {
    backgroundColor: 'rgba(242, 106, 141, 0.3)',
    color: theme.palette.text.primary,
  }),
}));

const ActionButton = styled(Button)(() => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.875rem',
}));

const TodayClientsPage: React.FC = () => {
  const { } = useAuth();
  const navigate = useNavigate();
  const [clientDisplays, setClientDisplays] = useState<DailyClientDisplay[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // モックデータを読み込み
    const loadClientData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        setClientDisplays(mockDailyClientDisplays);
      } catch (error) {
        console.error('Failed to load client data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClientData();
  }, []);

  const handleCardToggle = (appointmentId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateRange = (start: Date, duration: number) => {
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const todayDate = new Date();
  const completedCount = clientDisplays.filter(cd => 
    cd.appointment.status === 'completed'
  ).length;

  return (
    <PageContainer>
        {/* ヘッダー */}
        <Header position="static">
          <Toolbar>
            <Box flex={1}>
              <Typography variant="h6" fontWeight={500}>
                今日のお客様
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {todayDate.toLocaleDateString('ja-JP', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </Typography>
            </Box>
          </Toolbar>
        </Header>

        {/* メインコンテンツ */}
        <Container sx={{ pt: 3, pb: 10 }}>
          {/* サマリー統計 */}
          <SummaryCards>
            <StatCard>
              <Typography
                variant="h4"
                color="primary"
                fontWeight={600}
                mb={0.5}
              >
                {clientDisplays.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                予約数
              </Typography>
            </StatCard>
            
            <StatCard>
              <Typography
                variant="h4"
                color="primary"
                fontWeight={600}
                mb={0.5}
              >
                {completedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                完了
              </Typography>
            </StatCard>
            
            <StatCard>
              <Typography
                variant="h4"
                color="primary"
                fontWeight={600}
                mb={0.5}
              >
                {clientDisplays.filter(cd => cd.isFirstVisit).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                新規
              </Typography>
            </StatCard>
          </SummaryCards>

          {/* クライアントリスト */}
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={500}
              mb={2}
              display="flex"
              alignItems="center"
              gap={1}
            >
              <AccessTimeIcon color="primary" fontSize="small" />
              本日の予約
            </Typography>

            {clientDisplays.map((clientDisplay, index) => {
              const { appointment, client, compatibility } = clientDisplay;
              const isExpanded = expandedCards.has(appointment.id);

              return (
                <Fade in timeout={600 + index * 100} key={appointment.id}>
                  <ClientCard>
                    <Box
                      p={2}
                      onClick={() => handleCardToggle(appointment.id)}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <ClientAvatar>
                          {getInitials(client.name)}
                        </ClientAvatar>
                        
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight={500}>
                            {client.name}
                            {clientDisplay.isFirstVisit && (
                              <Chip
                                label="新規"
                                size="small"
                                color="primary"
                                sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                              />
                            )}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            display="flex"
                            alignItems="center"
                            gap={0.5}
                          >
                            <AccessTimeIcon fontSize="small" />
                            {formatDateRange(appointment.scheduledAt, appointment.duration)}
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                          <CompatibilityBadge
                            icon={<StarsIcon />}
                            label={`相性 ${compatibility.score}%`}
                            level={compatibility.level}
                            size="small"
                          />
                          <IconButton size="small">
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>

                    <Collapse in={isExpanded}>
                      <Divider />
                      <Box p={2} bgcolor="rgba(250, 250, 250, 0.5)">
                        {/* 詳細情報 */}
                        <Stack spacing={1.5} mb={2}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              施術内容
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {appointment.services.join('・')}
                            </Typography>
                          </Box>
                          
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              来店回数
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {client.visitCount}回目
                            </Typography>
                          </Box>
                          
                          {client.birthDate && (
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">
                                生年月日
                              </Typography>
                              <Typography variant="body2" fontWeight={500}>
                                {client.birthDate.toLocaleDateString('ja-JP')}
                              </Typography>
                            </Box>
                          )}
                          
                          {appointment.note && (
                            <Box>
                              <Typography variant="body2" color="text.secondary" mb={0.5}>
                                メモ
                              </Typography>
                              <Typography variant="body2">
                                {appointment.note}
                              </Typography>
                            </Box>
                          )}
                        </Stack>

                        {/* 相性アドバイス */}
                        {compatibility.advice && (
                          <Box
                            p={1.5}
                            bgcolor="rgba(242, 106, 141, 0.08)"
                            borderRadius={2}
                            mb={2}
                          >
                            <Typography variant="body2" color="primary" fontWeight={500} mb={0.5}>
                              相性アドバイス
                            </Typography>
                            <Typography variant="body2">
                              {compatibility.advice}
                            </Typography>
                          </Box>
                        )}

                        {/* アクションボタン */}
                        <Stack direction="row" spacing={1}>
                          <ActionButton
                            fullWidth
                            variant="contained"
                            color="primary"
                            startIcon={<ChatBubbleIcon />}
                            onClick={() => navigate(ROUTES.stylist.chat)}
                          >
                            スタイリスト相談
                          </ActionButton>
                          
                          <ActionButton
                            fullWidth
                            variant="outlined"
                            startIcon={<PersonIcon />}
                            sx={{
                              borderColor: 'rgba(0,0,0,0.12)',
                              color: 'text.primary',
                            }}
                          >
                            詳細を見る
                          </ActionButton>
                        </Stack>
                      </Box>
                    </Collapse>
                  </ClientCard>
                </Fade>
              );
            })}
          </Box>

          {/* 空の状態 */}
          {clientDisplays.length === 0 && (
            <Box textAlign="center" py={8}>
              <AccessTimeIcon
                sx={{ fontSize: 60, color: 'rgba(242, 106, 141, 0.3)', mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                本日の予約はありません
              </Typography>
              <Typography variant="body2" color="text.secondary">
                予約が入ると、ここに表示されます
              </Typography>
            </Box>
          )}
        </Container>
      </PageContainer>
  );
};

export default TodayClientsPage;