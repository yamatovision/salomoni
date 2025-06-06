import { logger } from '../../../../../common/utils/logger';

export interface Intent {
  type: string;
  query: string;
  confidence: number;
}

export class IntentParser {
  private patterns: Map<string, RegExp[]>;

  constructor() {
    this.patterns = new Map();
    this.initializePatterns();
  }

  /**
   * パターンを初期化
   */
  private initializePatterns(): void {
    // 人物に関するパターン
    this.patterns.set('person', [
      /(.+?)(?:さん|様|氏|くん|ちゃん)?(?:について|の相談|について教えて|の情報|の四柱推命)/,
      /(.+?)(?:さん|様|氏|くん|ちゃん)?の(?:運勢|運気|今日の運勢|相性)/,
      /(.+?)(?:さん|様|氏|くん|ちゃん)?と(?:相性|の相性|相談)/,
    ]);

    // 将来の拡張用パターン（コメントアウト）
    // this.patterns.set('sales', [
    //   /(?:売上|売り上げ|収益|収入)(?:について|の情報|を教えて)/,
    //   /(?:今月|先月|今年|昨年)の(?:売上|売り上げ|収益)/,
    // ]);
  }

  /**
   * メッセージから意図を解析
   */
  parse(message: string): Intent[] {
    const intents: Intent[] = [];

    try {
      // 「〜と〜の相性」パターンを特別に処理
      const compatibilityPattern = /(.+?)(?:さん|様|氏|くん|ちゃん)?と(.+?)(?:さん|様|氏|くん|ちゃん)?の(?:相性|運勢)/;
      const compatibilityMatch = message.match(compatibilityPattern);
      
      if (compatibilityMatch && compatibilityMatch[1] && compatibilityMatch[2]) {
        // 両方の人物を個別の意図として追加
        const person1 = compatibilityMatch[1].trim();
        const person2 = compatibilityMatch[2].trim();
        
        intents.push({
          type: 'person',
          query: person1,
          confidence: 0.9,
        });
        
        intents.push({
          type: 'person',
          query: person2,
          confidence: 0.9,
        });
      } else {
        // 通常のパターンマッチング
        for (const [type, patterns] of this.patterns.entries()) {
          for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) {
              const query = match[1] ? match[1].trim() : match[0];
              
              // 重複チェック
              const isDuplicate = intents.some(
                intent => intent.type === type && intent.query === query
              );

              if (!isDuplicate) {
                intents.push({
                  type,
                  query,
                  confidence: this.calculateConfidence(match, message),
                });
              }
            }
          }
        }
      }

      // 信頼度でソート（高い順）
      intents.sort((a, b) => b.confidence - a.confidence);

      logger.debug('Parsed intents', { 
        message, 
        intentsCount: intents.length,
        intents 
      });

    } catch (error) {
      logger.error('Intent parsing error', { error, message });
    }

    return intents;
  }

  /**
   * マッチの信頼度を計算
   */
  private calculateConfidence(match: RegExpMatchArray, message: string): number {
    // 基本信頼度
    let confidence = 0.7;

    // 完全一致の場合は信頼度を上げる
    if (match[0] === message.trim()) {
      confidence = 0.95;
    }
    // メッセージの大部分を占める場合
    else if (match[0].length / message.length > 0.7) {
      confidence = 0.85;
    }

    // 特定のキーワードが含まれる場合は信頼度を上げる
    if (message.includes('について') || message.includes('教えて')) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * 敬称を除去してクリーンな名前を取得
   */
  cleanName(name: string): string {
    return name.replace(/(?:さん|様|氏|くん|ちゃん)$/, '').trim();
  }
}