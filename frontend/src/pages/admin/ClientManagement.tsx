import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Button,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import {
  Search,
  Add,
  Edit,
  Chat,
  Psychology,
  CalendarMonth,
  LocalFireDepartment,
  Water,
  Park,
  Landscape,
  AutoAwesome,
  Close,
} from '@mui/icons-material';
import { useApi } from '../../hooks/useApi';
import { type Client as BaseClient } from '../../types';
import { logger } from '../../utils/logger';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

// クライアント管理ページ用の拡張型
interface ClientExtended extends BaseClient {
  phone?: string;
  fourPillarsData?: {
    element: string;
    characterType?: string;
  };
}

interface ClientDetailModalProps {
  open: boolean;
  onClose: () => void;
  client: ClientExtended | null;
}

const getElementIcon = (element: string) => {
  const icons: Record<string, React.ReactElement> = {
    '火': <LocalFireDepartment sx={{ color: '#ef9a9a' }} />,
    '水': <Water sx={{ color: '#90caf9' }} />,
    '木': <Park sx={{ color: '#a5d6a7' }} />,
    '土': <Landscape sx={{ color: '#ffe082' }} />,
    '金': <AutoAwesome sx={{ color: '#e0e0e0' }} />,
  };
  return icons[element] || <AutoAwesome />;
};

