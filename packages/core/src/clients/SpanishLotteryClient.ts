import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import axios from 'axios';

import {LottoType} from '@lotto/shared';
import type {SpanishLotteryDrawDto} from '../models';
import type {LoggerService} from '../services/logger/loggerService';
import {
  parseBonolotoDescription,
  parseElGordoDescription,
  parseLaPrimitivaDescription,
  parseRSSDate,
} from './helpers/spanishLottoTransformers';

export const SPANISH_LOTTERY_BASE_URL = 'https://www.loteriasyapuestas.es';

export type SpanishLotteryGameSlug = 'la-primitiva' | 'bonoloto' | 'gordo-primitiva';

interface RSSItem {
  title: string;
  pubDate: string;
  description: string;
  link: string;
}

@injectable({scope: BindingScope.SINGLETON})
export class SpanishLotteryClient {
  constructor(
    @inject('services.LoggerService')
    protected loggerService: LoggerService,
  ) {}

  /**
   * Fetch La Primitiva draws from RSS feed
   */
  async fetchLaPrimitivaDraws(): Promise<SpanishLotteryDrawDto[]> {
    const items = await this.fetchRSS('la-primitiva');
    return this.parsePrimitivaItems(items);
  }

  /**
   * Fetch Bonoloto draws from RSS feed
   */
  async fetchBonolotoDraws(): Promise<SpanishLotteryDrawDto[]> {
    const items = await this.fetchRSS('bonoloto');
    return this.parseBonolotoItems(items);
  }

  /**
   * Fetch El Gordo draws from RSS feed
   */
  async fetchElGordoDraws(): Promise<SpanishLotteryDrawDto[]> {
    const items = await this.fetchRSS('gordo-primitiva');
    return this.parseElGordoItems(items);
  }

  /**
   * Fetch raw RSS data from Spanish lottery website
   */
  private async fetchRSS(game: SpanishLotteryGameSlug): Promise<RSSItem[]> {
    const url = `${SPANISH_LOTTERY_BASE_URL}/es/${game}/resultados/.formatoRSS`;

    try {
      const response = await axios.get<string>(url, {
        responseType: 'text',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LottoLens/1.0)',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
      });
      return this.parseRSSXML(response.data);
    } catch (error) {
      this.loggerService.logError({
        message: `Failed to fetch Spanish lottery RSS for ${game}`,
        errorConstructor: HttpErrors.BadRequest,
      });
    }
  }

  /**
   * Parse RSS XML to extract items
   */
  private parseRSSXML(xml: string): RSSItem[] {
    const items: RSSItem[] = [];

    // Extract all <item> blocks
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g);
    if (!itemMatches) return items;

    for (const itemXml of itemMatches) {
      const title = this.extractTag(itemXml, 'title');
      const pubDate = this.extractTag(itemXml, 'pubDate');
      const description = this.extractTag(itemXml, 'description');
      const link = this.extractTag(itemXml, 'link');

      if (title && pubDate && description) {
        items.push({title, pubDate, description, link: link || ''});
      }
    }

    return items;
  }

  /**
   * Extract content from XML tag
   */
  private extractTag(xml: string, tag: string): string | null {
    const match = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`));
    if (match) return match[1].trim();

    // Try without CDATA
    const simpleMatch = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
    return simpleMatch ? simpleMatch[1].trim() : null;
  }

  /**
   * Parse La Primitiva / Bonoloto RSS items
   */
  private parsePrimitivaItems(items: RSSItem[]): SpanishLotteryDrawDto[] {
    return this.parseItems(items, parseLaPrimitivaDescription, 6, LottoType.ES_LA_PRIMITIVA);
  }

  private parseBonolotoItems(items: RSSItem[]): SpanishLotteryDrawDto[] {
    return this.parseItems(items, parseBonolotoDescription, 6, LottoType.ES_BONOLOTO);
  }

  /**
   * Parse El Gordo RSS items
   */
  private parseElGordoItems(items: RSSItem[]): SpanishLotteryDrawDto[] {
    return this.parseItems(items, parseElGordoDescription, 5, LottoType.ES_EL_GORDO);
  }

  /**
   * Generic parser for Spanish lottery RSS items
   */
  private parseItems(
    items: RSSItem[],
    parseFn: (description: string) => {
      mainNumbers: number[];
      complementario?: number;
      numeroClave?: number;
      reintegro?: number;
    },
    expectedCount: number,
    lotteryName: string,
  ): SpanishLotteryDrawDto[] {
    const results: SpanishLotteryDrawDto[] = [];

    for (const item of items) {
      const parsed = parseFn(item.description);

      if (parsed.mainNumbers.length !== expectedCount) {
        this.loggerService.log(`Skipping invalid ${lotteryName} draw: ${item.title}`);
        continue;
      }

      results.push({
        drawDate: parseRSSDate(item.pubDate),
        mainNumbers: parsed.mainNumbers,
        complementario: parsed.complementario ?? parsed.numeroClave,
        reintegro: parsed.reintegro,
      });
    }

    return results;
  }
}
