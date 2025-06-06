import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { ROUTES } from './routes';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const RoleBasedRedirect: React.FC = () => {
  const { user, loading, hasAICharacter, checkingAICharacter } = useAuth();

  // ローディング中は待機
  if (loading || checkingAICharacter) {
    console.log('[RoleBasedRedirect] ローディング中 - loading:', loading, 'checkingAICharacter:', checkingAICharacter);
    return <LoadingSpinner />;
  }

  // 未認証の場合はログインページへ
  if (!user) {
    console.log('[RoleBasedRedirect] 未認証ユーザー: ログインページへリダイレクト');
    return <Navigate to={ROUTES.public.login} replace />;
  }

  // ロールに応じたダッシュボードへリダイレクト
  console.log('[RoleBasedRedirect] 認証済みユーザー:', user.email, user.role, 'hasAICharacter:', hasAICharacter);
  
  switch (user.role) {
    case UserRole.SUPER_ADMIN:
      console.log('[RoleBasedRedirect] SUPER_ADMIN: /superadmin/organizations へリダイレクト');
      return <Navigate to={ROUTES.superadmin.organizations} replace />;
    
    case UserRole.OWNER:
    case UserRole.ADMIN:
      console.log('[RoleBasedRedirect] OWNER/ADMIN: /admin へリダイレクト');
      return <Navigate to={ROUTES.admin.dashboard} replace />;
    
    case UserRole.USER:
    case UserRole.STYLIST:
      // AIキャラクターが未設定の場合は設定ページへ
      if (!hasAICharacter) {
        console.log('[RoleBasedRedirect] USER/STYLIST: AIキャラクター未設定 - /ai-character-setup へリダイレクト');
        return <Navigate to={ROUTES.public.aiCharacterSetup} replace />;
      }
      console.log('[RoleBasedRedirect] USER/STYLIST: /dashboard へリダイレクト');
      return <Navigate to={ROUTES.stylist.dashboard} replace />;
    
    default:
      console.log('[RoleBasedRedirect] 不明なロール:', user.role, 'ログインページへリダイレクト');
      return <Navigate to={ROUTES.public.login} replace />;
  }
};