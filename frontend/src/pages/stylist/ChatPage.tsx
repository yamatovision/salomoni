import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Paper,
  Button,
  Stack,
  Fade,
  CircularProgress,
  InputAdornment,
  AppBar,
  Toolbar,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  AttachFile as AttachIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { ChatMessage, Client, Conversation, AICharacter, ConversationContextType } from '../../types';
import { MessageType } from '../../types';
import { clientService, chatService, aiCharacterService } from '../../services';
import { ROUTES } from '../../routes/routes';

// ページID: M-001

// スタイル付きコンポーネント
const ChatContainer = styled(Box)(() => ({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(180deg, #fafafa 0%, #f8fafc 100%)',
}));

const ChatHeader = styled(AppBar)(({ theme }: { theme: any }) => ({
  background: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)',
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const MessagesArea = styled(Box)(({ theme }: { theme: any }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.divider,
    borderRadius: '3px',
  },
}));

const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'messageType',
})<{ messageType: 'user' | 'ai' }>(({ theme, messageType }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: '20px',
  maxWidth: '85%',
  wordWrap: 'break-word',
  ...(messageType === 'user' ? {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
    color: 'white',
    borderBottomRightRadius: '6px',
    alignSelf: 'flex-end',
  } : {
    background: 'white',
    border: `1px solid ${theme.palette.divider}`,
    borderBottomLeftRadius: '6px',
    alignSelf: 'flex-start',
  }),
}));

