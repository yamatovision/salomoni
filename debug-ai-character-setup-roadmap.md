# AIキャラクター設定エラー デバッグロードマップ

## 1. エラー概要
- **問題1**: POST `/api/ai-characters/clients/{clientId}/setup` が400エラー
- **問題2**: AIキャラクターが存在するのに設定画面へリダイレクトされる

## 2. 依存関係マップ

### フロントエンド依存関係
```
AICharacterSetupPage.tsx
    ↓ uses
useAICharacterSetup.ts
    ↓ calls
aiCharacterSetup.ts
    ↓ uses
apiClient → Backend API
```

### バックエンド依存関係
```
ai-character.routes.ts
    ↓ routes to
ai-character.controller.ts
    ↓ uses
ai-character.service.ts
    ↓ uses
- AICharacterRepository
- UserRepository
- SajuService
- OpenAI Service
```

## 3. デバッグ手順

### ステップ1: 400エラーの詳細確認
1. ブラウザのネットワークタブで以下を確認:
   - リクエストURL
   - リクエストボディ
   - レスポンスボディ（エラーメッセージ）
   
2. バックエンドログの確認:
   - エラーハンドラーのログ
   - バリデーションエラーの詳細

### ステップ2: データフローの検証
1. **フロントエンド側**:
   - `setupData`の内容確認
   - `processedData`の形式確認
   - 送信されるリクエストボディの検証

2. **バックエンド側**:
   - バリデーター要件の確認
   - 既存AIキャラクターの重複チェック
   - クライアントIDの有効性確認

### ステップ3: AIキャラクター存在チェックの問題
1. `ChatPage.tsx`の`hasAICharacter`ロジック確認
2. `/ai-character-setup`へのリダイレクト条件確認
3. AIキャラクター取得APIの応答確認

## 4. ログ設置箇所

### フロントエンド
- `aiCharacterSetup.ts`: リクエスト送信前後
- `useAICharacterSetup.ts`: データ処理の各段階
- `ChatPage.tsx`: AIキャラクター取得と判定ロジック

### バックエンド
- `ai-character.controller.ts`: リクエスト受信時
- `ai-character.service.ts`: 各処理段階
- バリデーター: 検証失敗の詳細

## 5. 推定される原因

### 400エラーの可能性
1. **バリデーター不一致**: フロントエンドが`setupAICharacterValidator`の形式でデータを送信しているが、バックエンドは`setupClientAICharacterValidator`を使用
   - フロントエンド: すべてのフィールドを送信（必須扱い）
   - バックエンド: ほとんどのフィールドがオプショナル
2. **データ型不一致**: 文字列/数値の型エラー
3. **権限エラー**: ユーザーがクライアントにアクセスする権限がない

### リダイレクトの可能性
1. **AIキャラクター取得の条件判定誤り**: 
   - `characterResponse.success && characterResponse.data`の条件で、dataがnullまたはundefinedの場合
   - ユーザーのAIキャラクターとクライアントのAIキャラクターの混同

## 6. 修正方針

### 問題1: 400エラーの修正
- バリデーターを統一するか、フロントエンドの送信データを調整
- エラーハンドラーでバリデーションエラーの詳細を返すように改善

### 問題2: チャット画面遷移の修正
- AIキャラクター存在チェックのロジックを修正
- クライアント用AIキャラクターとユーザー用AIキャラクターを区別

## 7. 実施した修正

### フロントエンド
1. **aiCharacterSetup.ts**:
   - リクエストデータとエラーレスポンスの詳細ログを追加
   - エラー時により詳細な情報を出力

2. **ChatPage.tsx**:
   - クライアントIDが指定されている場合は、クライアントのAIキャラクター設定状況を確認
   - クライアント用チャットと個人用チャットを明確に区別
   - 不要なリダイレクトループを防止

3. **AICharacterSetupPage.tsx**:
   - AIキャラクター設定済みの場合は`/chat`へリダイレクト（`/dashboard`ではなく）

### バックエンド
1. **validationHandler.ts**:
   - バリデーションエラーの詳細を収集してエラーオブジェクトに追加

2. **errorHandler.ts**:
   - バリデーションエラーの詳細をAPIレスポンスに含める

## 8. 期待される動作

1. **400エラーが発生した場合**:
   - ブラウザコンソールに詳細なバリデーションエラーが表示される
   - どのフィールドが問題なのか特定可能

2. **チャット画面への遷移**:
   - 個人用チャット: 自分のAIキャラクターが必要
   - クライアント用チャット: クライアントのAIキャラクターが必要
   - 適切なリダイレクトが行われる