import type {Booter} from '@loopback/boot';
import {BindingScope, bind, inject} from '@loopback/core';
import {type LottoType, config} from '@lotto/shared';
import {schedule, validate} from 'node-cron';

import {
  type AustralianLottoDrawCronService,
  type CanadianLottoDrawCronService,
  type EstonianLottoDrawCronService,
  type FrenchLottoDrawCronService,
  type GermanLottoDrawCronService,
  type IrishLottoDrawCronService,
  LOTTERY_CONFIG,
  type LotteryConfigEntry,
  type LotteryRegion,
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
    @inject('services.IrishLottoDrawCronService')
    private irishLottoDrawCronService: IrishLottoDrawCronService,
    @inject('services.FrenchLottoDrawCronService')
    private frenchLottoDrawCronService: FrenchLottoDrawCronService,
    @inject('services.GermanLottoDrawCronService')
    private germanLottoDrawCronService: GermanLottoDrawCronService,
    @inject('services.CanadianLottoDrawCronService')
    private canadianLottoDrawCronService: CanadianLottoDrawCronService,
    @inject('services.AustralianLottoDrawCronService')
    private australianLottoDrawCronService: AustralianLottoDrawCronService,
  ) {}

  async load(): Promise<void> {
    // Schedule crons only for lotteries defined in LOTTERY_CONFIG
    // (sub-lotteries like Plus variants are handled via 'includes')
    for (const [lottoType, lotteryConfig] of Object.entries(LOTTERY_CONFIG)) {
      this.scheduleLotteryDraws(lottoType as LottoType, lotteryConfig);
    }
  }

  private scheduleLotteryDraws(lottoType: LottoType, lotteryConfig: LotteryConfigEntry): void {
    const cronSchedule = config.crons[lotteryConfig.configKey];

    if (!cronSchedule || cronSchedule === 'off') return;

    if (!validate(cronSchedule)) {
      throw new Error(`Invalid cron expression for ${lottoType}: ${cronSchedule}`);
    }

    const service = this.getServiceForRegion(lotteryConfig.region);
    const allTypes = [lottoType, ...(lotteryConfig.includes ?? [])];

    schedule(cronSchedule, async () => {
      for (const type of allTypes) {
        await service.saveLatestDraws(type);
      }
    });
  }

  private getServiceForRegion(region: LotteryRegion) {
    switch (region) {
      case 'est':
        return this.estonianLottoDrawCronService;
      case 'us':
        return this.usLottoDrawCronService;
      case 'uk':
        return this.ukLottoDrawCronService;
      case 'ie':
        return this.irishLottoDrawCronService;
      case 'es':
        return this.spanishLottoDrawCronService;
      case 'fr':
        return this.frenchLottoDrawCronService;
      case 'de':
        return this.germanLottoDrawCronService;
      case 'ca':
        return this.canadianLottoDrawCronService;
      case 'au':
        return this.australianLottoDrawCronService;
    }
  }
}
