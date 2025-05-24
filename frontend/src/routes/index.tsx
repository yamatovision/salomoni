import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routes';
import { ProtectedRoute } from './ProtectedRoute';
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

// 仮のページコンポーネント（Phase 3以降で実装）
const ComingSoonPage = ({ pageName }: { pageName: string }) => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>{pageName}</h1>
    <p>このページは現在開発中です</p>
  </div>
);

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公開ルート */}
        <Route path={ROUTES.public.splash} element={<ComingSoonPage pageName="スプラッシュページ" />} />
        <Route path={ROUTES.public.onboarding} element={<ComingSoonPage pageName="オンボーディング" />} />
        <Route path={ROUTES.public.login} element={<LoginPage />} />
        <Route path={ROUTES.public.organizationRegister} element={<OrganizationRegisterPage />} />
        <Route path={ROUTES.public.lineCallback} element={<LineCallbackPage />} />
        <Route path={ROUTES.public.initialSetup} element={<InitialSetupPage />} />

        {/* スタイリストルート（要認証） */}
        <Route element={<ProtectedRoute requiredRoles={[UserRole.USER, UserRole.ADMIN]} />}>
          <Route element={<MobileLayout />}>
            <Route path={ROUTES.stylist.chat} element={<ComingSoonPage pageName="AIチャット相談" />} />
            <Route path={ROUTES.stylist.dashboard} element={<ComingSoonPage pageName="今日のアドバイス" />} />
            <Route path={ROUTES.stylist.settings} element={<ComingSoonPage pageName="設定" />} />
            <Route path={ROUTES.stylist.todayClients} element={<ComingSoonPage pageName="本日の施術クライアント" />} />
            <Route path={ROUTES.stylist.newClient} element={<ComingSoonPage pageName="クライアント直接入力" />} />
            <Route path={ROUTES.stylist.initialSetup} element={<ComingSoonPage pageName="初回設定" />} />
          </Route>
        </Route>

        {/* 管理者ルート（要管理者権限） */}
        <Route element={<ProtectedRoute requiredRoles={[UserRole.OWNER, UserRole.ADMIN]} />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.admin.dashboard} element={<ComingSoonPage pageName="管理者ダッシュボード" />} />
            <Route path={ROUTES.admin.clients} element={<ComingSoonPage pageName="クライアント管理" />} />
            <Route path={ROUTES.admin.stylists} element={<ComingSoonPage pageName="スタイリスト管理" />} />
            <Route path={ROUTES.admin.appointments} element={<ComingSoonPage pageName="予約・担当管理" />} />
            <Route path={ROUTES.admin.import} element={<ComingSoonPage pageName="データインポート" />} />
            <Route path={ROUTES.admin.support} element={<ComingSoonPage pageName="サポート管理" />} />
            <Route path={ROUTES.admin.billing} element={<ComingSoonPage pageName="請求・支払い管理" />} />
          </Route>
        </Route>

        {/* SuperAdminルート（要SuperAdmin権限） */}
        <Route element={<ProtectedRoute requiredRoles={[UserRole.SUPER_ADMIN]} />}>
          <Route element={<SuperAdminLayout />}>
            <Route path={ROUTES.superadmin.dashboard} element={<ComingSoonPage pageName="SuperAdminダッシュボード" />} />
            <Route path={ROUTES.superadmin.organizations} element={<ComingSoonPage pageName="組織管理" />} />
            <Route path={ROUTES.superadmin.plans} element={<ComingSoonPage pageName="課金・プラン管理" />} />
            <Route path={ROUTES.superadmin.support} element={<ComingSoonPage pageName="サポートチケット管理" />} />
          </Route>
        </Route>

        {/* デフォルトリダイレクト */}
        <Route path="/" element={<Navigate to={ROUTES.public.login} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.public.login} replace />} />
      </Routes>
    </BrowserRouter>
  );
};