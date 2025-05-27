import { SajuEngine, SajuResult } from 'saju-engine';
import { logger } from '../../../common/utils/logger';
import { 
  FourPillarsData, 
  CompatibilityResult,
  FourPillarsCalculateRequest,
  FourPillarsAnalyzeRequest,
  CompatibilityCalculateRequest,
  JapanesePrefecture,
  JapanesePrefecturesResponse
} from '../../../types';
import mongoose from 'mongoose';
import { UserModel } from '../../users/models/user.model';

export class SajuService {
  private sajuEngine: SajuEngine;

  constructor() {
    this.sajuEngine = new SajuEngine();
  }

  /**
   * 四柱推命計算を実行
   */
  async calculateFourPillars(data: FourPillarsCalculateRequest): Promise<FourPillarsData> {
    try {
      logger.info('[SajuService] 四柱推命計算開始', { 
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        location: data.location
      });

      // SajuEngineで計算実行
      const birthDateTime = new Date(`${data.birthDate}T${data.birthTime}:00`);
      const birthHour = parseInt(data.birthTime.split(':')[0] || '0', 10);
      const result: SajuResult = this.sajuEngine.calculate(
        birthDateTime,
        birthHour,
        undefined, // gender
        data.location
      );

      // APIレスポンス形式に変換
      const fourPillarsData: FourPillarsData = {
        _id: new mongoose.Types.ObjectId().toString(), // 一時的なIDを生成
        userId: '',
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        location: data.location,
        timezone: data.timezone || 'Asia/Tokyo',
        
        // 四柱データ
        yearPillar: {
          heavenlyStem: result.fourPillars.yearPillar.stem,
          earthlyBranch: result.fourPillars.yearPillar.branch,
          element: this.getElementFromStem(result.fourPillars.yearPillar.stem),
          yinYang: this.getYinYangFromStem(result.fourPillars.yearPillar.stem)
        },
        monthPillar: {
          heavenlyStem: result.fourPillars.monthPillar.stem,
          earthlyBranch: result.fourPillars.monthPillar.branch,
          element: this.getElementFromStem(result.fourPillars.monthPillar.stem),
          yinYang: this.getYinYangFromStem(result.fourPillars.monthPillar.stem)
        },
        dayPillar: {
          heavenlyStem: result.fourPillars.dayPillar.stem,
          earthlyBranch: result.fourPillars.dayPillar.branch,
          element: this.getElementFromStem(result.fourPillars.dayPillar.stem),
          yinYang: this.getYinYangFromStem(result.fourPillars.dayPillar.stem)
        },
        hourPillar: {
          heavenlyStem: result.fourPillars.hourPillar.stem,
          earthlyBranch: result.fourPillars.hourPillar.branch,
          element: this.getElementFromStem(result.fourPillars.hourPillar.stem),
          yinYang: this.getYinYangFromStem(result.fourPillars.hourPillar.stem)
        },

        // 五行バランス
        elementBalance: {
          wood: result.elementProfile.wood,
          fire: result.elementProfile.fire,
          earth: result.elementProfile.earth,
          metal: result.elementProfile.metal,
          water: result.elementProfile.water
        },

        // 十神
        tenGods: {
          year: result.tenGods.year || '',
          month: result.tenGods.month || '',
          day: result.tenGods.day || '',
          hour: result.tenGods.hour || ''
        },

        // 蔵干
        hiddenStems: result.hiddenStems,

        // 十二運
        twelveFortunes: result.twelveFortunes,

        // 格局と用神
        kakukyoku: result.kakukyoku ? result.kakukyoku.type : undefined,
        yojin: result.yojin ? [result.yojin.tenGod] : undefined,

        calculatedAt: new Date()
      };

      logger.info('[SajuService] 四柱推命計算完了', { 
        mainElement: result.elementProfile.mainElement 
      });

      return fourPillarsData;

    } catch (error) {
      logger.error('[SajuService] 四柱推命計算エラー', error);
      throw new Error('四柱推命計算に失敗しました');
    }
  }

  /**
   * 追加分析実行（性格分析、運勢予測など）
   */
  async analyzeFourPillars(data: FourPillarsAnalyzeRequest): Promise<any> {
    try {
      logger.info('[SajuService] 追加分析開始', { type: data.analysisType });

      // ここでは簡易的な実装
      // 実際には、保存された四柱推命データを使って詳細な分析を行う
      const mockAnalysis = {
        analysisType: data.analysisType,
        result: {
          personalityTraits: [
            { trait: 'リーダーシップ', score: 85, description: '生まれ持ったリーダー気質' },
            { trait: '創造性', score: 72, description: '芸術的センスに優れる' }
          ],
          careerAdvice: '管理職やクリエイティブな職業が向いています',
          healthAdvice: '火の気が強いため、心臓と血圧に注意が必要です'
        }
      };

      logger.info('[SajuService] 追加分析完了');
      return mockAnalysis;

    } catch (error) {
      logger.error('[SajuService] 追加分析エラー', error);
      throw new Error('追加分析に失敗しました');
    }
  }

