import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import axios from 'axios';
import * as cheerio from 'cheerio';

import type {IrishLottoDrawDto} from '../models';
import type {LoggerService} from '../services/logger/loggerService';
import {LottoType} from '@lotto/shared';

const IRISH_LOTTERY_BASE_URL = 'https://www.lottery.ie';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

/**
 * Types for the lottery.ie __NEXT_DATA__ structure
 */
interface LotteryIEGrid {
  standard: number[][];
  additional: number[][];
}

interface LotteryIEGameData {
  gameLogo: string;
  jackpotAmount: string;
  drawDates?: string[]; // Only present in standard game
  grids: LotteryIEGrid[];
  prizes: Array<{
    match: string;
    prizeType: string;
    numberOfWinners: number;
    prize: string;
  }>;
  prizeMessage: string;
  gameTitle: string;
}

interface LotteryIEDrawItem {
  standard: LotteryIEGameData;
  addonGames: LotteryIEGameData[];
  raffle: {
    message: string;
    id: string;
  };
}

interface LotteryIENextData {
  props: {
    pageProps: {
      list: LotteryIEDrawItem[];
    };
  };
}

/**
 * Irish lottery game types
 */
type IrishLottoType =
  | LottoType.IE_LOTTO
  | LottoType.IE_LOTTO_PLUS_1
  | LottoType.IE_LOTTO_PLUS_2
  | LottoType.IE_DAILY_MILLION
  | LottoType.IE_DAILY_MILLION_PLUS;

type EndpointKey = 'irishLotto' | 'dailyMillion';
type GameSource = 'standard' | number;

/**
 * Endpoint configuration
 */
interface IrishLotteryEndpoint {
  urlPath: string;
  maxNumber: number;
  logPrefix: LottoType;
  games: Partial<Record<IrishLottoType, GameSource>>;
}

const IRISH_LOTTERY_ENDPOINTS: Record<EndpointKey, IrishLotteryEndpoint> = {
  irishLotto: {
    urlPath: '/results/lotto/history',
    maxNumber: 47,
    logPrefix: LottoType.IE_LOTTO,
    games: {
      [LottoType.IE_LOTTO]: 'standard',
      [LottoType.IE_LOTTO_PLUS_1]: 0,
      [LottoType.IE_LOTTO_PLUS_2]: 1,
    },
  },
  dailyMillion: {
    urlPath: '/results/daily-million/history',
    maxNumber: 39,
    logPrefix: LottoType.IE_DAILY_MILLION,
    games: {
      [LottoType.IE_DAILY_MILLION]: 'standard',
      [LottoType.IE_DAILY_MILLION_PLUS]: 0,
    },
  },
};

const LOTTO_TYPE_TO_ENDPOINT: Record<IrishLottoType, EndpointKey> = {
  [LottoType.IE_LOTTO]: 'irishLotto',
  [LottoType.IE_LOTTO_PLUS_1]: 'irishLotto',
  [LottoType.IE_LOTTO_PLUS_2]: 'irishLotto',
  [LottoType.IE_DAILY_MILLION]: 'dailyMillion',
  [LottoType.IE_DAILY_MILLION_PLUS]: 'dailyMillion',
};

interface CacheEntry {
  data: LotteryIEDrawItem[];
  timestamp: number;
}

@injectable({scope: BindingScope.SINGLETON})
export class IrishLotteryClient {
  private cache = new Map<EndpointKey, CacheEntry>();
  private readonly CACHE_TTL_MS = 60000; // 1 minute

  constructor(
    @inject('services.LoggerService')
    protected loggerService: LoggerService,
  ) {}

  /**
   * Fetch draws for any Irish lottery type
   */
  async fetchDraws(lottoType: IrishLottoType): Promise<IrishLottoDrawDto[]> {
    const endpointKey = LOTTO_TYPE_TO_ENDPOINT[lottoType];
    const endpoint = IRISH_LOTTERY_ENDPOINTS[endpointKey];
    const drawList = await this.fetchDrawListForEndpoint(endpointKey);
    const source = endpoint.games[lottoType];

    if (source === undefined) {
      this.loggerService.log(`[${lottoType}] Unknown game source, returning empty`);
      return [];
    }

    return this.parseDrawList(drawList, source, lottoType, endpoint.maxNumber);
  }

  // Convenience methods for backward compatibility
  async fetchIrishLottoDraws(): Promise<IrishLottoDrawDto[]> {
    return this.fetchDraws(LottoType.IE_LOTTO);
  }

  async fetchIrishLottoPlus1Draws(): Promise<IrishLottoDrawDto[]> {
    return this.fetchDraws(LottoType.IE_LOTTO_PLUS_1);
  }

  async fetchIrishLottoPlus2Draws(): Promise<IrishLottoDrawDto[]> {
    return this.fetchDraws(LottoType.IE_LOTTO_PLUS_2);
  }

