# 四柱推命表示問題デバッグ

## 問題の症状
- 四柱推命の全ての柱が「陰木」として表示される
- 五行バランスも異常な値（木1%, 火1%, 土2%, 金1%, 水3%）

## 調査結果

### 1. バックエンドの計算は正常
バックエンドログから、四柱推命の計算自体は正しく動作していることを確認：
- 計算結果: 乙巳 壬午 庚戌 丙子
- 正しい天干地支が計算されている

### 2. 問題の原因候補

#### A. データ構造の不一致
- バックエンド: `heavenlyStem`と`earthlyBranch`を返している
- フロントエンド: `stem`と`branch`を参照している可能性

#### B. getElementFromStemのデフォルト値
- 天干が認識されない場合、デフォルトで「木」を返す実装
- これが全て「陰木」になる原因の可能性

### 3. コンポーネントの構造
- StylistManagementPage.tsxではSajuProfileDisplayコンポーネントを使用
- その下に古いコードも残っている（重複表示の可能性）

## デバッグ手順

### 1. フロントエンドのコンソールログ確認
以下のログが追加されています：
```javascript
console.log('四柱推命APIレスポンス:', response);
console.log('四柱推命データ詳細:', {
  fullData: response.data,
  fourPillars: response.data.fourPillars,
  yearPillar: response.data.fourPillars?.yearPillar,
  // ...
});
```

### 2. バックエンドのログ確認
- `[SajuService] 認識できない天干`の警告を確認
- 天干が正しく渡されているか確認

## 修正案

### 1. データ構造の統一
- バックエンドとフロントエンドで同じプロパティ名を使用
- `heavenlyStem`/`earthlyBranch`または`stem`/`branch`に統一

### 2. デバッグログの追加位置
- saju.service.ts: getElementFromStemメソッドに警告ログ追加済み
- StylistManagementPage.tsx: APIレスポンスの詳細ログ追加済み

### 3. 重複コードの削除
- StylistManagementPage.tsxの古い四柱表示コードを削除
- SajuProfileDisplayコンポーネントのみを使用