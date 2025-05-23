import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  useTheme,
  useMediaQuery,
  Badge,
} from '@mui/material';
import {
  Dashboard,
  People,
  UploadFile,
  Groups,
  Event,
  Support,
  Payments,
  Menu as MenuIcon,
  Spa,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { logger } from '../../utils/logger';

const drawerWidth = 240;

interface NavigationItem {
  title: string;
  path: string;
  icon: React.ReactElement;
  requiredRoles?: UserRole[];
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    title: 'ダッシュボード',
    path: '/admin',
    icon: <Dashboard />,
  },
  {
    title: 'クライアント管理',
    path: '/admin/clients',
    icon: <People />,
  },
  {
    title: 'データインポート',
    path: '/admin/import',
    icon: <UploadFile />,
  },
  {
    title: 'スタイリスト管理',
    path: '/admin/stylists',
    icon: <Groups />,
  },
  {
    title: '予約・担当管理',
    path: '/admin/appointments',
    icon: <Event />,
  },
  {
    title: 'サポート管理',
    path: '/admin/support',
    icon: <Support />,
  },
  {
    title: '請求・支払い管理',
    path: '/admin/billing',
    icon: <Payments />,
    requiredRoles: [UserRole.OWNER],
    badge: 'Owner',
  },
];

export const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigate = (path: string) => {
    logger.info('Navigate to admin page', {
      component: 'AdminLayout',
      action: 'navigate',
      path,
    });
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      logger.info('Admin logout initiated', {
        component: 'AdminLayout',
        action: 'logout',
      });
      await logout();
      navigate('/login');
    } catch (error) {
      logger.error('Admin logout failed', error as Error, {
        component: 'AdminLayout',
        action: 'logout',
      });
    }
  };

  const drawer = (
    <Box>
      <List>
        {navigationItems.map((item) => {
          // ロールチェック
          if (item.requiredRoles && user && !item.requiredRoles.includes(user.role)) {
            return null;
          }

          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderLeft: isActive ? 4 : 0,
                  borderColor: 'primary.main',
                  backgroundColor: isActive ? 'primary.light' : 'transparent',
                  color: isActive ? 'primary.dark' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'secondary.light',
                  },
                  ...(item.requiredRoles && {
                    backgroundColor: 'rgba(236, 64, 122, 0.05)',
                    borderLeft: '4px solid rgba(236, 64, 122, 0.5)',
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'primary.dark' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.title} />
                {item.badge && (
                  <Badge
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        fontSize: '10px',
                        height: '20px',
                        minWidth: '40px',
                      },
                    }}
                    badgeContent={item.badge}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'secondary.light',
          color: 'primary.dark',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 40,
                height: 40,
                mr: 1.5,
              }}
            >
              <Spa />
            </Avatar>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 500 }}>
              Salomoni 管理者サイト
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={handleLogout}>
            <Avatar sx={{ bgcolor: 'primary.dark', width: 40, height: 40 }}>
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          backgroundColor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};