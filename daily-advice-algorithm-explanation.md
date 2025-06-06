# 「今日のアドバイス」機能の日替わりアルゴリズム解説

## 概要
「今日のアドバイス」は、毎日日替わりでユーザーに運勢アドバイスを提供する機能です。

## 日替わりアルゴリズムの仕組み

### 1. 基本的な動作フロー
1. ユーザーが「今日のアドバイス」にアクセス
2. システムが当日のアドバイスを検索
3. 既存のアドバイスがあれば返却、なければ新規生成
4. 生成したアドバイスは30日間保存

### 2. 日付による一意性の保証
```typescript
// fortune.repository.ts (121-141行目)
async findDailyAdvice(userId: ID, date?: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // その日の0:00:00から23:59:59までの範囲で検索
  query.date = { $gte: startOfDay, $lte: endOfDay };
}
```

### 3. データベースレベルでの制御
```typescript
// daily-advice.model.ts (87行目)
DailyAdviceSchema.index({ userId: 1, date: 1 }, { unique: true });
```
- **複合インデックス**: `userId`と`date`の組み合わせで一意性を保証
- 同じユーザーの同じ日付のアドバイスは1つだけ存在

### 4. 自動削除機能
```typescript
// daily-advice.model.ts (90行目)  
DailyAdviceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// fortune.service.ts (145行目)
expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
```
- **TTLインデックス**: 30日後に自動的にデータが削除される
- ストレージの効率的な利用を実現

### 5. 再生成機能
```typescript
// fortune.service.ts (92行目)
async getDailyAdvice(userId: ID, date = new Date(), regenerate = false) {
  if (!regenerate) {
    const existingAdvice = await this.fortuneRepository.findDailyAdvice(userId, date);
    if (existingAdvice) {
      return existingAdvice;
    }
  }
}
```
- `regenerate`パラメータがtrueの場合、既存のアドバイスを無視して新規生成
- 通常は既存のアドバイスを返却（同じ日に何度アクセスしても同じ内容）

## アドバイス生成の内容

### 1. AIキャラクターからの挨拶メッセージ
- ユーザーの四柱推命データに基づいた個別メッセージ
- AIキャラクターの性格を反映した文体

### 2. 運勢カード（複数枚）
- カテゴリー別の運勢アドバイス
- アイコンとグラデーションで視覚的に表現

### 3. 相性の良いスタイリスト情報
- その日の運勢に基づいて最適なスタイリストを推薦
- 相性スコア（1-5）と理由を提供

## まとめ
「今日のアドバイス」は、日付とユーザーIDの組み合わせで一意性を保証し、1日1回生成される仕組みです。同じ日に何度アクセスしても同じアドバイスが表示され、翌日になると新しいアドバイスが生成されます。30日後には自動的に削除されるため、効率的なデータ管理が実現されています。