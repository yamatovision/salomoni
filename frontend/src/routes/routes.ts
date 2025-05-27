// ルート定義（要件定義書2.3に基づく）

export const ROUTES = {
  // 公開ルート
  public: {
    splash: '/splash',
    onboarding: '/onboarding',
    login: '/auth/login',
    organizationRegister: '/auth/register-organization',
    lineCallback: '/auth/line-callback',
    initialSetup: '/auth/initial-setup',
    aiCharacterSetup: '/ai-character/setup',
  },
  
  // スタイリストルート（要認証）
  stylist: {
    chat: '/chat',
    dashboard: '/dashboard',
    settings: '/settings',
    todayClients: '/clients/today',
    newClient: '/clients/new',
    initialSetup: '/initial-setup',
  },
  
  // 管理者ルート（要管理者権限）
  admin: {
    dashboard: '/admin',
    clients: '/admin/clients',
    stylists: '/admin/stylists',
    appointments: '/admin/appointments',
    import: '/admin/import',
    support: '/admin/support',
    billing: '/admin/billing',
  },
  
  // SuperAdminルート（要SuperAdmin権限）
  superadmin: {
    dashboard: '/superadmin',
    organizations: '/superadmin/organizations',
    plans: '/superadmin/plans',
    support: '/superadmin/support',
  },
} as const;