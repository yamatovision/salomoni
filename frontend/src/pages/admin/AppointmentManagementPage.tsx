import React, { useState, useEffect } from 'react';
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
// import { format } from 'date-fns';
// import { ja } from 'date-fns/locale';
import {
  mockTimeSlots,
  mockDaySummary,
  mockCalendarSyncStatus,
  mockAssignmentRecommendations,
  getAppointmentsByTimeSlot,
  getAppointmentWithDetails,
  serviceMenus,
} from '../../services/mock/data/mockAppointments';
import { mockUsers } from '../../services/mock/data/mockUsers';
import type { Appointment } from '../../types';
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
  const [selectedDate, setSelectedDate] = useState(new Date('2025-04-26'));
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [newClientMode, setNewClientMode] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const getStylists = () => {
    return mockUsers.filter(user => user.role === UserRole.STYLIST);
  };

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

  const handleAssignStylist = (stylistId: string) => {
    // 実際の実装では、APIを呼び出してスタイリストを割り当てる
    console.log(`Assigning stylist ${stylistId} to appointment ${selectedAppointment?.id}`);
    setAssignModalOpen(false);
  };

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
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4">{mockDaySummary.totalAppointments}</Typography>
              <Typography variant="body2">総予約数</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4">{mockDaySummary.unassignedAppointments}</Typography>
              <Typography variant="body2">未割当</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4">{mockDaySummary.attendedClients}</Typography>
              <Typography variant="body2">来店済み</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4">{mockDaySummary.cancelledAppointments}</Typography>
              <Typography variant="body2">キャンセル</Typography>
            </Box>
          </Grid>
        </Grid>
      </DateNavigator>

      {/* タイムスロット一覧 */}
      <Box>
        {mockTimeSlots.map((timeSlot) => {
          const appointments = getAppointmentsByTimeSlot(timeSlot);
          const hasUnassigned = appointments.some(app => !app.stylistId);
          
          return (
            <TimeSlotCard key={timeSlot.id}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    {timeSlot.startTime} - {timeSlot.endTime}
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
                      {appointments.length}件
                    </Typography>
                  </Stack>
                </Box>
                
                <Grid container spacing={2}>
                  {appointments.length === 0 ? (
                    <Grid size={{ xs: 12 }}>
                      <EmptySlot onClick={() => handleOpenAddModal(`${timeSlot.startTime} - ${timeSlot.endTime}`)}>
                        <AddIcon sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />
                        <Typography>クリックして新規予約追加</Typography>
                        <Typography variant="caption" color="text.secondary">
                          または他の時間帯からドラッグ＆ドロップ
                        </Typography>
                      </EmptySlot>
                    </Grid>
                  ) : (
                    appointments.map((appointment) => {
                      const details = getAppointmentWithDetails(appointment);
                      const isUnassigned = !appointment.stylistId;
                      
                      return (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={appointment.id}>
                          <AppointmentCard
                            onClick={() => isUnassigned && handleOpenAssignModal(appointment)}
                          >
                            <GenderBorder gender={details.client?.gender || 'female'} />
                            <Box ml={1.5}>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle1" fontWeight={500}>
                                  {details.client?.name}
                                </Typography>
                                <Chip 
                                  label={appointment.status === 'confirmed' ? '確定' : appointment.status} 
                                  size="small"
                                  color={getStatusColor(appointment.status)}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {appointment.servicemenu}
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
                                      {details.stylist && getInitials(details.stylist.name)}
                                    </Avatar>
                                    <Typography variant="body2">
                                      {details.stylist?.name}
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
                        </Grid>
                      );
                    })
                  )}
                </Grid>
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
            const details = getAppointmentWithDetails(selectedAppointment);
            const recommendations = mockAssignmentRecommendations.find(
              r => r.appointmentId === selectedAppointment.id
            );
            
            return (
              <>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Avatar
                    sx={{
                      bgcolor: details.client?.gender === 'female' ? '#f48fb1' : '#90caf9',
                      width: 60,
                      height: 60,
                    }}
                  >
                    {details.client && getInitials(details.client.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{details.client?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {details.client?.gender}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedAppointment.servicemenu}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  AI推奨スタイリスト
                </Typography>
                <Stack spacing={1} mb={3}>
                  {recommendations?.recommendedStylists.map((rec) => {
                    const stylist = mockUsers.find(u => u.id === rec.stylistId);
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
                  {getStylists().map((stylist) => {
                    const isRecommended = recommendations?.recommendedStylists.some(
                      r => r.stylistId === stylist.id
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
                    {mockCalendarSyncStatus.totalAppointments}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">クライアントマッチ成功:</Typography>
                  <Typography variant="body2" fontWeight={500} color="success.main">
                    {mockCalendarSyncStatus.successfulClientMatches} ({Math.round(mockCalendarSyncStatus.successfulClientMatches / mockCalendarSyncStatus.totalAppointments * 100)}%)
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">スタイリストマッチ成功:</Typography>
                  <Typography variant="body2" fontWeight={500} color="success.main">
                    {mockCalendarSyncStatus.successfulStylistMatches} ({Math.round(mockCalendarSyncStatus.successfulStylistMatches / mockCalendarSyncStatus.totalAppointments * 100)}%)
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">確認待ち:</Typography>
                  <Typography variant="body2" fontWeight={500} color="warning.main">
                    {mockCalendarSyncStatus.pendingMatches}件
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
                      {mockTimeSlots.map((slot) => (
                        <MenuItem key={slot.id} value={`${slot.startTime} - ${slot.endTime}`}>
                          {slot.startTime} - {slot.endTime}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>サービスメニュー</InputLabel>
                    <Select label="サービスメニュー">
                      {serviceMenus.map((service) => (
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
                  {getStylists().map((stylist) => (
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