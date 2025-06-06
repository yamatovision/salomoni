# 日柱マスターデータ実装ガイド

## 概要
daily-pillar-implementation-plan.md との整合性を保ちながら、日柱データの事前計算・保存システムを実装しました。

## 実装内容

### 1. 日柱マスターデータモデル
`backend/src/features/fortune/models/day-pillar-master.model.ts`
- 日付ごとの日柱情報を事前保存
- インデックスによる高速検索
- 10年分のデータを一括生成可能

### 2. データ生成スクリプト
`backend/scripts/generate-day-pillar-master.ts`
```bash
# 10年分の日柱データを生成
npx ts-node scripts/generate-day-pillar-master.ts
```

### 3. システムへの統合

#### OpenAIService（チャット）
- 日柱マスターデータから取得を優先
- 存在しない場合は動的計算してマスターに保存
- 日運情報をシステムプロンプトに含める

#### FortuneService（運勢）
- DailyFortuneに日柱情報を追加
- calculateDailyFortuneで日柱マスターデータを参照

### 4. パフォーマンス改善
- **従来**: 毎回dayPillarCalculator.tsで計算
- **改善後**: データベースから高速取得（インデックス使用）
- **自動補完**: 未登録の日付は計算後に自動保存

### 5. daily-pillar-implementation-plan.md との整合性
- ✅ DailyFortuneモデルに日柱フィールド追加
- ✅ 日柱の事前計算・保存機能
- ✅ フロントエンドで表示可能な型定義
- ✅ 日運計算に日柱情報を活用

## 使用方法

### 初期データ生成
```bash
cd backend
npx ts-node scripts/generate-day-pillar-master.ts
```

### テスト実行
```bash
# 日運機能のテスト
npx ts-node scripts/test-day-pillar.ts

# チャットでの日運情報確認
npx ts-node scripts/test-chat-with-dayfortune.ts
```

### データ確認
```javascript
// MongoDB での確認
db.daypillarmasters.find({ dateString: "2025-06-07" })
```

## 利点
1. **パフォーマンス向上**: 計算済みデータの高速取得
2. **一貫性**: 同じ日付は常に同じ日柱
3. **拡張性**: 旧暦情報など追加情報も保存可能
4. **運用効率**: 事前に大量データを生成可能

## 今後の拡張案
1. 旧暦情報の追加（lunarDateフィールド活用）
2. 日柱に基づく運勢計算ロジックの高度化
3. フロントエンドでの日柱表示UI実装
4. 日柱解説機能の追加