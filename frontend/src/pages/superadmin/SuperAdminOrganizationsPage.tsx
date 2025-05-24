import React, { useState, useEffect } from 'react';
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
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Collapse,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Grid } from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
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
import { mockOrganizations, mockOrganizationOwners, mockOrganizationStats, mockSuperAdminStats } from '../../services/mock/data/mockOrganizations';

interface OrganizationFormData {
  name: string;
  displayName: string;
  ownerName: string;
  ownerEmail: string;
  plan: OrganizationPlan;
  status: OrganizationStatus;
  tokenLimit: number;
}

const SuperAdminOrganizationsPage: React.FC = () => {
  const theme = useTheme();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
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
    displayName: '',
    ownerName: '',
    ownerEmail: '',
    plan: OrganizationPlan.STANDARD,
    status: OrganizationStatus.TRIAL,
    tokenLimit: 0,
  });

  useEffect(() => {
    // モックデータを読み込み
    setOrganizations(mockOrganizations);
  }, []);

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
      displayName: '',
      ownerName: '',
      ownerEmail: '',
      plan: OrganizationPlan.STANDARD,
      status: OrganizationStatus.TRIAL,
      tokenLimit: 0,
    });
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  const handleOpenEditDialog = (organization: Organization) => {
    const owner = mockOrganizationOwners[organization.ownerId];
    const stats = mockOrganizationStats[organization.id];
    setSelectedOrganization(organization);
    setFormData({
      name: organization.name,
      displayName: organization.displayName || '',
      ownerName: owner?.name || '',
      ownerEmail: owner?.email || '',
      plan: organization.plan,
      status: organization.status,
      tokenLimit: stats?.tokenLimit || 0,
    });
    setShowStatusWarning(false);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedOrganization(null);
    setShowAdvancedSettings(false);
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (openAddDialog) {
      // 新規組織追加
      alert('新規組織が作成されました！');
      handleCloseAddDialog();
    } else if (openEditDialog) {
      // 組織情報更新
      if (formData.status === OrganizationStatus.SUSPENDED) {
        if (window.confirm('本当にこの組織を停止中にしますか？\n組織内のすべてのユーザーがアクセスできなくなります。')) {
          alert('組織情報が更新されました！');
          handleCloseEditDialog();
        }
      } else {
        alert('組織情報が更新されました！');
        handleCloseEditDialog();
      }
    }
  };

  const handleStatusChange = (event: SelectChangeEvent<OrganizationStatus>) => {
    const newStatus = event.target.value as OrganizationStatus;
    setFormData({ ...formData, status: newStatus });
    setShowStatusWarning(newStatus === OrganizationStatus.SUSPENDED);
  };

  // フィルタリング
  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || org.status === statusFilter;
    const matchesPlan = !planFilter || org.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

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

  const formatTokenUsage = (usage: number, limit: number) => {
    const usageK = Math.floor(usage / 1000);
    const limitK = limit > 0 ? Math.floor(limit / 1000) : '∞';
    return `${usageK}K / ${limitK}${limit > 0 ? 'K' : ''}`;
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

      {/* 統計情報 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.primary.main}` }}>
            <CardContent>
              <Typography variant="h3" component="div" color="primary" sx={{ fontWeight: 'bold' }}>
                {mockSuperAdminStats.totalOrganizations}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                総組織数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.primary.main}` }}>
            <CardContent>
              <Typography variant="h3" component="div" color="primary" sx={{ fontWeight: 'bold' }}>
                {mockSuperAdminStats.activeOrganizations}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                アクティブ組織
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.primary.main}` }}>
            <CardContent>
              <Typography variant="h3" component="div" color="primary" sx={{ fontWeight: 'bold' }}>
                {mockSuperAdminStats.trialOrganizations}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                トライアル中
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: `4px solid ${theme.palette.primary.main}` }}>
            <CardContent>
              <Typography variant="h3" component="div" color="primary" sx={{ fontWeight: 'bold' }}>
                ¥{mockSuperAdminStats.monthlyRevenue.toLocaleString()}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                今月の売上
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small">
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
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small">
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
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="組織名で検索..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
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
              {paginatedOrganizations.map((org) => {
                const owner = mockOrganizationOwners[org.ownerId];
                const stats = mockOrganizationStats[org.id];
                return (
                  <TableRow key={org.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {org.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{owner?.name || '-'}</TableCell>
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
                      {stats?.totalStylists || 0}名
                    </TableCell>
                    <TableCell>
                      {formatTokenUsage(stats?.tokenUsage || 0, stats?.tokenLimit || 0)}
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
                        sx={{ color: theme.palette.error.main }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
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
                    label="最終ログイン"
                    fullWidth
                    value={selectedOrganization && mockOrganizationOwners[selectedOrganization.ownerId]?.lastLoginAt
                      ? new Date(mockOrganizationOwners[selectedOrganization.ownerId].lastLoginAt!).toLocaleString('ja-JP')
                      : '-'}
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