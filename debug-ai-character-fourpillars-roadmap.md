# AIキャラクター作成時の四柱推命データ消失問題 デバッグロードマップ

## 問題の概要
- **症状**: AIキャラクター作成フローを完了すると、既存の四柱推命データが消失する
- **影響**: デイリーアドバイス機能で404エラー（FOURPILLARS_NOT_FOUND）が発生
- **比較対象**: スタイリスト管理画面では四柱推命データが正しく保存・表示される

## デバッグ手順

### フェーズ1: 関連ファイルの特定と依存関係の把握

#### 1.1 スタイリスト管理画面の更新フロー
- [ ] フロントエンド: `frontend/src/pages/admin/StylistManagementPage.tsx`
- [ ] API呼び出し: `frontend/src/services/api/stylists.ts`
- [ ] バックエンド: `backend/src/features/users/controllers/user.controller.ts`
- [ ] サービス層: `backend/src/features/users/services/user.service.ts`
- [ ] 四柱推命計算: `backend/src/features/saju/services/saju.service.ts`

#### 1.2 AIキャラクター作成フロー
- [ ] フロントエンド: `frontend/src/pages/public/AICharacterSetupPage.tsx`
- [ ] API呼び出し: `frontend/src/services/api/aiCharacterSetup.ts`
- [ ] バックエンド: `backend/src/features/ai-characters/controllers/ai-character.controller.ts`
- [ ] サービス層: `backend/src/features/ai-characters/services/ai-character.service.ts`

### フェーズ2: データフローの詳細調査

#### 2.1 スタイリスト管理画面でのデータ更新
1. 更新APIのペイロード確認
2. 四柱推命データの計算タイミング
3. データベースへの保存形式
4. トランザクション処理の有無

#### 2.2 AIキャラクター作成でのデータ更新
1. 作成APIのペイロード確認
2. ユーザー情報の更新処理
3. 四柱推命データの扱い
4. データの上書き/マージ処理

### フェーズ3: ログポイントの設置

#### 3.1 重要なログポイント
```typescript
// 1. ユーザー更新前のデータ
console.log('[DEBUG] 更新前のユーザーデータ:', existingUser);

// 2. 更新リクエストのペイロード
console.log('[DEBUG] 更新リクエスト:', updateData);

// 3. 四柱推命計算の実行有無
console.log('[DEBUG] 四柱推命計算実行:', shouldCalculateSaju);

// 4. 更新後のデータ
console.log('[DEBUG] 更新後のユーザーデータ:', updatedUser);
```

### フェーズ4: 問題の特定と解決

#### 4.1 想定される問題パターン
1. AIキャラクター作成時にユーザー情報を部分更新ではなく全体置換している
2. 四柱推命データを含まないペイロードで更新している
3. トランザクション処理の不備
4. データマージロジックの欠陥

#### 4.2 解決アプローチ
1. 両フローでのデータ更新ロジックの統一
2. 部分更新の実装（既存データの保持）
3. 四柱推命データの明示的な保護
4. 適切なテストケースの追加

## 現在の調査状況

### 確認済み事項
- AIキャラクターは正常に作成される
- 四柱推命データはAIキャラクター作成時に正しく計算・保存されている
- スタイリスト管理画面では問題なく動作する

### 問題の根本原因
AIキャラクター作成時にクライアントの生年月日情報（birthDate、birthTime、birthLocation）が保存されていなかった。

### 修正内容
1. `ai-character.service.ts`の`setupClientAICharacter`メソッドを修正
2. AIキャラクター作成前にクライアント情報（生年月日、出生時間、出生地）を更新
3. 更新されたクライアント情報を使用して四柱推命データを計算
4. デバッグログを追加して処理の流れを追跡可能に

### 実装した修正の詳細
```typescript
// クライアント情報を更新（生年月日情報）
if (data.birthDate) {
  const updateData: any = {
    birthDate: new Date(data.birthDate),
    birthTime: data.birthTime || '12:00',
  };

  // 出生地情報も更新
  if (data.birthPlace) {
    updateData.birthLocation = {
      name: data.birthPlace,
      longitude: 139.6917, // TODO: 実際の座標を取得
      latitude: 35.6895,
    };
  }

  await ClientModel.findByIdAndUpdate(clientId, updateData);
}
```

### 追加したデバッグログ
- クライアント情報更新前の状態
- 更新するデータの内容
- 四柱推命データ計算パラメータ
- 最終的なクライアント情報

### 次のステップ
1. 修正後の動作確認
2. AIキャラクター作成フローのテスト
3. デイリーアドバイス機能の動作確認
4. 出生地の座標取得機能の実装（TODO）

## デイリーアドバイスエラーの原因と修正

### 問題の発見
1. データベースに保存された四柱推命データにfourPillarsフィールドがnull
2. スタイリスト管理画面では`getUserFourPillars`を使用し、fourPillarsオブジェクトを動的に構築
3. デイリーアドバイスでは保存済みデータを使用し、fourPillarsオブジェクトが存在しない

### 実施した修正
1. `four-pillars-data.repository.ts`の`findLatestByUserId`と`findLatestByClientId`を修正
2. データ取得時にfourPillarsオブジェクトを動的に構築するように変更

```typescript
// fourPillarsオブジェクトを構築
if (!jsonData.fourPillars && (jsonData.yearPillar || jsonData.monthPillar || jsonData.dayPillar || jsonData.hourPillar)) {
  jsonData.fourPillars = {
    yearPillar: jsonData.yearPillar,
    monthPillar: jsonData.monthPillar,
    dayPillar: jsonData.dayPillar,
    hourPillar: jsonData.hourPillar
  };
}
```

これにより、デイリーアドバイス機能が保存済みの四柱推命データを正しく取得できるようになります。