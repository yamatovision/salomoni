import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Avatar,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  HelpOutline as HelpOutlineIcon,
  Send as SendIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { AdminLayout } from '../../layouts/AdminLayout';
import type {
  SupportTicket,
  SupportMessage,
} from '../../types';
import {
  TicketStatus,
} from '../../types';

// モックデータ
const mockTickets: SupportTicket[] = [
  {
    id: '1',
    ticketNumber: 'TK-0045',
    organizationId: 'org_1',
    userId: 'user_1',
    title: '予約カレンダーの同期について',
    description: 'GoogleカレンダーとiCloudカレンダーの両方を連携して使用していますが、時々同期がうまくいかず、予約が重複して表示されることがあります。',
    status: TicketStatus.PENDING,
    priority: 'medium',
    category: 'technical',
    createdAt: new Date('2025-04-28T14:30:00'),
    updatedAt: new Date('2025-04-28T14:30:00'),
  },
  {
    id: '2',
    ticketNumber: 'TK-0044',
    organizationId: 'org_1',
    userId: 'user_1',
    title: 'クライアントデータのエクスポート方法',
    description: 'クライアントデータをCSV形式でエクスポートしたいのですが、方法がわかりません。',
    status: TicketStatus.ANSWERED,
    priority: 'low',
    category: 'how-to',
    createdAt: new Date('2025-04-27T10:00:00'),
    updatedAt: new Date('2025-04-28T09:15:00'),
    lastResponseAt: new Date('2025-04-28T09:15:00'),
  },
  {
    id: '3',
    ticketNumber: 'TK-0043',
    organizationId: 'org_1',
    userId: 'user_1',
    title: 'スタイリストアカウントの追加について',
    description: '新しいスタイリストを追加したいのですが、招待メールが届かないようです。',
    status: TicketStatus.ANSWERED,
    priority: 'medium',
    category: 'account',
    createdAt: new Date('2025-04-25T16:20:00'),
    updatedAt: new Date('2025-04-26T11:30:00'),
    lastResponseAt: new Date('2025-04-26T11:30:00'),
  },
  {
    id: '4',
    ticketNumber: 'TK-0042',
    organizationId: 'org_1',
    userId: 'user_1',
    title: '請求書の確認方法',
    description: '先月分の請求書を確認したいのですが、どこから見ることができますか？',
    status: TicketStatus.ANSWERED,
    priority: 'low',
    category: 'billing',
    createdAt: new Date('2025-04-22T13:45:00'),
    updatedAt: new Date('2025-04-24T10:00:00'),
    lastResponseAt: new Date('2025-04-24T10:00:00'),
  },
  {
    id: '5',
    ticketNumber: 'TK-0041',
    organizationId: 'org_1',
    userId: 'user_1',
    title: '新機能のリリース予定',
    description: 'AIによる自動スケジューリング機能はいつリリースされる予定ですか？',
    status: TicketStatus.PENDING,
    priority: 'low',
    category: 'feature-request',
    createdAt: new Date('2025-04-20T09:30:00'),
    updatedAt: new Date('2025-04-21T14:00:00'),
  },
];

