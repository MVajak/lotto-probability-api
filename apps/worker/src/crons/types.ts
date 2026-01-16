import {LottoType, type config} from '@lotto/shared';

type CronConfigKey = keyof typeof config.crons;

export type LotteryRegion = 'est' | 'us' | 'uk' | 'ie' | 'es' | 'fr' | 'de' | 'ca' | 'au';

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
  [LottoType.US_LOTTO_AMERICA]: {
    configKey: 'usLottoAmericaInterval',
    region: 'us',
  },
  [LottoType.US_LUCKY_FOR_LIFE]: {
    configKey: 'usLuckyForLifeInterval',
    region: 'us',
  },
  [LottoType.US_CA_SUPERLOTTO]: {
    configKey: 'usCaSuperLottoInterval',
    region: 'us',
  },
  [LottoType.US_NY_LOTTO]: {
    configKey: 'usNyLottoInterval',
    region: 'us',
  },
  [LottoType.US_TX_LOTTO]: {
    configKey: 'usTxLottoInterval',
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
  [LottoType.UK_49S_LUNCHTIME]: {
    configKey: 'uk49sLunchtimeInterval',
    region: 'uk',
  },
  [LottoType.UK_49S_TEATIME]: {
    configKey: 'uk49sTeatimeInterval',
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
  // French lotteries
  [LottoType.FR_LOTO]: {
    configKey: 'frLotoInterval',
    region: 'fr',
  },
  [LottoType.FR_KENO]: {
    configKey: 'frKenoInterval',
    region: 'fr',
    includes: [LottoType.FR_JOKER],
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
  // Canadian lotteries
  [LottoType.CA_LOTTO_MAX]: {
    configKey: 'caLottoMaxInterval',
    region: 'ca',
  },
  [LottoType.CA_LOTTO_649]: {
    configKey: 'caLotto649Interval',
    region: 'ca',
  },
  [LottoType.CA_DAILY_GRAND]: {
    configKey: 'caDailyGrandInterval',
    region: 'ca',
  },
  [LottoType.CA_LOTTARIO]: {
    configKey: 'caLottarioInterval',
    region: 'ca',
  },
  [LottoType.CA_BC_49]: {
    configKey: 'caBc49Interval',
    region: 'ca',
  },
  [LottoType.CA_QUEBEC_49]: {
    configKey: 'caQuebec49Interval',
    region: 'ca',
  },
  [LottoType.CA_ATLANTIC_49]: {
    configKey: 'caAtlantic49Interval',
    region: 'ca',
  },
  // Australian lotteries
  [LottoType.AU_POWERBALL]: {
    configKey: 'auPowerballInterval',
    region: 'au',
  },
  [LottoType.AU_SATURDAY_LOTTO]: {
    configKey: 'auSaturdayLottoInterval',
    region: 'au',
  },
  [LottoType.AU_OZ_LOTTO]: {
    configKey: 'auOzLottoInterval',
    region: 'au',
  },
  [LottoType.AU_SET_FOR_LIFE]: {
    configKey: 'auSetForLifeInterval',
    region: 'au',
  },
  [LottoType.AU_WEEKDAY_WINDFALL]: {
    configKey: 'auWeekdayWindfallInterval',
    region: 'au',
  },
  [LottoType.AU_CASH_3]: {
    configKey: 'auCash3Interval',
    region: 'au',
  },
  [LottoType.AU_SUPER_66]: {
    configKey: 'auSuper66Interval',
    region: 'au',
  },
  [LottoType.AU_LOTTO_STRIKE]: {
    configKey: 'auLottoStrikeInterval',
    region: 'au',
  },
};
