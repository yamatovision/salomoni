import type {
  FourPillarsData,
  ElementBalance,
  CompatibilityResult,
} from '../../../types';
import {
  FiveElements,
} from '../../../types';

// モック四柱推命データ生成関数
export const generateMockFourPillarsData = (
  birthDate: Date
): FourPillarsData => {
  // 生年月日から擬似的に要素を決定（実際の四柱推命計算は複雑）
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  
  // 簡易的な天干地支の割り当て（実際は暦計算が必要）
  const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const elements = ['木', '火', '土', '金', '水'];
  
  return {
    _id: `mock-saju-${Date.now()}`,
    clientId: `mock-client-${Date.now()}`,
    birthDate: birthDate.toISOString().split('T')[0],
    birthTime: '12:00',
    timezone: 'Asia/Tokyo',
    elementBalance: {
      wood: 20,
      fire: 20,
      earth: 20,
      metal: 20,
      water: 20
    },
    tenGods: {
      year: '比肩',
      month: '食神',
      day: '正官',
      hour: '偏財'
    },
    yearPillar: {
      heavenlyStem: heavenlyStems[year % 10],
      earthlyBranch: earthlyBranches[year % 12],
      element: elements[year % 5],
      yinYang: year % 2 === 0 ? '陽' : '陰',
    },
    monthPillar: {
      heavenlyStem: heavenlyStems[month % 10],
      earthlyBranch: earthlyBranches[month % 12],
      element: elements[month % 5],
      yinYang: month % 2 === 0 ? '陽' : '陰',
    },
    dayPillar: {
      heavenlyStem: heavenlyStems[day % 10],
      earthlyBranch: earthlyBranches[day % 12],
      element: elements[day % 5],
      yinYang: day % 2 === 0 ? '陽' : '陰',
    },
    hourPillar: {
      heavenlyStem: heavenlyStems[8], // 仮に午後4時生まれとする
      earthlyBranch: earthlyBranches[8],
      element: elements[3],
      yinYang: '陽',
    },
    calculatedAt: new Date(),
  };
};

// モック五行バランス生成
export const generateMockElementBalance = (fourPillars: FourPillarsData): ElementBalance => {
  // 各柱から五行を集計（簡易版）
  const elements = [
    fourPillars.yearPillar.element,
    fourPillars.monthPillar.element,
    fourPillars.dayPillar.element,
    fourPillars.hourPillar.element,
  ];
  
  // 五行ごとのカウント
  const counts: Record<string, number> = {
    '木': 0,
    '火': 0,
    '土': 0,
    '金': 0,
    '水': 0,
  };
  
  elements.forEach(element => {
    if (element in counts) {
      counts[element]++;
    }
  });
  
  // パーセンテージに変換
  const total = 4;
  const balance: ElementBalance = {
    wood: (counts['木'] / total) * 100,
    fire: (counts['火'] / total) * 100,
    earth: (counts['土'] / total) * 100,
    metal: (counts['金'] / total) * 100,
    water: (counts['水'] / total) * 100,
    mainElement: FiveElements.WOOD, // デフォルト値として
    isBalanced: Math.max(...Object.values(counts)) <= 2, // 偏りが少ないかチェック
  };
  
  return balance;
};

// モック相性診断結果生成
export const generateMockCompatibility = (
  clientId: string,
  stylistId: string
): CompatibilityResult => {
  // ランダムに相性スコアを生成（実際は四柱推命の計算が必要）
  const baseScore = 60 + Math.floor(Math.random() * 30); // 60-90の範囲
  
  const relationshipTypes = ['excellent', 'good', 'average', 'challenging', 'difficult'] as const;
  let relationshipType: typeof relationshipTypes[number];
  
  if (baseScore >= 85) relationshipType = 'excellent';
  else if (baseScore >= 70) relationshipType = 'good';
  else if (baseScore >= 50) relationshipType = 'average';
  else if (baseScore >= 30) relationshipType = 'challenging';
  else relationshipType = 'difficult';
  
  return {
    _id: `mock-compat-${Date.now()}`,
    userIds: [clientId, stylistId],
    overallScore: baseScore,
    details: {
      elementHarmony: {
        score: 70 + Math.floor(Math.random() * 20),
        description: '五行の調和が良好です'
      },
      yinYangBalance: {
        score: 65 + Math.floor(Math.random() * 25),
        description: '陰陽のバランスが取れています'
      },
      tenGodCompatibility: {
        score: 75 + Math.floor(Math.random() * 15),
        description: '十神の相性が良好です'
      },
      lifePurpose: {
        score: 80 + Math.floor(Math.random() * 10),
        description: '人生の目的が調和しています'
      },
    },
    advice: getCompatibilityAdvice(relationshipType),
    challenges: baseScore < 70 ? ['コミュニケーションの改善が必要'] : [],
    strengths: baseScore >= 70 ? ['お互いを補完し合える関係'] : [],
    calculatedAt: new Date(),
  };
};