const ClientDetailModal = ({ open, onClose, client }: ClientDetailModalProps) => {
  const [tabValue, setTabValue] = useState(0);

  if (!client) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">クライアント詳細</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size="auto">
              <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                {client.name.charAt(0)}
              </Avatar>
            </Grid>
            <Grid size="grow">
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {client.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  label={`${client.fourPillarsData?.element || '不明'}行`}
                  size="small"
                  icon={getElementIcon(client.fourPillarsData?.element || '')}
                />
                <Chip
                  label={client.gender === 'male' ? '男性' : '女性'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label="基本情報" />
          <Tab label="命式情報" />
          <Tab label="AIメモリ" />
          <Tab label="来店履歴" />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  生年月日
                </Typography>
                <Typography variant="body1">
                  {client.birthDate ? new Date(client.birthDate).toLocaleDateString('ja-JP') : '未登録'}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  メールアドレス
                </Typography>
                <Typography variant="body1">
                  {client.email || '未登録'}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  電話番号
                </Typography>
                <Typography variant="body1">
                  {client.phone || '未登録'}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  登録日
                </Typography>
                <Typography variant="body1">
                  {new Date(client.createdAt).toLocaleDateString('ja-JP')}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 1 && client.fourPillarsData && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              四柱推命データ
            </Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" color="text.secondary">
                    主要エレメント
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    {getElementIcon(client.fourPillarsData.element)}
                    <Typography variant="h6">
                      {client.fourPillarsData.element}行
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid size={6}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" color="text.secondary">
                    性格タイプ
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {client.fourPillarsData.characterType || '分析中'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="body1" color="text.secondary">
              AIメモリ機能は準備中です。
            </Typography>
          </Box>
        )}

        {tabValue === 3 && (
          <Box>
            <Typography variant="body1" color="text.secondary">
              来店履歴機能は準備中です。
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
        <Button variant="contained" startIcon={<Chat />}>
          AIに相談
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const ClientManagement = () => {
  const {  } = useApi();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientExtended[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientExtended | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      logger.info('Fetching clients', {
        component: 'ClientManagement',
        action: 'fetchClients',
      });

      setLoading(true);

      // TODO: 実際のAPIコールに置き換える
      const mockClients: ClientExtended[] = [
        {
          id: '1',
          name: '佐藤 美咲',
          email: 'sato@example.com',
          phone: '090-1234-5678',
          gender: 'female',
          birthDate: new Date('1990-05-15'),
          organizationId: 'org1',
          visitCount: 3,
          fourPillarsData: {
            element: '火',
            characterType: '情熱的',
          },
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          name: '田中 裕子',
          email: 'tanaka@example.com',
          phone: '090-2345-6789',
          gender: 'female',
          birthDate: new Date('1985-08-20'),
          organizationId: 'org1',
          visitCount: 5,
          fourPillarsData: {
            element: '土',
            characterType: '安定志向',
          },
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-01'),
        },
        {
          id: '3',
          name: '山本 健太',
          email: 'yamamoto@example.com',
          phone: '090-3456-7890',
          gender: 'male',
          birthDate: new Date('1992-03-10'),
          organizationId: 'org1',
          visitCount: 2,
          fourPillarsData: {
            element: '金',
            characterType: '論理的',
          },
          createdAt: new Date('2024-02-15'),
          updatedAt: new Date('2024-02-15'),
        },
        {
          id: '4',
          name: '鈴木 花子',
          email: 'suzuki@example.com',
          gender: 'female',
          birthDate: new Date('1988-11-25'),
          organizationId: 'org1',
          visitCount: 1,
          fourPillarsData: {
            element: '水',
            characterType: '柔軟性',
          },
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date('2024-03-01'),
        },
        {
          id: '5',
          name: '高橋 太郎',
          email: 'takahashi@example.com',
          phone: '090-4567-8901',
          gender: 'male',
          birthDate: new Date('1995-07-30'),
          organizationId: 'org1',
          visitCount: 4,
          fourPillarsData: {
            element: '木',
            characterType: '成長志向',
          },
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date('2024-03-10'),
        },
      ];

      setClients(mockClients);

      logger.info('Clients fetched successfully', {
        component: 'ClientManagement',
        action: 'fetchClients',
        additionalInfo: { count: mockClients.length },
      });
    } catch (error) {
      logger.error('Failed to fetch clients', error as Error, {
        component: 'ClientManagement',
        action: 'fetchClients',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientClick = (client: ClientExtended) => {
    setSelectedClient(client);
    setDetailModalOpen(true);
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch = searchQuery
      ? client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone?.includes(searchQuery)
      : true;

    const matchesElement = selectedElement
      ? client.fourPillarsData?.element === selectedElement
      : true;

    return matchesSearch && matchesElement;
  });

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: '名前',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
            {params.value.charAt(0)}
          </Avatar>
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'element',
      headerName: '五行',
      width: 100,
      renderCell: (params: GridRenderCellParams) => {
        const element = params.row.fourPillarsData?.element;
        return element ? (
          <Chip
            label={`${element}行`}
            size="small"
            icon={getElementIcon(element)}
          />
        ) : null;
      },
    },
    {
      field: 'gender',
      headerName: '性別',
      width: 80,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.value === 'male' ? '男性' : '女性'}
        </Typography>
      ),
    },
    {
      field: 'birthDate',
      headerName: '生年月日',
      width: 120,
      valueFormatter: (params) => {
        return params ? new Date(params).toLocaleDateString('ja-JP') : '未登録';
      },
    },
    {
      field: 'phone',
      headerName: '電話番号',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">{params.value || '未登録'}</Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="詳細">
            <IconButton
              size="small"
              onClick={() => handleClientClick(params.row)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="相性診断">
            <IconButton size="small" color="primary">
              <Psychology fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="チャット">
            <IconButton size="small" color="secondary">
              <Chat fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const elements = ['火', '水', '木', '土', '金'];

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>
          クライアント管理
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CalendarMonth />}
          >
            Googleカレンダー連携
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
          >
            新規クライアント
          </Button>
        </Box>
      </Box>

      {/* 検索・フィルター */}
      <Card sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="名前、メール、電話番号で検索（例：「感情的」「水」など自然言語でも検索可能）"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="すべて"
            onClick={() => setSelectedElement(null)}
            color={selectedElement === null ? 'primary' : 'default'}
          />
          {elements.map((element) => (
            <Chip
              key={element}
              label={`${element}行`}
              icon={getElementIcon(element)}
              onClick={() => setSelectedElement(element)}
              color={selectedElement === element ? 'primary' : 'default'}
            />
          ))}
        </Box>
      </Card>

      {/* クライアント一覧 */}
      <Card>
        <DataGrid
          rows={filteredClients}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            '& .MuiDataGrid-cell': {
              cursor: 'pointer',
            },
          }}
        />
      </Card>

      {/* クライアント詳細モーダル */}
      <ClientDetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
      />
    </Box>
  );
};