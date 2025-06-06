# 機能拡張計画: クライアント専用AIチャット機能 2025-05-28

## 1. 拡張概要

スタイリストがクライアントに対してよりパーソナライズされたサービスを提供できるよう、クライアント専用のAIキャラクターを作成し、四柱推命データと連携したチャット機能を実装します。これにより、「サロンに行くと自分専用のAI占い師がいる」という特別な体験を提供します。

## 2. 詳細仕様

### 2.1 現状と課題

現在の実装では：
- チャット画面でクライアントを選択できない（新規クライアントボタンのみ）
- スタイリスト（userロール）がクライアントリストAPIにアクセスできない
- クライアント専用のAIキャラクターが作成できない
- TodayClientsPageの「詳細情報」ボタンが未実装

### 2.2 拡張内容

#### 2.2.1 クライアント専用AIキャラクター機能
- 各クライアントに専用のAIキャラクターを設定可能
- クライアントの四柱推命データに基づいたパーソナライズ
- 過去の会話履歴を記憶し、より親密な対応を実現

#### 2.2.2 チャット画面の文脈切り替え
- ホーム画面からのアクセス → スタイリスト自身のAIアシスタント
- TodayClientsPageからのアクセス → 選択したクライアント専用のAIアシスタント
- 同一の`/chat`ルートを使用し、文脈によって自動切り替え

#### 2.2.3 四柱推命情報のシステムプロンプト統合
- チャット開始時に自動的に四柱推命データをシステムプロンプトに組み込む
- スタイリストのチャット → スタイリスト自身の四柱推命データ
- クライアントのチャット → クライアントの四柱推命データ
- 最新15件の会話履歴とは別に、常に参照可能な状態を維持

#### 2.2.4 コンテキスト注入システム（合言葉機能）
- 拡張性の高い汎用的なデータ参照システムとして実装
- 自然言語でデータを要求すると、関連情報をコンテキストに追加

**Phase 1: 人物データの参照（初回実装）**
- 「〇〇さんについて」→ クライアントの四柱推命データ
- 「〇〇スタイリストについて」→ スタイリストの四柱推命データ
- サロン内の全員の情報を参照可能（情報共有モード）

**Phase 2: ビジネスデータの参照（将来拡張）**
- 「今月の売上について」→ 売上データ
- 「予約状況について」→ 予約データ
- 「人気メニューについて」→ メニュー分析データ

**Phase 3: 高度な分析（将来拡張）**
- 「去年の同月比は？」→ 前年比較データ
- 「在庫状況は？」→ 在庫管理データ
- 「トレンド分析」→ 統計分析データ

### 3 ディレクトリ構造
追加変更に係るファイルのディレクトリ構造を提示
```
frontend/
  src/
    pages/
      stylist/
        ChatPage.tsx                    # 文脈切り替え対応の追加
        TodayClientsPage.tsx           # AIチャットボタンの改善
    components/
      features/
        ai-character-setup/
          ClientAICharacterSetup.tsx   # 新規：クライアント用設定画面
    services/
      api/
        client.ts                      # getMyClients APIの追加
        
backend/
  src/
    features/
      clients/
        controllers/
          client.controller.ts         # getMyClients エンドポイント追加
        services/
          client.service.ts            # スタイリスト用クライアント取得
      chat/
        services/
          openai.service.ts            # コンテキスト注入システムの実装
          context-injection/          # 新規：コンテキスト注入システム
            index.ts                  # コンテキストマネージャー
            providers/                # データプロバイダー
              person.provider.ts      # 人物データプロバイダー
              business.provider.ts    # ビジネスデータプロバイダー（将来）
            parsers/                  
              intent.parser.ts        # 意図解析パーサー
      ai-characters/
        controllers/
          ai-character.controller.ts   # クライアント用setup追加
```

## 4. 技術的影響分析

### 4.1 影響範囲

- **フロントエンド**: 
  - ChatPage（文脈切り替えロジック）
  - TodayClientsPage（ボタン動作改善）
  - 新規ClientAICharacterSetupコンポーネント
- **バックエンド**: 
  - クライアントAPI（スタイリスト用エンドポイント）
  - OpenAIサービス（コンテキスト注入システム）
  - AIキャラクターサービス（クライアント用設定）
  - 新規コンテキスト注入システムの構築
