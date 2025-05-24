# 認証エラー デバッグ分析ドキュメント

## エラー概要
- **発生箇所**: `MockAuthService.getCurrentUser()` (auth.ts:58)
- **エラーメッセージ**: "認証が必要です"
- **症状**: モック画面が正しく表示されない

## 依存関係マップ

```
App.tsx
  └─> AuthProvider (AuthContext.tsx)
        ├─> authService (services/index.ts)
        │     └─> MockAuthService (services/mock/handlers/auth.ts)
        └─> refreshAuth() 
              └─> authService.getCurrentUser()
                    └─> エラー発生: currentUser が null
```

## 問題の根本原因

1. **トークンの不一致**:
   - `AuthContext.tsx` line 30: `localStorage.getItem('accessToken')`
   - `MockAuthService` line 9: `localStorage.getItem('mockAccessToken')`
   - 異なるキー名を使用しているため、認証状態が同期していない

2. **初期化の問題**:
   - MockAuthServiceのコンストラクタでmockAccessTokenを確認
   - AuthContextではaccessTokenを確認
   - トークンが見つからないため、currentUserがnullのまま

## 修正ロードマップ

### ステップ1: トークンキー名の統一
- [ ] AuthContextとMockAuthServiceで同じトークンキー名を使用

### ステップ2: ログ設置による詳細調査
- [ ] MockAuthServiceのコンストラクタにログ追加
- [ ] AuthContext.refreshAuth()にログ追加
- [ ] トークンの存在確認とユーザー設定の流れを追跡

### ステップ3: モック認証フローの修正
- [ ] トークンキー名の一貫性確保
- [ ] 初期ユーザー設定の改善

### ステップ4: 画面表示の修正
- [ ] 認証状態に応じた適切な画面遷移の実装

## 修正実施ログ

### ステップ1-3: 完了 ✓
- トークンキー名を統一（mockAccessToken → accessToken）
- デバッグログを追加して認証フローを追跡可能に
- MockAuthServiceのコンストラクタとAuthContextで同じキーを使用

### 現在の状況
- 認証エラーは解消されるはず
- ただし、初回アクセス時はトークンがないため、ログインページにリダイレクトされる
- モック認証情報でログインすることで、モック画面が表示される

## 追加修正ログ（2回目）

### 問題
1. トークンから正しくユーザーIDを抽出できない（split('-')[2]では不十分）
2. `mock-token-mock-superadmin-001` のような形式に対応必要

### 実施した修正
1. **トークンパース処理の改善**:
   - `mock-token-` プレフィックスを削除してからパース
   - タイムスタンプ部分を除外してユーザーIDを再構築
   - refreshメソッドも同様に修正

2. **InitialSetupPageの修正**:
   - インポートエラーは自動的に解決された模様

### 最終確認事項
- ブラウザをリロードして、モックユーザーでのログインが正常に動作することを確認
- コンソールログで正しいユーザーIDが抽出されているか確認