const InputArea = styled(Box)(({ theme }: { theme: any }) => ({
  padding: theme.spacing(2),
  background: 'white',
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const FortuneCard = styled(Paper)(({ theme }: { theme: any }) => ({
  background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #e0e7ff 100%)',
  borderRadius: '20px',
  padding: theme.spacing(3),
  margin: theme.spacing(1, 0),
  border: `1px solid rgba(242, 106, 141, 0.2)`,
}));

const QuickActionButton = styled(Button)(({ theme }: { theme: any }) => ({
  borderRadius: '25px',
  textTransform: 'none',
  background: 'linear-gradient(135deg, rgba(242, 106, 141, 0.1) 0%, rgba(242, 106, 141, 0.05) 100%)',
  border: `1px solid rgba(242, 106, 141, 0.3)`,
  color: theme.palette.primary.main,
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(242, 106, 141, 0.2) 0%, rgba(242, 106, 141, 0.1) 100%)',
  },
}));

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { clientId: urlClientId } = useParams<{ clientId?: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientMenuAnchor, setClientMenuAnchor] = useState<null | HTMLElement>(null);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [aiCharacter, setAiCharacter] = useState<AICharacter | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // クライアントリストとチャットデータを読み込み
    const loadData = async () => {
      console.log('[ChatPage] loadData - 開始');
      try {
        // URLパラメータまたはstateからclientIdを取得
        const clientId = urlClientId || location.state?.clientId;
        
        // AIキャラクターを取得
        console.log('[ChatPage] loadData - AIキャラクター取得開始');
        const characterResponse = await aiCharacterService.getMyAICharacter();
        console.log('[ChatPage] loadData - AIキャラクター取得レスポンス:', characterResponse);
        if (characterResponse.success && characterResponse.data) {
          console.log('[ChatPage] loadData - AIキャラクター取得成功');
          setAiCharacter(characterResponse.data);
        } else if (!characterResponse.success) {
          // AIキャラクターが未作成の場合、AIキャラクターセットアップページへ
          console.log('[ChatPage] AIキャラクター未設定 - セットアップページへリダイレクト');
          setError('AIキャラクターが設定されていません。初期設定を行います...');
          setTimeout(() => {
            navigate('/ai-character-setup');
          }, 1000);
          return;
        }
        
        // ユーザーロールの場合、クライアントリストの取得をスキップ
        // 管理者用APIのため、一般ユーザーはアクセスできない
        if (user?.role === 'admin' || user?.role === 'owner') {
          try {
            const clientsResponse = await clientService.getClients();
            if (clientsResponse.clients) {
              setAvailableClients(clientsResponse.clients);
              
              // NewClientPageから遷移してきた場合
              if (location.state?.clientId) {
                const client = clientsResponse.clients.find((c: Client) => c.id === location.state.clientId);
                if (client) {
                  setSelectedClient(client);
                }
              }
            }
          } catch (error) {
            console.log('[ChatPage] クライアントリスト取得エラー（権限不足の可能性）:', error);
          }
        } else {
          console.log('[ChatPage] ユーザーロールのため、クライアントリスト取得をスキップ');
        }
        
        // 会話を開始または取得（初期ロード時にclientIdがある場合は'client_direct'コンテキストを使用）
        const context: ConversationContextType = clientId ? 'client_direct' : 'personal';
        const chatResponse = await chatService.startChat({
          context,
          clientId: clientId || undefined,
        });
        
        if (chatResponse.success && chatResponse.data?.conversation) {
          setCurrentConversation(chatResponse.data.conversation);
          
          // 既存の会話がある場合はメッセージ履歴を取得
          // isNewフラグがある場合はそれを優先、ない場合はmessageCountで判定
          const isExistingConversation = chatResponse.data.isNew === false || 
            (chatResponse.data.isNew === undefined && (chatResponse.data.conversation?.messageCount || 0) > 0);
          
          if (isExistingConversation) {
            const messagesResponse = await chatService.getMessages(
              chatResponse.data.conversation.id,
              { order: 'asc' }
            );
            if (messagesResponse.success && messagesResponse.data) {
              setMessages(messagesResponse.data);
            }
          }
        } else {
          console.warn('チャット開始レスポンスが不正です:', chatResponse);
          setError('チャットを開始できませんでした');
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.state, navigate, urlClientId, user?.role]);
  
  // クライアント選択時に新しい会話を開始
  useEffect(() => {
    if (!aiCharacter || loading) return;
    
    const switchConversation = async () => {
      try {
        setMessages([]);
        setCurrentConversation(null);
        
        // 会話を開始または取得
        const context: ConversationContextType = selectedClient ? 'client_direct' : 'personal';
        const chatResponse = await chatService.startChat({
          context,
          clientId: selectedClient?.id,
        });
        
        if (chatResponse.success && chatResponse.data?.conversation) {
          setCurrentConversation(chatResponse.data.conversation);
          
          // 既存の会話がある場合はメッセージ履歴を取得
          // isNewフラグがある場合はそれを優先、ない場合はmessageCountで判定
          const isExistingConversation = chatResponse.data.isNew === false || 
            (chatResponse.data.isNew === undefined && (chatResponse.data.conversation?.messageCount || 0) > 0);
          
          if (isExistingConversation) {
            const messagesResponse = await chatService.getMessages(
              chatResponse.data.conversation.id,
              { order: 'asc' }
            );
            if (messagesResponse.success && messagesResponse.data) {
              setMessages(messagesResponse.data);
            }
          }
        } else {
          console.warn('チャット開始レスポンスが不正です:', chatResponse);
          setError('チャットを開始できませんでした');
        }
      } catch (error) {
        console.error('Failed to switch conversation:', error);
      }
    };
    
    switchConversation();
  }, [selectedClient, aiCharacter, loading]);

  useEffect(() => {
    // 新しいメッセージが追加されたら自動スクロール
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentConversation) return;
    
    // クライアントが選択されていない場合の警告
    if (!selectedClient && inputValue.includes('クライアント')) {
      // クライアント関連の質問の場合、選択を促す
      const systemMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        conversationId: currentConversation.id,
        type: MessageType.AI,
        content: 'どのクライアントさんについて話したい？上のメニューから選んでね♡',
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, systemMessage]);
      return;
    }

    const newUserMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: currentConversation.id,
      type: MessageType.USER,
      content: inputValue,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // AIに返答を求める
      const response = await chatService.sendMessage(currentConversation.id, {
        content: inputValue,
      });
      
      if (response.success && response.data) {
        setMessages((prev: ChatMessage[]) => [...prev, response.data as ChatMessage]);
      } else {
        // エラーメッセージを表示
        const errorMessage: ChatMessage = {
          id: `msg-error-${Date.now()}`,
          conversationId: currentConversation.id,
          type: MessageType.AI,
          content: 'ごめんね、メッセージの送信に失敗しちゃった。もう一度試してみて？',
          createdAt: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (action.startsWith('navigate:')) {
      const path = action.replace('navigate:', '');
      navigate(path);
    }
  };

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === MessageType.USER;
    const richContent = message.metadata?.richContent;

    return (
      <Fade in>
        <Box
          display="flex"
          flexDirection="column"
          alignItems={isUser ? 'flex-end' : 'flex-start'}
        >
          <Box display="flex" alignItems="flex-end" gap={1}>
            {!isUser && (
              <Avatar
                sx={{
                  bgcolor: '#F26A8D',
                  width: 32,
                  height: 32,
                  fontSize: '14px',
                }}
              >
                {aiCharacter?.name.charAt(0) || 'R'}
              </Avatar>
            )}
            
            <MessageBubble
              messageType={isUser ? 'user' : 'ai'}
              elevation={isUser ? 3 : 1}
            >
              <Typography variant="body1">
                {message.content}
              </Typography>
            </MessageBubble>
          </Box>

          {/* リッチコンテンツ（運勢カード） */}
          {richContent?.fortuneCard && (
            <FortuneCard sx={{ mt: 1, ml: isUser ? 0 : 5 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Typography fontSize="24px">
                  {richContent.fortuneCard.icon}
                </Typography>
                <Typography variant="h6" color="primary">
                  {richContent.fortuneCard.title}
                </Typography>
              </Box>
              
              <Box
                display="grid"
                gridTemplateColumns="1fr 1fr"
                gap={2}
              >
                {richContent.fortuneCard.items.map((item: { label: string; value: string; color?: string }, index: number) => (
                  <Box
                    key={`fortune-item-${message.id}-${index}`}
                    bgcolor="rgba(255,255,255,0.8)"
                    p={2}
                    borderRadius={2}
                    textAlign="center"
                  >
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={500}
                      color={item.color}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </FortuneCard>
          )}

          {/* クイックアクション */}
          {richContent?.quickActions && (
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1, ml: isUser ? 0 : 5 }}
              flexWrap="wrap"
            >
              {richContent.quickActions.map((action: { id: string; icon?: string; action: string; style?: string; label: string }) => (
                <QuickActionButton
                  key={action.id}
                  size="small"
                  startIcon={<span>{action.icon}</span>}
                  onClick={() => handleQuickAction(action.action)}
                  variant={action.style === 'primary' ? 'contained' : 'outlined'}
                >
                  {action.label}
                </QuickActionButton>
              ))}
            </Stack>
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, px: 1 }}
          >
            {formatTime(message.createdAt)}
          </Typography>
        </Box>
      </Fade>
    );
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
  
  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        gap={2}
      >
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={() => navigate(ROUTES.stylist.dashboard)}>
          ダッシュボードに戻る
        </Button>
      </Box>
    );
  }

  return (
      <ChatContainer>
        {/* ヘッダー */}
        <ChatHeader position="static">
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => navigate(ROUTES.stylist.dashboard)}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            
            <Avatar
              sx={{
                bgcolor: '#F26A8D',
                width: 40,
                height: 40,
                mr: 1.5,
              }}
            >
              {aiCharacter?.name.charAt(0) || 'R'}
            </Avatar>
            
            <Box flex={1}>
              <Typography variant="h6" color="text.primary">
                {aiCharacter?.name || 'Ruka'}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box
                    width={6}
                    height={6}
                    borderRadius="50%"
                    bgcolor="#4ade80"
                  />
                  <Typography variant="caption" color="text.secondary">
                    オンライン
                  </Typography>
                </Box>
                {selectedClient && (
                  <React.Fragment key="client-info">
                    <Typography variant="caption" color="text.secondary">•</Typography>
                    <Chip
                      size="small"
                      icon={<PersonIcon />}
                      label={selectedClient.name}
                      onClick={(e) => setClientMenuAnchor(e.currentTarget)}
                      onDelete={() => setSelectedClient(null)}
                      color="primary"
                      variant="outlined"
                    />
                  </React.Fragment>
                )}
              </Box>
            </Box>
            
            <IconButton>
              <InfoIcon />
            </IconButton>
          </Toolbar>
        </ChatHeader>

        {/* メッセージエリア */}
        <MessagesArea>
          {messages.map((message) => (
            <Box key={message.id}>
              {renderMessage(message)}
            </Box>
          ))}
          
          {/* タイピングインジケーター */}
          {isTyping && (
            <Fade in>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar
                  sx={{
                    bgcolor: '#F26A8D',
                    width: 32,
                    height: 32,
                    fontSize: '14px',
                  }}
                >
                  {aiCharacter?.name.charAt(0) || 'R'}
                </Avatar>
                <Paper
                  sx={{
                    p: 1.5,
                    borderRadius: '20px',
                    borderBottomLeftRadius: '6px',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary">
                      入力中
                    </Typography>
                    <Box display="flex" gap={0.5}>
                      {[0, 1, 2].map(i => (
                        <Box
                          key={i}
                          width={4}
                          height={4}
                          borderRadius="50%"
                          bgcolor="text.secondary"
                          sx={{
                            animation: 'pulse 1.4s infinite',
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Fade>
          )}
          
          <div ref={messagesEndRef} />
        </MessagesArea>

        {/* クライアント未選択時の案内 */}
        {!selectedClient && (
          <Box px={2} pb={1}>
            <Alert 
              severity="info" 
              action={
                <Button 
                  size="small" 
                  onClick={(e) => setClientMenuAnchor(e.currentTarget)}
                  startIcon={<PersonIcon />}
                >
                  選択
                </Button>
              }
            >
              クライアントを選択すると、より詳しいアドバイスができます
            </Alert>
          </Box>
        )}
        
        {/* 入力エリア */}
        <InputArea>
          <Box display="flex" alignItems="flex-end" gap={1}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="メッセージを入力..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '25px',
                  background: 'rgba(253, 242, 248, 0.3)',
                },
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small">
                        <AttachIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small">
                        <EmojiIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            
            <IconButton
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              sx={{
                bgcolor: '#F26A8D',
                color: 'white',
                width: 48,
                height: 48,
                '&:hover': {
                  bgcolor: '#E85C7F',
                },
                '&:disabled': {
                  bgcolor: 'rgba(0, 0, 0, 0.12)',
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </InputArea>
        
        {/* クライアント選択メニュー */}
        <Menu
          anchorEl={clientMenuAnchor}
          open={Boolean(clientMenuAnchor)}
          onClose={() => setClientMenuAnchor(null)}
          PaperProps={{
            elevation: 3,
            sx: {
              minWidth: 250,
              maxHeight: 400,
            },
          }}
        >
          <MenuItem onClick={() => navigate(ROUTES.stylist.newClient)}>
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>新規クライアント</ListItemText>
          </MenuItem>
          <Divider />
          {availableClients.map((client) => (
            <MenuItem
              key={client.id}
              onClick={() => {
                setSelectedClient(client);
                setClientMenuAnchor(null);
              }}
              selected={selectedClient?.id === client.id}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={client.name}
                secondary={client.lastVisitDate ? `最終来店: ${new Date(client.lastVisitDate).toLocaleDateString('ja-JP')}` : '新規'}
              />
            </MenuItem>
          ))}
        </Menu>
      </ChatContainer>
  );
};

export default ChatPage;