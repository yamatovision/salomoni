# SuperAdmin Support Reply エラーデバッグロードマップ

## エラー概要
- **発生場所**: SuperAdmin Support ページの返信機能
- **エラー内容**: 400 Bad Request - "返信内容は必須です"
- **エンドポイント**: POST /api/superadmin/support/tickets/:id/reply

## 問題の根本原因
フロントエンドとバックエンドでリクエストボディの構造が不一致：

### フロントエンド送信データ
```typescript
{
  senderId: ID;
  message: string;  // ← フロントエンドは"message"を送信
  isStaff: boolean;
  content?: string;
  attachments?: string[];
}
```

### バックエンド期待データ
```typescript
{
  content: string;  // ← バックエンドは"content"を期待
  attachments?: string[];
}
```

## 関連ファイル依存関係

```
フロントエンド
├── frontend/src/pages/superadmin/SuperAdminSupportPage.tsx (88-132行)
│   └── handleReply関数でmessageフィールドを送信
├── frontend/src/services/api/superadmin-support.ts (33-39行)
│   └── replySuperAdminSupportTicket関数
└── frontend/src/types/index.ts
    └── SupportTicketReplyInput型定義

バックエンド
├── backend/src/features/support/routes/support.routes.ts (148-153行)
│   └── superAdminReplyToTicketルート定義
├── backend/src/features/support/controllers/support.controller.ts (399-448行)
│   └── superAdminReplyToTicketコントローラー
├── backend/src/features/support/validators/support.validator.ts (70-85行)
│   └── replyToTicketValidator（contentフィールド必須）
└── backend/src/features/support/services/support.service.ts (180-229行)
    └── replyToTicketサービスメソッド
```

## 修正アプローチ

### 修正順序：
1. **型定義の確認と統一** (frontend/src/types/index.ts と backend/src/types/index.ts)
2. **フロントエンドの修正** - messageをcontentに変更
3. **ログの追加** - デバッグ用ログの設置
4. **テストと検証** - 修正後の動作確認

## ログ設置ポイント
1. フロントエンド: handleReply関数の送信データログ
2. バックエンド: コントローラーの受信データログ
3. バックエンド: バリデーション前後のログ

## 次のステップ
1. 型定義ファイルの内容を確認 ✅
2. フロントエンドのhandleReply関数を修正 ✅
3. 必要に応じてログを追加 ✅
4. 修正をテスト

## 実施した修正内容

### 1. フロントエンドの修正 (SuperAdminSupportPage.tsx)
- handleReply関数でcontentフィールドを追加（94-98行目）
- デバッグログを追加（101行目）

### 2. バックエンドのログ追加 (support.controller.ts)
- リクエストボディ全体をログに記録（418-424行目）
- contentフィールドの存在確認ログを追加

## 修正後の動作確認手順
1. フロントエンドとバックエンドを再起動
2. SuperAdminでログイン
3. サポートページで返信を送信
4. ブラウザコンソールとバックエンドログを確認