import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { ROUTES } from './routes';

interface ProtectedRouteProps {
  requiredRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRoles = [] }) => {
  const { user, loading, hasCharacter, checkingAICharacter } = useAuth();

  if (loading || checkingAICharacter) {
    // ローディング中はスピナーを表示
    return <div>Loading...</div>;
  }

  if (!user) {
    // 未認証の場合はログインページへリダイレクト
    return <Navigate to={ROUTES.public.login} replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    // 権限不足の場合は適切なダッシュボードへリダイレクト
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return <Navigate to={ROUTES.superadmin.dashboard} replace />;
      case UserRole.OWNER:
      case UserRole.ADMIN:
        return <Navigate to={ROUTES.admin.dashboard} replace />;
      case UserRole.USER:
        return <Navigate to={ROUTES.stylist.dashboard} replace />;
      default:
        return <Navigate to={ROUTES.public.login} replace />;
    }
  }

  // USER/STYLISTロールの場合、AIキャラクターが設定されているかチェック
  if ((user.role === UserRole.USER || user.role === UserRole.STYLIST) && !hasCharacter) {
    console.log('[ProtectedRoute] AIキャラクター未設定を検出 - /ai-character-setup へリダイレクト');
    return <Navigate to={ROUTES.public.aiCharacterSetup} replace />;
  }

  return <Outlet />;
};