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
  Stack
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
  Close as CloseIcon
} from '@mui/icons-material';
import { SajuProfileDisplay } from '../../components/features/saju/SajuProfileDisplay';
// import { useTheme } from '@mui/material/styles';
import type { 
  StylistDetail,
  JapanesePrefecture
} from '../../types';
import { 
  TurnoverRiskLevel,
  UserRole
} from '../../types';
import { stylistService, sajuService } from '../../services';

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
  { value: UserRole.ADMIN, label: '管理者権限（全機能）' },
  { value: UserRole.OWNER, label: 'オーナー権限（請求管理含む）' }
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


const StylistManagementPage: React.FC = () => {
  const [stylists, setStylists] = useState<StylistDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [riskSummary, setRiskSummary] = useState<any>(null);
  const [prefectures, setPrefectures] = useState<JapanesePrefecture[]>([]);
  
  // モーダル状態
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sajuModalOpen, setSajuModalOpen] = useState(false);
  const [editingStylist, setEditingStylist] = useState<StylistDetail | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<StylistDetail | null>(null);
  const [sajuData, setSajuData] = useState<any>(null);
  
  // フォーム状態
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    birthDate: string;
    birthTime: string;
    birthLocation: {
      name: string;
      longitude: number | null;
      latitude: number | null;
    };
    position: string;
    role: UserRole;
    phone: string;
    password: string;
  }>({
    name: '',
    email: '',
    birthDate: '',
    birthTime: '',
    birthLocation: {
      name: '',
      longitude: null,
      latitude: null
    },
    position: '',
    role: UserRole.USER,
    phone: '',
    password: '' // パスワードフィールドを追加
  });

  // データ読み込み
  useEffect(() => {
    loadData();
    loadPrefectures();
  }, []);

  const loadPrefectures = async () => {
    try {
      const response = await sajuService.getJapanesePrefectures();
      console.log('都道府県APIレスポンス:', response);
      
      if (response.success && response.data) {
        // dataが配列の場合はそのまま、オブジェクトの場合はprefectures属性を探す
        const prefecturesData = Array.isArray(response.data) 
          ? response.data 
          : response.data.prefectures || [];
        
        console.log('都道府県データ:', prefecturesData);
        setPrefectures(prefecturesData);
      }
    } catch (error) {
      console.error('都道府県データの取得に失敗:', error);
      setPrefectures([]); // エラー時は空配列を設定
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const stylistsResponse = await stylistService.getStylists();
      console.log('スタイリストレスポンス:', stylistsResponse);
      
      if (stylistsResponse.success && stylistsResponse.data) {
        // dataがページネーション付きレスポンスの場合（バックエンドの標準形式）
        if (stylistsResponse.data.data && Array.isArray(stylistsResponse.data.data)) {
          setStylists(stylistsResponse.data.data);
        } 
        // dataが直接配列の場合（後方互換性）
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
        birthTime: stylist.birthTime || '',
        birthLocation: {
          name: stylist.birthLocation?.name || '',
          longitude: stylist.birthLocation?.longitude ?? null,
          latitude: stylist.birthLocation?.latitude ?? null,
        },
        position: stylist.position,
        role: stylist.role,
        phone: stylist.phone || '',
        password: '' // 編集時はパスワードを空に
      });
    } else {
      setEditingStylist(null);
      setFormData({
        name: '',
        email: '',
        birthDate: '',
        birthTime: '',
        birthLocation: {
          name: '',
          longitude: null,
          latitude: null
        },
        position: '',
        role: UserRole.USER,
        phone: '',
        password: ''
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
        birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined
      };

      // デバッグログ: 送信するデータの確認
      console.log('[DEBUG] フォーム送信データ:', {
        formData,
        processedData: data,
        isEditing: !!editingStylist
      });

      if (editingStylist) {
        // 編集時はパスワードが空の場合は送信しない
        const updateData: any = {
          name: data.name,
          birthDate: data.birthDate,
          birthTime: formData.birthTime || undefined,
          birthLocation: formData.birthLocation.name ? {
            name: formData.birthLocation.name,
            longitude: formData.birthLocation.longitude,
            latitude: formData.birthLocation.latitude
          } : undefined,
          position: data.position,
          role: data.role,
          phone: data.phone
        };
        
        // パスワードが入力されている場合のみ追加
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        const response = await stylistService.updateStylist(editingStylist.id, updateData);
        if (response.success) {
          alert(response.meta?.message || 'スタイリスト情報を更新しました');
        }
      } else {
        // 新規作成時も全てのデータを送信するように修正
        const inviteData = {
          email: data.email,
          role: data.role as UserRole.ADMIN | UserRole.USER | UserRole.OWNER,
          name: data.name,
          birthDate: formData.birthDate || undefined,
          phone: data.phone,
          position: data.position,
          password: formData.password // パスワードを追加
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
      console.log('四柱推命APIレスポンス:', response);
      
      if (response.success && response.data) {
        console.log('四柱推命データ詳細:', {
          fullData: response.data,
          fourPillars: response.data.fourPillars,
          yearPillar: response.data.fourPillars?.yearPillar,
          monthPillar: response.data.fourPillars?.monthPillar,
          dayPillar: response.data.fourPillars?.dayPillar,
          hourPillar: response.data.fourPillars?.hourPillar,
        });
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
            専門分野: stylist.specialties ? stylist.specialties.join(', ') : '設定なし'
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
                    ) : stylist.role === UserRole.OWNER ? (
                      <AdminIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
                    ) : (
                      <PersonIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {stylist.role === UserRole.ADMIN ? '管理者権限' : 
                       stylist.role === UserRole.OWNER ? 'オーナー権限' : '基本権限'}
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
              label="生年月日 (オプショナル)"
              type="date"
              fullWidth
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="スタイリストが後から設定できます"
            />
            <TextField
              label="出生時間 (オプショナル)"
              type="time"
              fullWidth
              value={formData.birthTime}
              onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="四柱推命の計算に使用されます (例: 12:30)"
            />
            <FormControl fullWidth>
              <InputLabel>出生地 (オプショナル)</InputLabel>
              <Select
                value={formData.birthLocation.name || ''}
                onChange={(e) => {
                  const prefecture = prefectures.find(p => p.name === e.target.value);
                  setFormData({ 
                    ...formData, 
                    birthLocation: prefecture ? {
                      name: prefecture.name,
                      longitude: prefecture.longitude,
                      latitude: prefecture.latitude
                    } : {
                      name: e.target.value,
                      longitude: null,
                      latitude: null
                    }
                  });
                }}
                label="出生地 (オプショナル)"
              >
                <MenuItem value="">
                  <em>選択なし</em>
                </MenuItem>
                {prefectures && Array.isArray(prefectures) && prefectures.map((prefecture) => (
                  <MenuItem key={prefecture.code} value={prefecture.name}>
                    {prefecture.name}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                より正確な四柱推命計算のため
              </Typography>
            </FormControl>
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
            <TextField
              label={editingStylist ? "パスワード変更 (オプショナル)" : "パスワード"}
              type="password"
              fullWidth
              required={!editingStylist}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="8文字以上で入力"
              helperText={editingStylist 
                ? "変更する場合のみ入力してください" 
                : "スタイリストの初期パスワードを設定します"}
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
        <DialogContent sx={{ pt: 2 }}>
          {sajuData ? (
            <SajuProfileDisplay 
              profile={sajuData} 
              userName={selectedStylist?.name || ''}
            />
          ) : (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography color="text.secondary">
                四柱推命データを読み込み中...
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default StylistManagementPage;