// 相性に基づくアドバイス生成
const getCompatibilityAdvice = (relationshipType: string): string => {
  const adviceMap: Record<string, string> = {
    excellent: 'とても相性が良いです！自然な流れでコミュニケーションが取れるでしょう。お客様の要望を直感的に理解でき、最高の施術を提供できます。',
    good: '良い相性です。お互いを尊重し合える関係を築けるでしょう。丁寧な説明と傾聴を心がけることで、より良い関係に発展します。',
    average: '標準的な相性です。プロフェッショナルな対応を心がけ、お客様のニーズをしっかりと聞き取ることが大切です。',
    challenging: '少し気を付ける必要がある相性です。より丁寧なコミュニケーションと、お客様の要望の確認を心がけましょう。',
    difficult: '慎重な対応が必要な相性です。お客様の言葉に耳を傾け、要望を正確に理解することに重点を置きましょう。',
  };
  
  return adviceMap[relationshipType] || adviceMap.average;
};

// 五行に基づく美容アドバイス生成
export const generateBeautyAdvice = (elementBalance: ElementBalance): string[] => {
  const advice: string[] = [];
  
  // 主要素に基づくアドバイス
  const elementAdviceMap: Record<FiveElements, string> = {
    [FiveElements.WOOD]: '成長と発展を象徴する木の要素が強いお客様です。新しいスタイルへの挑戦を提案すると良いでしょう。',
    [FiveElements.FIRE]: '情熱的で華やかな火の要素が強いお客様です。トレンドを取り入れた印象的なスタイルが似合います。',
    [FiveElements.EARTH]: '安定と調和を求める土の要素が強いお客様です。ナチュラルで落ち着いたスタイルを好む傾向があります。',
    [FiveElements.METAL]: '洗練とクオリティを重視する金の要素が強いお客様です。精度の高い技術と仕上がりを求められます。',
    [FiveElements.WATER]: '柔軟性と適応力に富む水の要素が強いお客様です。季節や気分に合わせた変化を楽しまれます。',
  };
  
  if (elementBalance.mainElement) {
    advice.push(elementAdviceMap[elementBalance.mainElement]);
  }
  
  // バランスに基づくアドバイス
  if (elementBalance.isBalanced) {
    advice.push('五行のバランスが取れているため、様々なスタイルに挑戦できます。お客様の好みを重視した提案が効果的です。');
  } else {
    advice.push('特定の要素が強いため、その特性を活かしたスタイリングがおすすめです。');
  }
  
  // 不足している要素の補完アドバイス
  if (elementBalance.wood < 10) {
    advice.push('木の要素が少ないため、グリーン系のカラーや自然なウェーブスタイルで補完すると良いでしょう。');
  }
  if (elementBalance.fire < 10) {
    advice.push('火の要素が少ないため、暖色系のカラーや動きのあるスタイルで活力を与えると良いでしょう。');
  }
  if (elementBalance.earth < 10) {
    advice.push('土の要素が少ないため、ベージュやブラウン系のカラーで安定感を演出すると良いでしょう。');
  }
  if (elementBalance.metal < 10) {
    advice.push('金の要素が少ないため、アッシュ系カラーやストレートスタイルで洗練さを加えると良いでしょう。');
  }
  if (elementBalance.water < 10) {
    advice.push('水の要素が少ないため、ブルー系のカラーや流れるようなスタイルで柔らかさを演出すると良いでしょう。');
  }
  
  return advice;
};