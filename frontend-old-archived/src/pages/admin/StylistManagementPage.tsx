import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  Badge,
  InputAdornment,
  Stack,
  Paper,
  Grid,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Psychology as PsychologyIcon,
  Email as EmailIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Warning as WarningIcon,
  CrisisAlert as CrisisAlertIcon,
  People as PeopleIcon,
  LocalFireDepartment as FireIcon,
  Landscape as EarthIcon,
  Toll as MetalIcon,
  WaterDrop as WaterIcon,
  Park as WoodIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useApi } from '../../hooks/useApi';
import { useNotification } from '../../hooks/useNotification';
import { logger } from '../../utils/logger';
import { API_PATHS, type UserProfile, type TurnoverRiskLevel, UserRole } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface StylistCardData extends UserProfile {
  appointments?: number;
  riskLevel?: TurnoverRiskLevel;
  fourPillarsProfile?: {
    birthDate: string;
    birthTime?: string;
    birthPlace?: string;
    elements: {
      fire: number;
      earth: number;
      metal: number;
      water: number;
      wood: number;
    };
    pillars: {
      year: string;
      month: string;
      day: string;
      hour: string;
    };
  };
}

export const StylistManagementPage = () => {
  const [stylists, setStylists] = useState<StylistCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStylist, setSelectedStylist] = useState<StylistCardData | null>(null);
  const [, setOpenAddDialog] = useState(false);
  const [, setOpenEditDialog] = useState(false);
  const [openSajuDialog, setOpenSajuDialog] = useState(false);
  const [alertStats, setAlertStats] = useState({
    warning: 0,
    critical: 0,
    total: 0,
  });

  const { apiCall } = useApi();
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchStylists();
  }, []);

  const fetchStylists = async () => {
    try {
      logger.info('Fetching stylists', {
        component: 'StylistManagementPage',
        action: 'fetchStylists',
      });

      const data = await apiCall<UserProfile[]>(
        API_PATHS.USERS.BASE,
        {
          method: 'GET',
        },
        {
          component: 'StylistManagementPage',
          action: 'fetchStylists',
        }
      );

      // ダミーデータを追加（実際の実装では削除）
      const enrichedData: StylistCardData[] = data.map((user, index) => ({
        ...user,
        appointments: Math.floor(Math.random() * 20) + 5,
        riskLevel: index === 0 ? 'critical' : index === 1 ? 'high' : 'low',
        fourPillarsProfile: {
          birthDate: '1988-04-15',
          birthTime: '12:30',
          birthPlace: '東京都',
          elements: {
            fire: 40,
            earth: 30,
            metal: 15,
            water: 10,
            wood: 5,
          },
          pillars: {
            year: '戊辰',
            month: '丁卯',
            day: '甲子',
            hour: '庚午',
          },
        },
      } as StylistCardData));

      setStylists(enrichedData);
      
      // アラート統計を計算
      const stats = enrichedData.reduce(
        (acc, stylist) => ({
          warning: acc.warning + (stylist.riskLevel === 'high' ? 1 : 0),
          critical: acc.critical + (stylist.riskLevel === 'critical' ? 1 : 0),
          total: enrichedData.length,
        }),
        { warning: 0, critical: 0, total: 0 }
      );
      setAlertStats(stats);

      logger.info('Stylists fetched successfully', {
        component: 'StylistManagementPage',
        action: 'fetchStylists',
        additionalInfo: { stylistCount: enrichedData.length },
      });
    } catch (error) {
      logger.error('Failed to fetch stylists', error as Error, {
        component: 'StylistManagementPage',
        action: 'fetchStylists',
      });
      showNotification('スタイリスト一覧の取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStylist = (stylist: StylistCardData) => {
    setSelectedStylist(stylist);
    setOpenEditDialog(true);
  };

  const handleDownloadReport = async (stylist: StylistCardData) => {
    try {
      logger.info('Downloading report', {
        component: 'StylistManagementPage',
        action: 'downloadReport',
        additionalInfo: { stylistId: stylist.id },
      });

      // 実際の実装ではAPIからレポートを取得
      showNotification(`${stylist.name}のレポートをダウンロード中...`, 'info');
      
      setTimeout(() => {
        showNotification('レポートのダウンロードが完了しました', 'success');
      }, 2000);
    } catch (error) {
      logger.error('Failed to download report', error as Error, {
        component: 'StylistManagementPage',
        action: 'downloadReport',
        additionalInfo: { stylistId: stylist.id },
      });
      showNotification('レポートのダウンロードに失敗しました', 'error');
    }
  };

  const handleViewSajuProfile = (stylist: StylistCardData) => {
    setSelectedStylist(stylist);
    setOpenSajuDialog(true);
  };

  const getRiskIndicatorColor = (riskLevel?: TurnoverRiskLevel) => {
    switch (riskLevel) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      default:
        return 'success';
    }
  };

  const filteredStylists = stylists.filter((stylist) =>
    stylist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      {/* ヘッダー */}
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600, color: 'primary.main' }}>
        スタイリスト管理
      </Typography>

      {/* アクションバー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flex: 1, maxWidth: 600 }}>
          <TextField
            fullWidth
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
            sx={{ minWidth: 120 }}
          >
            フィルター
          </Button>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setOpenAddDialog(true)}
        >
          新規追加
        </Button>
      </Box>

      {/* アラートサマリー */}
      <Grid container spacing={3} sx={{ mb: 4 }} {...{} as any}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">要注意スタッフ</Typography>
              </Box>
              <Typography variant="h2" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {alertStats.warning}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                離職予兆アラート発生中
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CrisisAlertIcon sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="h6">緊急対応</Typography>
              </Box>
              <Typography variant="h2" sx={{ fontWeight: 700, color: 'error.main' }}>
                {alertStats.critical}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                即座の面談推奨
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">総スタッフ数</Typography>
              </Box>
              <Typography variant="h2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {alertStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                アクティブスタイリスト
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* スタイリストカード一覧 */}
      <Grid container spacing={3} {...{} as any}>
        {filteredStylists.map((stylist) => (
          <Grid key={stylist.id} size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              sx={{
                position: 'relative',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <Badge
                color={getRiskIndicatorColor(stylist.riskLevel)}
                variant="dot"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  '& .MuiBadge-dot': { width: 12, height: 12 },
                }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: 'primary.main',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      mr: 2,
                    }}
                  >
                    {stylist.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {stylist.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stylist.role === UserRole.ADMIN ? 'シニアスタイリスト' : 'スタイリスト'}
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={1} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary">
                      {stylist.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AdminPanelSettingsIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary">
                      {stylist.role === UserRole.ADMIN ? '管理者権限' : '基本権限'}
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {stylist.appointments || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    今月担当数
                  </Typography>
                </Box>

                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PsychologyIcon />}
                      onClick={() => handleViewSajuProfile(stylist)}
                      fullWidth
                    >
                      四柱推命
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditStylist(stylist)}
                      fullWidth
                    >
                      編集
                    </Button>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadReport(stylist)}
                    fullWidth
                  >
                    レポート
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 四柱推命プロフィールダイアログ */}
      <Dialog
        open={openSajuDialog}
        onClose={() => setOpenSajuDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedStylist?.name}の四柱推命プロフィール
            </Typography>
            <IconButton onClick={() => setOpenSajuDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedStylist?.fourPillarsProfile && (
            <>
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light' }}>
                <Grid container spacing={2} {...{} as any}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      生年月日
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedStylist.fourPillarsProfile.birthDate}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      生まれた時間
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedStylist.fourPillarsProfile.birthTime || '不明'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      生まれた場所
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedStylist.fourPillarsProfile.birthPlace || '不明'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      最終更新日
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {new Date().toLocaleDateString('ja-JP')}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant="h6" sx={{ mb: 2 }}>
                五行バランス
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <ElementBox
                  icon={<FireIcon />}
                  name="火"
                  percent={selectedStylist.fourPillarsProfile.elements.fire}
                  color="#ffebee"
                  textColor="#c62828"
                />
                <ElementBox
                  icon={<EarthIcon />}
                  name="土"
                  percent={selectedStylist.fourPillarsProfile.elements.earth}
                  color="#fff3e0"
                  textColor="#ef6c00"
                />
                <ElementBox
                  icon={<MetalIcon />}
                  name="金"
                  percent={selectedStylist.fourPillarsProfile.elements.metal}
                  color="#f5f5f5"
                  textColor="#757575"
                />
                <ElementBox
                  icon={<WaterIcon />}
                  name="水"
                  percent={selectedStylist.fourPillarsProfile.elements.water}
                  color="#e3f2fd"
                  textColor="#1976d2"
                />
                <ElementBox
                  icon={<WoodIcon />}
                  name="木"
                  percent={selectedStylist.fourPillarsProfile.elements.wood}
                  color="#e8f5e9"
                  textColor="#2e7d32"
                />
              </Box>

              <Typography variant="h6" sx={{ mb: 2 }}>
                四柱
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }} {...{} as any}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <PillarCard
                    title="年柱"
                    content={selectedStylist.fourPillarsProfile.pillars.year}
                    note="陽土陽木"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <PillarCard
                    title="月柱"
                    content={selectedStylist.fourPillarsProfile.pillars.month}
                    note="陰火陰木"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <PillarCard
                    title="日柱"
                    content={selectedStylist.fourPillarsProfile.pillars.day}
                    note="陽木陽水"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <PillarCard
                    title="時柱"
                    content={selectedStylist.fourPillarsProfile.pillars.hour}
                    note="陽金陽火"
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mb: 2, color: 'primary.dark' }}>
                命式の特徴
              </Typography>
              <Typography variant="body2" paragraph>
                この方の命式は「火土」が強く、「木水」が弱い傾向があります。リーダーシップと行動力に優れ、明るく情熱的な性格です。計画的で堅実な一面もありますが、柔軟性を持つことが課題となることがあります。
              </Typography>
              <Typography variant="body2">
                お客様との相性は「水」「木」のエネルギーを持つ方と特に良い関係が築けます。また、髪型のアドバイスとして、あまり直線的で硬い印象のスタイルは避け、柔らかさや流れのあるデザインを取り入れると良いでしょう。
              </Typography>
            </>
          )}
        </DialogContent>
      </Dialog>

    </Container>
  );
};

// 五行要素コンポーネント
const ElementBox = ({
  icon,
  name,
  percent,
  color,
  textColor,
}: {
  icon: React.ReactNode;
  name: string;
  percent: number;
  color: string;
  textColor: string;
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      p: 2,
      borderRadius: 2,
      bgcolor: color,
      color: textColor,
      minWidth: 80,
    }}
  >
    <Box sx={{ fontSize: '2rem', mb: 1 }}>{icon}</Box>
    <Typography fontWeight={500}>{name}</Typography>
    <Typography variant="caption">{percent}%</Typography>
  </Box>
);

// 四柱カードコンポーネント
const PillarCard = ({
  title,
  content,
  note,
}: {
  title: string;
  content: string;
  note: string;
}) => (
  <Paper sx={{ p: 2, textAlign: 'center', border: 1, borderColor: 'divider' }}>
    <Typography variant="caption" color="text.secondary">
      {title}
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 500, color: 'primary.dark', my: 1 }}>
      {content}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {note}
    </Typography>
  </Paper>
);