  /**
   * 相性診断実行
   */
  async calculateCompatibility(data: CompatibilityCalculateRequest): Promise<CompatibilityResult> {
    try {
      logger.info('[SajuService] 相性診断開始', { 
        userCount: data.users.length 
      });

      // 各ユーザーの四柱推命データを計算
      const userResults: SajuResult[] = [];
      for (const user of data.users) {
        const birthDateTime = new Date(`${user.birthDate}T${user.birthTime}:00`);
        const birthHour = parseInt(user.birthTime.split(':')[0] || '0');
        const result = this.sajuEngine.calculate(
          birthDateTime,
          birthHour,
          undefined, // gender
          user.location
        );
        userResults.push(result);
      }

      // 高度な相性診断計算
      const compatibilityDetails = this.calculateCompatibilityDetails(userResults[0], userResults[1]);

      const compatibilityResult: CompatibilityResult = {
        _id: '',
        userIds: data.users.map(u => u.userId),
        overallScore: compatibilityDetails.totalScore,
        
        details: {
          elementHarmony: {
            score: compatibilityDetails.details.elementHarmony,
            description: this.getElementHarmonyDescription(compatibilityDetails.details.elementHarmony)
          },
          yinYangBalance: {
            score: compatibilityDetails.details.yinYangBalance,
            description: this.getYinYangDescription(compatibilityDetails.details.yinYangBalance)
          },
          tenGodCompatibility: {
            score: compatibilityDetails.details.usefulGods,
            description: this.getTenGodDescription(compatibilityDetails.details.usefulGods)
          },
          lifePurpose: {
            score: compatibilityDetails.details.strengthBalance,
            description: this.getLifePurposeDescription(compatibilityDetails.details.strengthBalance)
          }
        },

        advice: this.generateAdvancedCompatibilityAdvice(compatibilityDetails),
        challenges: this.generateChallenges(compatibilityDetails),
        strengths: this.generateCompatibilityStrengths(compatibilityDetails),
        
        calculatedAt: new Date()
      };

      logger.info('[SajuService] 相性診断完了', { 
        overallScore: compatibilityDetails.totalScore,
        details: compatibilityDetails.details
      });

      return compatibilityResult;

    } catch (error) {
      logger.error('[SajuService] 相性診断エラー', error);
      throw new Error('相性診断に失敗しました');
    }
  }

  /**
   * 四柱推命マスターデータ取得
   */
  async getMasterData(): Promise<any> {
    try {
      logger.info('[SajuService] マスターデータ取得開始');

      // マスターデータの例
      const masterData = {
        heavenlyStems: [
          { code: '甲', name: '甲', element: 'wood', yinYang: 'yang' },
          { code: '乙', name: '乙', element: 'wood', yinYang: 'yin' },
          { code: '丙', name: '丙', element: 'fire', yinYang: 'yang' },
          { code: '丁', name: '丁', element: 'fire', yinYang: 'yin' },
          { code: '戊', name: '戊', element: 'earth', yinYang: 'yang' },
          { code: '己', name: '己', element: 'earth', yinYang: 'yin' },
          { code: '庚', name: '庚', element: 'metal', yinYang: 'yang' },
          { code: '辛', name: '辛', element: 'metal', yinYang: 'yin' },
          { code: '壬', name: '壬', element: 'water', yinYang: 'yang' },
          { code: '癸', name: '癸', element: 'water', yinYang: 'yin' }
        ],
        earthlyBranches: [
          { code: '子', name: '子', animal: '鼠' },
          { code: '丑', name: '丑', animal: '牛' },
          { code: '寅', name: '寅', animal: '虎' },
          { code: '卯', name: '卯', animal: '兎' },
          { code: '辰', name: '辰', animal: '龍' },
          { code: '巳', name: '巳', animal: '蛇' },
          { code: '午', name: '午', animal: '馬' },
          { code: '未', name: '未', animal: '羊' },
          { code: '申', name: '申', animal: '猿' },
          { code: '酉', name: '酉', animal: '鶏' },
          { code: '戌', name: '戌', animal: '犬' },
          { code: '亥', name: '亥', animal: '猪' }
        ],
        elements: [
          { code: 'wood', name: '木', color: '#4CAF50' },
          { code: 'fire', name: '火', color: '#F44336' },
          { code: 'earth', name: '土', color: '#795548' },
          { code: 'metal', name: '金', color: '#9E9E9E' },
          { code: 'water', name: '水', color: '#2196F3' }
        ],
        tenGods: [
          { code: '比肩', name: '比肩', description: '自己主張・独立心' },
          { code: '劫財', name: '劫財', description: '競争心・野心' },
          { code: '食神', name: '食神', description: '楽観的・芸術性' },
          { code: '傷官', name: '傷官', description: '批判的・完璧主義' },
          { code: '偏財', name: '偏財', description: '社交的・商才' },
          { code: '正財', name: '正財', description: '堅実・計画性' },
          { code: '偏官', name: '偏官', description: '行動力・決断力' },
          { code: '正官', name: '正官', description: '責任感・リーダーシップ' },
          { code: '偏印', name: '偏印', description: '独創性・直感力' },
          { code: '印綬', name: '印綬', description: '知性・学習能力' }
        ]
      };

      logger.info('[SajuService] マスターデータ取得完了');
      return masterData;

    } catch (error) {
      logger.error('[SajuService] マスターデータ取得エラー', error);
      throw new Error('マスターデータ取得に失敗しました');
    }
  }


