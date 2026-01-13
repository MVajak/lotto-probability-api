import {LottoType, type config} from '@lotto/shared';

type CronConfigKey = keyof typeof config.crons;

export type LotteryRegion = 'est' | 'us' | 'uk' | 'ie' | 'es' | 'de';

/**
 * Centralized lottery configuration
 * Single source of truth for all lottery-specific settings:
 * - configKey: Environment variable key for cron schedule
 * - region: Service routing (estonian/us/uk/spanish)
 * - includes: Sub-lotteries fetched together with this one (e.g., Plus variants)
 */
export interface LotteryConfigEntry {
  configKey: CronConfigKey;
  region: LotteryRegion;
  includes?: LottoType[];
}

export const LOTTERY_CONFIG: Partial<Record<LottoType, LotteryConfigEntry>> = {
  // Lotteries from EE source
  [LottoType.EUROJACKPOT]: {
    configKey: 'euroJackpotInterval',
    region: 'est',
  },
  [LottoType.VIKINGLOTTO]: {
    configKey: 'vikingLottoInterval',
    region: 'est',
  },
  [LottoType.EST_BINGO]: {
    configKey: 'estBingoLottoInterval',
    region: 'est',
  },
  [LottoType.EST_JOKKER]: {
    configKey: 'estJokkerLottoInterval',
    region: 'est',
  },
  [LottoType.EST_KENO]: {
    configKey: 'estKenoLottoInterval',
    region: 'est',
  },
  // Lotteries from US source
  [LottoType.US_POWERBALL]: {
    configKey: 'usPowerballInterval',
    region: 'us',
  },
  [LottoType.US_MEGA_MILLIONS]: {
    configKey: 'usMegaMillionsInterval',
    region: 'us',
  },
  [LottoType.US_CASH4LIFE]: {
    configKey: 'usCash4LifeInterval',
    region: 'us',
  },
  // Lotteries from UK source
  [LottoType.EUROMILLIONS]: {
    configKey: 'euroMillionsInterval',
    region: 'uk',
  },
  [LottoType.UK_LOTTO]: {
    configKey: 'ukLottoInterval',
    region: 'uk',
  },
  [LottoType.UK_THUNDERBALL]: {
    configKey: 'ukThunderballInterval',
    region: 'uk',
  },
  [LottoType.UK_SET_FOR_LIFE]: {
    configKey: 'ukSetForLifeInterval',
    region: 'uk',
  },
  [LottoType.UK_HOT_PICKS]: {
    configKey: 'ukHotPicksInterval',
    region: 'uk',
  },
  // Lotteries from IE source (Plus variants fetched with parent)
  [LottoType.IE_LOTTO]: {
    configKey: 'ieLottoInterval',
    region: 'ie',
    includes: [LottoType.IE_LOTTO_PLUS_1, LottoType.IE_LOTTO_PLUS_2],
  },
  [LottoType.IE_DAILY_MILLION]: {
    configKey: 'ieDailyMillionInterval',
    region: 'ie',
    includes: [LottoType.IE_DAILY_MILLION_PLUS],
  },
  // Lotteries from ES source
  [LottoType.ES_LA_PRIMITIVA]: {
    configKey: 'esLaPrimitivaInterval',
    region: 'es',
  },
  [LottoType.ES_BONOLOTO]: {
    configKey: 'esBonolotoInterval',
    region: 'es',
  },
  [LottoType.ES_EL_GORDO]: {
    configKey: 'esElGordoInterval',
    region: 'es',
  },
  [LottoType.EURODREAMS]: {
    configKey: 'euroDreamsInterval',
    region: 'es',
  },
  // German lotteries (Spiel77 and Super6 drawn with 6aus49)
  [LottoType.DE_LOTTO_6AUS49]: {
    configKey: 'deLotto6aus49Interval',
    region: 'de',
    includes: [LottoType.DE_SPIEL77, LottoType.DE_SUPER6],
  },
  [LottoType.DE_KENO]: {
    configKey: 'deKenoInterval',
    region: 'de',
  },
};
