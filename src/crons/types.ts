import {config} from '../common/config';
import {LottoType} from '../common/types';

/**
 * Historical start dates for fetching lottery data during reset operations
 * - Estonian lotteries: Taken from eestiloto.ee/et/results
 * - US lotteries: 5 years of historical data from data.ny.gov
 */
export const LastDrawDate: Record<LottoType, string> = {
  // Estonian lotteries
  VIKINGLOTTO: '2021-05-26T20:00:00',
  EURO: '2021-05-28T22:00:00',
  KENO: '2021-05-25T14:15:00',
  JOKKER: '2023-01-03T18:35:00',
  BINGO: '2021-05-26T18:30:00',
  // US lotteries (5 years of historical data from data.ny.gov)
  POWERBALL: '2019-12-01T00:00:00',
  MEGA_MILLIONS: '2019-12-01T00:00:00',
  CASH4LIFE: '2019-12-01T00:00:00',
};

type CronConfigKey = keyof typeof config.crons;

/**
 * Centralized lottery configuration mapping
 * Maps each lottery type to its cron config key and region (for service routing)
 */
export const LOTTERY_CRON_CONFIG: Record<
  LottoType,
  {
    configKey: CronConfigKey;
    region: 'estonian' | 'us';
  }
> = {
  // Estonian lotteries
  [LottoType.EURO]: {configKey: 'euroJackpotInterval', region: 'estonian'},
  [LottoType.VIKINGLOTTO]: {configKey: 'vikingLottoInterval', region: 'estonian'},
  [LottoType.BINGO]: {configKey: 'bingoLottoInterval', region: 'estonian'},
  [LottoType.JOKKER]: {configKey: 'jokkerLottoInterval', region: 'estonian'},
  [LottoType.KENO]: {configKey: 'kenoLottoInterval', region: 'estonian'},
  // US lotteries
  [LottoType.POWERBALL]: {configKey: 'powerballInterval', region: 'us'},
  [LottoType.MEGA_MILLIONS]: {configKey: 'megaMillionsInterval', region: 'us'},
  [LottoType.CASH4LIFE]: {configKey: 'cash4LifeInterval', region: 'us'},
};