  /**
   * 天干から五行を取得
   */
  private getElementFromStem(stem: string): string {
    const stemElements: Record<string, string> = {
      '甲': '木', '乙': '木',
      '丙': '火', '丁': '火',
      '戊': '土', '己': '土',
      '庚': '金', '辛': '金',
      '壬': '水', '癸': '水'
    };
    return stemElements[stem] || '木';
  }

  /**
   * 天干から陰陽を取得
   */
  private getYinYangFromStem(stem: string): string {
    const yangStems = ['甲', '丙', '戊', '庚', '壬'];
    return yangStems.includes(stem) ? '陽' : '陰';
  }

  // 陽の気の天干
  private readonly YANG_GANS = ['甲', '丙', '戊', '庚', '壬'];
  
  // 陰の気の天干（将来的に使用予定）
  // private readonly YIN_GANS = ['乙', '丁', '己', '辛', '癸'];
  
  // 三合会局の組み合わせ
  private readonly SANGOKAIGYO_GROUPS = [
    ['寅', '午', '戌'], // 火局
    ['亥', '卯', '未'], // 木局
    ['申', '子', '辰'], // 水局
    ['巳', '酉', '丑']  // 金局
  ];
  
  // 支合の組み合わせ
  private readonly SHIGOU_PAIRS = [
    ['子', '丑'],
    ['寅', '亥'],
    ['卯', '戌'],
    ['辰', '酉'],
    ['巳', '申'],
    ['午', '未']
  ];
  
  // 支沖の組み合わせ
  private readonly SHICHU_PAIRS = [
    ['子', '午'],
    ['丑', '未'],
    ['寅', '申'],
    ['卯', '酉'],
    ['辰', '戌'],
    ['巳', '亥']
  ];
  
  // 干合の組み合わせ
  private readonly GANGOU_PAIRS = [
    ['甲', '己'],
    ['乙', '庚'],
    ['丙', '辛'],
    ['丁', '壬'],
    ['戊', '癸']
  ];
  
  // 相生（生じる）関係
  private readonly GENERATES = {
    '木': '火',
    '火': '土',
    '土': '金',
    '金': '水',
    '水': '木'
  };
  
  // 相克（克す）関係
  private readonly RESTRICTS = {
    '木': '土',
    '土': '水',
    '水': '火',
    '火': '金',
    '金': '木'
  };

  /**
   * 陰陽バランスの相性を評価する
   * @param person1DayGan ユーザー1の日干
   * @param person2DayGan ユーザー2の日干
   * @returns 陰陽バランスの評価スコア (0-100)
   */
  private evaluateYinYangBalance(person1DayGan: string, person2DayGan: string): number {
    const isPerson1Yang = this.YANG_GANS.includes(person1DayGan);
    const isPerson2Yang = this.YANG_GANS.includes(person2DayGan);
    
    // 陰陽が異なる場合は高いスコア、同じ場合は低いスコア
    if (isPerson1Yang !== isPerson2Yang) {
      return 100; // 最高スコア
    } else {
      return 50; // 中間スコア
    }
  }
  
  /**
   * 身強弱のバランスを評価する
   * @param result1 ユーザー1の四柱推命結果
   * @param result2 ユーザー2の四柱推命結果
   * @returns 身強弱バランスの評価スコア (0-100)
   */
  private evaluateStrengthBalance(result1: SajuResult, result2: SajuResult): number {
    // kakukyokuから身強弱を判定
    const isStrong1 = result1.kakukyoku?.strength === 'strong';
    const isStrong2 = result2.kakukyoku?.strength === 'strong';
    
    // 一方が強く一方が弱い場合は高いスコア
    if (isStrong1 !== isStrong2) {
      return 100;
    } 
    // 同士の場合は中間スコア
    else {
      return 70;
    }
  }
  
  /**
   * 日支の関係を評価する
   * @param person1DayBranch ユーザー1の日支
   * @param person2DayBranch ユーザー2の日支
   * @returns 日支関係の評価スコアと関係タイプ
   */
  private evaluateDayBranchRelationship(person1DayBranch: string, person2DayBranch: string): {
    score: number,
    relationship: string
  } {
    // 三合会局かチェック
    for (const group of this.SANGOKAIGYO_GROUPS) {
      if (group.includes(person1DayBranch) && group.includes(person2DayBranch) && person1DayBranch !== person2DayBranch) {
        return { score: 100, relationship: '三合会局' };
      }
    }
    
    // 支合かチェック
    for (const pair of this.SHIGOU_PAIRS) {
      if ((pair[0] === person1DayBranch && pair[1] === person2DayBranch) ||
          (pair[1] === person1DayBranch && pair[0] === person2DayBranch)) {
        return { score: 85, relationship: '支合' };
      }
    }
    
    // 支沖かチェック
    for (const pair of this.SHICHU_PAIRS) {
      if ((pair[0] === person1DayBranch && pair[1] === person2DayBranch) ||
          (pair[1] === person1DayBranch && pair[0] === person2DayBranch)) {
        return { score: 60, relationship: '支沖' };
      }
    }
    
    // どの関係にもない場合
    return { score: 50, relationship: '通常' };
  }
  