- **データモデル**: 
  - 既存モデルで対応可能（AICharacterモデルはclientId対応済み）
  - 四柱推命データは既にシステムプロンプトに組み込み済み
- **その他**: 
  - ルーティングの変更は不要
  - 将来的な拡張を考慮したプロバイダーパターンの採用

### 4.2 変更が必要なファイル

```
【フロントエンド】
- frontend/src/pages/stylist/ChatPage.tsx: クライアントIDの受け取りと文脈切り替え
- frontend/src/pages/stylist/TodayClientsPage.tsx: AIチャットボタンの動作改善
- frontend/src/services/api/client.ts: getMyClients APIメソッド追加
- frontend/src/components/features/ai-character-setup/ClientAICharacterSetup.tsx: 新規作成

【バックエンド】
- backend/src/features/clients/controllers/client.controller.ts: GET /api/clients/my-clients追加
- backend/src/features/chat/services/openai.service.ts: コンテキスト注入システムの統合
- backend/src/features/ai-characters/controllers/ai-character.controller.ts: クライアント用setup追加

【新規作成：コンテキスト注入システム】
- backend/src/features/chat/services/context-injection/index.ts: システムのエントリーポイント
- backend/src/features/chat/services/context-injection/providers/person.provider.ts: 人物データ取得
- backend/src/features/chat/services/context-injection/parsers/intent.parser.ts: 自然言語解析
```

## 5. タスクリスト

```
- [ ] **T1**: スタイリスト用クライアント取得APIの実装
  - GET /api/clients/my-clientsエンドポイント作成
  - 本日の予約だけでなく、全担当クライアントを返す
  
- [ ] **T2**: ChatPageの文脈切り替え機能実装
  - URLパラメータまたはstateでクライアントIDを受け取る
  - クライアントIDがある場合はclient_directコンテキストを使用
  - クライアントのAIキャラクターを読み込む
  - 四柱推命データは既存の仕組みで自動的にシステムプロンプトに含まれる
  
- [ ] **T3**: TodayClientsPageのAIチャットボタン改善
  - クライアントのAIキャラクター設定状況を確認
  - 未設定の場合は設定画面へ遷移
  - 設定済みの場合はチャット画面へ遷移
  
- [ ] **T4**: クライアント用AIキャラクター設定画面の実装
  - 既存のAICharacterSetupPageを拡張
  - クライアント情報（生年月日等）を使用
  - 設定完了後はチャット画面へ遷移
  
- [ ] **T5**: コンテキスト注入システムの実装
  - 意図解析パーサーの実装（自然言語から要求を抽出）
  - 人物データプロバイダーの実装（クライアント・スタイリストの四柱推命取得）
  - コンテキストマネージャーの実装（プロバイダーの統合管理）
  - OpenAIサービスへの統合
  
- [ ] **T6**: コンテキスト注入システムの拡張準備
  - プロバイダーインターフェースの定義
  - 将来のビジネスデータプロバイダー用の基盤整備
  - 権限チェック機能の実装
  
- [ ] **T7**: 統合テストの作成
  - 各APIエンドポイントのテスト
  - 文脈切り替えのE2Eテスト
  - コンテキスト注入システムのテスト
  - 複数の合言葉パターンのテスト
```

### 6 テスト計画

1. **API単体テスト**
   - GET /api/clients/my-clientsの権限チェック
   - クライアント用AIキャラクター作成API
   - コンテキスト注入システムの各コンポーネント

2. **統合テスト**
   - TodayClientsPage → AIキャラクター設定 → チャットの流れ
   - コンテキスト注入システムによるデータ参照
   - 四柱推命データのシステムプロンプト組み込み確認

3. **E2Eテスト**
   - スタイリストがクライアント専用チャットを使用
   - 文脈切り替えが正しく動作すること
   - 様々な合言葉パターンでのデータ参照

4. **パフォーマンステスト**
   - コンテキスト注入時のレスポンス時間
   - 複数データ参照時のメモリ使用量

## 7. SCOPE_PROGRESSへの統合

SCOPE_PROGRESS.mdのPhase 3セクションに以下を追加：

```markdown
- [ ] **CHAT-EXT1**: クライアント専用AIチャット機能の実装
  - 目標: 2025-06-05
  - 参照: [/docs/plans/planning/ext-chat-personalization-2025-05-28.md]
  - 内容: クライアントごとのAIキャラクター作成と文脈切り替え機能
```

