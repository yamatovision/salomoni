# 今日のクライアント画面 四柱推命情報表示機能 実装ロードマップ

## 概要
`/clients/today`の詳細情報ボタンから、`/admin/clients`と同じフォーマットで四柱推命情報を表示する機能を実装する。

## 実装完了内容

### ✅ 実装済み機能（2025年1月6日）
1. **TodayClientsPage.tsx の更新**
   - 四柱推命プロフィール表示用の状態管理追加
   - `handleViewSajuProfile`関数の実装
   - 詳細情報ボタンのクリックハンドラー設定
   - SajuProfileDisplayコンポーネントのインポート
   - ダイアログによる四柱推命プロフィール表示

2. **追加されたインポート**
   - Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress（MUI）
   - Close as CloseIcon（MUI Icons）
   - SajuProfileDisplay（四柱推命表示コンポーネント）

3. **実装されたログポイント**
   - API呼び出し前：`[TodayClients] Fetching saju profile for client:`
   - API成功時：`[TodayClients] Saju profile response:`
   - エラー時：`[TodayClients] Error fetching saju profile:`

## 現状分析

### 実装済みの機能
1. **ClientManagementPage.tsx（管理画面）**
   - 完全な四柱推命表示機能実装済み
   - SajuProfileDisplayコンポーネントで表示
   - APIエンドポイント `/api/clients/:id/saju-profile` 実装済み

2. **TodayClientsPage.tsx（今日のクライアント）**
   - 四柱推命関連コードがコメントアウト状態
   - クライアントデータに`fourPillarsDataId`フィールドなし

### 依存関係図
```
TodayClientsPage.tsx
├── clientService.getDailyClients()
├── clientService.getClientSajuProfile() [追加予定]
└── SajuProfileDisplay.tsx [追加予定]

ClientManagementPage.tsx [参考実装]
├── clientService.getClientSajuProfile()
├── clientService.getClientCompatibility()
└── SajuProfileDisplay.tsx
```

## 実装ステップ

### Step 1: TodayClientsPageの型定義更新
**ファイル**: `frontend/src/pages/stylist/TodayClientsPage.tsx`
- ダイアログ状態の追加
- 選択中のクライアント状態の追加
- 四柱推命データ状態の追加

### Step 2: APIコール処理の実装
**ファイル**: `frontend/src/pages/stylist/TodayClientsPage.tsx`
- `handleViewSajuProfile`関数の実装
- ClientManagementPageの実装を参考にする

### Step 3: UIコンポーネントの追加
**ファイル**: `frontend/src/pages/stylist/TodayClientsPage.tsx`
- 詳細ボタンのクリックハンドラー設定
- SajuProfileDisplayコンポーネントのインポート
- ダイアログ表示の実装

### Step 4: エラーハンドリングとログ設置
- API呼び出し時のエラーハンドリング
- デバッグ用ログの設置
- ローディング状態の管理

## 実装順序

1. **TodayClientsPage.tsx の更新**（優先度：高）
   - 状態管理の追加
   - APIコール関数の実装
   - UIの更新

2. **テスト実施**（優先度：中）
   - 四柱推命データが存在するクライアントでのテスト
   - エラーケースのテスト

3. **ログとエラーハンドリング**（優先度：低）
   - 詳細なデバッグログの追加
   - ユーザーフレンドリーなエラーメッセージ

## 注意事項

1. **既存の実装を活用**
   - ClientManagementPageの実装をそのまま参考にする
   - SajuProfileDisplayコンポーネントは既に完成しているため再利用

2. **APIエンドポイント**
   - `/api/clients/:id/saju-profile`は既に実装済み
   - 追加のバックエンド作業は不要

3. **データの整合性**
   - クライアントに`fourPillarsDataId`がない場合の処理
   - 四柱推命データの自動生成は別タスクとして扱う

## ログポイント

1. **API呼び出し前後**
   ```typescript
   console.log('[TodayClients] Fetching saju profile for client:', clientId);
   console.log('[TodayClients] Saju profile response:', response);
   ```

2. **エラー発生時**
   ```typescript
   console.error('[TodayClients] Error fetching saju profile:', error);
   ```

3. **UI状態変更時**
   ```typescript
   console.log('[TodayClients] Opening saju dialog for client:', selectedClient);
   ```