  async fetchDailyMillionDraws(): Promise<IrishLottoDrawDto[]> {
    return this.fetchDraws(LottoType.IE_DAILY_MILLION);
  }

  async fetchDailyMillionPlusDraws(): Promise<IrishLottoDrawDto[]> {
    return this.fetchDraws(LottoType.IE_DAILY_MILLION_PLUS);
  }

  /**
   * Fetch draw list from lottery.ie with caching
   */
  private async fetchDrawListForEndpoint(endpointKey: EndpointKey): Promise<LotteryIEDrawItem[]> {
    const endpoint = IRISH_LOTTERY_ENDPOINTS[endpointKey];
    const now = Date.now();
    const cached = this.cache.get(endpointKey);

    // Return cached data if still valid
    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    const url = `${IRISH_LOTTERY_BASE_URL}${endpoint.urlPath}`;
    this.loggerService.log(`[${endpoint.logPrefix}] Fetching from ${url}...`);

    try {
      const response = await axios.get<string>(url, {
        responseType: 'text',
        headers: DEFAULT_HEADERS,
        timeout: 30000,
      });

      const drawList = this.extractDrawListFromHtml(response.data);
      this.loggerService.log(`[${endpoint.logPrefix}] Found ${drawList.length} draws in page data`);

      // Cache the result
      this.cache.set(endpointKey, {data: drawList, timestamp: now});
      return drawList;
    } catch (error) {
      this.loggerService.logError({
        message: `[${endpoint.logPrefix}] Failed to fetch draws`,
        errorConstructor: HttpErrors.BadRequest,
        data: axios.isAxiosError(error) ? error.response?.data : error,
      });
    }
  }

  /**
   * Extract draw list from HTML page
   */
  private extractDrawListFromHtml(html: string): LotteryIEDrawItem[] {
    const $ = cheerio.load(html);
    const nextDataScript = $('#__NEXT_DATA__').html();

    if (!nextDataScript) {
      throw new Error('Could not find __NEXT_DATA__ script tag');
    }

    const nextData: LotteryIENextData = JSON.parse(nextDataScript);
    const drawList = nextData?.props?.pageProps?.list;

    if (!Array.isArray(drawList)) {
      throw new Error('Could not find draw list in page data');
    }

    return drawList;
  }

  /**
   * Parse the draw list into DTOs
   */
  private parseDrawList(
    drawList: LotteryIEDrawItem[],
    source: GameSource,
    lottoType: IrishLottoType,
    maxNumber: number,
  ): IrishLottoDrawDto[] {
    const results: IrishLottoDrawDto[] = [];

    for (const draw of drawList) {
      const gameData = source === 'standard' ? draw.standard : draw.addonGames[source];

      if (!gameData) {
        this.loggerService.log(`[${lottoType}] Draw missing game data for source ${source}, skipping`);
        continue;
      }

      // Extract draw date from standard (always present)
      const drawDates = draw.standard?.drawDates;
      if (!drawDates?.[0]) {
        this.loggerService.log(`[${lottoType}] Draw missing date, skipping`);
        continue;
      }

      const drawDate = new Date(drawDates[0]);
      const drawLabel = drawDate.toISOString().split('T')[0];

      // Extract numbers from grids
      const grids = gameData.grids;
      if (!grids?.[0]) {
        this.loggerService.log(`[${lottoType}] Draw ${drawLabel}: missing grid data, skipping`);
        continue;
      }

      const mainNumbers = grids[0].standard?.[0];
      const bonusNumbers = grids[0].additional?.[0];

      if (!mainNumbers || mainNumbers.length !== 6) {
        this.loggerService.log(
          `[${lottoType}] Draw ${drawLabel}: invalid main numbers (got ${mainNumbers}), skipping`,
        );
        continue;
      }

      if (!bonusNumbers || bonusNumbers.length !== 1) {
        this.loggerService.log(`[${lottoType}] Draw ${drawLabel}: invalid bonus number (got ${bonusNumbers}), skipping`);
        continue;
      }

      // Validate number ranges
      const allValid =
        mainNumbers.every(n => n >= 1 && n <= maxNumber) && bonusNumbers[0] >= 1 && bonusNumbers[0] <= maxNumber;

      if (!allValid) {
        this.loggerService.log(`[${lottoType}] Draw ${drawLabel}: numbers out of range 1-${maxNumber}, skipping`);
        continue;
      }

      results.push({
        drawDate,
        drawLabel,
        mainNumbers,
        bonusNumber: bonusNumbers[0],
      });
    }

    // Sort by date ascending
    results.sort((a, b) => a.drawDate.getTime() - b.drawDate.getTime());

    this.loggerService.log(`[${lottoType}] Successfully parsed ${results.length} draws`);

    return results;
  }
}
