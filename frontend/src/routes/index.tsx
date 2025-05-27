import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routes';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleBasedRedirect } from './RoleBasedRedirect';
import { UserRole } from '../types';

// レイアウト
import { MobileLayout } from '../layouts/MobileLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { SuperAdminLayout } from '../layouts/SuperAdminLayout';

// 実装済みページ（Phase 2）
import { LoginPage } from '../pages/public/LoginPage';
import { OrganizationRegisterPage } from '../pages/public/OrganizationRegisterPage';
import { LineCallbackPage } from '../pages/public/LineCallbackPage';
import { InitialSetupPage } from '../pages/public/InitialSetupPage';
import AICharacterSetupPage from '../pages/public/AICharacterSetupPage';

// 実装済みページ（Phase 3）
import { SplashPage } from '../pages/public/SplashPage';
import { OnboardingPage } from '../pages/public/OnboardingPage';
import DailyAdvicePage from '../pages/stylist/DailyAdvicePage';
import ChatPage from '../pages/stylist/ChatPage';
import { SettingsPage } from '../pages/stylist/SettingsPage';
import TodayClientsPage from '../pages/stylist/TodayClientsPage';
import { NewClientPage } from '../pages/stylist/NewClientPage';

// 実装済みページ（Phase 4）
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import { ClientManagementPage } from '../pages/admin/ClientManagementPage';
import StylistManagementPage from '../pages/admin/StylistManagementPage';
import AppointmentManagementPage from '../pages/admin/AppointmentManagementPage';
import DataImportPage from '../pages/admin/DataImportPage';
import AdminSupportPage from '../pages/admin/AdminSupportPage';
import AdminBillingPage from '../pages/admin/AdminBillingPage';

// 実装済みページ（Phase 5）
import SuperAdminOrganizationsPage from '../pages/superadmin/SuperAdminOrganizationsPage';
import SuperAdminPlansPage from '../pages/superadmin/SuperAdminPlansPage';
import SuperAdminSupportPage from '../pages/superadmin/SuperAdminSupportPage';


export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公開ルート */}
        <Route path={ROUTES.public.splash} element={<SplashPage />} />
        <Route path={ROUTES.public.onboarding} element={<OnboardingPage />} />
        <Route path={ROUTES.public.login} element={<LoginPage />} />
        <Route path={ROUTES.public.organizationRegister} element={<OrganizationRegisterPage />} />
        <Route path={ROUTES.public.lineCallback} element={<LineCallbackPage />} />
        <Route path={ROUTES.public.initialSetup} element={<InitialSetupPage />} />
        <Route path={ROUTES.public.aiCharacterSetup} element={<AICharacterSetupPage />} />

        {/* スタイリストルート（要認証） */}
        <Route element={<ProtectedRoute requiredRoles={[UserRole.USER, UserRole.STYLIST, UserRole.ADMIN, UserRole.OWNER]} />}>
          <Route element={<MobileLayout />}>
            <Route path={ROUTES.stylist.chat} element={<ChatPage />} />
            <Route path={ROUTES.stylist.dashboard} element={<DailyAdvicePage />} />
            <Route path={ROUTES.stylist.settings} element={<SettingsPage />} />
            <Route path={ROUTES.stylist.todayClients} element={<TodayClientsPage />} />
            <Route path={ROUTES.stylist.newClient} element={<NewClientPage />} />
            <Route path={ROUTES.stylist.initialSetup} element={<InitialSetupPage />} />
          </Route>
        </Route>

        {/* 管理者ルート（要管理者権限） */}
        <Route element={<ProtectedRoute requiredRoles={[UserRole.OWNER, UserRole.ADMIN]} />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.admin.dashboard} element={<AdminDashboardPage />} />
            <Route path={ROUTES.admin.clients} element={<ClientManagementPage />} />
            <Route path={ROUTES.admin.stylists} element={<StylistManagementPage />} />
            <Route path={ROUTES.admin.appointments} element={<AppointmentManagementPage />} />
            <Route path={ROUTES.admin.import} element={<DataImportPage />} />
            <Route path={ROUTES.admin.support} element={<AdminSupportPage />} />
            <Route path={ROUTES.admin.billing} element={<AdminBillingPage />} />
          </Route>
        </Route>

        {/* SuperAdminルート（要SuperAdmin権限） */}
        <Route element={<ProtectedRoute requiredRoles={[UserRole.SUPER_ADMIN]} />}>
          <Route element={<SuperAdminLayout />}>
            <Route path={ROUTES.superadmin.dashboard} element={<Navigate to={ROUTES.superadmin.organizations} replace />} />
            <Route path={ROUTES.superadmin.organizations} element={<SuperAdminOrganizationsPage />} />
            <Route path={ROUTES.superadmin.plans} element={<SuperAdminPlansPage />} />
            <Route path={ROUTES.superadmin.support} element={<SuperAdminSupportPage />} />
          </Route>
        </Route>

        {/* デフォルトリダイレクト */}
        <Route path="/" element={<RoleBasedRedirect />} />
        <Route path="*" element={<Navigate to={ROUTES.public.login} replace />} />
      </Routes>
    </BrowserRouter>
  );
};