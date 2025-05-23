import { Box, Container, Paper, Typography, Button, Grid } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            SuperAdmin ダッシュボード
          </Typography>
          <Button variant="outlined" onClick={handleLogout}>
            ログアウト
          </Button>
        </Box>

        <Grid container spacing={3} {...{} as any}>
          <Grid item xs={12} {...{} as any}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                ようこそ、{user?.name}さん
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Email: {user?.email}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Role: {user?.role}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/superadmin/organizations')}>
              <Typography variant="h6" gutterBottom>
                組織管理
              </Typography>
              <Typography variant="h3" color="primary">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                登録組織数
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/superadmin/plans')}>
              <Typography variant="h6" gutterBottom>
                プラン管理
              </Typography>
              <Typography variant="h3" color="primary">
                3
              </Typography>
              <Typography variant="body2" color="text.secondary">
                利用可能プラン
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/superadmin/support')}>
              <Typography variant="h6" gutterBottom>
                サポート
              </Typography>
              <Typography variant="h3" color="primary">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                未対応チケット
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};