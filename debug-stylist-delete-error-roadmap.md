# スタイリスト削除エラー デバッグロードマップ

## エラー概要
- **発生箇所**: StylistManagementPage.tsx - スタイリスト削除機能
- **エラータイプ**: 
  1. 初回: 403 Forbidden
  2. 次回: 400 Bad Request
  3. MUI警告: select componentで無効な値 `owner`

## 分析フロー

### Phase 1: エラー関連ファイルの依存関係
```
フロントエンド:
├── StylistManagementPage.tsx (削除ボタンのクリックハンドラー)
├── services/api/stylists.ts (API呼び出し)
├── services/api/apiClient.ts (Axios設定)
└── types/index.ts (型定義)

バックエンド:
├── routes/user.routes.ts (DELETE /api/users/:id)
├── controllers/user.controller.ts (deleteUser)
├── services/user.service.ts (ビジネスロジック)
├── middleware/auth.ts (認証・認可)
└── types/index.ts (型定義)
```

### Phase 2: エラー詳細分析

#### 1. MUI Select警告
- **問題**: `owner` という値がselectコンポーネントで使用されているが、選択肢は `user`, `admin` のみ
- **原因**: ロールの不整合（ownerロールが選択肢に含まれていない）

#### 2. 403 Forbidden → 400 Bad Request
- **認証トークン**: 正常に送信されている
- **ユーザーロール**: `owner` (JWTトークンから確認)
- **問題の可能性**:
  - 権限チェックで`owner`ロールが処理されていない
  - ロールマッピングの不整合

### Phase 3: 調査順序
1. **バックエンドのロール定義確認**
   - types/index.tsでのUserRole定義
   - 認証ミドルウェアでのロール処理

2. **フロントエンドのロール管理**
   - StylistManagementPageでのロール選択肢
   - types/index.tsでのロール定義の同期

3. **削除APIエンドポイント**
   - user.controller.tsのdeleteUser実装
   - 権限チェックロジック

## 現在のステータス
- エラー関連ファイルの一覧取得: 完了
- 依存関係の分析: 完了
- 次のステップ: 関連ファイルの詳細調査