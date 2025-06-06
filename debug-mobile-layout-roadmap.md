# モバイルレイアウト デバッグロードマップ

## 問題の概要
- **症状**: モバイルビューで下部ナビゲーションバーよりもコンテンツが下に来ている
- **発生URL**: https://salomoni.web.app/dashboard
- **影響範囲**: スタイリスト向けモバイルレイアウト全体

## 実装した修正内容

### 1. MobileLayout.tsx の修正
- **問題**: padding-bottom: 7 (56px) が不足していた
- **修正内容**:
  1. padding-bottomを10 (80px)に増加
  2. z-index: 1100を追加（AppBarと同レベル）
  3. デバッグ用ログの追加

### 修正後のコード変更点:
```tsx
// メインコンテンツエリア
<Box component="main" sx={{ 
  flexGrow: 1, 
  overflow: 'auto', 
  pb: 10, // 7から10に増加
  position: 'relative'
}}>

// BottomNavigation
<Paper ref={navigationRef} sx={{ 
  position: 'fixed', 
  bottom: 0, 
  left: 0, 
  right: 0,
  zIndex: 1100 // 追加
}} elevation={3}>
```

### 2. ログ出力の追加
- ナビゲーションバーの実際の高さ
- ウィンドウの高さ
- ドキュメントの高さ

## 依存関係マップ

### 1. コンポーネント階層
```
App.tsx
└── Router (index.tsx)
    └── MobileLayout.tsx (スタイリストルート用)
        └── DailyAdvicePage.tsx (/dashboard)
```

### 2. 関連ファイル一覧
1. **MobileLayout.tsx** (frontend/src/layouts/MobileLayout.tsx)
   - 下部ナビゲーションバーの実装
   - Box layout with `pb={7}` (padding-bottom)
   - BottomNavigation with `position: 'fixed'`, `bottom: 0`

2. **DailyAdvicePage.tsx** (frontend/src/pages/stylist/DailyAdvicePage.tsx)
   - /dashboardルートのメインコンテンツ
   - Container with `maxWidth="sm"`, `py: 2`

3. **routes/index.tsx** (frontend/src/routes/index.tsx)
   - ルーティング設定
   - MobileLayoutの適用条件

4. **theme.ts** (frontend/src/styles/theme.ts)
   - グローバルスタイル設定
   - カラーテーマ定義

## デバッグ順序

### Phase 1: 現状調査
1. MobileLayoutのスタイル実装確認
2. BottomNavigationの高さと位置設定確認
3. コンテンツエリアのpadding設定確認

### Phase 2: 問題特定
1. ブラウザの開発者ツールでの実測値確認
2. CSS競合の有無確認
3. Material-UIデフォルトスタイルとの干渉確認

### Phase 3: 修正実装
1. padding-bottomの適切な値設定
2. BottomNavigationのz-index調整
3. コンテンツのスクロール領域調整

## ログポイント設置計画
1. MobileLayoutマウント時のサイズ情報
2. BottomNavigationの実際の高さ
3. WindowサイズとViewport情報
4. スタイル適用後の実測値