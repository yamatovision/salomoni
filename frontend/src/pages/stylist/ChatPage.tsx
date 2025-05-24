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
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { ChatMessage, Client } from '../../types';
import { MessageType } from '../../types';
import { mockChatMessages } from '../../services/mock/data/mockConversations';
import { mockAICharacters } from '../../services/mock/data/mockAICharacters';
import { clientService } from '../../services';
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

const MessageBubble = styled(Paper)<{ messageType: 'user' | 'ai' }>(({ theme, messageType }: { theme: any; messageType: 'user' | 'ai' }) => ({
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientMenuAnchor, setClientMenuAnchor] = useState<null | HTMLElement>(null);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);

  // AIキャラクターを取得
  const aiCharacter = mockAICharacters.find(char => char.userId === user?.id);

  useEffect(() => {
    // クライアントリストとメッセージを読み込み
    const loadData = async () => {
      try {
        // クライアントリストを取得
        const clientsResponse = await clientService.getClients();
        if (clientsResponse.success && clientsResponse.data) {
          setAvailableClients(clientsResponse.data);
          
          // NewClientPageから遷移してきた場合
          if (location.state?.clientId) {
            const client = clientsResponse.data.find(c => c.id === location.state.clientId);
            if (client) {
              setSelectedClient(client);
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        // 最新の会話のメッセージを取得
        const conversationMessages = mockChatMessages.filter(
          msg => msg.conversationId === 'conv-001'
        );
        setMessages(conversationMessages);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.state]);

  useEffect(() => {
    // 新しいメッセージが追加されたら自動スクロール
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // クライアントが選択されていない場合の警告
    if (!selectedClient && inputValue.includes('クライアント')) {
      // クライアント関連の質問の場合、選択を促す
      const systemMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        conversationId: 'conv-001',
        type: MessageType.AI,
        content: 'どのクライアントさんについて話したい？上のメニューから選んでね♡',
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, systemMessage]);
      return;
    }

    const newUserMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: 'conv-001',
      type: MessageType.USER,
      content: inputValue,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);

    // AIの返答をシミュレート
    setTimeout(() => {
      let responseContent = 'そうなんだ！もっと詳しく教えて♪';
      
      // クライアントが選択されている場合、それに応じた返答
      if (selectedClient) {
        const responses = [
          `${selectedClient.name}さんのことね！どんなスタイルが似合いそうかな？`,
          `${selectedClient.name}さんは${selectedClient.gender === 'female' ? '素敵な女性' : 'かっこいい方'}だよね♡`,
          `今日の${selectedClient.name}さんはどんな感じ？`,
        ];
        responseContent = responses[Math.floor(Math.random() * responses.length)];
      }
      
      const aiResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        conversationId: 'conv-001',
        type: MessageType.AI,
        content: responseContent,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (action: string) => {
    if (action.startsWith('navigate:')) {
      const path = action.replace('navigate:', '');
      navigate(path);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === MessageType.USER;
    const richContent = message.metadata?.richContent;

    return (
      <Fade in key={message.id}>
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
                    key={index}
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
                  <>
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
                  </>
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
          {messages.map(message => renderMessage(message))}
          
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
          <MenuItem onClick={() => navigate('/stylist/new-client')}>
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