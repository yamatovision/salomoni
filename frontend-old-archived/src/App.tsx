import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './hooks/useNotification';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { OrganizationRegisterPage } from './pages/auth/OrganizationRegisterPage';
import { LineCallbackPage } from './pages/auth/LineCallbackPage';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StylistDashboard } from './pages/stylist/StylistDashboard';
import { ClientManagement } from './pages/admin/ClientManagement';
import { StylistManagementPage } from './pages/admin/StylistManagementPage';
import { UserRole } from './types';

// TODO: 実装予定のページコンポーネント
const SuperAdminDashboardPage = () => <div>SuperAdminダッシュボード</div>;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <BrowserRouter>
          <NotificationProvider>
            <AuthProvider>
              <Routes>
                {/* 公開ルート */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register/organization" element={<OrganizationRegisterPage />} />
                <Route path="/auth/line/callback" element={<LineCallbackPage />} />

                {/* スタイリスト向けルート */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.USER]}>
                      <StylistDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 管理者向けルート */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.OWNER, UserRole.ADMIN]}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="clients" element={<ClientManagement />} />
                  <Route path="stylists" element={<StylistManagementPage />} />
                  {/* TODO: 他の管理者ページを追加 */}
                </Route>

                {/* SuperAdmin向けルート */}
                <Route
                  path="/superadmin/*"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                      <Routes>
                        <Route path="/" element={<SuperAdminDashboardPage />} />
                        {/* TODO: 他のSuperAdminページを追加 */}
                      </Routes>
                    </ProtectedRoute>
                  }
                />

                {/* デフォルトリダイレクト */}
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </AuthProvider>
          </NotificationProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App
