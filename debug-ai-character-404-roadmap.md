# AIキャラクター404エラー デバッグロードマップ

## エラー概要
1. `/api/fortune/users/{userId}/daily-advice` - 404エラー（AIキャラクターが見つからない）
2. `/api/ai-characters/my-character` - 404エラー（ルートが見つからない）

## 問題の根本原因

### 1. ルーティングの不一致
- **現状**: `backend/src/index.ts`で`aiCharacterRoutes`が`/api/chat`に登録されている（66行目）
- **期待**: 型定義では`/api/ai-characters`として定義されている
- **結果**: `/api/ai-characters/my-character`へのリクエストが404になる

### 2. APIパスの不一致
- **フロントエンド型定義**: `MY_CHARACTER: '/api/ai-characters/my-character'`
- **バックエンドルート定義**: `/characters/me`（ai-character.routes.ts 26行目）
- **実際のルート**: `/api/chat/characters/me`

## 修正手順

### ステップ1: backend/src/index.tsの修正（最優先）
```typescript
// 66行目を修正
app.use('/api/ai-characters', aiCharacterRoutes); // 変更前: '/api/chat'
```

### ステップ2: ai-character.routes.tsの修正
```typescript
// 26行目を修正
router.get('/my-character', auth(['user', 'admin', 'stylist', 'superadmin']), aiCharacterController.getMyCharacter);
// 変更前: '/characters/me'
```

### ステップ3: 型定義の確認と同期
- backend/src/types/index.tsとfrontend/src/types/index.tsが同期されていることを確認
- APIパスの定義が一致していることを確認

### ステップ4: fortuneサービスのエラーハンドリング確認
- fortune.service.tsでAIキャラクターが見つからない場合の処理を確認
- 適切なエラーメッセージとフォールバック処理があることを確認

### ステップ5: ログの追加
各ステップでログを追加して、エラーの発生箇所を特定できるようにする：
- ルート登録時のログ
- APIリクエスト受信時のログ
- AIキャラクター取得処理のログ

### ステップ6: テスト実行
1. `/api/ai-characters/my-character`が正しく応答することを確認
2. `/api/fortune/users/{userId}/daily-advice`がAIキャラクターを正しく取得できることを確認

## 依存関係図
```
index.ts (ルート登録)
  ├── ai-character.routes.ts (ルート定義)
  │   └── ai-character.controller.ts
  │       └── ai-character.service.ts
  │           └── ai-character.repository.ts
  │               └── ai-character.model.ts
  │
  └── fortune.routes.ts
      └── fortune.controller.ts
          └── fortune.service.ts (AIキャラクターを使用)
              ├── ai-character.service.ts
              └── fortune.repository.ts
```

## ログ追加箇所
1. `index.ts`: ルート登録時 ✓ 完了
2. `ai-character.routes.ts`: リクエスト受信時
3. `ai-character.controller.ts`: キャラクター取得処理 ✓ 完了
4. `fortune.service.ts`: AIキャラクター参照時 ✓ 完了

## 実施済みの修正
1. ✓ backend/src/index.ts: 66行目で `/api/chat` → `/api/ai-characters` に変更
2. ✓ ai-character.routes.ts: 26行目で `/characters/me` → `/my-character` に変更
3. ✓ ログ追加:
   - index.ts: AIキャラクタールート受信ログ
   - ai-character.controller.ts: getMyAICharacter開始・検索・エラーログ
   - fortune.service.ts: AIキャラクター取得開始・結果・エラーログ