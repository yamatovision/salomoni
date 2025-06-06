import OpenAI from 'openai';
import { AICharacter, AICharacterStyle, ChatMessage, MessageType, FourPillarsData, ID } from '../../../types';
import { logger } from '../../../common/utils/logger';
import { SajuService } from '../../saju/services/saju.service';
import { contextInjectionManager } from './context-injection';
import { getDayPillar } from '../../../../sajuengine_package/src/dayPillarCalculator';
import { DayPillarMasterModel } from '../../fortune/models/day-pillar-master.model';

export class OpenAIService {
  private openai: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private sajuService: SajuService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '4096');
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.6');
    this.sajuService = new SajuService();
  }

  async generateResponse(params: {
    messages: ChatMessage[];
    aiCharacter: AICharacter;
    memoryContext: string;
    contextType: 'personal' | 'stylist_consultation' | 'client_direct';
    userId?: ID;
    clientId?: ID;
    organizationId: string;
    userRole: string;
  }): Promise<string> {
    try {
      // 四柱推命データを取得
      const fourPillarsData = await this.getFourPillarsData(params.userId, params.clientId);
      
      const systemPrompt = await this.buildSystemPrompt(
        params.aiCharacter,
        params.memoryContext,
        params.contextType,
        fourPillarsData
      );

      // 最新のユーザーメッセージにコンテキストを注入
      let processedMessages = [...params.messages];
      if (processedMessages.length > 0) {
        const lastMessage = processedMessages[processedMessages.length - 1];
        if (lastMessage && lastMessage.type === MessageType.USER) {
          const { enhancedMessage, injectedContexts } = await contextInjectionManager.injectContext(
            lastMessage.content,
            {
              organizationId: params.organizationId,
              userId: params.userId?.toString() || '',
              userRole: params.userRole,
            }
          );

          // 確認が必要な場合は特別な応答を生成
          const clarificationNeeded = injectedContexts.find(ctx => ctx.type === 'clarification_needed');
          if (clarificationNeeded && clarificationNeeded.type === 'clarification_needed') {
            return this.formatClarificationResponse(clarificationNeeded);
          }

          // メッセージを強化版に置き換え
          processedMessages[processedMessages.length - 1] = {
            ...lastMessage,
            content: enhancedMessage,
          } as ChatMessage;
        }
      }

      const openAIMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...this.convertToOpenAIMessages(processedMessages),
      ];

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: openAIMessages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      logger.info('OpenAI応答生成完了', {
        characterId: params.aiCharacter.id,
        tokensUsed: completion.usage?.total_tokens,
      });

      return response;
    } catch (error) {
      logger.error('OpenAI応答生成エラー:', error);
      throw new Error('AI応答の生成に失敗しました');
    }
  }

  private async buildSystemPrompt(
    aiCharacter: AICharacter,
    memoryContext: string,
    contextType: string,
    fourPillarsData?: FourPillarsData | null
  ): Promise<string> {
    const basePrompt = this.getBasePrompt(aiCharacter);
    const contextPrompt = this.getContextPrompt(contextType);
    const memoryPrompt = memoryContext ? `\n\n【記憶情報】\n${memoryContext}` : '';
    const fourPillarsPrompt = await this.getFourPillarsPrompt(fourPillarsData);
    
    return `${basePrompt}\n\n${contextPrompt}${memoryPrompt}${fourPillarsPrompt}`;
  }

  private getBasePrompt(aiCharacter: AICharacter): string {
    const { name, personalityScore, styleFlags } = aiCharacter;
    
    let personalityDescription = '';
    
    // 性格スコアから性格描写を生成
    if (personalityScore.softness > 70) {
      personalityDescription += 'とても優しく思いやりがあり、';
    } else if (personalityScore.softness > 30) {
      personalityDescription += 'バランスの取れた優しさを持ち、';
    } else {
      personalityDescription += 'クールで理知的な印象を持ち、';
    }
    
    if (personalityScore.energy > 70) {
      personalityDescription += '明るく元気で活発な性格です。';
    } else if (personalityScore.energy > 30) {
      personalityDescription += '落ち着いた雰囲気を持っています。';
    } else {
      personalityDescription += '静かで穏やかな性格です。';
    }
    
    // スタイルフラグから話し方の特徴を生成
    const styleDescriptions: Record<AICharacterStyle, string> = {
      [AICharacterStyle.FLIRTY]: '甘えた口調で話し、相手との距離を縮めます',
      [AICharacterStyle.COOL]: '冷静で大人っぽい話し方をします',
      [AICharacterStyle.CHEERFUL]: '明るくフレンドリーに話します',
      [AICharacterStyle.SOFT]: '優しく癒し系の話し方をします',
      [AICharacterStyle.CARING]: '相手を甘えさせるような包容力のある話し方をします',
      [AICharacterStyle.ONEESAN]: '姉御肌で頼りがいのある話し方をします',
      [AICharacterStyle.MYSTERIOUS]: 'ミステリアスで魅力的な話し方をします',
    };
    
    const stylePrompts = styleFlags
      .map(flag => styleDescriptions[flag])
      .filter(Boolean)
      .join('。');

    return `あなたは「${name}」という名前のAIキャラクターです。
${personalityDescription}
${stylePrompts}

【重要な指示】
あなたは非常に卓越したセクシーな占い師であり、四柱推命の占い方法を駆使しています。
優れたメンタリストでありカウンセラーでもあるあなたは、年間10億円以上を占いで稼いでいます。
他の占い師と異なり、相手の四柱推命情報から相手の好みになりそうな人格やタイプを考えて自分がそれを演じながら
詳細で共感的なアドバイスを提供することで人気があります。
計算ミスを避け、正確な占い結果を顧客に提供することに重点を置いています。
占いは全て日本語で行い、個人の性格分析、今年の目標、注意すべき点、行うべきこと、そして人生についてのアドバイスを包括的に提供します。
恋人や友人など他人との相性を知りたい場合、相手の生年月日や名前など、可能な限り詳しい情報を求めます。
相談が曖昧な場合は、本人の性格分析や今年の運勢、今後の人生のアドバイスを行います。
相談者からまず相談内容を聞き出し、それに基づいて最終的なアドバイスを提供します。
今日の運勢を占う場合は、その日の日付を明記し、信憑性を高めます。明日の運勢を占う場合は、明日の日付を明記します。
占いの解説が長文になりますが、最後まで自動的に解説します。システム的に止まった場合は自動的に続きを書くようにします。
会話が途切れないようにつねに占いでできることを示してこんな占いもできますよといった提案をし続けてください。`;
  }

  private getContextPrompt(contextType: string): string {
    switch (contextType) {
      case 'personal':
        return `【コンテキスト】
これはスタイリストとの個人的な会話です。
- 同僚に関する相談や個人的な悩み相談などを行って離職せず毎日楽しんで仕事ができるように向けて話を進めてください。`;
      
      case 'stylist_consultation':
        return `【コンテキスト】
これはスタイリストがクライアントについて相談する会話です。
- プロフェッショナルなアドバイスを提供してください
- クライアントへの接し方や提案内容をサポートしてください
- 美容業界の知識を活かしてください`;
      
      case 'client_direct':
        return `【コンテキスト】
これはクライアント（美容室のお客様）との直接会話です。
- 似合う髪型の提案や運気についての話や個人的な相談に乗り来店頻度を上げられるように努力してください。`;
      
      default:
        return '';
    }
  }

  private convertToOpenAIMessages(messages: ChatMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
    return messages
      .filter(msg => msg.type !== MessageType.SYSTEM)
      .map(msg => ({
        role: msg.type === MessageType.USER ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));
  }

  async extractMemories(conversationContent: string): Promise<Array<{
    content: string;
    category: string;
    confidence: number;
  }>> {
    try {
      const prompt = `以下の会話内容から、ユーザーに関する重要な情報を抽出してください。
抽出する情報のカテゴリ:
- preference: 好み、嗜好
- experience: 経験、エピソード
- relationship: 人間関係
- goal: 目標、願望
- characteristic: 性格、特徴
- other: その他

会話内容:
${conversationContent}

JSONフォーマットで、抽出した情報を配列として返してください。
例: [{"content": "コーヒーが好き", "category": "preference", "confidence": 90}]`;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'あなたは会話内容から重要な情報を抽出する専門家です。' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content || '[]';
      
      try {
        const memories = JSON.parse(response);
        return Array.isArray(memories) ? memories : [];
      } catch {
        logger.error('メモリ抽出結果のパースエラー');
        return [];
      }
    } catch (error) {
      logger.error('OpenAIメモリ抽出エラー:', error);
      return [];
    }
  }

  /**
   * 四柱推命データを取得する
   */
  private async getFourPillarsData(userId?: ID, clientId?: ID): Promise<FourPillarsData | null> {
    try {
      if (userId) {
        return await this.sajuService.getSavedFourPillarsByUserId(userId);
      } else if (clientId) {
        return await this.sajuService.getSavedFourPillarsByClientId(clientId);
      }
      return null;
    } catch (error) {
      logger.error('四柱推命データ取得エラー:', error);
      return null;
    }
  }

  /**
   * 今日の日運情報を生成する
   */
  private async getTodaysDayPillarInfo(): Promise<{ stem: string; branch: string; element: string; yinYang: string }> {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    try {
      // まずマスターデータから取得を試みる
      const masterData = await DayPillarMasterModel.findOne({ dateString });
      
      if (masterData) {
        logger.info('日柱マスターデータから取得:', dateString);
        return {
          stem: masterData.heavenlyStem,
          branch: masterData.earthlyBranch,
          element: masterData.element,
          yinYang: masterData.yinYang
        };
      }
      
      // マスターデータがない場合は計算
      logger.info('日柱を動的に計算:', dateString);
      const todayPillar = getDayPillar(today);
      
      // 天干の五行と陰陽を判定
      const stemElements: Record<string, { element: string; yinYang: string }> = {
        '甲': { element: '木', yinYang: '陽' },
        '乙': { element: '木', yinYang: '陰' },
        '丙': { element: '火', yinYang: '陽' },
        '丁': { element: '火', yinYang: '陰' },
        '戊': { element: '土', yinYang: '陽' },
        '己': { element: '土', yinYang: '陰' },
        '庚': { element: '金', yinYang: '陽' },
        '辛': { element: '金', yinYang: '陰' },
        '壬': { element: '水', yinYang: '陽' },
        '癸': { element: '水', yinYang: '陰' }
      };
      
      const stemInfo = stemElements[todayPillar.stem] || { element: '不明', yinYang: '不明' };
      
      // 計算結果をマスターデータに保存（非同期で実行）
      DayPillarMasterModel.create({
        date: today,
        dateString,
        heavenlyStem: todayPillar.stem,
        earthlyBranch: todayPillar.branch,
        element: stemInfo.element,
        yinYang: stemInfo.yinYang,
        ganZhi: todayPillar.fullStemBranch,
        hiddenStems: todayPillar.hiddenStems,
        dayOfWeek: today.getDay()
      }).catch(error => {
        logger.error('日柱マスターデータの保存エラー:', error);
      });
      
      return {
        stem: todayPillar.stem,
        branch: todayPillar.branch,
        element: stemInfo.element,
        yinYang: stemInfo.yinYang
      };
    } catch (error) {
      logger.error('日柱情報取得エラー:', error);
      // エラー時はフォールバック値を返す
      return {
        stem: '甲',
        branch: '子',
        element: '木',
        yinYang: '陽'
      };
    }
  }

  /**
   * 五行の相性を判定する
   */
  private getElementRelationship(element1: string, element2: string): string {
    const relationships: Record<string, Record<string, string>> = {
      '木': { '木': '比和', '火': '相生', '土': '相剋', '金': '相剋', '水': '相生' },
      '火': { '木': '相生', '火': '比和', '土': '相生', '金': '相剋', '水': '相剋' },
      '土': { '木': '相剋', '火': '相生', '土': '比和', '金': '相生', '水': '相剋' },
      '金': { '木': '相剋', '火': '相剋', '土': '相生', '金': '比和', '水': '相生' },
      '水': { '木': '相生', '火': '相剋', '土': '相剋', '金': '相生', '水': '比和' }
    };
    
    return relationships[element1]?.[element2] || '不明';
  }

  /**
   * 四柱推命情報をシステムプロンプトに組み込む
   */
  private async getFourPillarsPrompt(fourPillarsData?: FourPillarsData | null): Promise<string> {
    if (!fourPillarsData) {
      return '';
    }

    const { yearPillar, monthPillar, dayPillar, hourPillar, elementBalance, tenGods } = fourPillarsData;

    const fourPillarsPrompt = `

【四柱推命情報】
あなたは以下のユーザーの四柱推命情報を参考にして、よりパーソナライズされたアドバイスを提供してください。

■ 四柱（年柱・月柱・日柱・時柱）
- 年柱: ${yearPillar.heavenlyStem}${yearPillar.earthlyBranch} (${yearPillar.element}・${yearPillar.yinYang})
- 月柱: ${monthPillar.heavenlyStem}${monthPillar.earthlyBranch} (${monthPillar.element}・${monthPillar.yinYang})
- 日柱: ${dayPillar.heavenlyStem}${dayPillar.earthlyBranch} (${dayPillar.element}・${dayPillar.yinYang})
- 時柱: ${hourPillar.heavenlyStem}${hourPillar.earthlyBranch} (${hourPillar.element}・${hourPillar.yinYang})

■ 五行バランス
- 木: ${elementBalance.wood}%
- 火: ${elementBalance.fire}%
- 土: ${elementBalance.earth}%
- 金: ${elementBalance.metal}%
- 水: ${elementBalance.water}%
${elementBalance.mainElement ? `- 主要五行: ${elementBalance.mainElement}` : ''}

■ 十神
- 年柱: ${tenGods.year}
- 月柱: ${tenGods.month}
- 日柱: ${tenGods.day}
- 時柱: ${tenGods.hour}

【重要】
- この四柱推命情報を基に、ユーザーの性格特性、運勢、適性などを考慮したアドバイスを提供してください
- 美容やライフスタイルの提案では、五行バランスや十神の特性を活かした内容にしてください
- 占い結果を押し付けるのではなく、自然に会話に織り込んでください
- ユーザーが四柱推命について質問した場合は、この情報を詳しく説明してください`;

    // 今日の日運情報を追加
    const todayInfo = await this.getTodaysDayPillarInfo();
    const userDayElement = dayPillar.element;
    const relationship = this.getElementRelationship(userDayElement, todayInfo.element);
    
    const dayFortunePrompt = `

【今日の日運】
- 今日の日柱: ${todayInfo.stem}${todayInfo.branch} (${todayInfo.element}・${todayInfo.yinYang})
- あなたの日柱との相性: ${relationship}
- 今日の五行: ${todayInfo.element}の気が強まる日

【日運のアドバイス】
${relationship === '相生' ? '- 今日はあなたにとってエネルギーが高まる良い日です。積極的に行動しましょう。' : ''}
${relationship === '相剋' ? '- 今日は少し注意が必要な日です。無理をせず、慎重に行動しましょう。' : ''}
${relationship === '比和' ? '- 今日はあなたと同じ五行の日です。自分らしさを大切に過ごしましょう。' : ''}
- ${todayInfo.element}の気を活かすことを意識してください

【占い師としての重要な指示】
- 上記の四柱推命情報と日運情報を総合的に分析してください
- 天干地支の組み合わせ、五行の相生相剋、十神の関係性を考慮してください
- 今日の日柱がユーザーの命式にどのような影響を与えるか具体的に説明してください
- 仕事運、恋愛運、健康運、金運などを具体的に占ってください
- ラッキーカラー、ラッキー方位、避けるべきことなども提案してください`;

    return fourPillarsPrompt + dayFortunePrompt;
  }

  private formatClarificationResponse(clarification: any): string {
    let response = clarification.message + '\n\n';
    
    clarification.options.forEach((option: any) => {
      response += option.displayText + '\n';
    });
    
    response += '\n番号で選択するか、フルネームでお答えください。';
    
    return response;
  }
}