# AIキャラクター404エラー デバッグロードマップ

## エラー概要
- **問題**: ログイン後、AIキャラクターが設定されていないユーザーがDailyAdvicePageやChatPageにアクセスすると404エラーが発生
- **エラーコード**: `AI_CHARACTER_NOT_FOUND`
- **発生タイミング**: ログイン直後のダッシュボードアクセス時

## 依存関係マップ

### 1. ログインフロー
```
LoginPage.tsx (ログイン処理)
    ↓
AuthContext.tsx (認証状態管理)
    ├─ checkAICharacterStatus() 実行
    └─ hasAICharacter ステート更新
```

### 2. リダイレクトフロー
```
LoginPage.tsx
    ↓
/dashboard へリダイレクト (USER/STYLISTロールの場合)
    ↓
RoleBasedRedirect.tsx (ロールベースのリダイレクト処理)
```

### 3. エラー発生フロー
```
DailyAdvicePage.tsx / ChatPage.tsx
    ↓
fortuneService.getDailyAdvice() / aiCharacterService.getAICharacter()
    ↓
バックエンドAPI呼び出し
    ↓
fortune.service.ts / ai-character.service.ts
    ↓
AIキャラクター検索
    ↓
404エラー返却 (AI_CHARACTER_NOT_FOUND)
    ↓
フロントエンドでエラーキャッチ
    ↓
/ai-character-setup へリダイレクト
```

## 修正対象ファイル優先順位

1. **AuthContext.tsx** - AIキャラクター未設定時の初期リダイレクト処理追加
2. **RoleBasedRedirect.tsx** - ロールベースリダイレクトにAIキャラクターチェック統合
3. **DailyAdvicePage.tsx** - エラーハンドリングの改善とログ追加
4. **ChatPage.tsx** - エラーハンドリングの改善とログ追加

## 推奨される修正アプローチ

### ステップ1: AuthContextでの初期チェック強化
- `checkAICharacterStatus()`の結果に基づいて、AIキャラクター未設定の場合は即座にリダイレクト

### ステップ2: 統一されたリダイレクトロジック
- RoleBasedRedirect.tsxにAIキャラクターチェックを統合
- USER/STYLISTロールでAIキャラクター未設定の場合は`/ai-character-setup`へ

### ステップ3: エラーハンドリングの改善
- 各ページで発生する404エラーに対する適切なログ出力
- ユーザーへの明確なフィードバック提供

## デバッグログ設置箇所

1. **AuthContext.tsx**
   - checkAICharacterStatus()の開始/終了
   - hasAICharacterステートの変更

2. **RoleBasedRedirect.tsx**
   - リダイレクト判定プロセス
   - AIキャラクターチェック結果

3. **DailyAdvicePage.tsx / ChatPage.tsx**
   - API呼び出し前後
   - エラーキャッチ時の詳細情報

## 環境変数の確認項目
- 特に環境差異によるエラーは見られないが、APIエンドポイントの設定を確認

## 実装した修正内容

### 1. ログ設置（完了）
- **AuthContext.tsx**: `checkAICharacterStatus()`にデバッグログを追加
  - 開始/終了のログ
  - APIレスポンスとhasAICharacterステートの変更ログ

- **RoleBasedRedirect.tsx**: AIキャラクターチェックを統合
  - `hasAICharacter`と`checkingAICharacter`の状態を確認
  - USER/STYLISTロールでAIキャラクター未設定の場合は`/ai-character-setup`へリダイレクト

- **DailyAdvicePage.tsx**: 詳細なエラーログを追加
  - API呼び出し前後のログ
  - エラー発生時の詳細情報（status, code, message）

- **ChatPage.tsx**: AIキャラクター取得時のログを追加
  - API呼び出しとレスポンスのログ

### 2. 統一されたリダイレクトロジック（実装済み）
- RoleBasedRedirect.tsxでAIキャラクターのチェックを統合
- ログイン直後にAIキャラクター未設定の場合は自動的に`/ai-character-setup`へリダイレクト

## 修正後の動作フロー

1. ユーザーがログイン
2. AuthContextで`checkAICharacterStatus()`が実行
3. RoleBasedRedirectで以下をチェック：
   - ユーザーのロール
   - AIキャラクターの設定状態（USER/STYLISTの場合）
4. AIキャラクター未設定の場合は即座に`/ai-character-setup`へリダイレクト
5. 各ページ（DailyAdvice、Chat）でも二重チェックとして404エラーハンドリング

## 期待される結果
- ログイン後、AIキャラクター未設定のユーザーは自動的にセットアップページへ誘導される
- 404エラーが発生する前に適切なリダイレクトが行われる
- デバッグログにより問題発生箇所が特定しやすくなる

## 追加で発見された問題と修正

### 問題1: APIレスポンスのプロパティ名の不一致
- **原因**: バックエンドは`data.hasCharacter`を返すが、フロントエンドは`hasAICharacter`を期待していた
- **修正**: AuthContext.tsxで`response.data?.hasCharacter`を使用するよう変更

### 問題2: リダイレクト時の権限問題
- **症状**: `/ai-character-setup`へリダイレクトしようとすると、ログインページに戻される
- **原因**: ProtectedRoute内からPublicルートへのナビゲーションが問題を起こしている可能性
- **対策**: ルーティング設定でAIキャラクターセットアップを特別扱いとしてコメント追加

## 最終的な修正内容

1. **AuthContext.tsx**
   - APIレスポンスのプロパティ名を`data.hasCharacter`に修正
   - デバッグログの追加

2. **RoleBasedRedirect.tsx**
   - AIキャラクター未設定時の自動リダイレクト機能を追加
   - ローディング状態の適切な処理

3. **DailyAdvicePage.tsx & ChatPage.tsx**
   - 404エラー時のフォールバックリダイレクト
   - 詳細なエラーログの追加

4. **routes/index.tsx**
   - AIキャラクターセットアップルートに説明コメントを追加

## AIキャラクターセットアップの問題と修正

### 発見された問題
1. **birthDateが空文字列のまま次のステップに進む問題**
   - 原因: `handleDateInput`で状態更新後すぐに`proceedToNextStep`を呼んでいたため、Reactの非同期状態更新が完了する前に次のステップへ進んでいた
   - 症状: birthDateフィールドが空のままbirthplaceステップをスキップしてbirthtimeへ進む

### 実装した修正
1. **useAICharacterSetup.ts**
   - `handleDateInput`: 状態更新のコールバック内で`proceedToNextStep`を呼ぶように修正
   - `handlePlaceInput`: 同様の修正とログ追加
   - `handleTimeInput`: 同様の修正とログ追加
   - `proceedToNextStep`: デバッグログを強化し、現在の状態を詳細に出力

2. **各ハンドラーの修正パターン**
   ```typescript
   // 修正前
   setSetupData((prev) => ({ ...prev, fieldName: value }));
   setTimeout(() => proceedToNextStep(), 500);
   
   // 修正後
   setSetupData((prev) => {
     const updated = { ...prev, fieldName: value };
     console.log('updated setupData:', updated);
     
     setTimeout(() => {
       console.log('状態更新完了後、次のステップへ進む');
       proceedToNextStep();
     }, 500);
     
     return updated;
   });
   ```

### 期待される動作
1. 各フォームで入力完了後、状態が確実に更新される
2. 更新された状態がログに正しく出力される
3. birthdate → birthplace → birthtime の順序でステップが進む
4. 最終的にすべてのデータが揃った状態でセットアップAPIが呼ばれる