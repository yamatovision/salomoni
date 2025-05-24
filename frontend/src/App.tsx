import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { theme } from './styles/theme';
import { AppRouter } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { MockIndicator } from './services/mock/mockIndicator';
import { isMockMode } from './services';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          {/* モック使用時のインジケーター */}
          {isMockMode && <MockIndicator />}
          
          {/* メインコンテンツ（モック使用時は上部に余白） */}
          <Box sx={{ pt: isMockMode && !import.meta.env.PROD ? 6 : 0 }}>
            <AppRouter />
          </Box>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;