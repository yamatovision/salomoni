import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Chat, Today, People, Settings } from '@mui/icons-material';
import { ROUTES } from '../routes/routes';
import { useEffect, useRef } from 'react';

// モバイルアプリ用レイアウト（ボトムナビゲーション）
export const MobileLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ナビゲーションバーの実際の高さをログ出力
    if (navigationRef.current) {
      console.log('[MobileLayout] Navigation height:', navigationRef.current.offsetHeight);
      console.log('[MobileLayout] Window height:', window.innerHeight);
      console.log('[MobileLayout] Document height:', document.documentElement.scrollHeight);
    }
  }, []);

  const navigationItems = [
    { label: 'チャット相談', value: ROUTES.stylist.chat, icon: <Chat /> },
    { label: '今日のアドバイス', value: ROUTES.stylist.dashboard, icon: <Today /> },
    { label: '今日のお客様', value: ROUTES.stylist.todayClients, icon: <People /> },
    { label: '管理画面', value: ROUTES.stylist.settings, icon: <Settings /> },
  ];

  const currentValue = navigationItems.find(item => 
    location.pathname.startsWith(item.value)
  )?.value || ROUTES.stylist.dashboard;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Box component="main" sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        pb: 10, // BottomNavigationの高さ(56px) + 余白を考慮して80pxに増加
        position: 'relative'
      }}>
        <Outlet />
      </Box>
      
      <Paper ref={navigationRef} sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        zIndex: 1100 // AppBarと同じレベルのz-indexを設定
      }} elevation={3}>
        <BottomNavigation
          value={currentValue}
          onChange={(_, newValue) => navigate(newValue)}
          sx={{ bgcolor: '#fce4ec' }}
        >
          {navigationItems.map((item) => (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={item.icon}
              sx={{
                '&.Mui-selected': {
                  color: '#e91e63',
                },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
};