  /**
   * 用神・喜神にあたる五行の評価
   * @param personDayGan ユーザーの日干
   * @param otherPersonResult 相手の四柱推命結果
   * @returns 用神・喜神の評価スコア (0-100)
   */
  private evaluateUsefulGods(personDayGan: string, otherPersonResult: SajuResult): number {
    const dayGanElement = this.getElementFromStem(personDayGan);
    
    // 用神（生じる五行）
    const youjin = this.GENERATES[dayGanElement as keyof typeof this.GENERATES];
    // 喜神（克される五行）
    const kijin = this.RESTRICTS[dayGanElement as keyof typeof this.RESTRICTS];
    
    let youjinCount = 0;
    let kijinCount = 0;
    
    // 相手の四柱に含まれる五行をカウント
    const { yearPillar, monthPillar, dayPillar, hourPillar } = otherPersonResult.fourPillars;
    
    const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];
    
    for (const pillar of pillars) {
      const ganElement = this.getElementFromStem(pillar.stem);
      const zhiElement = this.getElementFromBranch(pillar.branch);
      
      if (ganElement === youjin) youjinCount++;
      if (zhiElement === youjin) youjinCount++;
      
      if (ganElement === kijin) kijinCount++;
      if (zhiElement === kijin) kijinCount++;
    }
    
    // 用神と喜神の数に基づいてスコア計算
    const totalCount = youjinCount + kijinCount;
    const maxPossibleCount = 8; // 四柱で最大8つの干支
    
