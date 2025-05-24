import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes/routes';

// 公開ページ用レイアウト（ヘッダーのみ・シンプル）
export const PublicLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ backgroundColor: '#f8bbd0' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#333' }}>
            Salomoni
          </Typography>
          <Button 
            component={Link} 
            to={ROUTES.public.login} 
            sx={{ color: '#333' }}
          >
            ログイン
          </Button>
          <Button 
            component={Link} 
            to={ROUTES.public.organizationRegister} 
            sx={{ color: '#333', ml: 1 }}
          >
            組織登録
          </Button>
        </Toolbar>
      </AppBar>
      
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        <Outlet />
      </Box>
    </Box>
  );
};