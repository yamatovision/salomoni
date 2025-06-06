import { logger } from '../../../../../common/utils/logger';
import { 
  ContextProvider, 
  ProviderContext, 
  ContextData, 
  ClarificationResponse 
} from '../index';
import { UserModel } from '../../../../users/models/user.model';
import { ClientModel } from '../../../../clients/models/client.model';
import { SajuService } from '../../../../saju/services/saju.service';
import { UserRole } from '../../../../../types';

interface PersonSearchResult {
  id: string;
  name: string;
  type: 'client' | 'stylist';
  organizationId: string;
  lastVisitDate?: Date;
  birthDate?: Date;
  fourPillarsDataId?: string;
}

export class PersonProvider implements ContextProvider {
  name = 'person';
  patterns = ['について', 'の相談', 'について教えて', 'の情報', 'の四柱推命'];
  
  private sajuService: SajuService;

  constructor() {
    this.sajuService = new SajuService();
  }

  /**
   * 人物情報を提供
   */
  async provide(
    query: string, 
    context: ProviderContext
  ): Promise<ContextData | ClarificationResponse> {
    try {
      logger.info('PersonProvider: Processing query', { query, context });

      // 名前をクリーン化（敬称を除去）
      const cleanName = this.cleanName(query);

      // 人物を検索
      const searchResults = await this.searchPersons(cleanName, context);

      if (searchResults.length === 0) {
        return {
          type: 'data',
          content: `「${query}」という方は見つかりませんでした。`,
        };
      }

      // 1件のみの場合は直接データを返す
      if (searchResults.length === 1 && searchResults[0]) {
        return this.getPersonData(searchResults[0], context);
      }

      // 複数件の場合は確認が必要
      return this.createClarificationResponse(query, searchResults);

    } catch (error) {
      logger.error('PersonProvider error', { error, query });
      return {
        type: 'data',
        content: '人物情報の取得中にエラーが発生しました。',
      };
    }
  }

  /**
   * 人物を検索
   */
  private async searchPersons(
    name: string,
    context: ProviderContext
  ): Promise<PersonSearchResult[]> {
    const results: PersonSearchResult[] = [];

    try {
      // クライアントを検索
      const clients = await ClientModel.find({
        organizationId: context.organizationId,
        name: new RegExp(name, 'i'),
      }).limit(10);

      for (const client of clients) {
        results.push({
          id: client._id.toString(),
          name: client.name,
          type: 'client',
          organizationId: client.organizationId,
          lastVisitDate: client.lastVisitDate,
          birthDate: client.birthDate,
          fourPillarsDataId: client.fourPillarsDataId?.toString(),
        });
      }

      // スタイリストを検索
      const stylists = await UserModel.find({
        organizationId: context.organizationId,
        name: new RegExp(name, 'i'),
        role: UserRole.USER, // スタイリストはUSERロール
      }).limit(10);

      for (const stylist of stylists) {
        results.push({
          id: (stylist._id as any).toString(),
          name: stylist.name || stylist.email,
          type: 'stylist',
          organizationId: stylist.organizationId || '',
          birthDate: stylist.birthDate,
        });
      }

      // 最近の接触順でソート（クライアントの場合）
      results.sort((a, b) => {
        if (a.type === 'client' && b.type === 'client') {
          const aDate = a.lastVisitDate?.getTime() || 0;
          const bDate = b.lastVisitDate?.getTime() || 0;
          return bDate - aDate;
        }
        // クライアントを優先
        if (a.type === 'client' && b.type !== 'client') return -1;
        if (a.type !== 'client' && b.type === 'client') return 1;
        return 0;
      });

    } catch (error) {
      logger.error('Search persons error', { error, name });
    }

    return results;
  }

  /**
   * 人物データを取得
   */
  private async getPersonData(
    person: PersonSearchResult,
    _context: ProviderContext
  ): Promise<ContextData> {
    try {
      let fourPillarsInfo = '';

      // 四柱推命データを取得
      if (person.type === 'client' && person.fourPillarsDataId) {
        // クライアントの四柱推命データ
        const fourPillarsData = await this.sajuService.getFourPillarsData(person.fourPillarsDataId);
        if (fourPillarsData) {
          fourPillarsInfo = this.formatFourPillarsData(fourPillarsData);
        }
      } else if (person.type === 'stylist' && person.birthDate) {
        // スタイリストの四柱推命データ
        const fourPillarsData = await this.sajuService.getUserFourPillars(person.id);
        if (fourPillarsData) {
          fourPillarsInfo = this.formatFourPillarsData(fourPillarsData);
        }
      }

      // 基本情報
      let content = `【${person.name}さんの情報】\n`;
      content += `種別: ${person.type === 'client' ? 'クライアント' : 'スタイリスト'}\n`;
      
      if (person.birthDate) {
        content += `生年月日: ${person.birthDate.toLocaleDateString('ja-JP')}\n`;
      }

      if (person.type === 'client' && person.lastVisitDate) {
        content += `最終来店日: ${person.lastVisitDate.toLocaleDateString('ja-JP')}\n`;
      }

      if (fourPillarsInfo) {
        content += `\n${fourPillarsInfo}`;
      }

      return {
        type: 'data',
        content,
        metadata: {
          personId: person.id,
          personType: person.type,
        },
      };

    } catch (error) {
      logger.error('Get person data error', { error, person });
      return {
        type: 'data',
        content: '人物情報の詳細取得中にエラーが発生しました。',
      };
    }
  }

