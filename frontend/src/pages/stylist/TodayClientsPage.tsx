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
  Toolbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as AccessTimeIcon,
  ChatBubble as ChatBubbleIcon,
  Person as PersonIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Client } from '../../types';
import { clientService, aiCharacterService } from '../../services';
import { SajuProfileDisplay } from '../../components/features/saju/SajuProfileDisplay';

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

// TODO: 四柱推命統合後に実装
// const CompatibilityBadge = styled(Chip)<{ level?: 'excellent' | 'good' | 'average' }>(({ theme, level = 'good' }) => ({
//   fontWeight: 500,
//   fontSize: '0.8rem',
//   '& .MuiChip-icon': {
//     fontSize: '0.9rem',
//   },
//   ...(level === 'excellent' && {
//     backgroundColor: theme.palette.primary.main,
//     color: 'white',
//   }),
//   ...(level === 'good' && {
//     backgroundColor: 'rgba(242, 106, 141, 0.6)',
//     color: 'white',
//   }),
//   ...(level === 'average' && {
//     backgroundColor: 'rgba(242, 106, 141, 0.3)',
//     color: theme.palette.text.primary,
//   }),
// }));

const ActionButton = styled(Button)(() => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.875rem',
}));

const TodayClientsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 四柱推命プロフィール表示用の状態
  const [openSajuProfileDialog, setOpenSajuProfileDialog] = useState(false);
  const [sajuProfileData, setSajuProfileData] = useState<any>(null);
  const [sajuLoading, setSajuLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    // 本日のクライアントデータを取得
    const loadClientData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 今日の日付を取得
        const today = new Date().toISOString().split('T')[0];
        
        const todayClients = await clientService.getDailyClients(
          user?.role === 'user' ? user.id : undefined, // スタイリストの場合は自分のID
          today
        );
        setClients(todayClients);
      } catch (error) {
        console.error('Failed to load client data:', error);
        setError('本日のクライアント情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadClientData();
    }
  }, [user]);

  const handleCardToggle = (clientId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const handleChatClick = async (clientId: string) => {
    try {
      // クライアントのAIキャラクター設定状況を確認
      const setupStatus = await aiCharacterService.getClientSetupStatus(clientId);
      console.log('[TodayClientsPage] handleChatClick - setupStatus:', setupStatus);
      console.log('[TodayClientsPage] hasCharacter check:', {
        success: setupStatus.success,
        data: setupStatus.data,
        hasCharacter: setupStatus.data?.hasCharacter
      });
      
      // hasCharacterをチェック
      if (setupStatus.success && setupStatus.data?.hasCharacter) {
        // 設定済みの場合：チャット画面へ遷移
        console.log('[TodayClientsPage] AIキャラクター設定済み - チャット画面へ遷移');
        navigate('/chat', { state: { clientId } });
      } else {
        // 未設定の場合：AIキャラクター設定画面へ遷移
        console.log('[TodayClientsPage] AIキャラクター未設定 - 設定画面へ遷移');
        navigate(`/ai-character-setup/client/${clientId}`);
      }
    } catch (error) {
      console.error('AIキャラクター設定状況の確認に失敗しました:', error);
      // エラーの場合はとりあえずチャット画面へ
      navigate('/chat', { state: { clientId } });
    }
  };

  // 四柱推命プロフィールを表示
  const handleViewSajuProfile = async (client: Client) => {
    console.log('[TodayClients] Fetching saju profile for client:', client.id);
    setSelectedClient(client);
    setSajuLoading(true);
    setOpenSajuProfileDialog(true);
    
    try {
      const profile = await clientService.getClientSajuProfile(client.id);
      console.log('[TodayClients] Saju profile response:', profile);
      setSajuProfileData(profile);
    } catch (err) {
      console.error('[TodayClients] Error fetching saju profile:', err);
      setError('四柱推命プロフィールの取得に失敗しました。生年月日が登録されていない可能性があります。');
      setOpenSajuProfileDialog(false);
    } finally {
      setSajuLoading(false);
    }
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
  const completedCount = 0; // 予約管理機能の統合後に実装
  const newClientsCount = clients.filter(client => client.visitCount === 0).length;

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
          {/* エラー表示 */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* サマリー統計 */}
          <SummaryCards>
            <StatCard>
              <Typography
                variant="h4"
                color="primary"
                fontWeight={600}
                mb={0.5}
              >
                {clients.length}
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
                {newClientsCount}
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

            {clients.map((client, index) => {
              const isExpanded = expandedCards.has(client.id);
              const isFirstVisit = client.visitCount === 0;

              return (
                <Fade in timeout={600 + index * 100} key={client.id}>
                  <ClientCard>
                    <Box
                      p={2}
                      onClick={() => handleCardToggle(client.id)}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <ClientAvatar>
                          {getInitials(client.name)}
                        </ClientAvatar>
                        
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight={500}>
                            {client.name}
                            {isFirstVisit && (
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
                          >
                            来店回数: {client.visitCount}回
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                          {/* TODO: 四柱推命データ統合後に実装
                          {client.fourPillarsDataId && (
                            <CompatibilityBadge
                              level="good"
                              icon={<StarsIcon />}
                              label="相性良好"
                              size="small"
                            />
                          )} */}
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardToggle(client.id);
                            }}
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>

                    {/* 拡張表示エリア */}
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ px: 2, pb: 2 }}>
                        <Divider sx={{ mb: 2 }} />

                        {/* クライアント情報 */}
                        <Box mb={2}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={500}
                            mb={0.5}
                          >
                            クライアント情報
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            メール: {client.email || '未登録'}<br />
                            電話: {client.phoneNumber || '未登録'}<br />
                            最終来店: {client.lastVisitDate ? new Date(client.lastVisitDate).toLocaleDateString('ja-JP') : '初回'}
                          </Typography>
                        </Box>

                        {/* メモ */}
                        {client.memo && (
                          <Box mb={2}>
                            <Typography
                              variant="subtitle2"
                              fontWeight={500}
                              mb={0.5}
                            >
                              メモ
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {client.memo}
                            </Typography>
                          </Box>
                        )}

                        {/* アクションボタン */}
                        <Stack direction="row" spacing={1} mt={2}>
                          <ActionButton
                            variant="contained"
                            startIcon={<ChatBubbleIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChatClick(client.id);
                            }}
                            fullWidth
                          >
                            AIチャット
                          </ActionButton>
                          <ActionButton
                            variant="outlined"
                            startIcon={<PersonIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewSajuProfile(client);
                            }}
                            fullWidth
                          >
                            詳細情報
                          </ActionButton>
                        </Stack>
                      </Box>
                    </Collapse>
                  </ClientCard>
                </Fade>
              );
            })}

            {/* データがない場合 */}
            {clients.length === 0 && !loading && (
              <Box
                textAlign="center"
                py={8}
                color="text.secondary"
              >
                <Typography variant="h6" mb={1}>
                  本日の予約はありません
                </Typography>
                <Typography variant="body2">
                  新しい予約が入ると、ここに表示されます
                </Typography>
              </Box>
            )}
          </Box>
        </Container>

        {/* 四柱推命プロフィールダイアログ */}
        <Dialog
          open={openSajuProfileDialog}
          onClose={() => {
            setOpenSajuProfileDialog(false);
            setSajuProfileData(null);
            setSelectedClient(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            四柱推命プロフィール
            <IconButton
              onClick={() => {
                setOpenSajuProfileDialog(false);
                setSajuProfileData(null);
                setSelectedClient(null);
              }}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {sajuLoading ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body1" sx={{ mb: 2 }}>四柱推命データを計算中...</Typography>
                <LinearProgress />
              </Box>
            ) : sajuProfileData ? (
              <SajuProfileDisplay 
                profile={sajuProfileData} 
                userName={selectedClient?.name || ''}
              />
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenSajuProfileDialog(false);
              setSajuProfileData(null);
              setSelectedClient(null);
            }}>
              閉じる
            </Button>
          </DialogActions>
        </Dialog>
    </PageContainer>
  );
};

export default TodayClientsPage;