    return Math.min(100, (totalCount / maxPossibleCount) * 100);
  }
  
  /**
   * 日干の干合を評価する
   * @param person1DayGan ユーザー1の日干
   * @param person2DayGan ユーザー2の日干
   * @returns 日干干合の評価スコアと干合かどうか
   */
  private evaluateDayGanCombination(person1DayGan: string, person2DayGan: string): {
    score: number,
    isGangou: boolean
  } {
    // 干合かチェック
    for (const pair of this.GANGOU_PAIRS) {
      if ((pair[0] === person1DayGan && pair[1] === person2DayGan) ||
          (pair[1] === person1DayGan && pair[0] === person2DayGan)) {
        return { score: 100, isGangou: true };
      }
    }
    
    // 干合でない場合
    return { score: 50, isGangou: false };
  }
  
  /**
   * 地支から五行を取得
   */
  private getElementFromBranch(branch: string): string {
    const branchElements: Record<string, string> = {
      '寅': '木', '卯': '木',
      '巳': '火', '午': '火',
      '辰': '土', '戌': '土', '丑': '土', '未': '土',
      '申': '金', '酉': '金',
      '子': '水', '亥': '水'
    };
    return branchElements[branch] || '木';
  }
  
  /**
   * 相性の詳細計算を行う
   */
  private calculateCompatibilityDetails(result1: SajuResult | undefined, result2: SajuResult | undefined): {
    totalScore: number,
    details: {
      yinYangBalance: number,
      strengthBalance: number,
      dayBranchRelationship: { score: number, relationship: string },
      usefulGods: number,
      dayGanCombination: { score: number, isGangou: boolean },
      elementHarmony: number
    },
    relationshipType: string
  } {
    if (!result1 || !result2) {
      return {
        totalScore: 50,
        details: {
          yinYangBalance: 50,
          strengthBalance: 50,
          dayBranchRelationship: { score: 50, relationship: '通常' },
          usefulGods: 50,
          dayGanCombination: { score: 50, isGangou: false },
          elementHarmony: 50
        },
        relationshipType: 'generalRelationship'
      };
    }
    
    // 日干・日支の取得
    const user1DayGan = result1.fourPillars.dayPillar.stem;
    const user1DayBranch = result1.fourPillars.dayPillar.branch;
    const user2DayGan = result2.fourPillars.dayPillar.stem;
    const user2DayBranch = result2.fourPillars.dayPillar.branch;
    
    // 各評価項目の計算
    const yinYangBalance = this.evaluateYinYangBalance(user1DayGan, user2DayGan);
    const strengthBalance = this.evaluateStrengthBalance(result1, result2);
    const dayBranchRelationship = this.evaluateDayBranchRelationship(user1DayBranch, user2DayBranch);
    
    // 用神評価（双方向で計算して平均を取る）
    const usefulGods1 = this.evaluateUsefulGods(user1DayGan, result2);
    const usefulGods2 = this.evaluateUsefulGods(user2DayGan, result1);
    const usefulGods = (usefulGods1 + usefulGods2) / 2;
    
    const dayGanCombination = this.evaluateDayGanCombination(user1DayGan, user2DayGan);
    
    // 五行調和の計算
    const elementHarmony = this.calculateElementHarmony(result1, result2);
    
    // 重み付け総合スコア計算（enhanced-compatibility.service.tsと同じ比重）
    const totalScore = 
      yinYangBalance * 0.2 +          // 20%
      strengthBalance * 0.2 +         // 20%
      dayBranchRelationship.score * 0.25 + // 25%
      usefulGods * 0.2 +              // 20%
      dayGanCombination.score * 0.15; // 15%
    
    const roundedScore = Math.round(totalScore);
    
    // 関係性タイプの判定
    const relationshipType = this.determineRelationshipType({
      totalScore: roundedScore,
      details: {
        yinYangBalance,
        strengthBalance,
        dayBranchRelationship,
        usefulGods,
        dayGanCombination
      }
    });
    
    return {
      totalScore: roundedScore,
      details: {
        yinYangBalance,
        strengthBalance,
        dayBranchRelationship,
        usefulGods,
        dayGanCombination,
        elementHarmony
      },
      relationshipType
    };
  }
  
  /**
   * 五行調和スコアを計算
   */
  private calculateElementHarmony(result1: SajuResult, result2: SajuResult): number {
    // 五行バランスの差を計算
    const elementDiff = Math.abs(result1.elementProfile.wood - result2.elementProfile.wood) +
                       Math.abs(result1.elementProfile.fire - result2.elementProfile.fire) +
                       Math.abs(result1.elementProfile.earth - result2.elementProfile.earth) +
                       Math.abs(result1.elementProfile.metal - result2.elementProfile.metal) +
                       Math.abs(result1.elementProfile.water - result2.elementProfile.water);
    
    // 差が小さいほど調和が良い
    return Math.max(0, 100 - elementDiff * 5);
  }
  
  /**
   * 関係性タイプを判定する
   */
  private determineRelationshipType(
    compatibilityResult: {
      totalScore: number,
      details: {
        yinYangBalance: number,
        strengthBalance: number,
        dayBranchRelationship: { score: number, relationship: string },
        usefulGods: number,
        dayGanCombination: { score: number, isGangou: boolean }
      }
    }
  ): string {
    const { totalScore, details } = compatibilityResult;
    
    // 理想的パートナー
    if (totalScore >= 90 && 
        details.dayGanCombination.isGangou && 
        details.dayBranchRelationship.relationship === '三合会局' && 
        details.yinYangBalance >= 80) {
      return 'idealPartner';
    }
    
    // 良好な協力関係
    if (totalScore >= 80 && 
        details.usefulGods >= 80 && 
        details.strengthBalance >= 80) {
      return 'goodCooperation';
    }
    
    // 安定した関係
    if (totalScore >= 70 && 
        details.dayBranchRelationship.relationship === '支合' && 
        details.yinYangBalance >= 70) {
      return 'stableRelationship';
    }
    
    // 刺激的な関係
    if (totalScore >= 60 && 
        details.dayBranchRelationship.relationship === '支沖' && 
        details.usefulGods >= 50) {
      return 'stimulatingRelationship';
    }
    
    // 要注意の関係
    if (totalScore < 60 && 
        details.yinYangBalance < 60 && 
        details.strengthBalance < 60 && 
        details.usefulGods < 50) {
      return 'cautionRelationship';
    }
    
    // その他の関係
    return 'generalRelationship';
  }
  
  // /**
  //  * 相性スコア計算（高度な実装）- calculateCompatibilityDetailsで代替
  //  */
  // private calculateCompatibilityScore(result1: SajuResult | undefined, result2: SajuResult | undefined): number {
  //   if (!result1 || !result2) {
  //     return 50; // デフォルトスコア
  //   }
    
  //   // 日干・日支の取得
  //   const user1DayGan = result1.fourPillars.dayPillar.stem;
  //   const user1DayBranch = result1.fourPillars.dayPillar.branch;
  //   const user2DayGan = result2.fourPillars.dayPillar.stem;
  //   const user2DayBranch = result2.fourPillars.dayPillar.branch;
    
  //   // 各評価項目の計算
  //   const yinYangBalance = this.evaluateYinYangBalance(user1DayGan, user2DayGan);
  //   const strengthBalance = this.evaluateStrengthBalance(result1, result2);
  //   const dayBranchRelationship = this.evaluateDayBranchRelationship(user1DayBranch, user2DayBranch);
    
  //   // 用神評価（双方向で計算して平均を取る）
  //   const usefulGods1 = this.evaluateUsefulGods(user1DayGan, result2);
  //   const usefulGods2 = this.evaluateUsefulGods(user2DayGan, result1);
  //   const usefulGods = (usefulGods1 + usefulGods2) / 2;
    
  //   const dayGanCombination = this.evaluateDayGanCombination(user1DayGan, user2DayGan);
    
  //   // 重み付け総合スコア計算（enhanced-compatibility.service.tsと同じ比重）
  //   const totalScore = 
  //     yinYangBalance * 0.2 +          // 20%
  //     strengthBalance * 0.2 +         // 20%
  //     dayBranchRelationship.score * 0.25 + // 25%
  //     usefulGods * 0.2 +              // 20%
  //     dayGanCombination.score * 0.15; // 15%
    
  //   return Math.round(totalScore);
  // }

  /**
   * 関係性タイプの日本語マッピング
   */
  private readonly RELATIONSHIP_TYPE_JP = {
    'idealPartner': '理想的パートナー',
    'goodCooperation': '良好な協力関係',
    'stableRelationship': '安定した関係',
    'stimulatingRelationship': '刺激的な関係',
    'cautionRelationship': '要注意の関係',
    'generalRelationship': '一般的な関係'
  };
  
  /**
   * 五行調和の説明文を生成
   */
  private getElementHarmonyDescription(score: number): string {
    if (score >= 80) {
      return '五行のバランスが非常に良く、自然な調和があります。';
    } else if (score >= 60) {
      return '五行の調和は良好で、お互いを補い合えます。';
    } else if (score >= 40) {
      return '五行バランスに違いがありますが、互いの個性を活かせます。';
    } else {
      return '五行バランスが異なりますが、違いを理解することで成長できます。';
    }
  }
  
  /**
   * 陰陽バランスの説明文を生成
   */
  private getYinYangDescription(score: number): string {
    if (score === 100) {
      return '陰陽が完璧に補完し合い、理想的なバランスです。';
    } else {
      return '陰陽が同質で、穏やかで安定した関係を築けます。';
    }
  }
  
  /**
   * 十神相性の説明文を生成
   */
  private getTenGodDescription(score: number): string {
    if (score >= 80) {
      return '用神・喜神の相性が非常に良く、お互いに必要な要素を持っています。';
    } else if (score >= 60) {
      return '用神・喜神の相性は良好で、相互サポートが期待できます。';
    } else if (score >= 40) {
      return '用神・喜神の観点では標準的な相性です。';
    } else {
      return '用神・喜神の相性には工夫が必要ですが、努力で改善できます。';
    }
  }
  
  /**
   * 人生目的の説明文を生成
   */
  private getLifePurposeDescription(score: number): string {
    if (score === 100) {
      return '身強弱が互いを補完し、バランスの取れた協力関係を築けます。';
    } else {
      return '同じ身強弱タイプで、共通の価値観を持ちやすい関係です。';
    }
  }
  
  /**
   * 高度な相性アドバイスを生成
   */
  private generateAdvancedCompatibilityAdvice(details: any): string {
    const { relationshipType } = details;
    const relationshipTypeJP = this.RELATIONSHIP_TYPE_JP[relationshipType as keyof typeof this.RELATIONSHIP_TYPE_JP] || '一般的な関係';
    
    let baseAdvice = `お二人は「${relationshipTypeJP}」にあります。`;
    
    // 関係性タイプ別のアドバイス
    switch (relationshipType) {
      case 'idealPartner':
        baseAdvice += '稀に見る素晴らしい相性で、深い理解と信頼関係を築ける運命的な組み合わせです。';
        break;
      case 'goodCooperation':
        baseAdvice += 'お互いの長所を活かし合い、効果的に協力できる建設的な関係です。';
        break;
      case 'stableRelationship':
        baseAdvice += '安定感があり、長期的に良好な関係を維持しやすい組み合わせです。';
        break;
      case 'stimulatingRelationship':
        baseAdvice += '刺激的で成長を促す関係ですが、時には衝突もあるかもしれません。';
        break;
      case 'cautionRelationship':
        baseAdvice += '相互理解に努力が必要ですが、違いを受け入れることで成長できます。';
        break;
      default:
        baseAdvice += 'お互いを理解し、尊重し合うことで良い関係を築けます。';
    }
    
    // 特筆すべき点の追加
    if (details.details.dayGanCombination.isGangou) {
      baseAdvice += '日干が干合の関係にあり、特別な縁があります。';
    }
    
    if (details.details.dayBranchRelationship.relationship === '三合会局') {
      baseAdvice += '日支が三合会局を形成し、強力な結びつきがあります。';
    }
    
    return baseAdvice;
  }
  
  /**
   * ユーザーの四柱推命プロフィール取得
   */
  async getUserFourPillars(userId: string): Promise<any> {
    try {
      logger.info('[SajuService] ユーザー四柱推命プロフィール取得開始', { userId });

      // データベースからユーザー情報を取得
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      // 生年月日がない場合はエラー
      if (!user.birthDate) {
        throw new Error('ユーザーの生年月日が登録されていません');
      }

      // デフォルト値の設定
      const birthDate = new Date(user.birthDate);
      const birthTime = user.birthTime || '00:00'; // デフォルトは午前0時
      const timeParts = birthTime.split(':');
      const hour = parseInt(timeParts[0] || '0', 10);
      const minute = parseInt(timeParts[1] || '0', 10);
      const birthHour = hour + (minute / 60); // 小数点以下で分を表現
      
      // 出生地の設定（デフォルトは東京）
      const location = user.birthLocation?.longitude && user.birthLocation?.latitude ? {
        longitude: user.birthLocation.longitude,
        latitude: user.birthLocation.latitude
      } : {
        longitude: 139.6917,
        latitude: 35.6895
      };

      // SajuEngineで四柱推命を計算
      const sajuEngine = new SajuEngine({
        useInternationalMode: true,
        useLocalTime: true,
        useDST: true
      });

      const sajuResult = sajuEngine.calculate(
        birthDate,
        Math.floor(birthHour), // 整数部分のみ使用
        user.gender === 'male' ? 'M' : 'F',
        location
      );

      // レスポンス形式に変換
      const profile = {
        userId,
        birthDate: birthDate.toISOString(),
        birthTime,
        location: user.birthLocation?.name || '東京',
        fourPillars: {
          yearPillar: {
            heavenlyStem: sajuResult.fourPillars.yearPillar.stem,
            earthlyBranch: sajuResult.fourPillars.yearPillar.branch,
            element: this.getElementFromStem(sajuResult.fourPillars.yearPillar.stem),
            yinYang: this.getYinYangFromStem(sajuResult.fourPillars.yearPillar.stem)
          },
          monthPillar: {
            heavenlyStem: sajuResult.fourPillars.monthPillar.stem,
            earthlyBranch: sajuResult.fourPillars.monthPillar.branch,
            element: this.getElementFromStem(sajuResult.fourPillars.monthPillar.stem),
            yinYang: this.getYinYangFromStem(sajuResult.fourPillars.monthPillar.stem)
          },
          dayPillar: {
            heavenlyStem: sajuResult.fourPillars.dayPillar.stem,
            earthlyBranch: sajuResult.fourPillars.dayPillar.branch,
            element: this.getElementFromStem(sajuResult.fourPillars.dayPillar.stem),
            yinYang: this.getYinYangFromStem(sajuResult.fourPillars.dayPillar.stem)
          },
          hourPillar: {
            heavenlyStem: sajuResult.fourPillars.hourPillar.stem,
            earthlyBranch: sajuResult.fourPillars.hourPillar.branch,
            element: this.getElementFromStem(sajuResult.fourPillars.hourPillar.stem),
            yinYang: this.getYinYangFromStem(sajuResult.fourPillars.hourPillar.stem)
          }
        },
        elementBalance: {
          wood: sajuResult.elementProfile.wood,
          fire: sajuResult.elementProfile.fire,
          earth: sajuResult.elementProfile.earth,
          metal: sajuResult.elementProfile.metal,
          water: sajuResult.elementProfile.water
        },
        tenGods: sajuResult.tenGods,
        personality: {
          mainElement: sajuResult.elementProfile.mainElement,
          traits: this.generatePersonalityTraits(sajuResult),
          strengths: this.generateStrengths(sajuResult),
          weaknesses: this.generateWeaknesses(sajuResult)
        },
        calculatedAt: new Date()
      };

      logger.info('[SajuService] ユーザー四柱推命プロフィール取得完了', { userId });
      return profile;

    } catch (error) {
      logger.error('[SajuService] ユーザー四柱推命プロフィール取得エラー', { error, userId });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('ユーザーの四柱推命プロフィール取得に失敗しました');
    }
  }

  /**
   * 性格特性を生成
   */
  private generatePersonalityTraits(sajuResult: any): string[] {
    const traits: string[] = [];
    const mainElement = sajuResult.elementProfile.mainElement;
    
    switch(mainElement) {
      case '木':
        traits.push('リーダーシップ', '創造性', '向上心');
        break;
      case '火':
        traits.push('情熱的', '行動力', '社交的');
        break;
      case '土':
        traits.push('安定志向', '信頼性', '実務能力');
        break;
      case '金':
        traits.push('論理的', '正義感', '完璧主義');
        break;
      case '水':
        traits.push('適応力', '知的', '直感的');
        break;
    }
    
    return traits;
  }

  /**
   * 強みを生成
   */
  private generateStrengths(sajuResult: any): string[] {
    const strengths: string[] = [];
    const mainElement = sajuResult.elementProfile.mainElement;
    
    switch(mainElement) {
      case '木':
        strengths.push('決断力が高い', '目標達成力がある', '人を引っ張る力がある');
        break;
      case '火':
        strengths.push('積極的に行動できる', 'コミュニケーション能力が高い', '周囲を明るくする');
        break;
      case '土':
        strengths.push('責任感が強い', '計画的に物事を進められる', '忍耐力がある');
        break;
      case '金':
        strengths.push('分析力が高い', '公平な判断ができる', '品質にこだわる');
        break;
      case '水':
        strengths.push('柔軟性がある', '学習能力が高い', '洞察力に優れる');
        break;
    }
    
    return strengths;
  }

  /**
   * 弱点を生成
   */
  private generateWeaknesses(sajuResult: any): string[] {
    const weaknesses: string[] = [];
    const mainElement = sajuResult.elementProfile.mainElement;
    
    switch(mainElement) {
      case '木':
        weaknesses.push('頑固な面がある', '協調性に欠ける場合がある');
        break;
      case '火':
        weaknesses.push('衝動的になりやすい', '飽きっぽい面がある');
        break;
      case '土':
        weaknesses.push('変化を嫌う傾向がある', '融通が利かない場合がある');
        break;
      case '金':
        weaknesses.push('批判的になりやすい', '完璧を求めすぎる');
        break;
      case '水':
        weaknesses.push('優柔不断になりやすい', '感情に流されやすい');
        break;
    }
    
    return weaknesses;
  }

  /**
   * 課題を生成
   */
  private generateChallenges(details: any): string[] {
    const challenges: string[] = [];
    
    if (details.details.yinYangBalance < 60) {
      challenges.push('陰陽バランスの調整が必要です。お互いの気質の違いを理解しましょう。');
    }
    
    if (details.details.dayBranchRelationship.relationship === '支沖') {
      challenges.push('日支が沖の関係にあるため、価値観の違いが生じやすいです。');
    }
    
    if (details.details.usefulGods < 50) {
      challenges.push('用神・喜神の観点では相性が弱いため、お互いをサポートする意識が大切です。');
    }
    
    if (details.totalScore < 60) {
      challenges.push('全体的な相性に課題がありますが、努力と理解で改善可能です。');
    }
    
    return challenges.length > 0 ? challenges : ['特に大きな課題はありません。'];
  }
  
  /**
   * 相性の強みを生成
   */
  private generateCompatibilityStrengths(details: any): string[] {
    const strengths: string[] = [];
    
    if (details.details.yinYangBalance >= 80) {
      strengths.push('陰陽バランスが優れており、自然な調和があります。');
    }
    
    if (details.details.dayGanCombination.isGangou) {
      strengths.push('日干が干合の関係で、深い縁と理解があります。');
    }
    
    if (details.details.dayBranchRelationship.relationship === '三合会局') {
      strengths.push('日支が三合会局を形成し、強力な協力関係を築けます。');
    } else if (details.details.dayBranchRelationship.relationship === '支合') {
      strengths.push('日支が支合の関係で、安定した信頼関係があります。');
    }
    
    if (details.details.strengthBalance >= 80) {
      strengths.push('身強弱のバランスが良く、互いに補完し合えます。');
    }
    
    if (details.details.usefulGods >= 80) {
      strengths.push('用神・喜神の相性が良く、お互いに必要な要素を提供できます。');
    }
    
    return strengths.length > 0 ? strengths : ['お互いを尊重し合える良好な関係です。'];
  }
  
  // /**
  //  * 相性アドバイス生成（互換性のため残す）- generateAdvancedCompatibilityAdviceで代替
  //  */
  // private generateCompatibilityAdvice(score: number): string {
  //   if (score >= 80) {
  //     return '非常に相性が良く、お互いを自然に理解し合える関係です。';
  //   } else if (score >= 60) {
  //     return 'バランスの取れた関係で、努力次第でより良い関係を築けます。';
  //   } else {
  //     return '価値観の違いがありますが、お互いを尊重することで成長できる関係です。';
  //   }
  // }

  /**
   * 日本の都道府県リスト取得
   */
  async getJapanesePrefectures(): Promise<JapanesePrefecturesResponse> {
    try {
      // 日本の47都道府県と時差調整データ
      const prefectures: JapanesePrefecture[] = [
        { name: '北海道', adjustmentMinutes: 0 },
        { name: '青森県', adjustmentMinutes: 0 },
        { name: '岩手県', adjustmentMinutes: 0 },
        { name: '宮城県', adjustmentMinutes: 0 },
        { name: '秋田県', adjustmentMinutes: 0 },
        { name: '山形県', adjustmentMinutes: 0 },
        { name: '福島県', adjustmentMinutes: 0 },
        { name: '茨城県', adjustmentMinutes: 0 },
        { name: '栃木県', adjustmentMinutes: 0 },
        { name: '群馬県', adjustmentMinutes: 0 },
        { name: '埼玉県', adjustmentMinutes: 0 },
        { name: '千葉県', adjustmentMinutes: 0 },
        { name: '東京都', adjustmentMinutes: 0 },
        { name: '神奈川県', adjustmentMinutes: 0 },
        { name: '新潟県', adjustmentMinutes: 0 },
        { name: '富山県', adjustmentMinutes: 0 },
        { name: '石川県', adjustmentMinutes: 0 },
        { name: '福井県', adjustmentMinutes: 0 },
        { name: '山梨県', adjustmentMinutes: 0 },
        { name: '長野県', adjustmentMinutes: 0 },
        { name: '岐阜県', adjustmentMinutes: 0 },
        { name: '静岡県', adjustmentMinutes: 0 },
        { name: '愛知県', adjustmentMinutes: 0 },
        { name: '三重県', adjustmentMinutes: 0 },
        { name: '滋賀県', adjustmentMinutes: 0 },
        { name: '京都府', adjustmentMinutes: 0 },
        { name: '大阪府', adjustmentMinutes: 0 },
        { name: '兵庫県', adjustmentMinutes: 0 },
        { name: '奈良県', adjustmentMinutes: 0 },
        { name: '和歌山県', adjustmentMinutes: 0 },
        { name: '鳥取県', adjustmentMinutes: 0 },
        { name: '島根県', adjustmentMinutes: 0 },
        { name: '岡山県', adjustmentMinutes: 0 },
        { name: '広島県', adjustmentMinutes: 0 },
        { name: '山口県', adjustmentMinutes: 0 },
        { name: '徳島県', adjustmentMinutes: 0 },
        { name: '香川県', adjustmentMinutes: 0 },
        { name: '愛媛県', adjustmentMinutes: 0 },
        { name: '高知県', adjustmentMinutes: 0 },
        { name: '福岡県', adjustmentMinutes: 0 },
        { name: '佐賀県', adjustmentMinutes: 0 },
        { name: '長崎県', adjustmentMinutes: 0 },
        { name: '熊本県', adjustmentMinutes: 0 },
        { name: '大分県', adjustmentMinutes: 0 },
        { name: '宮崎県', adjustmentMinutes: 0 },
        { name: '鹿児島県', adjustmentMinutes: 0 },
        { name: '沖縄県', adjustmentMinutes: 0 },
      ];

      return { prefectures };
    } catch (error) {
      logger.error('都道府県リスト取得エラー:', error);
      throw error;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const sajuService = new SajuService();