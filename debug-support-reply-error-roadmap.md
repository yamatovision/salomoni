# サポート返信エラー デバッグロードマップ

## エラー概要
- **エンドポイント**: `/api/admin/support/tickets/:ticketId/reply`
- **メソッド**: POST
- **ステータス**: 400 Bad Request
- **エラーメッセージ**: "返信内容は必須です"
- **エラーコード**: VALIDATION_ERROR

## 依存関係マップ

```
1. Routes (backend/src/features/support/routes/support.routes.ts)
   ├── Line 78-83: adminRouter.post('/tickets/:ticketId/reply')
   └── Middleware Chain:
       ├── replyToTicketValidator
       ├── handleValidationErrors
       └── adminReplyToTicket (controller)

2. Validators (backend/src/features/support/validators/support.validator.ts)
   └── Line 74-77: replyToTicketValidator
       └── body('content').notEmpty().withMessage('返信内容は必須です')

3. Controllers (backend/src/features/support/controllers/support.controller.ts)
   └── adminReplyToTicket method

4. Error Handler (backend/src/common/middleware/validationHandler.ts)
   └── handleValidationErrors middleware
```

## デバッグ手順

### ステップ1: リクエストボディの確認
- [x] フロントエンドから送信されるリクエストボディの構造を確認
- [x] `content` フィールドが正しく送信されているか検証
- [x] Content-Typeヘッダーが正しく設定されているか確認

### ステップ2: バリデーション詳細の調査
- [x] replyToTicketValidator の動作を確認
- [x] リクエストボディのログを追加して実際の値を確認

### ステップ3: フロントエンドのAPI呼び出し確認
- [x] support.ts のreplyToTicket関数の実装を確認
- [x] リクエストペイロードの構造を検証

## 根本原因
**フロントエンドとバックエンドのフィールド名の不一致**
- フロントエンド: `message` フィールドを送信
- バックエンド: `content` フィールドを期待

### 詳細
1. AdminSupportPage.tsx (Line 311): `message: replyText.trim()` を送信
2. SupportTicketReplyInput型 (Line 1789): `message: string` と定義
3. support.validator.ts (Line 75): `body('content')` を検証

## 解決策（実装済み）
バックエンドを修正してフロントエンドの仕様に合わせる：

1. **バリデーター修正** (support.validator.ts)
   - `body('content')` → `body('message')` に変更

2. **コントローラー修正** (support.controller.ts)
   - `const { message: content, attachments } = req.body;` でフィールド名を変換
   - 既存のロジックはそのまま`content`変数を使用

## 修正完了
- [x] バリデーターを `body('message')` に変更
- [x] コントローラーでフィールド名を適切にマッピング
- [x] デバッグログは既存のまま維持