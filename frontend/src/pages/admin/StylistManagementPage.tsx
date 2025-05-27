import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Breadcrumbs,
  Link,
  Tooltip,
  LinearProgress,
  Stack,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Email as EmailIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Psychology as PsychologyIcon,
  LocalFireDepartment as FireIcon,
  Landscape as EarthIcon,
  Toll as MetalIcon,
  WaterDrop as WaterIcon,
  Park as WoodIcon,
  Close as CloseIcon
} from '@mui/icons-material';
// import { useTheme } from '@mui/material/styles';
import type { 
  StylistDetail,
  StaffInviteRequest
} from '../../types';
import { 
  TurnoverRiskLevel,
  UserRole,
  FiveElements
} from '../../types';
import { stylistService } from '../../services';

// 役職リスト
const positionOptions = [
  { value: 'trainee', label: '研修生' },
  { value: 'junior', label: 'ジュニアスタイリスト' },
  { value: 'stylist', label: 'スタイリスト' },
  { value: 'senior', label: 'シニアスタイリスト' },
  { value: 'manager', label: 'マネージャー' }
];

// 権限レベルリスト
const permissionOptions = [
  { value: UserRole.USER, label: '基本権限（顧客管理・チャット）' },
  { value: UserRole.ADMIN, label: '管理者権限（全機能）' }
];

// 離職リスクレベルの色設定
const getRiskColor = (level: TurnoverRiskLevel) => {
  switch (level) {
    case TurnoverRiskLevel.CRITICAL:
      return 'error';
    case TurnoverRiskLevel.HIGH:
      return 'warning';
    case TurnoverRiskLevel.MEDIUM:
      return 'info';
    case TurnoverRiskLevel.LOW:
    default:
      return 'success';
  }
};

// 離職リスクレベルの日本語表示
const getRiskLabel = (level: TurnoverRiskLevel) => {
  switch (level) {
    case TurnoverRiskLevel.CRITICAL:
      return '緊急';
    case TurnoverRiskLevel.HIGH:
      return '高';
    case TurnoverRiskLevel.MEDIUM:
      return '中';
    case TurnoverRiskLevel.LOW:
    default:
      return '低';
  }
};

// 五行の色設定
const getElementColor = (element: FiveElements) => {
  switch (element) {
    case FiveElements.FIRE:
      return '#ff5252';
    case FiveElements.EARTH:
      return '#ff9800';
    case FiveElements.METAL:
      return '#9e9e9e';
    case FiveElements.WATER:
      return '#2196f3';
    case FiveElements.WOOD:
      return '#4caf50';
  }
};

// 五行のアイコン取得
const getElementIcon = (element: FiveElements) => {
  switch (element) {
    case FiveElements.FIRE:
      return <FireIcon />;
    case FiveElements.EARTH:
      return <EarthIcon />;
    case FiveElements.METAL:
      return <MetalIcon />;
    case FiveElements.WATER:
      return <WaterIcon />;
    case FiveElements.WOOD:
      return <WoodIcon />;
  }
};

