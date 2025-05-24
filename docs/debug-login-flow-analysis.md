# ログイン遷移エラー分析ドキュメント

## 問題の概要
ログイン成功後、適切なダッシュボードへの遷移が発生しない

## 関連ファイルの依存関係マップ

```
App.tsx
  └── AuthProvider (認証コンテキストプロバイダー)
       └── AppRouter (routes/index.tsx)
            ├── PublicLayout
            │    └── LoginPage.tsx
            │         └── navigate('/') ← 問題箇所
            └── ProtectedRoute.tsx
                 ├── SUPER_ADMIN → /superadmin
                 ├── OWNER/ADMIN → /admin
                 └── USER → /dashboard
```

## 問題の詳細分析

### 現在のフロー
1. ユーザーがログインページでログイン
2. LoginPage.tsx の62行目で `navigate('/')` を実行
3. routes/index.tsx の96行目で `/` は `/auth/login` へリダイレクト
4. **結果**: ログイン済みユーザーが再度ログインページへ戻される

### 根本原因
- LoginPage.tsx がユーザーのロールを考慮せず、常に `/` へ遷移している
- `/` へのアクセスは無条件でログインページへリダイレクトされる設定になっている

## 実施した修正

### 1. LoginPage.tsx の修正
- ログイン成功後、AuthResponseからユーザーのロールを取得
- ロールに応じたダッシュボードへ直接遷移するように変更
- デバッグログを追加して遷移先を確認可能に

### 2. AuthContext.tsx の修正
- login関数がAuthResponseを返すように型を更新
- ログイン成功後の遷移に必要な情報を提供

### 3. routes/index.tsx の修正
- デフォルトルート `/` に RoleBasedRedirect コンポーネントを設定
- 認証状態とロールに基づいた適切なリダイレクトを実装

### 4. RoleBasedRedirect コンポーネントの作成
- 認証状態をチェック
- 未認証: ログインページへ
- 認証済み: ロールに応じたダッシュボードへ

## 修正後のフロー

### ログイン時
1. ユーザーがログインページでログイン
2. LoginPage.tsx でロールを判定
3. 直接適切なダッシュボードへ遷移
   - SUPER_ADMIN → /superadmin/organizations
   - OWNER/ADMIN → /admin
   - USER/STYLIST → /dashboard

### ルートアクセス時
1. `/` にアクセス
2. RoleBasedRedirect が認証状態とロールを確認
3. 適切なページへリダイレクト

## デバッグログ

以下の箇所にログを追加済み：
- LoginPage.tsx: ログイン成功時のロール判定
- RoleBasedRedirect.tsx: リダイレクト先の判定
- AuthContext.tsx: トークンとユーザー情報の取得