  /**
   * 確認応答を作成
   */
  private createClarificationResponse(
    query: string,
    results: PersonSearchResult[]
  ): ClarificationResponse {
    const options = results.slice(0, 5).map((person, index) => {
      let displayText = `${index + 1}. ${person.name}さん（${person.type === 'client' ? 'クライアント' : 'スタイリスト'}）`;
      
      if (person.type === 'client' && person.lastVisitDate) {
        const daysAgo = Math.floor((Date.now() - person.lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo === 0) {
          displayText += ' - 本日来店';
        } else if (daysAgo < 7) {
          displayText += ` - ${daysAgo}日前来店`;
        } else {
          displayText += ` - ${Math.floor(daysAgo / 7)}週間前来店`;
        }
      }

      return {
        id: person.id,
        name: person.name,
        type: person.type,
        displayText,
        metadata: { personId: person.id },
      };
    });

    return {
      type: 'clarification_needed',
      message: `複数の${query}さんがいらっしゃいます。どちらの方でしょうか？`,
      options,
    };
  }

  /**
   * 確認応答を処理
   */
  async handleClarification(
    selection: string,
    context: ProviderContext
  ): Promise<ContextData | null> {
    try {
      // 番号での選択
      const numberMatch = selection.match(/^(\d+)$/);
      if (numberMatch) {
        // const index = parseInt(numberMatch[1]) - 1;
        // キャッシュから取得（実装簡略化のため、今回は省略）
      }

      // ID直接指定
      if (selection.match(/^[0-9a-fA-F]{24}$/)) {
        // MongoDBのObjectID形式
        const person = await this.getPersonById(selection, context);
        if (person) {
          return this.getPersonData(person, context);
        }
      }

      // フルネームでの再検索
      const results = await this.searchPersons(selection, context);
      if (results.length === 1 && results[0]) {
        return this.getPersonData(results[0], context);
      }

      return null;
    } catch (error) {
      logger.error('Handle clarification error', { error, selection });
      return null;
    }
  }

  /**
   * IDで人物を取得
   */
  private async getPersonById(
    id: string,
    context: ProviderContext
  ): Promise<PersonSearchResult | null> {
    try {
      // クライアントを検索
      const client = await ClientModel.findOne({
        _id: id,
        organizationId: context.organizationId,
      });

      if (client) {
        return {
          id: client._id.toString(),
          name: client.name,
          type: 'client',
          organizationId: client.organizationId,
          lastVisitDate: client.lastVisitDate,
          birthDate: client.birthDate,
          fourPillarsDataId: client.fourPillarsDataId?.toString(),
        };
      }

      // スタイリストを検索
      const stylist = await UserModel.findOne({
        _id: id,
        organizationId: context.organizationId,
        role: UserRole.USER,
      });

      if (stylist) {
        return {
          id: (stylist._id as any).toString(),
          name: stylist.name || stylist.email,
          type: 'stylist',
          organizationId: stylist.organizationId || '',
          birthDate: stylist.birthDate,
        };
      }

      return null;
    } catch (error) {
      logger.error('Get person by ID error', { error, id });
      return null;
    }
  }

  /**
   * 四柱推命データをフォーマット
   */
  private formatFourPillarsData(data: any): string {
    let content = '【四柱推命情報】\n';

    // 四柱
    if (data.fourPillars) {
      content += '\n■ 四柱\n';
      // 異なるデータ形式に対応
      const year = data.fourPillars.year || data.fourPillars.yearPillar;
      const month = data.fourPillars.month || data.fourPillars.monthPillar;
      const day = data.fourPillars.day || data.fourPillars.dayPillar;
      const hour = data.fourPillars.hour || data.fourPillars.hourPillar;
      
      if (year) {
        content += `年柱: ${year.heavenlyStem}${year.earthlyBranch}\n`;
      }
      if (month) {
        content += `月柱: ${month.heavenlyStem}${month.earthlyBranch}\n`;
      }
      if (day) {
        content += `日柱: ${day.heavenlyStem}${day.earthlyBranch}\n`;
      }
      if (hour) {
        content += `時柱: ${hour.heavenlyStem}${hour.earthlyBranch}\n`;
      }
    }

    // 五行バランス
    const elements = data.elements || data.elementBalance;
    if (elements) {
      content += '\n■ 五行バランス\n';
      content += `木: ${elements.wood}, 火: ${elements.fire}, 土: ${elements.earth}, `;
      content += `金: ${elements.metal}, 水: ${elements.water}\n`;
    }

    // 十神
    if (data.tenGods && data.tenGods.length > 0) {
      content += '\n■ 十神\n';
      content += data.tenGods.join(', ') + '\n';
    }

    // 格局
    if (data.pattern) {
      content += `\n■ 格局: ${data.pattern}\n`;
    }

    return content;
  }

  /**
   * 名前から敬称を除去
   */
  private cleanName(name: string): string {
    return name.replace(/(?:さん|様|氏|くん|ちゃん)$/, '').trim();
  }
}