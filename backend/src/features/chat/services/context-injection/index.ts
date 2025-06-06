import { logger } from '../../../../common/utils/logger';
import { PersonProvider } from './providers/person.provider';
import { IntentParser } from './parsers/intent.parser';

export interface ContextProvider {
  name: string;
  patterns: string[];
  provide(query: string, context: ProviderContext): Promise<ContextData | ClarificationResponse>;
}

export interface ProviderContext {
  organizationId: string;
  userId: string;
  userRole: string;
}

export interface ContextData {
  type: 'data';
  content: string;
  metadata?: Record<string, any>;
}

export interface ClarificationResponse {
  type: 'clarification_needed';
  message: string;
  options: Array<{
    id: string;
    name: string;
    type: string;
    displayText: string;
    metadata?: Record<string, any>;
  }>;
}

export class ContextInjectionManager {
  private providers: Map<string, ContextProvider>;
  private intentParser: IntentParser;

  constructor() {
    this.providers = new Map();
    this.intentParser = new IntentParser();
    
    // プロバイダーの登録
    this.registerProvider(new PersonProvider());
  }

  /**
   * プロバイダーを登録
   */
  private registerProvider(provider: ContextProvider): void {
    this.providers.set(provider.name, provider);
    logger.info('Context provider registered', { name: provider.name });
  }

  /**
   * メッセージからコンテキストを注入
   */
  async injectContext(
    message: string,
    context: ProviderContext
  ): Promise<{
    enhancedMessage: string;
    injectedContexts: Array<ContextData | ClarificationResponse>;
  }> {
    try {
      logger.debug('Processing message for context injection', { message });

      // 意図解析
      const intents = this.intentParser.parse(message);
      if (intents.length === 0) {
        return {
          enhancedMessage: message,
          injectedContexts: [],
        };
      }

      logger.debug('Intents detected', { intents });

      const injectedContexts: Array<ContextData | ClarificationResponse> = [];
      let enhancedMessage = message;

      // 各意図に対してプロバイダーを実行
      for (const intent of intents) {
        const provider = this.findProviderForIntent(intent);
        if (!provider) {
          logger.debug('No provider found for intent', { intent });
          continue;
        }

        try {
          const result = await provider.provide(intent.query, context);
          injectedContexts.push(result);

          // データの場合はメッセージに追加
          if (result.type === 'data') {
            enhancedMessage += `\n\n【${intent.query}の情報】\n${result.content}`;
          }
        } catch (error) {
          logger.error('Provider error', { 
            provider: provider.name, 
            intent, 
            error 
          });
        }
      }

      return {
        enhancedMessage,
        injectedContexts,
      };
    } catch (error) {
      logger.error('Context injection error', { error });
      return {
        enhancedMessage: message,
        injectedContexts: [],
      };
    }
  }

  /**
   * 意図に対応するプロバイダーを検索
   */
  private findProviderForIntent(intent: { type: string; query: string }): ContextProvider | null {
    // 現在は人物プロバイダーのみ対応
    if (intent.type === 'person') {
      return this.providers.get('person') || null;
    }
    return null;
  }

  /**
   * 確認応答を処理
   */
  async handleClarification(
    providerId: string,
    selection: string,
    context: ProviderContext
  ): Promise<ContextData | null> {
    const provider = this.providers.get(providerId);
    if (!provider || !('handleClarification' in provider)) {
      return null;
    }

    // PersonProviderの場合の処理
    if (provider instanceof PersonProvider) {
      return provider.handleClarification(selection, context);
    }

    return null;
  }
}

// シングルトンインスタンス
export const contextInjectionManager = new ContextInjectionManager();