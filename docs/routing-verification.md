# ルーティング検証レポート

## Phase 3: スタイリスト向け機能

| ページID | ページ名 | 期待ルート | 実装状態 | 備考 |
|---------|---------|-----------|----------|------|
| P-001 | スプラッシュページ | `/splash` | ✅ 実装済み | SplashPage |
| P-002 | オンボーディングページ | `/onboarding` | ✅ 実装済み | OnboardingPage |
| M-001 | AIチャット相談ページ | `/chat` | ✅ 実装済み | ChatPage |
| M-002 | 今日のアドバイスページ | `/dashboard` | ✅ 実装済み | DailyAdvicePage |
| M-003 | 管理画面ページ（設定） | `/settings` | ✅ 実装済み | SettingsPage |
| M-004 | 本日の施術クライアント一覧 | `/clients/today` | ✅ 実装済み | TodayClientsPage |
| M-005 | クライアント直接入力・結果表示 | `/clients/new` | ✅ 実装済み | NewClientPage |

## Phase 4: 管理者向け機能

| ページID | ページ名 | 期待ルート | 実装状態 | 備考 |
|---------|---------|-----------|----------|------|
| A-001 | 管理者ダッシュボード | `/admin` | ✅ 実装済み | AdminDashboardPage |
| A-002 | クライアント管理 | `/admin/clients` | ✅ 実装済み | ClientManagementPage |
| A-003 | スタイリスト管理 | `/admin/stylists` | ✅ 実装済み | StylistManagementPage |
| A-004 | 予約・担当管理 | `/admin/appointments` | ✅ 実装済み | AppointmentManagementPage |
| A-005 | データインポート | `/admin/import` | ✅ 実装済み | DataImportPage |
| A-006 | サポート管理 | `/admin/support` | ✅ 実装済み | AdminSupportPage |
| A-007 | 請求・支払い管理 | `/admin/billing` | ✅ 実装済み | AdminBillingPage |

## Phase 5: SuperAdmin向け機能

| ページID | ページ名 | 期待ルート | 実装状態 | 備考 |
|---------|---------|-----------|----------|------|
| S-001 | 組織管理画面 | `/superadmin/organizations` | ✅ 実装済み | SuperAdminOrganizationsPage |
| S-002 | 課金・プラン管理画面 | `/superadmin/plans` | ✅ 実装済み | SuperAdminPlansPage |
| S-003 | サポートチケット管理画面 | `/superadmin/support` | ✅ 実装済み | SuperAdminSupportPage |
| S-004 | SuperAdminダッシュボード | `/superadmin` | ✅ 実装済み | S-001へリダイレクト |

## 問題点と修正事項

### 1. ProtectedRoute の requiredRoles 設定

**問題**: スタイリストルートで `UserRole.USER` と `UserRole.ADMIN` が設定されているが、`UserRole.STYLIST` が含まれていない

**現在の設定**:
```tsx
<Route element={<ProtectedRoute requiredRoles={[UserRole.USER, UserRole.ADMIN]} />}>
```

**修正案**:
```tsx
<Route element={<ProtectedRoute requiredRoles={[UserRole.USER, UserRole.STYLIST, UserRole.ADMIN, UserRole.OWNER]} />}>
```

### 2. スタイリスト初回設定ページ

**問題**: `/initial-setup` が ComingSoonPage になっている

**現在の設定**:
```tsx
<Route path={ROUTES.stylist.initialSetup} element={<ComingSoonPage pageName="初回設定" />} />
```

**修正案**: 
- InitialSetupPage を再利用するか、スタイリスト用の初回設定ページを別途実装する必要がある

### 3. ロールの整合性

SCOPE_PROGRESS.md のモックユーザー情報では:
- `stylist1@salon.com` のロールが `USER`

型定義では:
- `UserRole.STYLIST` が存在

これらの不整合を解消する必要がある。

## 結論

すべてのページのルーティングは設定されていますが、以下の調整が必要です：
1. スタイリストルートの requiredRoles に STYLIST と OWNER を追加
2. スタイリスト初回設定ページの実装
3. UserRole.STYLIST の使用について整合性を確保