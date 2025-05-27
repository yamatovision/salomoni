# CORSエラー デバッグレポート

## エラー概要
- **発生日時**: 2025/5/26
- **エラータイプ**: CORS policy エラー & 接続拒否エラー
- **影響範囲**: 認証システム全体（ログイン、ユーザー情報取得）

## エラーメッセージ
```
Access to XMLHttpRequest at 'http://localhost:3001/api/users/me' from origin 'http://localhost:5173' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: The value of the 'Access-Control-Allow-Origin' header in the response 
must not be the wildcard '*' when the request's credentials mode is 'include'.
```

## 根本原因

### 1. ポート番号の不一致
- **フロントエンド環境変数**: `VITE_API_BASE_URL=http://localhost:3001`
- **バックエンド実行ポート**: 5000
- フロントエンドがポート3001にアクセスしようとしているが、バックエンドはポート5000で起動している

### 2. CORS設定の問題
- バックエンドのCORS設定で`origin: '*'`と`credentials: true`を同時に使用
- ブラウザのセキュリティポリシーにより、この組み合わせは許可されない

## 依存関係マップ
```
フロントエンド（localhost:5173）
  ├─ apiClient.ts
  │   └─ baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:5000'
  │   └─ withCredentials: true
  │
  ├─ AuthContext.tsx
  │   └─ apiClient を使用して /api/users/me にアクセス
  │
  └─ .env.development
      └─ VITE_API_BASE_URL=http://localhost:3001 ← 問題の設定

バックエンド（localhost:5000）
  └─ index.ts
      └─ CORS設定: origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
      └─ credentials: true
```

## 解決手順

### ステップ1: ポート番号の修正
フロントエンドの環境変数を修正:
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:5000
```

### ステップ2: CORS設定の修正
バックエンドの環境変数に明示的なoriginを設定:
```bash
# backend/.env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### ステップ3: フロントエンドの再起動
環境変数を反映させるため、フロントエンドサーバーを再起動する必要がある

## ログ設置ポイント
1. **apiClient.ts**: リクエスト前のベースURL確認
2. **backend/index.ts**: CORS設定の実際の値
3. **auth.middleware.ts**: トークン検証プロセス

## 検証項目
- [ ] フロントエンドの環境変数が正しく読み込まれているか
- [ ] バックエンドのCORS設定が適切か
- [ ] ポート番号が一致しているか
- [ ] credentials設定が両側で一致しているか