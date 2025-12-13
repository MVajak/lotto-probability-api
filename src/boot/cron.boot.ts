import {Booter} from '@loopback/boot';
import {bind, BindingScope, inject} from '@loopback/core';
import {schedule, validate} from 'node-cron';

import {config} from '../common/config';
import {ALL_PROBABILITY_LOTTO, LottoType} from '../common/types';
import {EstonianLottoDrawCronService} from '../crons/estonianLottoDrawCronService';
import {ResetLottoDrawsCronService} from '../crons/resetLottoDrawsCronService';
import {LOTTERY_CONFIG} from '../crons/types';
import {UKLottoDrawCronService} from '../crons/ukLottoDrawCronService';
import {USLottoDrawCronService} from '../crons/usLottoDrawCronService';

@bind({scope: BindingScope.SINGLETON})
export class CronBooter implements Booter {
  constructor(
    @inject('services.EstonianLottoDrawCronService')
    private estonianLottoDrawCronService: EstonianLottoDrawCronService,
    @inject('services.ResetLottoDrawsCronService')
    private resetLottoDrawsCronService: ResetLottoDrawsCronService,
    @inject('services.USLottoDrawCronService')
    private usLottoDrawCronService: USLottoDrawCronService,
    @inject('services.UKLottoDrawCronService')
    private ukLottoDrawCronService: UKLottoDrawCronService,
  ) {}

  async load(): Promise<void> {
    // Schedule all lottery crons from single loop
    for (const lottoType of ALL_PROBABILITY_LOTTO) {
      this.scheduleLotteryDraws(lottoType);
    }

    this.scheduleReset();
  }

  private scheduleLotteryDraws(lottoType: LottoType): void {
    const lotteryConfig = LOTTERY_CONFIG[lottoType];
    const cronSchedule = config.crons[lotteryConfig.configKey];

    if (!cronSchedule || cronSchedule === 'off') return;

    if (!validate(cronSchedule)) {
      throw new Error(`Invalid cron expression for ${lottoType}: ${cronSchedule}`);
    }

    const service =
      lotteryConfig.region === 'estonian'
        ? this.estonianLottoDrawCronService
        : lotteryConfig.region === 'us'
          ? this.usLottoDrawCronService
          : this.ukLottoDrawCronService;

    schedule(cronSchedule, async () => {
      await service.saveLatestDraws(lottoType);
    });
  }

  private scheduleReset(): void {
    const cronSchedule = config.crons.resetDrawsInterval;

    if (!cronSchedule || cronSchedule === 'off') return;

    if (!validate(cronSchedule)) {
      throw new Error(`Invalid cron expression for data reset: ${cronSchedule}`);
    }

    schedule(cronSchedule, async () => {
      await this.resetLottoDrawsCronService.resetDraws();
    });
  }
}
