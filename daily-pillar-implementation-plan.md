# 「今日の日柱」表示機能の実装計画

## 現状分析

### 既存の実装
1. **日柱計算機能は実装済み**
   - `sajuengine_package/src/dayPillarCalculator.ts`
   - ローカル時間、タイムゾーン対応済み
   - 日付変更モード（astronomical/traditional/korean）対応

2. **日運（DailyFortune）には日柱データなし**
   - 現在は単純な乱数ベースの運勢計算
   - 日柱の天干・地支は活用されていない

3. **タイムゾーン対応は実装済み**
   - FortuneRepositoryで`getLocalDateRange`実装済み
   - フロントエンドからタイムゾーン情報送信済み

## 実装案

### 1. バックエンド拡張

#### A. DailyFortuneモデルに日柱フィールド追加
```typescript
// daily-fortune.model.ts
const DailyFortuneSchema = new Schema({
  // 既存フィールド...
  
  // 新規追加
  dayPillar: {
    heavenlyStem: String,      // 天干
    earthlyBranch: String,     // 地支
    element: String,           // 五行
    yinYang: String,          // 陰陽
    ganZhi: String,           // 干支（例：癸巳）
  }
});
```

#### B. FortuneServiceの拡張
```typescript
// fortune.service.ts
import { calculateKoreanDayPillar } from '../../sajuengine_package';

async getDailyFortune(userId?: ID, clientId?: ID, date = new Date(), timezone?: string) {
  // 既存の処理...
  
  // 日柱計算を追加
  const dayPillar = calculateKoreanDayPillar(date, {
    useLocalTime: true,
    timezone: timezone || 'Asia/Tokyo',
    dateChangeMode: 'astronomical'
  });
  
  // 日運データに日柱を追加
  const fortuneData = {
    // 既存フィールド...
    dayPillar: {
      heavenlyStem: dayPillar.stem,
      earthlyBranch: dayPillar.branch,
      element: dayPillar.element,
      yinYang: dayPillar.yinYang,
      ganZhi: `${dayPillar.stem}${dayPillar.branch}`
    }
  };
}
```

### 2. フロントエンド拡張

#### A. 型定義の更新
```typescript
// types/index.ts
export interface DailyFortune {
  // 既存フィールド...
  dayPillar?: {
    heavenlyStem: string;
    earthlyBranch: string;
    element: string;
    yinYang: string;
    ganZhi: string;
  };
}
```

#### B. DailyAdvicePageで日柱表示
```typescript
// DailyAdvicePage.tsx
{fortuneData?.dayPillar && (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        今日の日柱
      </Typography>
      <Box display="flex" alignItems="center" gap={2}>
        <Typography variant="h4" color="primary">
          {fortuneData.dayPillar.ganZhi}
        </Typography>
        <Box>
          <Typography variant="body2" color="text.secondary">
            天干: {fortuneData.dayPillar.heavenlyStem}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            地支: {fortuneData.dayPillar.earthlyBranch}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            五行: {fortuneData.dayPillar.element} ({fortuneData.dayPillar.yinYang})
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
)}
```

### 3. 日柱を活用した運勢計算の改善

現在の乱数ベースから、日柱の五行を考慮した計算に変更：

```typescript
// 日柱の五行と個人の四柱推命データの五行バランスを比較
// より精度の高い日運計算を実現
```

## 実装の優先順位

1. **Phase 1**: 日柱の表示のみ（読み取り専用）
   - DailyFortuneモデルに日柱フィールド追加
   - 日柱計算と保存
   - フロントエンドで表示

2. **Phase 2**: 日柱を活用した運勢計算
   - 五行相性を考慮した運勢スコア計算
   - より詳細な運勢アドバイス生成

3. **Phase 3**: 日柱の解説機能
   - 日柱の意味や特徴の説明
   - AIキャラクターによる解説

## メリット

1. **ユーザー体験の向上**
   - 四柱推命の本格的な情報提供
   - 日々変わる日柱の確認が可能

2. **運勢計算の精度向上**
   - 乱数ベースから理論に基づいた計算へ
   - 個人の四柱推命データとの相性考慮

3. **差別化要素**
   - 他のアプリにない本格的な四柱推命機能