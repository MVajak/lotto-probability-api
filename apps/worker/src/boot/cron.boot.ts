import type {Booter} from '@loopback/boot';
import {BindingScope, bind, inject} from '@loopback/core';
import {ALL_PROBABILITY_LOTTO, type LottoType, config} from '@lotto/shared';
import {schedule, validate} from 'node-cron';

import {
  type EstonianLottoDrawCronService,
  LOTTERY_CONFIG,
  type SpanishLottoDrawCronService,
  type UKLottoDrawCronService,
  type USLottoDrawCronService,
} from '../crons';

@bind({scope: BindingScope.SINGLETON})
export class CronBooter implements Booter {
  constructor(
    @inject('services.EstonianLottoDrawCronService')
    private estonianLottoDrawCronService: EstonianLottoDrawCronService,
    @inject('services.USLottoDrawCronService')
    private usLottoDrawCronService: USLottoDrawCronService,
    @inject('services.UKLottoDrawCronService')
    private ukLottoDrawCronService: UKLottoDrawCronService,
    @inject('services.SpanishLottoDrawCronService')
    private spanishLottoDrawCronService: SpanishLottoDrawCronService,
  ) {}

  async load(): Promise<void> {
    // Schedule all lottery crons from single loop
    for (const lottoType of ALL_PROBABILITY_LOTTO) {
      this.scheduleLotteryDraws(lottoType);
    }
  }

  private scheduleLotteryDraws(lottoType: LottoType): void {
    const lotteryConfig = LOTTERY_CONFIG[lottoType];
    const cronSchedule = config.crons[lotteryConfig.configKey];

    if (!cronSchedule || cronSchedule === 'off') return;

    if (!validate(cronSchedule)) {
      throw new Error(`Invalid cron expression for ${lottoType}: ${cronSchedule}`);
    }

    const service = this.getServiceForRegion(lotteryConfig.region);

    schedule(cronSchedule, async () => {
      await service.saveLatestDraws(lottoType);
    });
  }

  private getServiceForRegion(region: 'estonian' | 'us' | 'uk' | 'spanish') {
    switch (region) {
      case 'estonian':
        return this.estonianLottoDrawCronService;
      case 'us':
        return this.usLottoDrawCronService;
      case 'uk':
        return this.ukLottoDrawCronService;
      case 'spanish':
        return this.spanishLottoDrawCronService;
    }
  }
}
