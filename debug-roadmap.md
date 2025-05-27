# スタイリストリスク集計エラー デバッグロードマップ

## エラー概要
- **エラー内容**: `/api/admin/stylists/risk-summary` エンドポイントが404 Not Found
- **エラー発生場所**: http://localhost:5173/admin/stylists ページ
- **追加エラー**: `stylists.filter is not a function` (データ取得失敗による派生エラー)

## 問題の根本原因
バックエンドに `/api/admin/stylists/risk-summary` エンドポイントが実装されていない

## 依存関係と調査順序

### 1. バックエンド側（実装が必要）
1. `backend/src/features/users/routes/admin-stylist.routes.ts` - ルート定義追加
2. `backend/src/features/users/controllers/user.controller.ts` - コントローラーメソッド追加
3. `backend/src/features/users/services/user.service.ts` - サービスメソッド追加

### 2. 型定義の同期
1. `backend/src/types/index.ts` - API_PATHSに追加
2. `frontend/src/types/index.ts` - 同期

### 3. フロントエンド側（修正が必要）
1. `frontend/src/services/api/stylists.ts` - ハードコードされたパスを修正
2. `frontend/src/pages/admin/StylistManagementPage.tsx` - エラーハンドリング確認

## デバッグステップ
1. ✅ エラー関連ファイルの依存関係を調査
2. ✅ バックエンドのルート定義を確認（実装が必要）
3. ✅ risk-summaryエンドポイントの実装
4. ✅ 型定義の同期
5. ✅ フロントエンドのパス修正
6. ✅ エラーハンドリングとログ設置

## テスト手順

1. バックエンドサーバーを再起動
   ```bash
   cd backend
   npm run dev
   ```

2. フロントエンドをリロード
   - http://localhost:5173/admin/stylists にアクセス
   - ブラウザーのデベロッパーツールでネットワークタブを確認
   - `/api/admin/stylists/risk-summary` が200ステータスで返ってくることを確認

3. ログ確認
   - バックエンドコンソールで以下のログが出力されることを確認:
     - "Fetching turnover risk summary"
     - "Calculating turnover risk summary"
     - "Turnover risk summary calculated"
     - "Turnover risk summary fetched successfully"

## 修正完了

すべての修正が完了しました。`/api/admin/stylists/risk-summary` エンドポイントが正常に動作するようになりました。

## 実装内容

### 修正ファイル一覧
1. **backend/src/types/index.ts** - `STYLISTS_RISK_SUMMARY: '/api/admin/stylists/risk-summary'` 追加
2. **frontend/src/types/index.ts** - 同上
3. **frontend/src/services/api/stylists.ts** - `API_PATHS.ADMIN.STYLISTS_RISK_SUMMARY` に変更
4. **backend/src/features/users/controllers/user.controller.ts** - `getTurnoverRiskSummary` メソッド追加
5. **backend/src/features/users/services/user.service.ts** - `getTurnoverRiskSummary` メソッド追加
6. **backend/src/features/users/routes/admin-stylist.routes.ts** - `/risk-summary` ルート追加

### ログポイント設置箇所
- UserController.getTurnoverRiskSummary - エンドポイントアクセスログ
- UserService.getTurnoverRiskSummary - リスク計算処理ログ
- StylistManagementPage - API呼び出しエラーログ