import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  Switch,
  Stack,
  Paper,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Sync as SyncIcon,
  Print as PrintIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  PersonOff as PersonOffIcon,
  Edit as EditIcon,
  Assistant as AssistantIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { appointmentService, userService, clientService } from '../../services';
import type { Appointment, User, Client } from '../../types';
import { UserRole } from '../../types';

// ページID: A-004

// スタイル付きコンポーネント
const DateNavigator = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const TimeSlotCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiCardContent-root': {
    padding: theme.spacing(2),
  },
}));

const AppointmentCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const GenderBorder = styled(Box)<{ gender: string }>(({ gender }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: 4,
  backgroundColor: gender === 'female' ? '#f48fb1' : '#90caf9',
}));

const EmptySlot = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  border: '2px dashed',
  borderColor: theme.palette.primary.light,
  backgroundColor: theme.palette.grey[50],
  transition: 'all 0.3s',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + '10',
  },
}));

const AppointmentManagementPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stylists, setStylists] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [newClientMode, setNewClientMode] = useState(false);
  
  // タイムスロット（10:00-20:00）
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = 10 + i;
    return `${hour}:00`;
  });

  // 予約データ取得
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await appointmentService.getAppointments({ date: dateStr });
      setAppointments(response.appointments);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // スタイリスト一覧取得
  const fetchStylists = useCallback(async () => {
    try {
      const users = await userService.getUsers();
      const stylists = users.filter(user => user.role === UserRole.STYLIST);
      setStylists(stylists);
    } catch (err) {
      console.error('Failed to fetch stylists:', err);
    }
  }, []);

  // クライアント一覧取得
  const fetchClients = useCallback(async () => {
    try {
      const response = await clientService.getClients();
      setClients(response.clients);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchStylists();
    fetchClients();
  }, [fetchStylists, fetchClients]);

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const handleOpenAssignModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setAssignModalOpen(true);
  };

  const handleOpenAddModal = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setAddModalOpen(true);
  };

  const handleAssignStylist = async (stylistId: string) => {
    if (!selectedAppointment) return;
    
    try {
      await appointmentService.assignStylist(selectedAppointment.id, stylistId);
      setAssignModalOpen(false);
      // 予約リストを再取得
      fetchAppointments();
    } catch (err) {
      console.error('Failed to assign stylist:', err);
    }
  };

  // 時間帯ごとの予約を取得
  const getAppointmentsByTimeSlot = (timeSlot: string): Appointment[] => {
    const hour = parseInt(timeSlot.split(':')[0]);
    return appointments.filter(apt => {
      const aptHour = new Date(apt.scheduledAt).getHours();
      return aptHour === hour;
    });
  };

  // 日次サマリーの計算
  const getDaySummary = () => {
    const total = appointments.length;
    const unassigned = appointments.filter(apt => !apt.stylistId).length;
    const completed = appointments.filter(apt => apt.status === 'completed').length;
    const revenue = appointments
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.amount || 0), 0);
    
    return {
      totalAppointments: total,
      unassignedAppointments: unassigned,
      attendedClients: completed,
      totalRevenue: revenue,
    };
  };

  const daySummary = getDaySummary();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0].charAt(0) + parts[1].charAt(0);
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" color="primary">
          予約・担当管理
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={() => setSyncModalOpen(true)}
          >
            カレンダー同期
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
          >
            印刷
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenAddModal('')}
          >
            新規予約
          </Button>
        </Stack>
      </Box>

      {/* 日付ナビゲーター */}
      <DateNavigator>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <IconButton color="inherit" onClick={() => handleDateChange('prev')}>
            <ChevronLeftIcon />
          </IconButton>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h5">
              {selectedDate.toLocaleDateString('ja-JP', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </Typography>
            <IconButton color="inherit" size="small" onClick={() => setSelectedDate(new Date())}>
              <TodayIcon />
            </IconButton>
          </Stack>
          <IconButton color="inherit" onClick={() => handleDateChange('next')}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
        
        {/* 日次サマリー */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mt: 2 }}>
          <Box textAlign="center">
            <Typography variant="h4">{daySummary.totalAppointments}</Typography>
            <Typography variant="body2">総予約数</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4">{daySummary.unassignedAppointments}</Typography>
            <Typography variant="body2">未割当</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4">{daySummary.attendedClients}</Typography>
            <Typography variant="body2">来店済み</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4">{appointments.filter(apt => apt.status === 'cancelled').length}</Typography>
            <Typography variant="body2">キャンセル</Typography>
          </Box>
        </Box>
      </DateNavigator>

      {/* タイムスロット一覧 */}
      <Box>
        {timeSlots.map((timeSlot) => {
          const slotAppointments = getAppointmentsByTimeSlot(timeSlot);
          const hasUnassigned = slotAppointments.some(app => !app.stylistId);
          
          return (
            <TimeSlotCard key={timeSlot}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    {timeSlot}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {hasUnassigned && (
                      <Chip 
                        icon={<PersonOffIcon />}
                        label="未割当あり" 
                        color="warning" 
                        size="small"
                      />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {slotAppointments.length}件
                    </Typography>
                  </Stack>
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {slotAppointments.length === 0 ? (
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <EmptySlot onClick={() => handleOpenAddModal(timeSlot)}>
                        <AddIcon sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />
                        <Typography>クリックして新規予約追加</Typography>
                        <Typography variant="caption" color="text.secondary">
                          または他の時間帯からドラッグ＆ドロップ
                        </Typography>
                      </EmptySlot>
                    </Box>
                  ) : (
                    slotAppointments.map((appointment) => {
                      const client = clients.find(c => c.id === appointment.clientId);
                      const stylist = stylists.find(s => s.id === appointment.stylistId);
                      const isUnassigned = !appointment.stylistId;
                      
                      return (
                        <Box key={appointment.id}>
                          <AppointmentCard
                            onClick={() => isUnassigned && handleOpenAssignModal(appointment)}
                          >
                            <GenderBorder gender={client?.gender || 'female'} />
                            <Box ml={1.5}>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle1" fontWeight={500}>
                                  {client?.name || 'クライアント名不明'}
                                </Typography>
                                <Chip 
                                  label={appointment.status === 'confirmed' ? '確定' : appointment.status} 
                                  size="small"
                                  color={getStatusColor(appointment.status)}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {appointment.services?.join(', ') || 'サービス未設定'}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1} mt={1}>
                                {isUnassigned ? (
                                  <>
                                    <PersonOffIcon fontSize="small" color="warning" />
                                    <Typography variant="body2" color="warning.main">
                                      未割当
                                    </Typography>
                                    <Chip
                                      icon={<AssistantIcon />}
                                      label="AI推奨あり"
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  </>
                                ) : (
                                  <>
                                    <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                                      {stylist && getInitials(stylist.name)}
                                    </Avatar>
                                    <Typography variant="body2">
                                      {stylist?.name || 'スタイリスト名不明'}
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            </Box>
                            {!isUnassigned && (
                              <IconButton
                                size="small"
                                sx={{ position: 'absolute', top: 8, right: 8 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // 編集処理
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                          </AppointmentCard>
                        </Box>
                      );
                    })
                  )}
                </Box>
              </CardContent>
            </TimeSlotCard>
          );
        })}
      </Box>

      {/* スタイリスト割り当てモーダル */}
      <Dialog
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>スタイリスト割り当て</DialogTitle>
        <DialogContent>
          {selectedAppointment && (() => {
            const client = clients.find(c => c.id === selectedAppointment.clientId);
            // TODO: AI推奨機能の実装
            const recommendations: { recommendedStylists?: Array<{ stylistId: string; reason?: string }> } = { recommendedStylists: [] };
            
            return (
              <>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Avatar
                    sx={{
                      bgcolor: client?.gender === 'female' ? '#f48fb1' : '#90caf9',
                      width: 60,
                      height: 60,
                    }}
                  >
                    {client && getInitials(client.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{client?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {client?.gender}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedAppointment.services?.join(', ') || 'サービス未設定'}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  AI推奨スタイリスト
                </Typography>
                <Stack spacing={1} mb={3}>
                  {recommendations.recommendedStylists?.map((rec: any) => {
                    const stylist = stylists.find(u => u.id === rec.stylistId);
                    if (!stylist) return null;
                    
                    return (
                      <Paper
                        key={rec.stylistId}
                        onClick={() => handleAssignStylist(rec.stylistId)}
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          bgcolor: 'primary.light',
                          '&:hover': { bgcolor: 'primary.main', color: 'white' },
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {getInitials(stylist.name)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">{stylist.name}</Typography>
                            <Typography variant="caption">{rec.reason}</Typography>
                          </Box>
                        </Box>
                        <Chip label={`${rec.compatibilityScore || 0}%`} color="primary" />
                      </Paper>
                    );
                  })}
                </Stack>

                <Typography variant="subtitle2" gutterBottom>
                  その他のスタイリスト
                </Typography>
                <Stack spacing={1}>
                  {stylists.map((stylist) => {
                    const isRecommended = recommendations.recommendedStylists?.some(
                      (r: any) => r.stylistId === stylist.id
                    );
                    if (isRecommended) return null;
                    
                    return (
                      <Paper
                        key={stylist.id}
                        onClick={() => handleAssignStylist(stylist.id)}
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'grey.50' },
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: stylist.gender === 'female' ? '#f48fb1' : '#90caf9' }}>
                            {getInitials(stylist.name)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">{stylist.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {stylist.gender} | {stylist.department}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    );
                  })}
                </Stack>
              </>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignModalOpen(false)}>キャンセル</Button>
        </DialogActions>
      </Dialog>

      {/* カレンダー同期モーダル */}
      <Dialog
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>カレンダー同期状況</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                最終同期: 2025-04-26 09:00
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Google Calendar: 接続済み
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                同期サマリー
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">取り込み予約数:</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {appointments.length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">クライアントマッチ成功:</Typography>
                  <Typography variant="body2" fontWeight={500} color="success.main">
                    {Math.round(appointments.length * 0.8)} ({80}%)
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">スタイリストマッチ成功:</Typography>
                  <Typography variant="body2" fontWeight={500} color="success.main">
                    {Math.round(appointments.length * 0.7)} ({70}%)
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">確認待ち:</Typography>
                  <Typography variant="body2" fontWeight={500} color="warning.main">
                    {Math.round(appointments.length * 0.1)}件
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                次回同期予定
              </Typography>
              <Typography variant="body2" color="text.secondary">
                2025-04-26 10:00 (約1時間後)
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncModalOpen(false)}>閉じる</Button>
          <Button 
            variant="contained" 
            startIcon={<SyncIcon />}
            onClick={() => {
              // 同期処理の実装
              setSyncModalOpen(false);
            }}
          >
            今すぐ同期
          </Button>
        </DialogActions>
      </Dialog>

      {/* 新規予約登録モーダル */}
      <Dialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>新規予約登録</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={1}>
            {/* 予約情報 */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                予約情報
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>日付</InputLabel>
                    <Select value={selectedDate.toISOString().split('T')[0]} label="日付">
                      <MenuItem value={selectedDate.toISOString().split('T')[0]}>
                        {selectedDate.toLocaleDateString('ja-JP')}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>時間枠</InputLabel>
                    <Select value={selectedTimeSlot} label="時間枠">
                      {timeSlots.map((slot) => (
                        <MenuItem key={slot} value={slot}>
                          {slot}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>サービスメニュー</InputLabel>
                    <Select label="サービスメニュー">
                      {/* TODO: サービスメニューの実装 */}
                      {[{id: '1', name: 'カット', duration: 60}].map((service) => (
                        <MenuItem key={service.id} value={service.id}>
                          {service.name} ({service.duration}分)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* クライアント情報 */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2">
                  クライアント情報
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={newClientMode}
                      onChange={(e) => setNewClientMode(e.target.checked)}
                    />
                  }
                  label="新規クライアント"
                />
              </Box>
              
              {newClientMode && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="名前" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>性別</InputLabel>
                      <Select label="性別">
                        <MenuItem value="male">男性</MenuItem>
                        <MenuItem value="female">女性</MenuItem>
                        <MenuItem value="other">その他</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="電話番号" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="メールアドレス" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="生年月日" type="date" InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>生まれた時間</InputLabel>
                      <Select label="生まれた時間">
                        <MenuItem value="">不明</MenuItem>
                        {Array.from({ length: 24 }, (_, i) => (
                          <MenuItem key={i} value={i}>
                            {i}:00 - {i}:59
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField fullWidth multiline rows={2} label="メモ" />
                  </Grid>
                </Grid>
              )}
            </Box>

            {/* 担当スタイリスト */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                担当スタイリスト
              </Typography>
              <RadioGroup>
                <Grid container spacing={2}>
                  {stylists.map((stylist) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={stylist.id}>
                      <Paper
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': { bgcolor: 'grey.50' },
                        }}
                      >
                        <FormControlLabel
                          value={stylist.id}
                          control={<Radio />}
                          label={
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar
                                sx={{
                                  bgcolor: stylist.gender === 'female' ? '#f48fb1' : '#90caf9',
                                  width: 36,
                                  height: 36,
                                }}
                              >
                                {getInitials(stylist.name)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">{stylist.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {stylist.gender} | {stylist.department}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </RadioGroup>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddModalOpen(false)}>キャンセル</Button>
          <Button variant="contained" startIcon={<CheckCircleIcon />}>
            予約を登録
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentManagementPage;