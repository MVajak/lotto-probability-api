import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {groupBy} from 'lodash';

import type {LottoDrawRelations} from '@lotto/database';
import {
  ALL_PROBABILITY_LOTTO,
  type LottoType,
  OVERALL_PROBABILITY_LOTTO,
  POSITIONAL_PROBABILITY_LOTTO,
  type SubscriptionTierCode,
  convertToNumbers,
  enforceMinDate,
  safeBig,
} from '@lotto/shared';

import {
  type EstonianLottoDrawWinningsDto,
  type LottoDrawSearchDto,
  LottoProbabilityDto,
  LottoProbabilityNumbersDto,
} from '../../models';
import type {LoggerService} from '../logger/loggerService';
import type {LottoDrawService} from '../lottoDraw/lottoDrawService';

import {
  calculateNumberStatsWithCI,
  calculatePositionalNumberStatsWithCI,
} from './helpers/calculateProbability';
import type {WinningNumbers} from './types';

@injectable({scope: BindingScope.SINGLETON})
export class LottoProbabilityService {
  constructor(
    @inject('services.LoggerService')
    private loggerService: LoggerService,
    @inject('services.LottoDrawService')
    private lottoDrawService: LottoDrawService,
  ) {}

  async calculateProbability(
    data: LottoDrawSearchDto,
    subscriptionTier: SubscriptionTierCode,
  ): Promise<LottoProbabilityDto> {
    // Enforce date range based on subscription tier
    if (data.dateFrom) {
      data.dateFrom = enforceMinDate(data.dateFrom, subscriptionTier);
    }

    this.validatePayload(data);
    const estonianLottoDraws: LottoDrawRelations[] = await this.lottoDrawService.findDraws(data);

    const totalDraws = estonianLottoDraws.length;
    const {lottoType} = data;
    const result = this.calculateProbabilityByType(estonianLottoDraws, lottoType);

    return this.buildLottoProbabilityDto(result, lottoType, totalDraws);
  }

  private calculateProbabilityByType(
    draws: LottoDrawRelations[],
    lottoType: LottoType,
  ): LottoProbabilityNumbersDto[] {
    if (OVERALL_PROBABILITY_LOTTO.includes(lottoType)) {
      return this.calculateOverallProbability(draws, lottoType);
    }
    if (POSITIONAL_PROBABILITY_LOTTO.includes(lottoType)) {
      return this.calculatePositionalProbability(draws, lottoType);
    }
    return [];
  }

  private validatePayload(payload: LottoDrawSearchDto) {
    const {lottoType} = payload;

    if (!ALL_PROBABILITY_LOTTO.includes(lottoType)) {
      this.loggerService.logError({
        message: `Lotto type ${lottoType} is not supported.`,
        errorConstructor: HttpErrors.BadRequest,
      });
    }
  }

  private calculatePositionalProbability(
    draws: LottoDrawRelations[],
    lottoType: LottoType,
  ): LottoProbabilityNumbersDto[] {
    const allResults: WinningNumbers[] = draws.map((draw: LottoDrawRelations) => {
      return draw.results.reduce<WinningNumbers>(
        (acc, result) => {
          acc.winningNumbers.push(...convertToNumbers(result.winningNumber));
          acc.secWinningNumbers.push(...convertToNumbers(result.secWinningNumber));
          return acc;
        },
        {winningNumbers: [], secWinningNumbers: []},
      );
    });

    return [
      new LottoProbabilityNumbersDto({
        winClass: null,
        winningNumbersCount: calculatePositionalNumberStatsWithCI(
          allResults.map(result => result.winningNumbers),
          lottoType,
        ),
        secWinningNumbersCount: calculatePositionalNumberStatsWithCI(
          allResults.map(result => result.secWinningNumbers),
          lottoType,
          true,
        ),
      }),
    ];
  }

  private calculateOverallProbability(
    draws: LottoDrawRelations[],
    lottoType: LottoType,
  ): LottoProbabilityNumbersDto[] {
    const allResults: EstonianLottoDrawWinningsDto[] = draws.flatMap(
      (draw: LottoDrawRelations) => draw.results,
    );

    const resultsByWinClass = groupBy(allResults, result => result.winClass);

    return Object.entries(resultsByWinClass).map(([winClassStr, results]) => {
      const winClass = safeBig(winClassStr).toNumber();

      const combinedNumbers = results.reduce<WinningNumbers>(
        (acc, result) => {
          acc.winningNumbers.push(...convertToNumbers(result.winningNumber));
          acc.secWinningNumbers.push(...convertToNumbers(result.secWinningNumber));
          return acc;
        },
        {winningNumbers: [], secWinningNumbers: []},
      );

      return new LottoProbabilityNumbersDto({
        winClass,
        winningNumbersCount: calculateNumberStatsWithCI(
          combinedNumbers.winningNumbers,
          lottoType,
          results.length,
          false,
          winClass,
        ),
        secWinningNumbersCount: calculateNumberStatsWithCI(
          combinedNumbers.secWinningNumbers,
          lottoType,
          results.length,
          true,
          winClass,
        ),
      });
    });
  }

  private buildLottoProbabilityDto(
    probabilityNumbers: LottoProbabilityNumbersDto[],
    lottoType: LottoType,
    totalDraws: number,
  ) {
    return new LottoProbabilityDto({lottoType, probabilityNumbers, totalDraws});
  }
}
