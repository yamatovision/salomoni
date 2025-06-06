# 「今日のアドバイス」タイムゾーン問題修正ロードマップ

## 問題の概要
- **現象**: 日本時間で6月7日土曜日なのに、6月6日金曜日のアドバイスが表示される
- **原因**: 日付処理でタイムゾーンが適切に考慮されていない
- **影響範囲**: 日本時間の0:00-9:00の間に特に問題が発生しやすい

## 根本原因
1. `setHours(0, 0, 0, 0)` がローカルタイムゾーン（サーバーのタイムゾーン）で動作
2. MongoDBはUTCで日付を保存するが、クエリ時にJSTへの変換が考慮されていない
3. サーバーがUTCまたは他のタイムゾーンで動作している可能性

## 修正対象ファイル
1. `backend/src/features/fortune/repositories/fortune.repository.ts`
   - `findDailyFortune` メソッド（37-59行目）
   - `findDailyAdvice` メソッド（121-141行目）

## 修正内容

### 1. タイムゾーンを考慮した日付範囲計算関数の作成
```typescript
// 日本時間での日付範囲を計算するユーティリティ関数
private getJSTDateRange(date: Date): { start: Date; end: Date } {
  // 日本時間の0:00:00を計算
  const jstOffset = 9 * 60; // JST is UTC+9
  const inputDate = new Date(date);
  
  // 日本時間の0:00:00
  const startOfDayJST = new Date(inputDate);
  startOfDayJST.setUTCHours(0, 0, 0, 0);
  startOfDayJST.setUTCMinutes(startOfDayJST.getUTCMinutes() - jstOffset);
  
  // 日付が前日になった場合は翌日に調整
  if (startOfDayJST.getUTCDate() !== inputDate.getUTCDate()) {
    startOfDayJST.setUTCDate(startOfDayJST.getUTCDate() + 1);
  }
  
  // 日本時間の23:59:59
  const endOfDayJST = new Date(startOfDayJST);
  endOfDayJST.setUTCHours(23, 59, 59, 999);
  
  return { start: startOfDayJST, end: endOfDayJST };
}
```

### 2. findDailyFortune メソッドの修正
```typescript
async findDailyFortune(userId?: ID, clientId?: ID, date?: Date): Promise<DailyFortune | null> {
  try {
    const query: any = {};
    if (userId) query.userId = userId;
    if (clientId) query.clientId = clientId;
    if (date) {
      const { start, end } = this.getJSTDateRange(date);
      query.date = { $gte: start, $lte: end };
    }
    
    const fortune = await DailyFortuneModel.findOne(query);
    return fortune ? (fortune.toJSON() as unknown as DailyFortune) : null;
  } catch (error) {
    logger.error('[FortuneRepository] 日運データ取得エラー:', error);
    throw new AppError('Failed to fetch daily fortune', 500, 'FORTUNE_FETCH_ERROR');
  }
}
```

### 3. findDailyAdvice メソッドの修正
```typescript
async findDailyAdvice(userId: ID, date?: Date): Promise<DailyAdviceData | null> {
  try {
    const query: any = { userId };
    if (date) {
      const { start, end } = this.getJSTDateRange(date);
      query.date = { $gte: start, $lte: end };
    }
    
    const advice = await DailyAdviceModel.findOne(query).sort({ date: -1 });
    return advice ? (advice.toJSON() as unknown as DailyAdviceData) : null;
  } catch (error) {
    logger.error('[FortuneRepository] デイリーアドバイス取得エラー:', error);
    throw new AppError('Failed to fetch daily advice', 500, 'ADVICE_FETCH_ERROR');
  }
}
```

## テスト項目
1. 日本時間の各時刻でのテスト（特に0:00-9:00）
2. サーバーのタイムゾーン設定に依存しないことの確認
3. 日付が正しく切り替わることの確認
4. 既存データとの互換性確認

## ログ追加（デバッグ用）
```typescript
logger.info(`[FortuneRepository] 日付範囲クエリ:`, {
  inputDate: date,
  jstStart: start.toISOString(),
  jstEnd: end.toISOString(),
  serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
});
```

## 実装手順
1. ユーティリティ関数の追加
2. 各メソッドの修正
3. ログの追加
4. ローカルテスト
5. ステージング環境でのテスト
6. 本番デプロイ

## 注意事項
- 既存のデータとの互換性を保つ
- パフォーマンスへの影響を最小限に抑える
- エラーハンドリングを適切に行う