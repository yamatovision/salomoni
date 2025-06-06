import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Avatar,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  IconButton,
  Stack,
} from '@mui/material';
import {
  PhotoCamera,
  Person,
  Notifications,
  SmartToy,
  Save,
  Edit,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { AICharacterStyle } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);

  // プロフィール状態
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    profileImage: '',
  });

  // ユーザーデータが変更されたらプロフィールを更新
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        profileImage: user.profileImage || '',
      });
    }
  }, [user]);

  // 通知設定状態
  const [notifications, setNotifications] = useState({
    dailyAdvice: true,
    clientReminder: true,
    appointmentAlert: true,
    systemNews: false,
    pushEnabled: true,
    emailEnabled: false,
  });

  // AIパートナー設定状態
  const [aiSettings, setAiSettings] = useState({
    characterName: 'あいちゃん',
    selectedStyles: [AICharacterStyle.CHEERFUL, AICharacterStyle.CARING] as AICharacterStyle[],
    voiceEnabled: true,
    responseSpeed: 'normal' as 'slow' | 'normal' | 'fast',
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setEditMode(false);
  };

  const handleProfileSave = () => {
    // モックなのでAPI呼び出しはせず、アラートのみ表示
    setShowSaveAlert(true);
    setEditMode(false);
    setTimeout(() => setShowSaveAlert(false), 3000);
  };

  const handleNotificationChange = (setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications({
      ...notifications,
      [setting]: event.target.checked,
    });
  };

  const handleAIStyleToggle = (style: AICharacterStyle) => {
    setAiSettings(prev => ({
      ...prev,
      selectedStyles: prev.selectedStyles.includes(style)
        ? prev.selectedStyles.filter(s => s !== style)
        : [...prev.selectedStyles, style],
    }));
  };

  const aiStyleOptions = [
    { value: AICharacterStyle.FLIRTY, label: '甘え・恋愛系', emoji: '💕' },
    { value: AICharacterStyle.COOL, label: '冷静・大人系', emoji: '🌙' },
    { value: AICharacterStyle.CHEERFUL, label: '明るい・フレンドリー', emoji: '☀️' },
    { value: AICharacterStyle.SOFT, label: 'やさしい・癒し系', emoji: '🌸' },
    { value: AICharacterStyle.CARING, label: '甘えさせ系', emoji: '🤗' },
    { value: AICharacterStyle.ONEESAN, label: '姉御・甘えられ系', emoji: '👑' },
    { value: AICharacterStyle.MYSTERIOUS, label: '謎めいた系', emoji: '✨' },
  ];

  return (
    <Container maxWidth="sm" sx={{ pb: 8 }}>
      <>
        {showSaveAlert && (
          <Alert severity="success" sx={{ mb: 2 }}>
            設定を保存しました
          </Alert>
        )}

        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<Person />} label="プロフィール" />
            <Tab icon={<Notifications />} label="通知" />
            <Tab icon={<SmartToy />} label="AIパートナー" />
          </Tabs>

          {/* プロフィールタブ */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ px: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">基本情報</Typography>
                {!editMode ? (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setEditMode(true)}
                    size="small"
                  >
                    編集
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      onClick={() => setEditMode(false)}
                    >
                      キャンセル
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleProfileSave}
                      size="small"
                    >
                      保存
                    </Button>
                  </Stack>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{ width: 80, height: 80, mr: 2 }}
                  src={profile.profileImage}
                >
                  {profile.name.charAt(0)}
                </Avatar>
                {editMode && (
                  <IconButton color="primary" component="label">
                    <input hidden accept="image/*" type="file" />
                    <PhotoCamera />
                  </IconButton>
                )}
              </Box>

              <Stack spacing={2}>
                <TextField
                  label="名前"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={!editMode}
                  fullWidth
                />
                <TextField
                  label="メールアドレス"
                  value={profile.email}
                  disabled
                  fullWidth
                  helperText="メールアドレスは変更できません"
                />
                <TextField
                  label="電話番号"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!editMode}
                  fullWidth
                />
                <TextField
                  label="生年月日"
                  type="date"
                  value={profile.birthDate}
                  onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                  disabled={!editMode}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <FormControl disabled={!editMode}>
                  <FormLabel>性別</FormLabel>
                  <RadioGroup
                    row
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  >
                    <FormControlLabel value="female" control={<Radio />} label="女性" />
                    <FormControlLabel value="male" control={<Radio />} label="男性" />
                    <FormControlLabel value="other" control={<Radio />} label="その他" />
                  </RadioGroup>
                </FormControl>
              </Stack>
            </Box>
          </TabPanel>

          {/* 通知タブ */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ px: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>通知設定</Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText
                    primary="プッシュ通知"
                    secondary="アプリからの通知を受け取る"
                  />
                  <Switch
                    checked={notifications.pushEnabled}
                    onChange={handleNotificationChange('pushEnabled')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText
                    primary="メール通知"
                    secondary="重要な通知をメールで受け取る"
                  />
                  <Switch
                    checked={notifications.emailEnabled}
                    onChange={handleNotificationChange('emailEnabled')}
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ mb: 1 }}>通知の種類</Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="今日のアドバイス"
                    secondary="毎朝の運勢とアドバイス"
                  />
                  <Switch
                    checked={notifications.dailyAdvice}
                    onChange={handleNotificationChange('dailyAdvice')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="クライアントリマインダー"
                    secondary="施術予定の通知"
                  />
                  <Switch
                    checked={notifications.clientReminder}
                    onChange={handleNotificationChange('clientReminder')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="予約アラート"
                    secondary="新規予約や変更の通知"
                  />
                  <Switch
                    checked={notifications.appointmentAlert}
                    onChange={handleNotificationChange('appointmentAlert')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="システムニュース"
                    secondary="新機能やメンテナンス情報"
                  />
                  <Switch
                    checked={notifications.systemNews}
                    onChange={handleNotificationChange('systemNews')}
                  />
                </ListItem>
              </List>
            </Box>
          </TabPanel>

          {/* AIパートナータブ */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ px: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>AIパートナー設定</Typography>
              
              <Box sx={{ mb: 3 }}>
                <TextField
                  label="AIパートナーの名前"
                  value={aiSettings.characterName}
                  onChange={(e) => setAiSettings({ ...aiSettings, characterName: e.target.value })}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="subtitle1" sx={{ mb: 1 }}>性格タイプ（複数選択可）</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {aiStyleOptions.map((style) => (
                    <Chip
                      key={style.value}
                      label={`${style.emoji} ${style.label}`}
                      onClick={() => handleAIStyleToggle(style.value)}
                      color={aiSettings.selectedStyles.includes(style.value) ? 'primary' : 'default'}
                      variant={aiSettings.selectedStyles.includes(style.value) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ mb: 1 }}>会話設定</Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SmartToy />
                  </ListItemIcon>
                  <ListItemText
                    primary="音声読み上げ"
                    secondary="AIの返答を音声で聞く"
                  />
                  <Switch
                    checked={aiSettings.voiceEnabled}
                    onChange={(e) => setAiSettings({ ...aiSettings, voiceEnabled: e.target.checked })}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="返答スピード"
                    secondary="AIの思考時間を調整"
                  />
                  <FormControl>
                    <RadioGroup
                      row
                      value={aiSettings.responseSpeed}
                      onChange={(e) => setAiSettings({ ...aiSettings, responseSpeed: e.target.value as any })}
                    >
                      <FormControlLabel value="slow" control={<Radio size="small" />} label="ゆっくり" />
                      <FormControlLabel value="normal" control={<Radio size="small" />} label="普通" />
                      <FormControlLabel value="fast" control={<Radio size="small" />} label="速い" />
                    </RadioGroup>
                  </FormControl>
                </ListItem>
              </List>

              <Box sx={{ mt: 3 }}>
                <Alert severity="info">
                  AIパートナーの性格は、選択したタイプに基づいて会話のトーンが変わります。
                  複数選択することで、より豊かな性格を持つパートナーになります。
                </Alert>
              </Box>
            </Box>
          </TabPanel>
        </Paper>
      </>
    </Container>
  );
};