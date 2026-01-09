import {LottoType, type config} from '@lotto/shared';

type CronConfigKey = keyof typeof config.crons;

/**
 * Centralized lottery configuration
 * Single source of truth for all lottery-specific settings:
 * - configKey: Environment variable key for cron schedule
 * - region: Service routing (estonian/us/uk/spanish)
 */
export const LOTTERY_CONFIG: Record<
  LottoType,
  {
    configKey: CronConfigKey;
    region: 'estonian' | 'us' | 'uk' | 'spanish';
  }
> = {
  // Lotteries from EE source
  [LottoType.EUROJACKPOT]: {
    configKey: 'euroJackpotInterval',
    region: 'estonian',
  },
  [LottoType.VIKINGLOTTO]: {
    configKey: 'vikingLottoInterval',
    region: 'estonian',
  },
  [LottoType.EST_BINGO]: {
    configKey: 'bingoLottoInterval',
    region: 'estonian',
  },
  [LottoType.EST_JOKKER]: {
    configKey: 'jokkerLottoInterval',
    region: 'estonian',
  },
  [LottoType.EST_KENO]: {
    configKey: 'kenoLottoInterval',
    region: 'estonian',
  },
  // Lotteries from US source
  [LottoType.US_POWERBALL]: {
    configKey: 'powerballInterval',
    region: 'us',
  },
  [LottoType.US_MEGA_MILLIONS]: {
    configKey: 'megaMillionsInterval',
    region: 'us',
  },
  [LottoType.US_CASH4LIFE]: {
    configKey: 'cash4LifeInterval',
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
  // Lotteries from ES source
  [LottoType.ES_LA_PRIMITIVA]: {
    configKey: 'esLaPrimitivaInterval',
    region: 'spanish',
  },
  [LottoType.ES_BONOLOTO]: {
    configKey: 'esBonolotoInterval',
    region: 'spanish',
  },
  [LottoType.ES_EL_GORDO]: {
    configKey: 'esElGordoInterval',
    region: 'spanish',
  },
  [LottoType.EURODREAMS]: {
    configKey: 'euroDreamsInterval',
    region: 'spanish',
  },
};
