# CORS エラー解決ドキュメント

## エラー内容
```
Access to XMLHttpRequest at 'http://localhost:3001/api/auth/login' from origin 'http://localhost:5173' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
The value of the 'Access-Control-Allow-Credentials' header in the response is '' which must be 'true' 
when the request's credentials mode is 'include'.
```

## 問題の原因

1. **ポート番号の不一致**
   - バックエンドの.envファイル: `PORT=3001`
   - バックエンドの実際の起動ポート: `8080`（デフォルト値）
   - フロントエンドからのアクセス先: `http://localhost:3001`

2. **CORS設定の問題**
   - `Access-Control-Allow-Credentials`ヘッダーが正しく設定されていない
   - プリフライトリクエスト（OPTIONS）の処理が不適切

## 解決方法

### 1. CORS設定を修正済み（backend/src/index.ts）
- より詳細なCORS設定に変更
- origin検証機能を追加
- 必要なヘッダーを明示的に指定

### 2. バックエンドの起動を確認

```bash
# バックエンドディレクトリで実行
cd backend
npm run dev
```

起動時のログで以下を確認：
- `Server is running on port 3001` と表示されることを確認
- `CORS設定:` のログで許可されたオリジンを確認

### 3. もし問題が続く場合の対処法

#### A. バックエンドが3001ポートで起動していることを確認
```bash
# ポートの使用状況を確認（macOS/Linux）
lsof -i :3001
```

#### B. フロントエンドの環境変数を確認
```bash
# frontend/.env ファイルを確認
VITE_API_BASE_URL=http://localhost:3001
```

#### C. ブラウザのキャッシュをクリア
- 開発者ツールを開く
- Network タブで「Disable cache」をチェック
- ページをリロード

### 4. デバッグ手順

1. バックエンドのログを確認
   - CORS設定が正しく読み込まれているか
   - リクエストが到達しているか

2. ブラウザの開発者ツールで確認
   - NetworkタブでOPTIONSリクエストのレスポンスヘッダーを確認
   - `Access-Control-Allow-Credentials: true` が設定されているか

3. 一時的な対処法（開発環境のみ）
   - Chromeの場合: `--disable-web-security` フラグで起動（非推奨）

## 正常動作時の期待値

- OPTIONSリクエストが200 OKを返す
- レスポンスヘッダーに以下が含まれる：
  - `Access-Control-Allow-Origin: http://localhost:5173`
  - `Access-Control-Allow-Credentials: true`
  - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`