import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Collapse,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  PauseCircleOutline as PauseCircleOutlineIcon,
  Business as BusinessIcon,
  // People as PeopleIcon,
  // TrendingUp as TrendingUpIcon,
  // AttachMoney as AttachMoneyIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { OrganizationStatus, OrganizationPlan } from '../../types';
import type { Organization } from '../../types';
import { organizationService } from '../../services';

interface OrganizationFormData {
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  phone?: string;
  address?: string;
  plan: OrganizationPlan;
  status: OrganizationStatus;
  tokenLimit: number;
}

const SuperAdminOrganizationsPage: React.FC = () => {
  const theme = useTheme();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrganizationStatus | ''>('');
  const [planFilter, setPlanFilter] = useState<OrganizationPlan | ''>('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showStatusWarning, setShowStatusWarning] = useState(false);
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    phone: '',
    address: '',
    plan: OrganizationPlan.STANDARD,
    status: OrganizationStatus.TRIAL,
    tokenLimit: 0,
  });

  // 組織一覧を取得
  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // SuperAdmin用のエンドポイントを使用
      const response = await organizationService.getOrganizations();
      
      if (response.success && response.data) {
        // バックエンドからのレスポンス形式に対応
        if ('organizations' in response.data && Array.isArray(response.data.organizations)) {
          // ページネーション付きレスポンス
          setOrganizations(response.data.organizations);
        } else if (Array.isArray(response.data)) {
          // 配列レスポンス
          setOrganizations(response.data);
        } else {
          console.error('予期しないレスポンス形式:', response.data);
          setOrganizations([]);
        }
        
        // 各組織の統計情報とオーナー情報を取得（必要に応じて）
        // TODO: バックエンドAPIが対応したら実装
      } else {
        setOrganizations([]);
      }
    } catch (err) {
      console.error('組織一覧の取得に失敗しました:', err);
      setError('組織一覧の取得に失敗しました');
      setOrganizations([]); // エラー時は空配列をセット
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent<OrganizationStatus | ''>) => {
    setStatusFilter(event.target.value as OrganizationStatus | '');
    setPage(0);
  };

  const handlePlanFilterChange = (event: SelectChangeEvent<OrganizationPlan | ''>) => {
    setPlanFilter(event.target.value as OrganizationPlan | '');
    setPage(0);
  };

  const handleOpenAddDialog = () => {
    setFormData({
      name: '',
      ownerName: '',
      ownerEmail: '',
      ownerPassword: '',
      phone: '',
      address: '',
      plan: OrganizationPlan.STANDARD,
      status: OrganizationStatus.TRIAL,
      tokenLimit: 0,
    });
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  const handleOpenEditDialog = async (organization: Organization) => {
    setSelectedOrganization(organization);
    
    // 組織情報からオーナー情報を取得
    const ownerName = typeof organization.ownerId === 'object' && organization.ownerId?.name 
      ? organization.ownerId.name 
      : '';
    
    setFormData({
      name: organization.name,
      ownerName: ownerName,
      ownerEmail: organization.email || '',
      ownerPassword: '', // 編集時は不要
      phone: organization.phone || '',
      address: organization.address || '',
      plan: organization.plan,
      status: organization.status,
      tokenLimit: 0, // TODO: APIから取得する必要がある
    });
    setShowStatusWarning(false);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedOrganization(null);
    setShowAdvancedSettings(false);
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      if (openAddDialog) {
        // 新規組織とオーナー同時作成
        const createData = {
          name: formData.name,
          ownerName: formData.ownerName,
          ownerEmail: formData.ownerEmail,
          ownerPassword: formData.ownerPassword,
          phone: formData.phone || '',
          address: formData.address || '',
          plan: formData.plan,
          status: formData.status,
          tokenLimit: formData.tokenLimit,
        };
        
        const response = await organizationService.createOrganizationWithOwner(createData);
        
        if (response.success) {
          alert('新規組織が作成されました！');
          handleCloseAddDialog();
          await fetchOrganizations();
        } else {
          alert('組織の作成に失敗しました');
        }
      } else if (openEditDialog && selectedOrganization) {
        // 組織情報更新
        if (formData.status === OrganizationStatus.SUSPENDED) {
          if (!window.confirm('本当にこの組織を停止中にしますか？\n組織内のすべてのユーザーがアクセスできなくなります。')) {
            return;
          }
        }
        
        const updateData = {
          name: formData.name,
          plan: formData.plan,
          status: formData.status,
        };
        
        const response = await organizationService.updateOrganization(selectedOrganization.id, updateData);
        
        if (response.success) {
          alert('組織情報が更新されました！');
          handleCloseEditDialog();
          await fetchOrganizations();
        } else {
          alert('組織情報の更新に失敗しました');
        }
      }
    } catch (error) {
      console.error('フォーム送信エラー:', error);
      alert('操作に失敗しました');
    }
  };

  const handleSuspendOrganization = async (organization: Organization) => {
    if (window.confirm(`本当に「${organization.name}」を停止しますか？\n組織内のすべてのユーザーがアクセスできなくなります。`)) {
      try {
        // APIを呼び出してステータスを停止中に変更
        const response = await organizationService.updateOrganization(organization.id, {
          status: OrganizationStatus.SUSPENDED
        });
        
        if (response.success) {
          alert(`組織「${organization.name}」を停止しました。`);
          // 組織一覧を再取得
          await fetchOrganizations();
        } else {
          alert('組織の停止に失敗しました');
        }
      } catch (error) {
        console.error('組織停止エラー:', error);
        alert('組織の停止に失敗しました');
      }
    }
  };

  const handleStatusChange = (event: SelectChangeEvent<OrganizationStatus>) => {
    const newStatus = event.target.value as OrganizationStatus;
    setFormData({ ...formData, status: newStatus });
    setShowStatusWarning(newStatus === OrganizationStatus.SUSPENDED);
  };

  // フィルタリング（organizationsが配列であることを確認）
  const filteredOrganizations = Array.isArray(organizations) 
    ? organizations.filter((org) => {
        const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || org.status === statusFilter;
        const matchesPlan = !planFilter || org.plan === planFilter;
        return matchesSearch && matchesStatus && matchesPlan;
      })
    : [];

  // ページネーション
  const paginatedOrganizations = filteredOrganizations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status: OrganizationStatus) => {
    switch (status) {
      case OrganizationStatus.ACTIVE:
        return 'success';
      case OrganizationStatus.TRIAL:
        return 'warning';
      case OrganizationStatus.SUSPENDED:
        return 'error';
      case OrganizationStatus.CANCELED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: OrganizationStatus) => {
    switch (status) {
      case OrganizationStatus.ACTIVE:
        return 'アクティブ';
      case OrganizationStatus.TRIAL:
        return 'トライアル';
      case OrganizationStatus.SUSPENDED:
        return '停止中';
      case OrganizationStatus.CANCELED:
        return 'キャンセル';
      default:
        return status;
    }
  };

  const getPlanLabel = (plan: OrganizationPlan) => {
    switch (plan) {
      case OrganizationPlan.STANDARD:
        return 'スタンダード';
      case OrganizationPlan.PROFESSIONAL:
        return 'プロフェッショナル';
      case OrganizationPlan.ENTERPRISE:
        return 'エンタープライズ';
      default:
        return plan;
    }
  };


  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon />
          組織管理画面
        </Typography>
      </Box>


      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 組織一覧 */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            bgcolor: theme.palette.mode === 'light' ? '#D1EAE2' : 'background.paper',
          }}
        >
          <Typography variant="h6" component="h2">
            組織一覧
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            sx={{ bgcolor: theme.palette.primary.main }}
          >
            新規組織追加
          </Button>
        </Box>

        {/* フィルター */}
        <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>ステータス</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="ステータス"
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value={OrganizationStatus.ACTIVE}>アクティブ</MenuItem>
                <MenuItem value={OrganizationStatus.TRIAL}>トライアル</MenuItem>
                <MenuItem value={OrganizationStatus.SUSPENDED}>停止中</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>プラン</InputLabel>
              <Select
                value={planFilter}
                onChange={handlePlanFilterChange}
                label="プラン"
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value={OrganizationPlan.STANDARD}>スタンダード</MenuItem>
                <MenuItem value={OrganizationPlan.PROFESSIONAL}>プロフェッショナル</MenuItem>
                <MenuItem value={OrganizationPlan.ENTERPRISE}>エンタープライズ</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="組織名で検索..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ flex: 1, minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        {/* テーブル */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>組織名</TableCell>
                <TableCell>オーナー</TableCell>
                <TableCell>プラン</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell align="center">スタイリスト数</TableCell>
                <TableCell>月間トークン使用量</TableCell>
                <TableCell>登録日</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      組織データを読み込み中...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      組織が見つかりません
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrganizations.map((org) => (
                  <TableRow key={org.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {org.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {typeof org.ownerId === 'object' && org.ownerId?.name 
                        ? org.ownerId.name 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPlanLabel(org.plan)}
                        size="small"
                        sx={{ bgcolor: '#C4C3D5', color: '#222222' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(org.status)}
                        color={getStatusColor(org.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      -
                    </TableCell>
                    <TableCell>
                      -
                    </TableCell>
                    <TableCell>
                      {new Date(org.createdAt).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditDialog(org)}
                        sx={{ color: theme.palette.info.main }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleSuspendOrganization(org)}
                        sx={{ color: theme.palette.error.main }}
                        title="組織を停止"
                      >
                        <PauseCircleOutlineIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredOrganizations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="表示件数:"
        />
      </Paper>

      {/* 新規組織追加ダイアログ */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>新規組織追加</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="組織名"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例：Hair Salon LUXE"
              />
              <TextField
                label="オーナー名"
                fullWidth
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="例：田中 美咲"
              />
              <TextField
                label="メールアドレス"
                type="email"
                fullWidth
                required
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                placeholder="example@salon.com"
              />
              <TextField
                label="パスワード"
                type="password"
                fullWidth
                required
                value={formData.ownerPassword}
                onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                placeholder="8文字以上（大文字・小文字・数字を含む）"
                helperText="オーナーの初期パスワードを設定してください"
              />
              <FormControl fullWidth>
                <InputLabel>プラン</InputLabel>
                <Select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value as OrganizationPlan })}
                  label="プラン"
                >
                  <MenuItem value={OrganizationPlan.STANDARD}>
                    スタンダード（¥29,700/月）
                  </MenuItem>
                  <MenuItem value={OrganizationPlan.PROFESSIONAL}>
                    プロフェッショナル（¥49,700/月）
                  </MenuItem>
                  <MenuItem value={OrganizationPlan.ENTERPRISE}>
                    エンタープライズ（¥99,700/月）
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddDialog}>キャンセル</Button>
            <Button type="submit" variant="contained">作成</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 組織編集ダイアログ */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle>組織情報編集</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {/* 基本情報 */}
              <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold', mt: 1 }}>
                基本情報
              </Typography>
              <TextField
                label="組織名"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <TextField
                label="オーナー名"
                fullWidth
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              />
              <TextField
                label="メールアドレス"
                type="email"
                fullWidth
                required
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
              />

              {/* プラン・課金設定 */}
              <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold', mt: 2 }}>
                プラン・課金設定
              </Typography>
              <FormControl fullWidth>
                <InputLabel>プラン</InputLabel>
                <Select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value as OrganizationPlan })}
                  label="プラン"
                >
                  <MenuItem value={OrganizationPlan.STANDARD}>
                    スタンダード（¥29,700/月）
                  </MenuItem>
                  <MenuItem value={OrganizationPlan.PROFESSIONAL}>
                    プロフェッショナル（¥49,700/月）
                  </MenuItem>
                  <MenuItem value={OrganizationPlan.ENTERPRISE}>
                    エンタープライズ（¥99,700/月）
                  </MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                プラン変更は次回請求時から適用されます
              </Typography>
              <TextField
                label="月間トークン上限"
                type="number"
                fullWidth
                value={formData.tokenLimit}
                onChange={(e) => setFormData({ ...formData, tokenLimit: parseInt(e.target.value) || 0 })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">トークン</InputAdornment>,
                }}
                helperText="0を設定すると無制限になります"
              />

              {/* ステータス設定 */}
              <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold', mt: 2 }}>
                ステータス設定
              </Typography>
              <FormControl fullWidth>
                <InputLabel>ステータス</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleStatusChange}
                  label="ステータス"
                >
                  <MenuItem value={OrganizationStatus.ACTIVE}>アクティブ</MenuItem>
                  <MenuItem value={OrganizationStatus.TRIAL}>トライアル</MenuItem>
                  <MenuItem value={OrganizationStatus.SUSPENDED}>停止中</MenuItem>
                </Select>
              </FormControl>
              <Collapse in={showStatusWarning}>
                <Alert severity="warning" icon={<WarningIcon />}>
                  ステータスを「停止中」に変更すると、組織内のすべてのユーザーがアクセスできなくなります
                </Alert>
              </Collapse>

              {/* 詳細設定 */}
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  cursor: 'pointer',
                }}
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" fontWeight="medium">
                    詳細設定
                  </Typography>
                  <ExpandMoreIcon
                    sx={{
                      transform: showAdvancedSettings ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                    }}
                  />
                </Box>
              </Box>
              <Collapse in={showAdvancedSettings}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="組織ID"
                    fullWidth
                    value={selectedOrganization?.id || ''}
                    InputProps={{ readOnly: true }}
                    disabled
                  />
                  <TextField
                    label="登録日"
                    fullWidth
                    value={selectedOrganization ? new Date(selectedOrganization.createdAt).toLocaleString('ja-JP') : ''}
                    InputProps={{ readOnly: true }}
                    disabled
                  />
                  <TextField
                    label="最終更新日"
                    fullWidth
                    value={selectedOrganization ? new Date(selectedOrganization.updatedAt).toLocaleString('ja-JP') : ''}
                    InputProps={{ readOnly: true }}
                    disabled
                  />
                </Box>
              </Collapse>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>キャンセル</Button>
            <Button type="submit" variant="contained">保存</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default SuperAdminOrganizationsPage;