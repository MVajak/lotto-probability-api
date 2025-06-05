import {BindingScope, inject, injectable} from '@loopback/core';
import {groupBy} from 'lodash';

import {EstonianLottoApiClient} from '../../clients/EstonianLottoApiClient';
import {LottoType} from '../../common/types';
import {safeBig} from '../../common/utils/calculations';
import {convertToNumbers} from '../../common/utils/conversions';
import {EstonianLottoDrawDto} from '../../models/EstonianLotto/EstonianLottoDrawDto';
import {EstonianLottoDrawResultDto} from '../../models/EstonianLotto/EstonianLottoDrawResultDto';
import {LottoProbabilityDto} from '../../models/LottoNumbers/LottoProbabilityDto';
import {LottoProbabilityNumbersDto} from '../../models/LottoNumbers/LottoProbabilityNumbersDto';
import {LottoSearchDto} from '../../models/LottoNumbers/LottoSearchDto';
import {CsrfService} from '../csrf/csrf.service';

import {calculateNumberStats, calculatePositionalNumberStats} from './helpers/calculateProbability';
import {OVERALL_PROBABILITY_LOTTO, POSITIONAL_PROBABILITY_LOTTO, WinningNumbers} from './types';

@injectable({scope: BindingScope.SINGLETON})
export class LottoProbabilityService {
  constructor(
    @inject('services.CsrfService')
    protected csrfService: CsrfService,
    @inject('clients.EstonianLottoApiClient')
    protected estonianLottoApiClient: EstonianLottoApiClient,
  ) {}

  async calculateProbability(data: LottoSearchDto): Promise<LottoProbabilityDto> {
    const estonianLottoDraws: EstonianLottoDrawDto[] = await this.fetchEstonianLottoDraws(data);

    const totalDraws = estonianLottoDraws.length;
    const {lottoType} = data;
    const result = this.calculateProbabilityByType(estonianLottoDraws, lottoType);

    return this.buildLottoProbabilityDto(result, lottoType, totalDraws);
  }

  private async fetchEstonianLottoDraws(data: LottoSearchDto): Promise<EstonianLottoDrawDto[]> {
    const csrfToken = await this.csrfService.getCsrfToken();
    const client = this.csrfService.getClient();

    return this.estonianLottoApiClient.getAllEstonianLottoDraws(data, csrfToken, client);
  }

  private calculateProbabilityByType(
    draws: EstonianLottoDrawDto[],
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

  private calculatePositionalProbability(
    draws: EstonianLottoDrawDto[],
    lottoType: LottoType,
  ): LottoProbabilityNumbersDto[] {
    const allResults: WinningNumbers[] = draws.map((draw: EstonianLottoDrawDto) => {
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
    draws: EstonianLottoDrawDto[],
    lottoType: LottoType,
  ): LottoProbabilityNumbersDto[] {
    const allResults: EstonianLottoDrawResultDto[] = draws.flatMap(
      (draw: EstonianLottoDrawDto) => draw.results,
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