const mockMessages: Record<string, SupportMessage[]> = {
  '1': [
    {
      id: 'msg_1',
      ticketId: '1',
      senderId: 'user_1',
      senderType: 'user',
      content: `GoogleカレンダーとiCloudカレンダーの両方を連携して使用していますが、時々同期がうまくいかず、予約が重複して表示されることがあります。

具体的には、Googleカレンダーで予約を登録すると、Salomoniのシステムには正常に表示されますが、別のスタッフがiCloudカレンダーから同じクライアントの予約を確認すると、時間がずれていたり、別の予約として表示されることがあります。

この問題を解決する設定や方法はありますか？`,
      createdAt: new Date('2025-04-28T14:30:00'),
      updatedAt: new Date('2025-04-28T14:30:00'),
    },
  ],
  '2': [
    {
      id: 'msg_2',
      ticketId: '2',
      senderId: 'user_1',
      senderType: 'user',
      content: 'クライアントデータをCSV形式でエクスポートしたいのですが、方法がわかりません。',
      createdAt: new Date('2025-04-27T10:00:00'),
      updatedAt: new Date('2025-04-27T10:00:00'),
    },
    {
      id: 'msg_3',
      ticketId: '2',
      senderId: 'support_1',
      senderType: 'admin',
      content: `クライアントデータのCSVエクスポート機能についてご案内いたします。

1. クライアント管理画面を開く
2. 画面右上の「エクスポート」ボタンをクリック
3. エクスポート形式で「CSV」を選択
4. 必要な項目を選択（全項目選択も可能）
5. 「エクスポート実行」ボタンをクリック

エクスポートしたファイルは登録されているメールアドレスに送信されます。
ご不明な点がございましたら、お気軽にお問い合わせください。`,
      createdAt: new Date('2025-04-28T09:15:00'),
      updatedAt: new Date('2025-04-28T09:15:00'),
    },
  ],
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`support-tabpanel-${index}`}
      aria-labelledby={`support-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const AdminSupportPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(mockTickets[0]);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [newTicketData, setNewTicketData] = useState({
    title: '',
    description: '',
  });

  // タブ別のチケットをフィルタリング
  const allTickets = mockTickets;
  const pendingTickets = mockTickets.filter(t => t.status === TicketStatus.PENDING);
  const answeredTickets = mockTickets.filter(t => t.status === TicketStatus.ANSWERED);

  const getTicketsByTab = () => {
    switch (tabValue) {
      case 0:
        return allTickets;
      case 1:
        return pendingTickets;
      case 2:
        return answeredTickets;
      default:
        return allTickets;
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTicketClick = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  const handleNewTicketOpen = () => {
    setNewTicketOpen(true);
  };

  const handleNewTicketClose = () => {
    setNewTicketOpen(false);
    setNewTicketData({ title: '', description: '' });
  };

  const handleNewTicketSubmit = () => {
    // 実際にはAPIを呼び出してチケットを作成
    console.log('新規チケット作成:', newTicketData);
    handleNewTicketClose();
  };

  const handleReplySubmit = () => {
    if (replyText.trim() && selectedTicket) {
      // 実際にはAPIを呼び出して返信を送信
      console.log('返信送信:', { ticketId: selectedTicket.id, message: replyText });
      setReplyText('');
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.PENDING:
        return 'warning';
      case TicketStatus.ANSWERED:
        return 'success';
      case TicketStatus.IN_PROGRESS:
        return 'info';
      case TicketStatus.RESOLVED:
        return 'default';
      case TicketStatus.CLOSED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.PENDING:
        return '未回答';
      case TicketStatus.ANSWERED:
        return '回答済み';
      case TicketStatus.IN_PROGRESS:
        return '対応中';
      case TicketStatus.RESOLVED:
        return '解決済み';
      case TicketStatus.CLOSED:
        return 'クローズ';
      default:
        return status;
    }
  };

  const getSenderInitials = (_senderId: string, senderType: string) => {
    if (senderType === 'admin' || senderType === 'system') {
      return 'S';
    }
    return 'SN'; // 実際にはユーザー名から取得
  };

  const getSenderName = (_senderId: string, senderType: string) => {
    if (senderType === 'admin') {
      return 'サポートチーム';
    }
    return '佐藤 直子（サロンオーナー）'; // 実際にはユーザー情報から取得
  };

  return (
    <AdminLayout>
      <Box sx={{ 
        p: { xs: 2, md: 3 },
        maxWidth: 1200,
        mx: 'auto',
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <Typography variant="h4" color="primary">
            サポート
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewTicketOpen}
            sx={{ 
              whiteSpace: 'nowrap',
            }}
          >
            新規チケット作成
          </Button>
        </Box>

        {/* チケット一覧 */}
        <Paper sx={{ mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label={`すべてのチケット`} />
                <Tab label={`未回答 (${pendingTickets.length})`} />
                <Tab label={`回答済み (${answeredTickets.length})`} />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <TicketList tickets={getTicketsByTab()} selectedTicket={selectedTicket} onTicketClick={handleTicketClick} getStatusColor={getStatusColor} getStatusLabel={getStatusLabel} />
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <TicketList tickets={getTicketsByTab()} selectedTicket={selectedTicket} onTicketClick={handleTicketClick} getStatusColor={getStatusColor} getStatusLabel={getStatusLabel} />
              </TabPanel>
              <TabPanel value={tabValue} index={2}>
                <TicketList tickets={getTicketsByTab()} selectedTicket={selectedTicket} onTicketClick={handleTicketClick} getStatusColor={getStatusColor} getStatusLabel={getStatusLabel} />
              </TabPanel>
            </Paper>

        {/* チケット詳細 */}
        {selectedTicket && (
              <Paper sx={{ minHeight: 400 }}>
                {/* ヘッダー */}
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h5" gutterBottom>
                    {selectedTicket.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', color: 'text.secondary' }}>
                    <Typography variant="body2">
                      チケット番号: {selectedTicket.ticketNumber}
                    </Typography>
                    <Typography variant="body2">
                      作成日: {new Date(selectedTicket.createdAt).toLocaleDateString('ja-JP')}
                    </Typography>
                    <Chip
                      label={getStatusLabel(selectedTicket.status)}
                      color={getStatusColor(selectedTicket.status)}
                      size="small"
                    />
                  </Box>
                </Box>

                {/* メッセージ一覧 */}
                <Box sx={{ p: 3 }}>
                  {mockMessages[selectedTicket.id]?.map((message) => (
                    <Box key={message.id} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: '0.875rem',
                              bgcolor: message.senderType === 'admin' ? 'primary.dark' : 'grey.400',
                            }}
                          >
                            {getSenderInitials(message.senderId, message.senderType)}
                          </Avatar>
                          <Typography variant="body1" fontWeight={500}>
                            {getSenderName(message.senderId, message.senderType)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(message.createdAt).toLocaleString('ja-JP')}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          bgcolor: message.senderType === 'admin' ? 'grey.100' : 'white',
                          border: '1px solid',
                          borderColor: message.senderType === 'admin' ? 'grey.300' : 'grey.200',
                          p: 2.5,
                          borderRadius: 1,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        <Typography variant="body1">
                          {message.content}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* 返信フォーム */}
                <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="返信メッセージを入力..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={handleReplySubmit}
                      disabled={!replyText.trim()}
                    >
                      返信する
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}

        {/* 新規チケット作成ダイアログ */}
        <Dialog open={newTicketOpen} onClose={handleNewTicketClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            新規サポートチケット作成
            <IconButton
              aria-label="close"
              onClick={handleNewTicketClose}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              label="タイトル"
              placeholder="質問の要点を簡潔に記載してください"
              value={newTicketData.title}
              onChange={(e) => setNewTicketData({ ...newTicketData, title: e.target.value })}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              multiline
              rows={6}
              label="詳細内容"
              placeholder="問題の詳細や質問内容を具体的に記載してください。エラーメッセージや再現手順があれば併せてお知らせください。"
              value={newTicketData.description}
              onChange={(e) => setNewTicketData({ ...newTicketData, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleNewTicketClose} color="inherit">
              キャンセル
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleNewTicketSubmit}
              disabled={!newTicketData.title.trim() || !newTicketData.description.trim()}
            >
              送信する
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

// チケット一覧コンポーネント
interface TicketListProps {
  tickets: SupportTicket[];
  selectedTicket: SupportTicket | null;
  onTicketClick: (ticket: SupportTicket) => void;
  getStatusColor: (status: TicketStatus) => any;
  getStatusLabel: (status: TicketStatus) => string;
}

const TicketList: React.FC<TicketListProps> = ({
  tickets,
  selectedTicket,
  onTicketClick,
  getStatusColor,
  getStatusLabel,
}) => {
  if (tickets.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
        <HelpOutlineIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
        <Typography>チケットがありません</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {tickets.map((ticket, index) => (
        <React.Fragment key={ticket.id}>
          <ListItem disablePadding>
            <ListItemButton
              selected={selectedTicket?.id === ticket.id}
              onClick={() => onTicketClick(ticket)}
              sx={{
                py: 2,
                px: 2.5,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  borderLeft: '4px solid',
                  borderLeftColor: 'primary.main',
                },
              }}
          >
            <ListItemText
              primary={
                <Box sx={{ mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {ticket.ticketNumber}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                    {ticket.title}
                  </Typography>
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, fontSize: '0.75rem', color: 'text.secondary' }}>
                    <span>作成日: {new Date(ticket.createdAt).toLocaleDateString('ja-JP')}</span>
                    <span>最終更新: {new Date(ticket.updatedAt).toLocaleDateString('ja-JP')}</span>
                  </Box>
                  <Chip
                    label={getStatusLabel(ticket.status)}
                    color={getStatusColor(ticket.status)}
                    size="small"
                  />
                </Box>
              }
            />
            </ListItemButton>
          </ListItem>
          {index < tickets.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default AdminSupportPage;
