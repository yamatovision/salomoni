import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemButton,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Badge,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { 
  getSuperAdminSupportTickets,
  getSuperAdminSupportTicket,
  replySuperAdminSupportTicket,
  updateSuperAdminSupportTicket,
  getSuperAdminSupportTicketStats
} from '../../services/api/superadmin-support';
import type { 
  SupportTicket, 
  SupportTicketReplyInput,
  SupportTicketUpdateInput
} from '../../types';
import { TicketStatus } from '../../types';

const SuperAdminSupportPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [replying, setReplying] = useState(false);

  // チケット一覧の取得
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const response = await getSuperAdminSupportTickets(params);
      setTickets(response.tickets);
      
      // 最初のチケットを選択
      if (response.tickets.length > 0 && !selectedTicket) {
        setSelectedTicket(response.tickets[0]);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setSnackbar({
        open: true,
        message: 'チケットの取得に失敗しました',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, searchQuery]);

  // チケットへの返信
  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim() || !user) return;

    setReplying(true);
    try {
      const replyData: SupportTicketReplyInput = {
        senderId: user.id,
        message: replyMessage.trim(),
        isStaff: true
      };

      await replySuperAdminSupportTicket(selectedTicket.id, replyData);
      
      // ローカルの状態を更新
      const updatedTicket: SupportTicket = {
        ...selectedTicket,
        status: selectedTicket.status === TicketStatus.OPEN ? TicketStatus.IN_PROGRESS : selectedTicket.status,
        updatedAt: new Date()
      };
      
      setSelectedTicket(updatedTicket);
      
      // チケット一覧も更新
      setTickets(tickets.map(t => 
        t.id === selectedTicket.id ? updatedTicket : t
      ));
      
      setReplyMessage('');
      setSnackbar({
        open: true,
        message: '返信を送信しました',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to send reply:', error);
      setSnackbar({
        open: true,
        message: '返信の送信に失敗しました',
        severity: 'error'
      });
    } finally {
      setReplying(false);
    }
  };

  // チケットステータスの更新
  const handleStatusUpdate = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;

    try {
      const updateData: SupportTicketUpdateInput = {
        status: newStatus
      };

      const updatedTicket = await updateSuperAdminSupportTicket(selectedTicket.id, updateData);
      
      setSelectedTicket(updatedTicket);
      setTickets(tickets.map(t => 
        t.id === selectedTicket.id ? updatedTicket : t
      ));
      
      setSnackbar({
        open: true,
        message: 'ステータスを更新しました',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      setSnackbar({
        open: true,
        message: 'ステータスの更新に失敗しました',
        severity: 'error'
      });
    }
  };

  // ステータスバッジの色を取得
  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return 'warning';
      case TicketStatus.PENDING:
        return 'warning';
      case TicketStatus.IN_PROGRESS:
        return 'info';
      case TicketStatus.RESOLVED:
        return 'success';
      case TicketStatus.CLOSED:
        return 'success';
      default:
        return 'default';
    }
  };

  // 優先度バッジの色を取得
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  // ステータスラベルの取得
  const getStatusLabel = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return '未回答';
      case TicketStatus.PENDING:
        return '未回答';
      case TicketStatus.IN_PROGRESS:
        return '対応中';
      case TicketStatus.RESOLVED:
        return '解決済';
      case TicketStatus.CLOSED:
        return 'クローズ';
      default:
        return status;
    }
  };

  // 優先度ラベルの取得
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '緊急';
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return priority;
    }
  };

  // 未回答チケット数の計算
  const pendingCount = tickets.filter(t => t.status === TicketStatus.OPEN || t.status === TicketStatus.PENDING).length;

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* チケット一覧 */}
      <Paper
        sx={{
          width: 320,
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* 検索バー */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="サポートチケットを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* ステータスタブ */}
        <Tabs
          value={statusFilter}
          onChange={(_, value) => setStatusFilter(value)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="すべて" value="all" />
          <Tab 
            label={
              <Badge badgeContent={pendingCount} color="error">
                未回答
              </Badge>
            } 
            value="pending" 
          />
          <Tab label="対応中" value="in_progress" />
          <Tab label="解決済" value="resolved" />
        </Tabs>

        {/* チケットカウンター */}
        <Box
          sx={{
            py: 1,
            px: 2,
            bgcolor: 'primary.light',
            color: 'primary.main',
            fontWeight: 500,
            fontSize: 14,
            textAlign: 'center'
          }}
        >
          {statusFilter === 'all' 
            ? `総チケット数: ${tickets.length}件`
            : `${getStatusLabel(statusFilter as TicketStatus)}のチケット: ${tickets.length}件`
          }
        </Box>

        {/* チケット一覧 */}
        <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : tickets.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              チケットがありません
            </Box>
          ) : (
            tickets.map((ticket) => (
              <ListItem key={ticket.id} disablePadding>
                <ListItemButton
                  selected={selectedTicket?.id === ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  sx={{
                    borderLeft: selectedTicket?.id === ticket.id ? 4 : 0,
                    borderColor: 'primary.main',
                    '&.Mui-selected': {
                      bgcolor: 'primary.light'
                    }
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        #{ticket.id.slice(-4).toUpperCase()}
                      </Typography>
                      <Chip
                        label={getStatusLabel(ticket.status)}
                        size="small"
                        color={getStatusColor(ticket.status) as any}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {ticket.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {ticket.organization?.name || ticket.user?.name}
                    </Typography>
                  </Box>
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {/* チケット詳細 */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedTicket ? (
          <>
            {/* 詳細ヘッダー */}
            <Paper sx={{ p: 3, borderRadius: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {selectedTicket.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, color: 'text.secondary' }}>
                    <Typography variant="body2">
                      チケット番号: #{selectedTicket.id.slice(-4).toUpperCase()}
                    </Typography>
                    <Typography variant="body2">
                      組織: {selectedTicket.organization?.name}
                    </Typography>
                    <Typography variant="body2">
                      作成日: {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleDateString('ja-JP') : '-'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={getPriorityLabel(selectedTicket.priority || 'medium')}
                    size="small"
                    color={getPriorityColor(selectedTicket.priority || 'medium') as any}
                  />
                  <IconButton size="small" onClick={fetchTickets}>
                    <RefreshIcon />
                  </IconButton>
                </Box>
              </Box>
              
              {/* ステータス更新ボタン */}
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                {selectedTicket.status !== TicketStatus.RESOLVED && (
                  <>
                    {(selectedTicket.status === TicketStatus.OPEN || selectedTicket.status === TicketStatus.PENDING) && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleStatusUpdate(TicketStatus.IN_PROGRESS)}
                      >
                        対応開始
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleStatusUpdate(TicketStatus.RESOLVED)}
                    >
                      解決済みにする
                    </Button>
                  </>
                )}
              </Box>
            </Paper>

            {/* メッセージ一覧 */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3, bgcolor: '#f9f9f9' }}>
              {selectedTicket.messages?.map((message) => (
                <Box key={message.id} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          mr: 1,
                          bgcolor: message.isStaff ? 'primary.light' : 'grey.400',
                          color: message.isStaff ? 'primary.main' : 'white',
                          fontSize: 12
                        }}
                      >
                        {message.isStaff ? 'SA' : (selectedTicket.user?.name?.[0] || 'U')}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>
                        {message.isStaff ? 'スーパー管理者' : selectedTicket.user?.name}
                        {!message.isStaff && selectedTicket.organization && (
                          <Typography component="span" variant="body2" color="text.secondary">
                            （{selectedTicket.organization.name}）
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {message.createdAt ? new Date(message.createdAt).toLocaleString('ja-JP') : '-'}
                    </Typography>
                  </Box>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: message.isStaff ? '#ffe0e8' : 'white',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {message.content}
                  </Paper>
                </Box>
              ))}
            </Box>

            {/* 返信フォーム */}
            <Paper sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="返信メッセージを入力..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleReply}
                disabled={!replyMessage.trim() || replying}
              >
                返信する
              </Button>
            </Paper>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary'
            }}
          >
            <HelpIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography>チケットを選択してください</Typography>
          </Box>
        )}
      </Box>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SuperAdminSupportPage;