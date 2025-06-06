import React, { useState, useEffect, useCallback } from 'react';
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
  Snackbar,
  Select,
  MenuItem,
  InputLabel,
  LinearProgress,
  CircularProgress,
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
  AutoAwesomeOutlined,
} from '@mui/icons-material';
import { clientService, sajuService } from '../../services';
import type { Client, ClientCreateRequest, ClientSearchFilter, JapanesePrefecture } from '../../types';
import { SajuProfileDisplay } from '../../components/features/saju/SajuProfileDisplay';

export const ClientManagementPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [openNewClientDialog, setOpenNewClientDialog] = useState(false);
  const [openClientDetailDialog, setOpenClientDetailDialog] = useState(false);
  const [openEditClientDialog, setOpenEditClientDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [openSajuProfileDialog, setOpenSajuProfileDialog] = useState(false);
  const [sajuProfileData, setSajuProfileData] = useState<any>(null);
  const [sajuLoading, setSajuLoading] = useState(false);
  const [prefectures, setPrefectures] = useState<JapanesePrefecture[]>([]);
  const [compatibilityData, setCompatibilityData] = useState<any>(null);
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);
  
  // 新規クライアントフォームの状態
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    gender: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthTime: '',
    birthLocation: {
      name: '',
      longitude: 0,
      latitude: 0,
    },
    memo: '',
  });

  // 編集フォームの状態
  const [editClientForm, setEditClientForm] = useState<{
    name: string;
    phoneNumber: string;
    email: string;
    gender: string;
    birthYear: string;
    birthMonth: string;
    birthDay: string;
    birthTime: string;
    birthLocation: {
      name: string;
      longitude: number;
      latitude: number;
    };
    memo: string;
  }>({
    name: '',
    phoneNumber: '',
    email: '',
    gender: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthTime: '',
    birthLocation: {
      name: '',
      longitude: 0,
      latitude: 0,
    },
    memo: '',
  });

  const itemsPerPage = 6;

  // クライアント一覧を取得
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ClientSearchFilter = {
        searchTerm,
        missingBirthDate: activeFilter === 'noBirthDate',
        visitedThisMonth: activeFilter === 'thisMonth',
        isFavorite: activeFilter === 'favorite',
      };

      const response = await clientService.getClients(
        filters,
        { page, limit: itemsPerPage }
      );

      setClients(response.clients);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeFilter, page]);

  // 初期ロードとフィルター変更時の再取得
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // 都道府県データを取得
  useEffect(() => {
    const fetchPrefectures = async () => {
      try {
        const response = await sajuService.getJapanesePrefectures();
        console.log('[ClientManagementPage] Prefectures response:', response);
        setPrefectures(response.data?.prefectures || []);
      } catch (error) {
        console.error('Failed to fetch prefectures:', error);
        setPrefectures([]); // エラー時は空配列を設定
      }
    };
    fetchPrefectures();
  }, []);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
  };

  // 検索処理（デバウンス付き）
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleClientClick = async (client: Client) => {
    try {
      // 詳細情報を取得
      const detailedClient = await clientService.getClient(client.id);
      setSelectedClient(detailedClient);
      setOpenClientDetailDialog(true);
      
      // 相性データを取得
      setCompatibilityLoading(true);
      try {
        const compatibility = await clientService.getClientCompatibility(client.id);
        setCompatibilityData(compatibility);
      } catch (error) {
        console.error('相性データの取得に失敗しました', error);
        // エラーでも詳細画面は表示する
      } finally {
        setCompatibilityLoading(false);
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'クライアント情報の取得に失敗しました', severity: 'error' });
    }
  };

  // 四柱推命プロフィールを表示
  const handleViewSajuProfile = async (client: Client) => {
    setSajuLoading(true);
    try {
      const profile = await clientService.getClientSajuProfile(client.id);
      setSajuProfileData(profile);
      setOpenSajuProfileDialog(true);
    } catch (err) {
      setSnackbar({ 
        open: true, 
        message: '四柱推命プロフィールの取得に失敗しました。生年月日が登録されていない可能性があります。', 
        severity: 'error' 
      });
    } finally {
      setSajuLoading(false);
    }
  };

  // クライアント削除処理
  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('本当にこのクライアントを削除しますか？')) {
      return;
    }

    try {
      await clientService.deleteClient(clientId);
      setSnackbar({ open: true, message: 'クライアントを削除しました', severity: 'success' });
      setOpenClientDetailDialog(false);
      fetchClients();
    } catch (err) {
      setSnackbar({ open: true, message: 'クライアントの削除に失敗しました', severity: 'error' });
    }
  };

  const handleNewClientSubmit = async () => {
    try {
      // 生年月日を組み立て
      let birthDate: string | undefined;
      if (newClientForm.birthYear && newClientForm.birthMonth && newClientForm.birthDay) {
        birthDate = `${newClientForm.birthYear}-${newClientForm.birthMonth.padStart(2, '0')}-${newClientForm.birthDay.padStart(2, '0')}`;
      }

      const createRequest: ClientCreateRequest = {
        name: newClientForm.name,
        phoneNumber: newClientForm.phoneNumber || '',
        email: newClientForm.email || undefined,
        gender: newClientForm.gender as 'male' | 'female' | 'other' | undefined,
        birthDate,
        birthTime: newClientForm.birthTime || undefined,
        birthLocation: newClientForm.birthLocation.name ? newClientForm.birthLocation : undefined,
        memo: newClientForm.memo || undefined,
      };

      await clientService.createClient(createRequest);
      
      setSnackbar({ open: true, message: 'クライアントを登録しました', severity: 'success' });
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
        birthTime: '',
        birthLocation: {
          name: '',
          longitude: 0,
          latitude: 0,
        },
        memo: '',
      });
      
      // リストを再取得
      fetchClients();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'クライアントの登録に失敗しました', severity: 'error' });
    }
  };

  // クライアント更新処理
  const handleEditClientSubmit = async () => {
    if (!selectedClient) return;

    try {
      // 生年月日を組み立て
      let birthDate: string | undefined;
      if (editClientForm.birthYear && editClientForm.birthMonth && editClientForm.birthDay) {
        birthDate = `${editClientForm.birthYear}-${editClientForm.birthMonth.padStart(2, '0')}-${editClientForm.birthDay.padStart(2, '0')}`;
      }

      const updateRequest = {
        name: editClientForm.name,
        phoneNumber: editClientForm.phoneNumber || undefined,
        email: editClientForm.email || undefined,
        gender: editClientForm.gender as 'male' | 'female' | 'other' | undefined,
        birthDate,
        birthTime: editClientForm.birthTime || undefined,
        birthLocation: editClientForm.birthLocation.name ? editClientForm.birthLocation : undefined,
        memo: editClientForm.memo || undefined,
      };

      await clientService.updateClient(selectedClient.id, updateRequest);
      
      setSnackbar({ open: true, message: 'クライアント情報を更新しました', severity: 'success' });
      setOpenEditClientDialog(false);
      setOpenClientDetailDialog(false);
      
      // リストを再取得
      fetchClients();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'クライアントの更新に失敗しました', severity: 'error' });
    }
  };

  // 編集ダイアログを開く
  const handleEditClick = () => {
    if (!selectedClient) return;

    // 生年月日を分解
    let birthYear = '';
    let birthMonth = '';
    let birthDay = '';
    
    if (selectedClient.birthDate) {
      const date = new Date(selectedClient.birthDate);
      birthYear = date.getFullYear().toString();
      birthMonth = (date.getMonth() + 1).toString();
      birthDay = date.getDate().toString();
    }

    // フォームに現在の値を設定
    setEditClientForm({
      name: selectedClient.name,
      phoneNumber: selectedClient.phoneNumber || '',
      email: selectedClient.email || '',
      gender: selectedClient.gender || '',
      birthYear,
      birthMonth,
      birthDay,
      birthTime: selectedClient.birthTime || '',
      birthLocation: {
        name: selectedClient.birthLocation?.name || '',
        longitude: selectedClient.birthLocation?.longitude ?? 0,
        latitude: selectedClient.birthLocation?.latitude ?? 0,
      },
      memo: selectedClient.memo || '',
    });

    setOpenEditClientDialog(true);
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
      <Box>
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
          {clients.map((client, index) => (
              <Card
                key={client.id || `client-${index}`}
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
        {!loading && totalPages > 1 && (
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

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <TextField
                  fullWidth
                  label="出生時刻 (オプショナル)"
                  type="time"
                  value={newClientForm.birthTime}
                  onChange={(e) => setNewClientForm({ ...newClientForm, birthTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="四柱推命の計算に使用されます"
                />
                <FormControl fullWidth>
                  <InputLabel>出生地 (オプショナル)</InputLabel>
                  <Select
                    value={newClientForm.birthLocation.name || ''}
                    onChange={(e) => {
                      const prefecture = prefectures.find(p => p.name === e.target.value);
                      setNewClientForm({ 
                        ...newClientForm, 
                        birthLocation: prefecture ? {
                          name: prefecture.name,
                          longitude: prefecture.longitude || 0,
                          latitude: prefecture.latitude || 0,
                        } : {
                          name: '',
                          longitude: 0,
                          latitude: 0,
                        }
                      });
                    }}
                  >
                    <MenuItem value="">
                      <em>選択してください</em>
                    </MenuItem>
                    {prefectures && prefectures.map((prefecture) => (
                      <MenuItem key={prefecture.code} value={prefecture.name}>
                        {prefecture.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
          onClose={() => {
            setOpenClientDetailDialog(false);
            setCompatibilityData(null);
          }}
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
                    <Box>
                      <Typography variant="body2" color="text.secondary">出生時刻</Typography>
                      <Typography variant="body1">
                        {selectedClient.birthTime || '未設定'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">出生地</Typography>
                      <Typography variant="body1">
                        {selectedClient.birthLocation?.name || '未設定'}
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
                  {compatibilityLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2">相性を計算中...</Typography>
                    </Box>
                  ) : compatibilityData ? (
                    compatibilityData.message ? (
                      <Typography variant="body2" color="text.secondary">
                        {compatibilityData.message}
                      </Typography>
                    ) : compatibilityData.compatibilities.length > 0 ? (
                      <Typography variant="body2">
                        {compatibilityData.compatibilities
                          .slice(0, 3)
                          .map((comp: any) => `${comp.stylistName}（相性 ${comp.compatibilityScore}%）`)
                          .join('、')}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        相性データがありません
                      </Typography>
                    )
                  ) : null}
                </Alert>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              color="error" 
              onClick={() => selectedClient && handleDeleteClient(selectedClient.id)}
            >
              削除
            </Button>
            <Button startIcon={<Edit />} onClick={handleEditClick}>
              編集
            </Button>
            <Button 
              onClick={() => selectedClient && handleViewSajuProfile(selectedClient)}
              disabled={!selectedClient?.birthDate || sajuLoading}
              startIcon={<AutoAwesomeOutlined />}
            >
              四柱推命
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

        {/* クライアント編集ダイアログ */}
        <Dialog
          open={openEditClientDialog}
          onClose={() => setOpenEditClientDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            クライアント情報編集
            <IconButton
              onClick={() => setOpenEditClientDialog(false)}
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
                value={editClientForm.name}
                onChange={(e) => setEditClientForm({ ...editClientForm, name: e.target.value })}
              />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <TextField
                  fullWidth
                  label="電話番号"
                  value={editClientForm.phoneNumber}
                  onChange={(e) => setEditClientForm({ ...editClientForm, phoneNumber: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="メールアドレス"
                  type="email"
                  value={editClientForm.email}
                  onChange={(e) => setEditClientForm({ ...editClientForm, email: e.target.value })}
                />
              </Box>

              <FormControl>
                <FormLabel>性別</FormLabel>
                <RadioGroup
                  row
                  value={editClientForm.gender}
                  onChange={(e) => setEditClientForm({ ...editClientForm, gender: e.target.value })}
                >
                  <FormControlLabel value="male" control={<Radio />} label="男性" />
                  <FormControlLabel value="female" control={<Radio />} label="女性" />
                  <FormControlLabel value="other" control={<Radio />} label="その他" />
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
                    value={editClientForm.birthYear}
                    onChange={(e) => setEditClientForm({ ...editClientForm, birthYear: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    placeholder="月"
                    type="number"
                    value={editClientForm.birthMonth}
                    onChange={(e) => setEditClientForm({ ...editClientForm, birthMonth: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    placeholder="日"
                    type="number"
                    value={editClientForm.birthDay}
                    onChange={(e) => setEditClientForm({ ...editClientForm, birthDay: e.target.value })}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <TextField
                  fullWidth
                  label="出生時刻 (オプショナル)"
                  type="time"
                  value={editClientForm.birthTime}
                  onChange={(e) => setEditClientForm({ ...editClientForm, birthTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText="四柱推命の計算に使用されます"
                />
                <FormControl fullWidth>
                  <InputLabel>出生地 (オプショナル)</InputLabel>
                  <Select
                    value={editClientForm.birthLocation.name || ''}
                    onChange={(e) => {
                      const prefecture = prefectures.find(p => p.name === e.target.value);
                      setEditClientForm({ 
                        ...editClientForm, 
                        birthLocation: prefecture ? {
                          name: prefecture.name,
                          longitude: prefecture.longitude || 0,
                          latitude: prefecture.latitude || 0,
                        } : {
                          name: '',
                          longitude: 0,
                          latitude: 0,
                        }
                      });
                    }}
                  >
                    <MenuItem value="">
                      <em>選択してください</em>
                    </MenuItem>
                    {prefectures && prefectures.map((prefecture) => (
                      <MenuItem key={prefecture.code} value={prefecture.name}>
                        {prefecture.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                fullWidth
                label="メモ"
                multiline
                rows={3}
                placeholder="お客様の特徴や好み、注意事項など..."
                value={editClientForm.memo}
                onChange={(e) => setEditClientForm({ ...editClientForm, memo: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditClientDialog(false)}>
              キャンセル
            </Button>
            <Button variant="contained" onClick={handleEditClientSubmit}>
              更新する
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* 四柱推命プロフィールダイアログ */}
        <Dialog
          open={openSajuProfileDialog}
          onClose={() => setOpenSajuProfileDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            四柱推命プロフィール
            <IconButton
              onClick={() => setOpenSajuProfileDialog(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <Close />
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
                userName={sajuProfileData.client?.name || ''}
              />
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSajuProfileDialog(false)}>
              閉じる
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};