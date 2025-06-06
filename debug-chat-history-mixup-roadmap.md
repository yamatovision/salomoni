# チャット履歴混在バグ デバッグロードマップ

## 問題の概要
- クライアントのチャットで、実際にはスタイリストの履歴が表示される
- ログから： `conversationId: '6842d5e1307f75627e6bcb71'` でクライアント「耳」のチャットを開いている

## 調査した依存関係の全体像

**データフロー**: 
フロントエンド(`ChatPage.tsx`) → APIクライアント(`chat.ts`) → コントローラー(`chat.controller.ts`) → サービス(`chat.service.ts`) → リポジトリ(`conversation.repository.ts`, `chat-message.repository.ts`)

## 調査優先度

### 🔴 最高優先（即座に確認が必要）
1. **会話特定ロジック** (`conversation.repository.ts` の `getActiveConversation()`)
   - userIdとclientIdの区別が正しく機能しているか
   - 異なるユーザー間での会話混在の可能性

### 🟡 高優先 
2. **会話作成・取得の整合性** (`chat.service.ts`)
3. **認証とユーザー特定** (`chat.controller.ts`)

### 🟢 中優先
4. **フロントエンド状態管理** (`ChatPage.tsx`)
5. **会話切り替え処理**

## 重要な調査ポイント

**A. 会話の一意性確保**: MongoDB検索クエリでのuserID/clientIDフィルタリング
**B. 認証情報の正確性**: JWTから取得したユーザー情報の整合性  
**C. コンテキスト設定**: `personal` vs `client_direct` vs `stylist_consultation`の適切な使い分け

## 発見した問題点

### 🚨 **重大な問題**: `getConversations`での引数混在
- **場所**: `chat.controller.ts:74-82`
- **問題**: `userId`と`clientId`の両方を`chatService.getConversations`に渡している
- **影響**: context無視でuserIdが優先され、クライアント専用会話でもスタイリストの履歴が表示される

### 🔧 **実施した修正**
1. **ログ設置完了**:
   - `conversation.repository.ts:getActiveConversation()` - 検索条件とクエリ結果の詳細ログ
   - `chat.controller.ts:getConversations()` - userId/clientId引数とコンテキスト判定ログ  
   - `chat.service.ts:getConversations()` - 実際の検索実行時のパラメータログ

2. **修正実装完了**:
   - `chat.controller.ts`でcontextに応じた排他的なuserId/clientId設定を実装

## 予想される原因
- ✅ **確認済み**: 会話検索時のユーザーフィルタリングが不完全（getConversationsで修正済み）
- 組織ID による権限分離が不十分
- フロントエンド側での会話切り替え時の状態クリア不足

## 次のステップ
1. ✅ **完了**: `conversation.repository.ts` の `getActiveConversation()` メソッドへのログ設置
2. ✅ **完了**: コントローラーでのuserId/clientId排他処理の修正
3. 🔄 **進行中**: テスト実行とログ確認でバグ修正の検証