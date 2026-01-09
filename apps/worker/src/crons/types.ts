import {LottoType, type config} from '@lotto/shared';

type CronConfigKey = keyof typeof config.crons;

/**
 * Centralized lottery configuration
 * Single source of truth for all lottery-specific settings:
 * - configKey: Environment variable key for cron schedule
 * - region: Service routing (estonian/us/uk)
 * - historyStart: Historical start date for reset operations
 */
export const LOTTERY_CONFIG: Record<
  LottoType,
  {
    configKey: CronConfigKey;
    region: 'estonian' | 'us' | 'uk' | 'spanish';
    historyStart: string;
  }
> = {
  // Estonian lotteries
  [LottoType.EUROJACKPOT]: {
    configKey: 'euroJackpotInterval',
    region: 'estonian',
    historyStart: '2021-05-28T22:00:00',
  },
  [LottoType.VIKINGLOTTO]: {
    configKey: 'vikingLottoInterval',
    region: 'estonian',
    historyStart: '2021-05-26T20:00:00',
  },
  [LottoType.EST_BINGO]: {
    configKey: 'bingoLottoInterval',
    region: 'estonian',
    historyStart: '2021-05-26T18:30:00',
  },
  [LottoType.EST_JOKKER]: {
    configKey: 'jokkerLottoInterval',
    region: 'estonian',
    historyStart: '2023-01-03T18:35:00',
  },
  [LottoType.EST_KENO]: {
    configKey: 'kenoLottoInterval',
    region: 'estonian',
    historyStart: '2021-05-25T14:15:00',
  },
  // US lotteries
  [LottoType.US_POWERBALL]: {
    configKey: 'powerballInterval',
    region: 'us',
    historyStart: '2019-12-01T00:00:00',
  },
  [LottoType.US_MEGA_MILLIONS]: {
    configKey: 'megaMillionsInterval',
    region: 'us',
    historyStart: '2019-12-01T00:00:00',
  },
  [LottoType.US_CASH4LIFE]: {
    configKey: 'cash4LifeInterval',
    region: 'us',
    historyStart: '2019-12-01T00:00:00',
  },
  // UK lotteries
  [LottoType.EUROMILLIONS]: {
    configKey: 'euroMillionsInterval',
    region: 'uk',
    historyStart: '2020-12-01T00:00:00',
  },
  [LottoType.UK_LOTTO]: {
    configKey: 'ukLottoInterval',
    region: 'uk',
    historyStart: '2020-12-01T00:00:00',
  },
  [LottoType.UK_THUNDERBALL]: {
    configKey: 'ukThunderballInterval',
    region: 'uk',
    historyStart: '2020-12-01T00:00:00',
  },
  [LottoType.UK_SET_FOR_LIFE]: {
    configKey: 'ukSetForLifeInterval',
    region: 'uk',
    historyStart: '2020-12-01T00:00:00',
  },
  [LottoType.UK_HOT_PICKS]: {
    configKey: 'ukHotPicksInterval',
    region: 'uk',
    historyStart: '2020-12-01T00:00:00',
  },
  // Spanish lotteries
  [LottoType.ES_LA_PRIMITIVA]: {
    configKey: 'esLaPrimitivaInterval',
    region: 'spanish',
    historyStart: '2020-12-01T00:00:00',
  },
  [LottoType.ES_BONOLOTO]: {
    configKey: 'esBonolotoInterval',
    region: 'spanish',
    historyStart: '2020-12-01T00:00:00',
  },
  [LottoType.ES_EL_GORDO]: {
    configKey: 'esElGordoInterval',
    region: 'spanish',
    historyStart: '2020-12-01T00:00:00',
  },
  // Shared lotteries
  [LottoType.EURODREAMS]: {
    configKey: 'euroDreamsInterval',
    region: 'spanish', // Uses Spanish lottery API
    historyStart: '2023-11-06T00:00:00', // EuroDreams launched Nov 2023
  },
};
