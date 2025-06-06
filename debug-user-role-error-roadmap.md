# デバッグロードマップ: GET /api/users?role=USER 400エラー

## エラー概要
- **エラー内容**: `GET http://localhost:5173/api/users?role=USER 400 (Bad Request)`
- **発生箇所**: StylistManagementPage.tsx でスタイリスト一覧を取得する際
- **根本原因**: UserRole列挙型の値の不一致（フロントエンド: 'USER' vs バックエンド: 'user'）

## 調査で判明した問題

### 1. フロントエンド側の問題
- **ファイル**: `frontend/src/services/api/stylists.ts`
- **問題点**: `getStylists`関数で大文字の'USER'を送信していたが、バックエンドは小文字の'user'を期待
```typescript
// 修正前の問題コード
params.append('role', 'USER');  // バックエンドのUserRole.USER = 'user'と不一致
```

### 2. バックエンド側の型定義
- **ファイル**: `backend/src/types/index.ts`
- **UserRole列挙型の定義**:
```typescript
export enum UserRole {
  SUPER_ADMIN = 'superadmin',
  OWNER = 'owner',
  ADMIN = 'admin',
  STYLIST = 'stylist',
  USER = 'user',  // 小文字の'user'
  CLIENT = 'client',
}
```

## 修正内容

### 1. stylists.ts の修正
```typescript
// 修正後: 小文字の'user'を使用
if (filter?.role) {
  params.append('role', filter.role);
} else {
  params.append('role', 'user');  // 'USER'から'user'に変更
}
```

## 依存関係マップ

```
StylistManagementPage.tsx
    ↓ (getStylists呼び出し)
stylists.ts
    ↓ (apiClient.get呼び出し)
apiClient.ts
    ↓ (HTTP GET リクエスト)
backend: user.routes.ts
    ↓ (ルーティング)
backend: user.controller.ts
    ↓ (バリデーション)
backend: user.validator.ts
    ↓ (検証失敗 → 400エラー)
```

## ログ設置箇所
1. `stylists.ts`: パラメータ生成直後にconsole.log追加（デバッグ時）
2. `user.controller.ts`: リクエストパラメータのログ追加（必要に応じて）

## 今後の推奨事項
1. APIクライアント層でのパラメータ重複チェックの実装
2. バックエンド側での配列パラメータのハンドリング改善
3. 型定義での厳密なパラメータ型の指定