const StylistManagementPage: React.FC = () => {
  const [stylists, setStylists] = useState<StylistDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [riskSummary, setRiskSummary] = useState<any>(null);
  
  // モーダル状態
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sajuModalOpen, setSajuModalOpen] = useState(false);
  const [editingStylist, setEditingStylist] = useState<StylistDetail | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<StylistDetail | null>(null);
  const [sajuData, setSajuData] = useState<any>(null);
  
  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthDate: '',
    position: '',
    role: UserRole.USER,
    phone: ''
  });

  // データ読み込み
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const stylistsResponse = await stylistService.getStylists();
      console.log('スタイリストレスポンス:', stylistsResponse);
      
      if (stylistsResponse.success && stylistsResponse.data) {
        // dataがページネーション付きレスポンスの場合
        if ('users' in stylistsResponse.data && Array.isArray(stylistsResponse.data.users)) {
          setStylists(stylistsResponse.data.users);
        } 
        // dataが直接配列の場合
        else if (Array.isArray(stylistsResponse.data)) {
          setStylists(stylistsResponse.data);
        } 
        // それ以外の場合は空配列
        else {
          console.error('予期しないレスポンス形式:', stylistsResponse.data);
          setStylists([]);
        }
      } else {
        console.error('スタイリスト一覧の取得に失敗:', stylistsResponse);
        setStylists([]);
      }

      const summaryResponse = await stylistService.getTurnoverRiskSummary();
      if (summaryResponse.success && summaryResponse.data) {
        setRiskSummary(summaryResponse.data);
      } else {
        console.error('離職リスクサマリーの取得に失敗:', summaryResponse);
        // デフォルト値を設定
        setRiskSummary({ high: 0, medium: 0, low: 0, total: 0 });
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      // エラー時はデフォルト値を設定
      setStylists([]);
      setRiskSummary({ high: 0, medium: 0, low: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // 検索フィルター処理
  const filteredStylists = stylists.filter(stylist =>
    stylist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stylist.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // モーダル操作
  const handleOpenAddModal = (stylist?: StylistDetail) => {
    if (stylist) {
      setEditingStylist(stylist);
      setFormData({
        name: stylist.name,
        email: stylist.email,
        birthDate: stylist.birthDate ? new Date(stylist.birthDate).toISOString().split('T')[0] : '',
        position: stylist.position,
        role: stylist.role,
        phone: stylist.phone || ''
      });
    } else {
      setEditingStylist(null);
      setFormData({
        name: '',
        email: '',
        birthDate: '',
        position: '',
        role: UserRole.USER,
        phone: ''
      });
    }
    setAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setAddModalOpen(false);
    setEditingStylist(null);
  };

  // フォーム送信処理
  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        birthDate: formData.birthDate || undefined
      };

      // デバッグログ: 送信するデータの確認
      console.log('[DEBUG] フォーム送信データ:', {
        formData,
        processedData: data,
        isEditing: !!editingStylist
      });

      if (editingStylist) {
        const response = await stylistService.updateStylist(editingStylist.id, data);
        if (response.success) {
          alert(response.meta?.message || 'スタイリスト情報を更新しました');
        }
      } else {
        // 新規作成時も全てのデータを送信するように修正
        const inviteData = {
          email: data.email,
          role: data.role as UserRole.ADMIN | UserRole.USER,
          name: data.name,
          birthDate: formData.birthDate || undefined,
          phone: data.phone,
          position: data.position
        };
        console.log('[DEBUG] 新規作成送信データ:', inviteData);
        const response = await stylistService.createStylist(inviteData);
        if (response.success) {
          alert(response.meta?.message || '新規スタイリストを登録しました');
        }
      }

      handleCloseAddModal();
      loadData();
    } catch (error: any) {
      console.error('保存エラー:', error);
      
      // エラーレスポンスの詳細を表示
      if (error.response?.data) {
        console.error('エラー詳細:', error.response.data);
        const errorMessage = error.response.data.meta?.message || 
                           error.response.data.errors?.[0]?.message || 
                           '保存中にエラーが発生しました';
        alert(errorMessage);
      } else {
        alert('保存中にエラーが発生しました');
      }
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!editingStylist) return;

    if (confirm(`${editingStylist.name}を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
      try {
        const response = await stylistService.deleteStylist(editingStylist.id);
        if (response.success) {
          alert(response.meta?.message || 'スタイリストを削除しました');
          handleCloseAddModal();
          loadData();
        }
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除中にエラーが発生しました');
      }
    }
  };

  // 四柱推命プロフィール表示
  const handleViewSajuProfile = async (stylist: StylistDetail) => {
    setSelectedStylist(stylist);
    try {
      const response = await stylistService.getStylistFourPillars(stylist.id);
      if (response.success && response.data) {
        setSajuData(response.data);
        setSajuModalOpen(true);
      }
    } catch (error) {
      console.error('四柱推命データ取得エラー:', error);
      alert('四柱推命データの取得に失敗しました');
    }
  };

  // レポートダウンロード
  const handleDownloadReport = async (stylist: StylistDetail) => {
    try {
      // 現在の月の開始日と終了日を設定
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];
      
      const response = await stylistService.getStylistReport(stylist.id, startDate, endDate);
      if (response.success && response.data) {
        const report = response.data;
        
        // レポートデータをJSON形式でダウンロード
        const reportContent = {
          スタイリスト情報: {
            名前: stylist.name,
            役職: stylist.position,
            勤続年数: stylist.yearsOfService + '年',
            専門分野: stylist.specialties.join(', ')
          },
          期間: {
            開始: startDate,
            終了: endDate
          },
          実績: {
            予約総数: report.totalAppointments || 0,
            売上: report.revenueGenerated ? `¥${report.revenueGenerated.toLocaleString()}` : '---',
            顧客満足度: report.clientSatisfactionScore ? `${report.clientSatisfactionScore}/5.0` : '---'
          },
          離職リスク: {
            レベル: getRiskLabel(stylist.turnoverRiskLevel),
            月間予約数: stylist.monthlyAppointments
          },
          四柱推命分析: report.fourPillarsAnalysis ? '含まれています' : '含まれていません'
        };
        
        // JSONをBlobとしてダウンロード
        const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stylist_report_${stylist.name}_${startDate}_${endDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        alert(`${stylist.name}さんのレポートがダウンロードされました。`);
      }
    } catch (error) {
      console.error('レポートダウンロードエラー:', error);
      alert('レポートのダウンロードに失敗しました');
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* パンくずリスト */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 2 }}
      >
        <Link
          color="inherit"
          href="/admin/dashboard"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          ダッシュボード
        </Link>
        <Typography color="text.primary">スタイリスト管理</Typography>
      </Breadcrumbs>

      {/* ページタイトル */}
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        スタイリスト管理
      </Typography>

      {/* アクションバー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, maxWidth: 500 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="スタイリスト名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            フィルター
          </Button>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenAddModal()}
        >
          新規追加
        </Button>
      </Box>

      {/* アラートサマリー */}
      {riskSummary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WarningIcon color="warning" />
                  <Typography variant="h6">要注意スタッフ</Typography>
                </Box>
                <Typography variant="h3" sx={{ color: 'warning.main', fontWeight: 700 }}>
                  {riskSummary.high}
                </Typography>
                <Typography color="text.secondary">離職予兆アラート発生中</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ErrorIcon color="error" />
                  <Typography variant="h6">緊急対応</Typography>
                </Box>
                <Typography variant="h3" sx={{ color: 'error.main', fontWeight: 700 }}>
                  {riskSummary.critical}
                </Typography>
                <Typography color="text.secondary">即座の面談推奨</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={{ borderLeft: 4, borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon color="primary" />
                  <Typography variant="h6">総スタッフ数</Typography>
                </Box>
                <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {riskSummary.totalActive}
                </Typography>
                <Typography color="text.secondary">アクティブスタイリスト</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* スタイリストカード一覧 */}
      <Grid container spacing={3}>
        {filteredStylists.map((stylist) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={stylist.id}>
            <Card
              sx={{
                position: 'relative',
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              {/* 離職リスクインジケーター */}
              <Tooltip title={`離職リスク: ${getRiskLabel(stylist.turnoverRiskLevel)}`}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: `${getRiskColor(stylist.turnoverRiskLevel)}.main`
                  }}
                />
              </Tooltip>

              <CardContent>
                {/* スタイリストヘッダー */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: 'primary.main',
                      fontSize: '1.5rem',
                      fontWeight: 700
                    }}
                  >
                    {stylist.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {stylist.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stylist.position} ({stylist.yearsOfService}年目)
                    </Typography>
                  </Box>
                </Box>

                {/* 詳細情報 */}
                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary">
                      {stylist.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {stylist.role === UserRole.ADMIN ? (
                      <AdminIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    ) : (
                      <PersonIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {stylist.role === UserRole.ADMIN ? '管理者権限' : '基本権限'}
                    </Typography>
                  </Box>
                </Stack>

                {/* 統計情報 */}
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    {stylist.monthlyAppointments}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    今月担当数
                  </Typography>
                </Box>

                {/* アクションボタン */}
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PsychologyIcon />}
                    onClick={() => handleViewSajuProfile(stylist)}
                    sx={{ flex: 1 }}
                  >
                    四柱推命
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenAddModal(stylist)}
                    sx={{ flex: 1 }}
                  >
                    編集
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadReport(stylist)}
                    sx={{ flex: 1 }}
                  >
                    レポート
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 新規追加/編集モーダル */}
      <Dialog
        open={addModalOpen}
        onClose={handleCloseAddModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: 'primary.main' }}>
              {editingStylist ? `${editingStylist.name}の情報編集` : '新規スタイリスト追加'}
            </Typography>
            <IconButton onClick={handleCloseAddModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="氏名"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例: 山田 花子"
            />
            <TextField
              label="生年月日"
              type="date"
              fullWidth
              required
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth required>
              <InputLabel>役職</InputLabel>
              <Select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                label="役職"
              >
                {positionOptions.map((option) => (
                  <MenuItem key={option.value} value={option.label}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="メールアドレス"
              type="email"
              fullWidth
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="例: hanako@example.com"
            />
            <FormControl fullWidth>
              <InputLabel>権限レベル</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                label="権限レベル"
              >
                {permissionOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="電話番号"
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="例: 090-1234-5678"
            />
          </Stack>

          {editingStylist && (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              sx={{ mt: 3 }}
            >
              このスタイリストを削除
            </Button>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddModal}>キャンセル</Button>
          <Button onClick={handleSubmit} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 四柱推命モーダル */}
      <Dialog
        open={sajuModalOpen}
        onClose={() => setSajuModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: 'primary.main' }}>
              {selectedStylist?.name}の四柱推命プロフィール
            </Typography>
            <IconButton onClick={() => setSajuModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {sajuData && (
            <>
              {/* 生年月日情報 */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">生年月日</Typography>
                    <Typography variant="body1">
                      {selectedStylist?.birthDate ? new Date(selectedStylist.birthDate).toLocaleDateString('ja-JP') : '未設定'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">生まれた時間</Typography>
                    <Typography variant="body1">12:30</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">生まれた場所</Typography>
                    <Typography variant="body1">東京都</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">最終更新日</Typography>
                    <Typography variant="body1">
                      {new Date().toLocaleDateString('ja-JP')}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* 五行バランス */}
              {sajuData.elementBalance && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>五行バランス</Typography>
                  <Grid container spacing={2}>
                    {Object.entries(sajuData.elementBalance).map(([element, percent]) => {
                      if (element === 'mainElement' || element === 'isBalanced') return null;
                      return (
                        <Grid key={element}>
                          <Paper
                            sx={{
                              p: 2,
                              textAlign: 'center',
                              bgcolor: `${getElementColor(element as FiveElements)}20`,
                              color: getElementColor(element as FiveElements)
                            }}
                          >
                            <Box sx={{ fontSize: '2rem', mb: 1 }}>
                              {getElementIcon(element as FiveElements)}
                            </Box>
                            <Typography variant="h6">
                              {element === 'fire' ? '火' : element === 'earth' ? '土' : element === 'metal' ? '金' : element === 'water' ? '水' : '木'}
                            </Typography>
                            <Typography variant="body2">{percent as number}%</Typography>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

              {/* 四柱データ */}
              {sajuData.fourPillars && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>四柱命式</Typography>
                  <Grid container spacing={2}>
                    {['year', 'month', 'day', 'hour'].map((pillar) => {
                      const data = sajuData.fourPillars[`${pillar}Pillar`];
                      return (
                        <Grid size={{ xs: 6, sm: 3 }} key={pillar}>
                          <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                {pillar === 'year' ? '年柱' : pillar === 'month' ? '月柱' : pillar === 'day' ? '日柱' : '時柱'}
                              </Typography>
                              <Typography variant="h5" sx={{ color: 'primary.main', my: 1 }}>
                                {data.stem}{data.branch}
                              </Typography>
                              <Typography variant="caption">
                                {data.yinYang === 'yang' ? '陽' : '陰'}{data.element === 'fire' ? '火' : data.element === 'earth' ? '土' : data.element === 'metal' ? '金' : data.element === 'water' ? '水' : '木'}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

              {/* 分析結果 */}
              {sajuData.analysis && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    命式の特徴
                  </Typography>
                  <Typography paragraph>{sajuData.analysis.characteristics}</Typography>
                  <Typography paragraph>{sajuData.analysis.advice}</Typography>
                  <Typography>{sajuData.analysis.stylingAdvice}</Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default StylistManagementPage;