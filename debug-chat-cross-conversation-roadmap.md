# チャット履歴混在バグ調査ロードマップ

## 問題の概要
スタイリストのチャット画面で、異なるクライアントの履歴が表示されるバグが発生している可能性。

## 調査した依存関係構造

### フロントエンド側の流れ
1. `ChatPage.tsx` - メインコンポーネント
   - URLパラメータまたはstateからclientIdを取得
   - `chatService.startChat()` でチャット開始
   - `chatService.getMessages()` でメッセージ履歴取得

2. `chat.ts` - APIクライアント
   - `startChat()` → POST `/api/chat/start`
   - `getMessages()` → GET `/api/chat/conversations/{conversationId}/messages`

### バックエンド側の流れ
1. `chat.controller.ts` - コントローラー
   - `startChat()` メソッドでリクエスト処理
   - `getMessages()` メソッドでメッセージ取得

2. `chat.service.ts` - ビジネスロジック
   - `getOrCreateConversation()` で会話の取得/作成
   - `getMessages()` でメッセージ取得

3. `conversation.repository.ts` - データアクセス
   - `getActiveConversation()` でアクティブ会話検索
   - `findByUserId()` / `findByClientId()` で会話検索

4. `chat-message.repository.ts` - メッセージデータアクセス
   - `findByConversationId()` でメッセージ履歴取得

## 調査優先度（高→低）

### 🔴 最高優先（即座に確認）
1. **会話特定ロジックの検証** (`conversation.repository.ts` の `getActiveConversation()`)
   - userIdとclientIdの区別が正しく行われているか
   - contextの条件が適切に設定されているか
   - 異なるユーザー間で会話が混在しないか

### 🟡 高優先（会話作成・取得の整合性）
2. **会話開始処理の検証** (`chat.service.ts` の `getOrCreateConversation()`)
   - contextとuserID/clientIDの整合性チェック
   - AIキャラクター取得ロジックの確認

3. **認証とユーザー特定** (`chat.controller.ts` の `startChat()`)
   - `req.user`から正しいユーザー情報が取得されているか
   - JWTペイロードの解析が正しく行われているか

### 🟢 中優先（フロントエンド側の状態管理）
4. **チャット開始時のパラメータ渡し** (`ChatPage.tsx`)
   - clientIdの受け渡しが正しく行われているか
   - URLパラメータとstateの優先順位に問題がないか

5. **会話切り替え処理** (`ChatPage.tsx` のuseEffect)
   - クライアント変更時の会話切り替えロジック
   - 古い会話の状態がクリアされているか

### 🔵 低優先（確認程度）
6. **メッセージ取得処理** (`chat-message.repository.ts`)
   - conversationIdによるフィルタリングが正しく動作するか

## 具体的な調査ポイント

### A. 会話の一意性確保
```typescript
// conversation.repository.ts:189-220
// この検索条件が正しく動作するかチェック
const query: any = {
  aiCharacterId,
  endedAt: { $exists: false },
};

if (userId) {
  query.userId = userId;  // ← userIdが正しく設定されているか
} else if (clientId) {
  query.clientId = clientId;  // ← clientIdが正しく設定されているか
}

if (context) {
  query.context = context;  // ← contextが適切に渡されているか
}
```

### B. 認証情報の正確性
```typescript
// chat.controller.ts:194-248
// JWTから取得したuser情報が正しいかチェック
const userProfile = context === 'client_direct' ? undefined : {
  id: user.id,           // ← user.idが正しく設定されているか
  email: user.email,
  roles: user.roles,
  organizationId: user.organizationId,  // ← 組織IDが正しいか
} as any;
```

### C. フロントエンド状態管理
```typescript
// ChatPage.tsx:224-233
// contextとclientIdの設定が正しいかチェック
const context: ConversationContextType = clientId ? 'client_direct' : 'personal';
const chatResponse = await chatService.startChat({
  context,
  clientId: clientId || undefined,  // ← clientIdが正しく渡されているか
});
```

## 次のアクション
1. 会話特定ロジック（`getActiveConversation`）の詳細確認
2. 実際のデータベースクエリでの検索条件確認
3. ログによる会話IDとユーザーIDの紐付け確認
4. 権限チェックの実装状況確認

## 予想される原因
- 会話検索時のuserID/clientIDフィルタリングが不完全
- contextの設定ミスによる異なるコンテキストの会話取得
- 組織IDによる権限分離が不十分
- フロントエンド側での会話切り替え時の状態管理ミス