## 8. 備考

### 実装の優先順位
1. スタイリスト用クライアント取得API（T1）
2. ChatPageの文脈切り替え（T2）
3. TodayClientsPageの改善（T3）
4. クライアント用AI設定画面（T4）
5. コンテキスト注入システムの基盤実装（T5）
6. コンテキスト注入システムの拡張準備（T6）

### 将来の拡張可能性
- クライアントがログインして自分のAIキャラクターと会話
- AIキャラクターの性格をより細かくカスタマイズ
- クライアント間の相性診断機能
- AIキャラクターによる施術メニュー提案
- ビジネスデータのコンテキスト注入（売上、在庫、予約等）
- 高度な分析機能（トレンド分析、前年比較等）

### コンテキスト注入システムの設計思想
- **拡張性**: 新しいデータタイプを簡単に追加できるプロバイダーパターン
- **自然言語**: 「〜について」という自然な表現でデータ参照
- **権限管理**: 組織内の情報は共有、組織外の情報はアクセス不可
- **パフォーマンス**: 必要なデータのみを動的に取得
- **将来性**: AIがビジネスパートナーとして成長できる基盤

### コンテキスト注入システムの実装詳細

#### 1. プロバイダー登録方式（段階的実装）

**Phase 1: ハードコード実装（初期）**
```typescript
// context-injection/config/providers.ts
export const contextProviders = {
  person: {
    patterns: ['について', 'の相談', 'について教えて'],
    provider: PersonProvider,
    enabled: true
  },
  // 将来的に追加
  sales: {
    patterns: ['売上', '収益', '売り上げ'],
    provider: SalesProvider,
    enabled: false
  }
};
```

**Phase 2: 設定ファイル化（次期）**
- 環境変数やJSONファイルでパターンを管理
- 動的な有効/無効の切り替え

**Phase 3: 管理画面（将来）**
- SuperAdmin画面で合言葉パターンを管理
- 組織ごとのカスタマイズ

#### 2. 確認ダイアログ方式（曖昧性解決）

**同名人物の処理フロー：**

1. **ユーザー入力例**
   ```
   「佐藤さんについて相談したい」
   「田中さんの運勢を教えて」
   ```

2. **AIの確認応答**
   ```
   複数の佐藤さんがいらっしゃいます。どちらの佐藤さんでしょうか？

   【クライアント】
   ・佐藤 美咲さん（最終来店: 3日前）
   ・佐藤 健一さん（最終来店: 1週間前）
   
   【スタイリスト】  
   ・佐藤 由美子さん（スタイリスト）

   番号で選択するか、フルネームでお答えください。
   ```

3. **実装コード例**
   ```typescript
   interface ClarificationResponse {
     type: 'clarification_needed';
     message: string;
     options: Array<{
       id: string;
       name: string;
       type: 'client' | 'stylist';
       lastContact?: Date;
       displayText: string;
     }>;
   }

   // PersonProvider内の処理
   async findPerson(query: string): Promise<Person | ClarificationResponse> {
     const matches = await this.searchPersons(query);
     
     if (matches.length === 0) {
       throw new Error('該当する方が見つかりません');
     }
     
     if (matches.length === 1) {
       return matches[0];
     }
     
     // 複数マッチの場合
     return {
       type: 'clarification_needed',
       message: `複数の${query}さんがいらっしゃいます。`,
       options: matches.map((person, index) => ({
         id: person.id,
         name: person.name,
         type: person.type,
         lastContact: person.lastVisitDate,
         displayText: `${index + 1}. ${person.name}さん（${person.type === 'client' ? 'クライアント' : 'スタイリスト'}）`
       }))
     };
   }
   ```

4. **賢い絞り込み機能**
   - 文脈からの推測: 「昨日の佐藤さん」→ 昨日来店した佐藤さんを優先
   - 最近の接触順: より最近接触した人を上位に表示
   - 部分一致対応: 「さとう」でも「佐藤」を検索
   - フルネーム優先: 「佐藤美咲」と完全一致があれば確認不要

5. **ユーザビリティの工夫**
   - 選択肢は最大5件まで表示
   - それ以上の場合は「もっと詳しく教えてください」
   - 前回選択した人を記憶して次回は優先表示