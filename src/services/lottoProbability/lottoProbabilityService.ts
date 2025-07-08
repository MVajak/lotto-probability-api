import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {groupBy} from 'lodash';

import {
  ALL_PROBABILITY_LOTTO,
  LottoType,
  OVERALL_PROBABILITY_LOTTO,
  POSITIONAL_PROBABILITY_LOTTO,
} from '../../common/types';
import {safeBig} from '../../common/utils/calculations';
import {convertToNumbers} from '../../common/utils/conversions';
import {isDateBefore} from '../../common/utils/dates';
import {EstonianLottoDrawWinningsDto} from '../../models/EstonianLotto/EstonianLottoDrawWinningsDto';
import {LottoDrawRelations} from '../../models/LottoDraw';
import {LottoDrawSearchDto} from '../../models/LottoNumbers/LottoDrawSearchDto';
import {LottoProbabilityDto} from '../../models/LottoNumbers/LottoProbabilityDto';
import {LottoProbabilityNumbersDto} from '../../models/LottoNumbers/LottoProbabilityNumbersDto';
import {LoggerService} from '../logger/loggerService';
import {LottoDrawService} from '../lottoDraw/lottoDrawService';

import {calculateNumberStats, calculatePositionalNumberStats} from './helpers/calculateProbability';
import {WinningNumbers} from './types';

@injectable({scope: BindingScope.SINGLETON})
export class LottoProbabilityService {
  constructor(
    @inject('services.LoggerService')
    private loggerService: LoggerService,
    @inject('services.LottoDrawService')
    private lottoDrawService: LottoDrawService,
  ) {}

  async calculateProbability(data: LottoDrawSearchDto): Promise<LottoProbabilityDto> {
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
    } else if (POSITIONAL_PROBABILITY_LOTTO.includes(lottoType)) {
      return this.calculatePositionalProbability(draws, lottoType);
    } else {
      return [];
    }
  }

  private validatePayload(payload: LottoDrawSearchDto) {
    const {lottoType, dateFrom, dateTo} = payload;

    if (!ALL_PROBABILITY_LOTTO.includes(lottoType)) {
      this.loggerService.logError({
        message: `Lotto type ${lottoType} is not supported.`,
        errorConstructor: HttpErrors.BadRequest,
      });
    }

    if (!isDateBefore(dateFrom, dateTo)) {
      this.loggerService.logError({
        message: `Date data is incorrect.`,
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
        winningNumbersCount: calculatePositionalNumberStats(
          allResults.map(result => result.winningNumbers),
          lottoType,
        ),
        secWinningNumbersCount: calculatePositionalNumberStats(
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
        winningNumbersCount: calculateNumberStats(
          combinedNumbers.winningNumbers,
          lottoType,
          false,
          winClass,
        ),
        secWinningNumbersCount: calculateNumberStats(
          combinedNumbers.secWinningNumbers,
          lottoType,
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
