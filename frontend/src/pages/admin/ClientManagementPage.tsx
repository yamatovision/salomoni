import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  Alert,
  Divider,
} from '@mui/material';
import {
  Search,
  Add,
  CloudUpload,
  Cake,
  Email,
  EventNote,
  Edit,
  Close,
  CheckCircle,
  Warning,
  Favorite,
} from '@mui/icons-material';
import { mockClients, searchClients } from '../../services/mock/data/mockClients';
import type { Client } from '../../types';

export const ClientManagementPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [openNewClientDialog, setOpenNewClientDialog] = useState(false);
  const [openClientDetailDialog, setOpenClientDetailDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  
  // 新規クライアントフォームの状態
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    gender: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthHour: '',
    birthMinute: '',
    memo: '',
  });

  const itemsPerPage = 6;

  // フィルター設定
  const filters = {
    birthDateMissing: activeFilter === 'noBirthDate',
    visitedThisMonth: activeFilter === 'thisMonth',
    isFavorite: activeFilter === 'favorite',
  };

  // クライアントをフィルタリング
  const filteredClients = useMemo(() => {
    return searchClients(mockClients, searchTerm, filters);
  }, [searchTerm, activeFilter]);

  // ページネーション
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setOpenClientDetailDialog(true);
  };

  const handleNewClientSubmit = () => {
    // 新規クライアント登録処理（モック）
    console.log('新規クライアント登録:', newClientForm);
    setOpenNewClientDialog(false);
    // フォームをリセット
    setNewClientForm({
      name: '',
      phoneNumber: '',
      email: '',
      gender: '',
      birthYear: '',
      birthMonth: '',
      birthDay: '',
      birthHour: '',
      birthMinute: '',
      memo: '',
    });
  };

  const getClientInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0].charAt(0) + names[1].charAt(0);
    }
    return name.substring(0, 2);
  };

  const formatAge = (birthDate?: Date) => {
    if (!birthDate) return '年齢不明';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age}歳`;
  };

  return (
    <Container maxWidth="lg">
        {/* ヘッダー */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight="bold">
            クライアント管理
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              onClick={() => setOpenImportDialog(true)}
            >
              インポート
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenNewClientDialog(true)}
            >
              新規クライアント
            </Button>
          </Stack>
        </Box>

        {/* 検索ボックス */}
        <TextField
          fullWidth
          placeholder="クライアント名、電話番号で検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        {/* フィルターチップ */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="すべて"
            onClick={() => handleFilterChange('all')}
            color={activeFilter === 'all' ? 'primary' : 'default'}
            icon={<CheckCircle />}
          />
          <Chip
            label="誕生日未設定"
            onClick={() => handleFilterChange('noBirthDate')}
            color={activeFilter === 'noBirthDate' ? 'primary' : 'default'}
            icon={<Warning />}
          />
          <Chip
            label="今月来店"
            onClick={() => handleFilterChange('thisMonth')}
            color={activeFilter === 'thisMonth' ? 'primary' : 'default'}
            icon={<EventNote />}
          />
          <Chip
            label="お気に入り"
            onClick={() => handleFilterChange('favorite')}
            color={activeFilter === 'favorite' ? 'primary' : 'default'}
            icon={<Favorite />}
          />
        </Box>

        {/* クライアントリスト */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {paginatedClients.map((client) => (
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleClientClick(client)}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {getClientInitials(client.name)}
                    </Avatar>
                  }
                  title={client.name}
                  subheader={client.phoneNumber}
                  action={
                    client.visitCount >= 10 && (
                      <IconButton size="small">
                        <Favorite fontSize="small" color="primary" />
                      </IconButton>
                    )
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Cake fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {client.birthDate
                        ? `${new Date(client.birthDate).toLocaleDateString('ja-JP')} (${formatAge(client.birthDate)})`
                        : '誕生日未設定'}
                    </Typography>
                  </Box>
                  {client.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {client.email}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      来店回数: {client.visitCount}回
                    </Typography>
                    {client.lastVisitDate && (
                      <Typography variant="caption" color="text.secondary">
                        最終来店: {new Date(client.lastVisitDate).toLocaleDateString('ja-JP')}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
          ))}
        </Box>

        {/* ページネーション */}
        {totalPages > 1 && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}

        {/* 新規クライアント登録ダイアログ */}
        <Dialog
          open={openNewClientDialog}
          onClose={() => setOpenNewClientDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            新規クライアント登録
            <IconButton
              onClick={() => setOpenNewClientDialog(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="お名前"
                required
                value={newClientForm.name}
                onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
              />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <TextField
                  fullWidth
                  label="電話番号"
                  value={newClientForm.phoneNumber}
                  onChange={(e) => setNewClientForm({ ...newClientForm, phoneNumber: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="メールアドレス"
                  type="email"
                  value={newClientForm.email}
                  onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                />
              </Box>

              <FormControl>
                <FormLabel>性別</FormLabel>
                <RadioGroup
                  row
                  value={newClientForm.gender}
                  onChange={(e) => setNewClientForm({ ...newClientForm, gender: e.target.value })}
                >
                  <FormControlLabel value="male" control={<Radio />} label="男性" />
                  <FormControlLabel value="female" control={<Radio />} label="女性" />
                </RadioGroup>
              </FormControl>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  生年月日
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="西暦"
                    type="number"
                    value={newClientForm.birthYear}
                    onChange={(e) => setNewClientForm({ ...newClientForm, birthYear: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    placeholder="月"
                    type="number"
                    value={newClientForm.birthMonth}
                    onChange={(e) => setNewClientForm({ ...newClientForm, birthMonth: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    placeholder="日"
                    type="number"
                    value={newClientForm.birthDay}
                    onChange={(e) => setNewClientForm({ ...newClientForm, birthDay: e.target.value })}
                  />
                </Box>
              </Box>

              <TextField
                fullWidth
                label="メモ"
                multiline
                rows={3}
                placeholder="お客様の特徴や好み、注意事項など..."
                value={newClientForm.memo}
                onChange={(e) => setNewClientForm({ ...newClientForm, memo: e.target.value })}
              />

              <Alert severity="info" icon={false}>
                🧠 AIメモリ（自動学習）
                <Typography variant="body2" sx={{ mt: 1 }}>
                  AIとの会話から自動的に抽出された重要情報が表示されます。
                </Typography>
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenNewClientDialog(false)}>
              キャンセル
            </Button>
            <Button variant="contained" onClick={handleNewClientSubmit}>
              登録する
            </Button>
          </DialogActions>
        </Dialog>

        {/* クライアント詳細ダイアログ */}
        <Dialog
          open={openClientDetailDialog}
          onClose={() => setOpenClientDetailDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            クライアント詳細
            <IconButton
              onClick={() => setOpenClientDetailDialog(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {selectedClient && (
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32 }}>
                    {getClientInitials(selectedClient.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{selectedClient.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedClient.phoneNumber} | {selectedClient.email || 'メール未登録'}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    基本情報
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">性別</Typography>
                      <Typography variant="body1">
                        {selectedClient.gender === 'male' ? '男性' : selectedClient.gender === 'female' ? '女性' : '未設定'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">生年月日</Typography>
                      <Typography variant="body1">
                        {selectedClient.birthDate
                          ? `${new Date(selectedClient.birthDate).toLocaleDateString('ja-JP')} (${formatAge(selectedClient.birthDate)})`
                          : '未設定'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">来店回数</Typography>
                      <Typography variant="body1">{selectedClient.visitCount}回</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">最終来店日</Typography>
                      <Typography variant="body1">
                        {selectedClient.lastVisitDate
                          ? new Date(selectedClient.lastVisitDate).toLocaleDateString('ja-JP')
                          : '記録なし'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {selectedClient.memo && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        メモ
                      </Typography>
                      <Typography variant="body2">{selectedClient.memo}</Typography>
                    </Box>
                  </>
                )}

                <Divider />

                <Alert severity="success">
                  <Typography variant="subtitle2" gutterBottom>
                    相性の良いスタイリスト
                  </Typography>
                  <Typography variant="body2">
                    山本 健太（相性 95%）、中村 美香（相性 88%）
                  </Typography>
                </Alert>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button startIcon={<Edit />} onClick={() => setOpenClientDetailDialog(false)}>
              編集
            </Button>
            <Button variant="contained" onClick={() => setOpenClientDetailDialog(false)}>
              閉じる
            </Button>
          </DialogActions>
        </Dialog>

        {/* インポートダイアログ */}
        <Dialog
          open={openImportDialog}
          onClose={() => setOpenImportDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            クライアントデータのインポート
            <IconButton
              onClick={() => setOpenImportDialog(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <FormLabel>インポート方法を選択</FormLabel>
              <RadioGroup defaultValue="hotpepper" sx={{ mt: 2 }}>
                <FormControlLabel
                  value="hotpepper"
                  control={<Radio />}
                  label="ホットペッパービューティーから連携"
                />
                <FormControlLabel
                  value="salonanswer"
                  control={<Radio />}
                  label="サロンアンサーから連携"
                />
                <FormControlLabel
                  value="googlecalendar"
                  control={<Radio />}
                  label="Googleカレンダーから連携"
                />
                <FormControlLabel
                  value="csv"
                  control={<Radio />}
                  label="CSVファイルをアップロード"
                />
              </RadioGroup>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenImportDialog(false)}>
              キャンセル
            </Button>
            <Button variant="contained" startIcon={<CloudUpload />}>
              インポート開始
            </Button>
          </DialogActions>
        </Dialog>
    </Container>
  );
};