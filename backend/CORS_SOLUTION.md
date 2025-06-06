# CORS問題の最終解決策

## 問題の概要
- OPTIONSリクエストで`Access-Control-Allow-Credentials`ヘッダーが設定されない
- 未知のミドルウェアがCORSヘッダーを上書きしている

## 推奨される解決策

### 1. 即時対応（フロントエンド側）
フロントエンドのAPIクライアントで、credentials設定を調整：

```typescript
// frontend/src/services/api/apiClient.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  withCredentials: true, // これが原因でCORSエラーが発生
  headers: {
    'Content-Type': 'application/json',
  },
});
```

一時的な回避策として、認証が必要ないエンドポイントでは`withCredentials: false`に設定することも検討。

### 2. 根本的解決（バックエンド側）

#### オプション1: Expressアプリケーションの再構築
```javascript
// 新しいExpressアプリケーションを作成し、ミドルウェアの順序を厳密に管理
const app = express();

// 1. 最初にCORSを設定（他のすべてのミドルウェアより前）
app.use((req, res, next) => {
  // CORSヘッダーを強制的に設定
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(204).end();
    }
  }
  next();
});

// 2. その後に他のミドルウェアを設定
```

#### オプション2: プロキシサーバーの使用
開発環境では、Viteのプロキシ機能を使用してCORS問題を回避：

```javascript
// frontend/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
```

#### オプション3: カスタムExpressサーバーの作成
完全に新しいExpressサーバーを作成し、既存のルートをインポート：

```javascript
// new-server.ts
import express from 'express';
import { createCorsHandler } from './common/middleware/cors-handler';

const app = express();

// CORS設定を最初に
app.use(createCorsHandler(allowedOrigins));

// その他のミドルウェアとルート
// ...

export default app;
```

## 調査で判明した事実

1. **カスタムCORSミドルウェアが呼ばれていない**
   - ログに「Handling OPTIONS request」が記録されていない
   - 別のミドルウェアが先にOPTIONSリクエストを処理している

2. **不明なCORSヘッダーパターン**
   - `Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE`
   - このパターンはコード内に存在しない
   - Express内部またはサードパーティライブラリが原因の可能性

3. **通常のリクエストは正常**
   - GET、POSTリクエストでは正しくCORSヘッダーが設定される
   - 問題はOPTIONSリクエストのみ

## 次のステップ

1. **デバッグの継続**
   - Express内部のミドルウェアスタックを調査
   - `app._router.stack`を確認して、登録されているミドルウェアを特定

2. **一時的な回避策**
   - フロントエンドで`withCredentials`を必要な場合のみ設定
   - 開発環境ではプロキシを使用

3. **長期的な解決**
   - Expressアプリケーションの初期化プロセスを見直し
   - 必要に応じて、カスタムサーバー実装を検討