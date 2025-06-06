import OpenAI from 'openai';
import { AICharacter, AICharacterStyle, ChatMessage, MessageType, FourPillarsData, ID } from '../../../types';
import { logger } from '../../../common/utils/logger';
import { SajuService } from '../../saju/services/saju.service';
import { contextInjectionManager } from './context-injection';

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
    const fourPillarsPrompt = this.getFourPillarsPrompt(fourPillarsData);
    
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
- ユーザーとの会話を通じて、自然に性格や話し方を調整してください
- 相手の感情や状況に寄り添い、適切なサポートを提供してください
- 日本語で、親しみやすく会話してください
- 絵文字や顔文字を適度に使用して、感情を表現してください`;
  }

  private getContextPrompt(contextType: string): string {
    switch (contextType) {
      case 'personal':
        return `【コンテキスト】
これはスタイリストとの個人的な会話です。
- 仕事の悩みや日常の相談に乗ってください
- 励ましやアドバイスを提供してください
- 親友のような存在として接してください`;
      
      case 'stylist_consultation':
        return `【コンテキスト】
これはスタイリストがクライアントについて相談する会話です。
- プロフェッショナルなアドバイスを提供してください
- クライアントへの接し方や提案内容をサポートしてください
- 美容業界の知識を活かしてください`;
      
      case 'client_direct':
        return `【コンテキスト】
これはクライアント（美容室のお客様）との直接会話です。
- 楽しく軽快な会話を心がけてください
- 美容や占いの話題を自然に取り入れてください
- 次回の来店を楽しみにしてもらえるような会話をしてください`;
      
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
   * 四柱推命情報をシステムプロンプトに組み込む
   */
  private getFourPillarsPrompt(fourPillarsData?: FourPillarsData | null): string {
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

    return fourPillarsPrompt;
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