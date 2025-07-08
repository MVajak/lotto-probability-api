import {Booter} from '@loopback/boot';
import {bind, BindingScope, inject} from '@loopback/core';
import {schedule, validate} from 'node-cron';

import {config} from '../common/config';
import {LottoType} from '../common/types';
import {NewLottoDrawsCronService} from '../crons/newLottoDrawsCronService';
import {ResetLottoDrawsCronService} from '../crons/resetLottoDrawsCronService';

@bind({scope: BindingScope.SINGLETON})
export class CronBooter implements Booter {
  constructor(
    @inject('services.NewLottoDrawsCronService')
    private newLottoDrawsCronService: NewLottoDrawsCronService,
    @inject('services.ResetLottoDrawsCronService')
    private resetLottoDrawsCronService: ResetLottoDrawsCronService,
  ) {}

  async load(): Promise<void> {
    await this.saveNewDraws(config.crons.euroJackpotInterval, LottoType.EURO);
    await this.saveNewDraws(config.crons.vikingLottoInterval, LottoType.VIKINGLOTTO);
    await this.saveNewDraws(config.crons.bingoLottoInterval, LottoType.BINGO);
    await this.saveNewDraws(config.crons.jokkerLottoInterval, LottoType.JOKKER);
    await this.saveNewDraws(config.crons.kenoLottoInterval, LottoType.KENO);

    await this.deleteAllAndResave();
  }

  private async saveNewDraws(
    cronScheduleVar: string | undefined,
    lottoType: LottoType,
  ): Promise<void> {
    if (cronScheduleVar && cronScheduleVar !== 'off') {
      if (!validate(cronScheduleVar)) {
        throw new Error(`Invalid cron expression for lott ${lottoType}: ${cronScheduleVar}`);
      }

      schedule(cronScheduleVar, async () => {
        await this.newLottoDrawsCronService.saveLatestDraws(lottoType);
      });
    }
  }

  private async deleteAllAndResave(): Promise<void> {
    const drawsResetCronSchedule = config.crons.resetDrawsInterval;

    if (drawsResetCronSchedule && drawsResetCronSchedule !== 'off') {
      if (!validate(drawsResetCronSchedule)) {
        throw new Error(`Invalid cron expression on data reset: ${drawsResetCronSchedule}`);
      }

      schedule(drawsResetCronSchedule, async () => {
        await this.resetLottoDrawsCronService.resetDraws();
      });
    }
  }
}
