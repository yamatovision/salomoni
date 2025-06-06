# AIキャラクター作成画面の重複表示問題の修正ロードマップ

## 問題概要
AIキャラクター作成画面で、各ステップのAIメッセージが2回表示される問題

## 根本原因
質問文が2箇所で定義・表示されている：
1. `AICharacterSetupPage.tsx`の`steps`配列の`question`プロパティ
2. `useAICharacterSetup.ts`の`proceedToNextStep`関数内の`addAIMessage`呼び出し

## 修正方針
`useAICharacterSetup.ts`から重複するAIメッセージの追加を削除し、`AICharacterSetupPage.tsx`の`steps`配列から質問文を取得して表示するように統一する。

## 修正手順

### ステップ1: useAICharacterSetup.tsの修正
- `proceedToNextStep`関数から各ステップのAIメッセージ追加を削除
- 最初の質問（name）も`startSetup`から削除

### ステップ2: AICharacterSetupPage.tsxの修正
- `steps`配列をuseAICharacterSetupに渡す
- startSetupとproceedToNextStepで適切な質問を表示

## 影響範囲
- AIキャラクター作成フローのみ
- 機能自体には影響なし（表示の重複を解消するのみ）

## 期待される結果
- 各ステップで質問が1回だけ表示される
- コードの重複が解消され、保守性が向上する