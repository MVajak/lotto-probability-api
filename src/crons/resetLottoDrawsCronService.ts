import {BindingScope, inject, injectable} from '@loopback/core';

import {ALL_PROBABILITY_LOTTO} from '../common/types';
import {LoggerService} from '../services/logger/loggerService';
import {LottoDrawService} from '../services/lottoDraw/lottoDrawService';
import {LottoDrawResultService} from '../services/lottoDrawResult/lottoDrawResultService';

import {EstonianLottoDrawCronService} from './estonianLottoDrawCronService';
import {LOTTERY_CONFIG} from './types';
import {UKLottoDrawCronService} from './ukLottoDrawCronService';
import {USLottoDrawCronService} from './usLottoDrawCronService';

/**
 * Service for resetting all lottery draws (deletes and re-fetches)
 * Used for data cleanup/refresh operations
 */
@injectable({scope: BindingScope.SINGLETON})
export class ResetLottoDrawsCronService {
  constructor(
    @inject('services.LoggerService')
    private loggerService: LoggerService,
    @inject('services.LottoDrawService')
    private lottoDrawService: LottoDrawService,
    @inject('services.LottoDrawResultService')
    private lottoDrawResultService: LottoDrawResultService,
    @inject('services.EstonianLottoDrawCronService')
    private estonianLottoDrawCronService: EstonianLottoDrawCronService,
    @inject('services.USLottoDrawCronService')
    private usLottoDrawCronService: USLottoDrawCronService,
    @inject('services.UKLottoDrawCronService')
    private ukLottoDrawCronService: UKLottoDrawCronService,
  ) {}

  async resetDraws(): Promise<void> {
    this.loggerService.log(`Deleting everything and resaving every draw...`);

    await this.deleteAllDraws();
    await this.saveAllDraws();

    this.loggerService.log(`Resetting successful.`);
  }

  private async deleteAllDraws(): Promise<void> {
    await this.lottoDrawService.hardDeleteAll({});
    await this.lottoDrawResultService.hardDeleteAll({});
  }

  private async saveAllDraws(): Promise<void> {
    const now = new Date();

    for (const lottoType of ALL_PROBABILITY_LOTTO) {
      const lotteryConfig = LOTTERY_CONFIG[lottoType];
      const dateRange = {
        dateFrom: new Date(lotteryConfig.historyStart),
        dateTo: now,
      };

      const service =
        lotteryConfig.region === 'estonian'
          ? this.estonianLottoDrawCronService
          : lotteryConfig.region === 'us'
            ? this.usLottoDrawCronService
            : this.ukLottoDrawCronService;

      await service.saveLatestDraws(lottoType, dateRange);
    }
  }
}
