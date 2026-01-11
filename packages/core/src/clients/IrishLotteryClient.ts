import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import axios from 'axios';
import * as cheerio from 'cheerio';

import type {IrishLottoDrawDto} from '../models';
import type {LoggerService} from '../services/logger/loggerService';

const IRISH_LOTTERY_BASE_URL = 'https://www.lottery.ie';

/**
 * Types for the lottery.ie __NEXT_DATA__ structure
 */
interface LotteryIEGrid {
  standard: number[][]; // Main numbers arrays
  additional: number[][]; // Bonus numbers arrays
}

interface LotteryIEDrawStandard {
  gameLogo: string;
  jackpotAmount: string;
  drawDates: string[]; // ISO date strings
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

/**
 * Addon game structure (Plus 1, Plus 2)
 * Same structure as standard but in addonGames array
 */
interface LotteryIEAddonGame {
  gameLogo: string;
  jackpotAmount: string;
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
  standard: LotteryIEDrawStandard;
  addonGames: LotteryIEAddonGame[];
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
 * Irish lottery game type
 */
type IrishLottoGame = 'IE_LOTTO' | 'IE_LOTTO_PLUS_1' | 'IE_LOTTO_PLUS_2';

/**
 * Data source for each game type
 * - 'standard' = main Lotto game (draw.standard)
 * - 0, 1 = addonGames index for Plus 1 and Plus 2
 */
type GameSource = 'standard' | number;

const GAME_SOURCE: Record<IrishLottoGame, GameSource> = {
  IE_LOTTO: 'standard',
  IE_LOTTO_PLUS_1: 0, // addonGames[0]
  IE_LOTTO_PLUS_2: 1, // addonGames[1]
};

@injectable({scope: BindingScope.SINGLETON})
export class IrishLotteryClient {
  private cachedDrawList: LotteryIEDrawItem[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 60000; // 1 minute cache

  constructor(
    @inject('services.LoggerService')
    protected loggerService: LoggerService,
  ) {}

  /**
   * Fetch Irish Lotto draws (main game)
   */
  async fetchIrishLottoDraws(): Promise<IrishLottoDrawDto[]> {
    return this.fetchDrawsForGame('IE_LOTTO');
  }

  /**
   * Fetch Irish Lotto Plus 1 draws
   */
  async fetchIrishLottoPlus1Draws(): Promise<IrishLottoDrawDto[]> {
    return this.fetchDrawsForGame('IE_LOTTO_PLUS_1');
  }

  /**
   * Fetch Irish Lotto Plus 2 draws
   */
  async fetchIrishLottoPlus2Draws(): Promise<IrishLottoDrawDto[]> {
    return this.fetchDrawsForGame('IE_LOTTO_PLUS_2');
  }

  /**
   * Fetch draws for a specific Irish lottery game
   */
  private async fetchDrawsForGame(game: IrishLottoGame): Promise<IrishLottoDrawDto[]> {
    const drawList = await this.fetchDrawList();
    const source = GAME_SOURCE[game];
    return this.parseDrawList(drawList, source, game);
  }

  /**
   * Fetch draw list from lottery.ie (with caching)
   * All three games share the same draw data
   */
  private async fetchDrawList(): Promise<LotteryIEDrawItem[]> {
    const now = Date.now();

    // Return cached data if still valid
    if (this.cachedDrawList && now - this.cacheTimestamp < this.CACHE_TTL_MS) {
      this.loggerService.log('[IE_LOTTO] Using cached draw data');
      return this.cachedDrawList;
    }

    const url = `${IRISH_LOTTERY_BASE_URL}/results/lotto/history`;
    this.loggerService.log(`[IE_LOTTO] Fetching from ${url}...`);

    try {
      const response = await axios.get<string>(url, {
        responseType: 'text',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);

      // Extract the __NEXT_DATA__ JSON from the script tag
      const nextDataScript = $('#__NEXT_DATA__').html();

      if (!nextDataScript) {
        throw new Error('Could not find __NEXT_DATA__ script tag');
      }

      const nextData: LotteryIENextData = JSON.parse(nextDataScript);
      const drawList = nextData?.props?.pageProps?.list;

      if (!Array.isArray(drawList)) {
        throw new Error('Could not find draw list in page data');
      }

      this.loggerService.log(`[IE_LOTTO] Found ${drawList.length} draws in page data`);

      // Cache the result
      this.cachedDrawList = drawList;
      this.cacheTimestamp = now;

      return drawList;
    } catch (error) {
      this.loggerService.logError({
        message: '[IE_LOTTO] Failed to fetch Irish Lotto draws',
        errorConstructor: HttpErrors.BadRequest,
        data: axios.isAxiosError(error) ? error.response?.data : error,
      });
      return [];
    }
  }

  /**
   * Parse the draw list from lottery.ie
   * @param drawList - Raw draw list from API
   * @param source - 'standard' for main Lotto, or addonGames index for Plus games
   * @param game - Game name for logging
   */
  private parseDrawList(
    drawList: LotteryIEDrawItem[],
    source: GameSource,
    game: IrishLottoGame,
  ): IrishLottoDrawDto[] {
    const results: IrishLottoDrawDto[] = [];

    for (const draw of drawList) {
      // Get the game data based on source
      // - 'standard' = draw.standard (main Lotto)
      // - number = draw.addonGames[n] (Plus 1 or Plus 2)
      const gameData = source === 'standard' ? draw.standard : draw.addonGames[source];

      if (!gameData) {
        this.loggerService.log(`[${game}] Draw missing game data for source ${source}, skipping`);
        continue;
      }

      // Extract draw date from the main standard (always present)
      const drawDates = draw.standard?.drawDates;
      if (!drawDates || !drawDates[0]) {
        this.loggerService.log(`[${game}] Draw missing date, skipping`);
        continue;
      }

      // Parse ISO date string
      const drawDate = new Date(drawDates[0]);
      const drawLabel = drawDate.toISOString().split('T')[0]; // YYYY-MM-DD

      // Extract main numbers and bonus from grids[0] of the selected game
      const grids = gameData.grids;
      if (!grids || !grids[0]) {
        this.loggerService.log(`[${game}] Draw ${drawLabel}: missing grid data, skipping`);
        continue;
      }

      const mainNumbers = grids[0].standard?.[0];
      const bonusNumbers = grids[0].additional?.[0];

      if (!mainNumbers || mainNumbers.length !== 6) {
        this.loggerService.log(
          `[${game}] Draw ${drawLabel}: invalid main numbers (got ${mainNumbers?.length}), skipping`,
        );
        continue;
      }

      if (!bonusNumbers || bonusNumbers.length !== 1) {
        this.loggerService.log(`[${game}] Draw ${drawLabel}: invalid bonus number, skipping`);
        continue;
      }

      // Validate number ranges (1-47)
      const allValid =
        mainNumbers.every(n => n >= 1 && n <= 47) && bonusNumbers[0] >= 1 && bonusNumbers[0] <= 47;

      if (!allValid) {
        this.loggerService.log(`[${game}] Draw ${drawLabel}: numbers out of range 1-47, skipping`);
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

    this.loggerService.log(`[${game}] Successfully parsed ${results.length} draws`);

    return results;
  }
}
