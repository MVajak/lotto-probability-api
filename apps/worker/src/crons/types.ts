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
    region: 'estonian' | 'us' | 'uk';
    historyStart: string;
  }
> = {
  // Estonian lotteries (dates from eestiloto.ee/et/results)
  [LottoType.EURO]: {
    configKey: 'euroJackpotInterval',
    region: 'estonian',
    historyStart: '2021-05-28T22:00:00',
  },
  [LottoType.VIKINGLOTTO]: {
    configKey: 'vikingLottoInterval',
    region: 'estonian',
    historyStart: '2021-05-26T20:00:00',
  },
  [LottoType.BINGO]: {
    configKey: 'bingoLottoInterval',
    region: 'estonian',
    historyStart: '2021-05-26T18:30:00',
  },
  [LottoType.JOKKER]: {
    configKey: 'jokkerLottoInterval',
    region: 'estonian',
    historyStart: '2023-01-03T18:35:00',
  },
  [LottoType.KENO]: {
    configKey: 'kenoLottoInterval',
    region: 'estonian',
    historyStart: '2021-05-25T14:15:00',
  },
  // US lotteries (5 years of historical data from data.ny.gov)
  [LottoType.POWERBALL]: {
    configKey: 'powerballInterval',
    region: 'us',
    historyStart: '2019-12-01T00:00:00',
  },
  [LottoType.MEGA_MILLIONS]: {
    configKey: 'megaMillionsInterval',
    region: 'us',
    historyStart: '2019-12-01T00:00:00',
  },
  [LottoType.CASH4LIFE]: {
    configKey: 'cash4LifeInterval',
    region: 'us',
    historyStart: '2019-12-01T00:00:00',
  },
  // UK lotteries (5 years of historical data from national-lottery.co.uk)
  [LottoType.UK_EUROMILLIONS]: {
    configKey: 'ukEuroMillionsInterval',
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
};
