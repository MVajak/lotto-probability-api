import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import axios, {type AxiosInstance, type AxiosRequestConfig, type AxiosResponse} from 'axios';

import {DateFormat, LottoType} from '@lotto/shared';
import {formatDate} from '@lotto/shared';
import type {EstonianLottoDrawDto} from '../models';
import type {EstonianLottoDrawsResultDto} from '../models';
import {EstonianLottoPayloadDto} from '../models';
import type {LoggerService} from '../services/logger/loggerService';

import {getEstonianLottoHeaders} from './helpers/getEstonianLottoHeaders';
import type {EstonianLottoSearchDto, PageableEstonianLottoSearchDto} from './types';

/**
 * Maps internal LottoType enum values to Estonian Lotto API game type names.
 * The API expects: KENO, JOKKER, BINGO, VIKINGLOTTO, EURO
 * But our enum uses: EST_KENO, EST_JOKKER, EST_BINGO for Estonian-specific games
 */
const LOTTO_TYPE_TO_API_GAME_TYPE: Record<string, string> = {
  [LottoType.EST_KENO]: 'KENO',
  [LottoType.EST_JOKKER]: 'JOKKER',
  [LottoType.EST_BINGO]: 'BINGO',
  [LottoType.VIKINGLOTTO]: 'VIKINGLOTTO',
  [LottoType.EUROJACKPOT]: 'EURO',
};

/**
 * Reverse mapping: Estonian Lotto API game type names to internal LottoType.
 * Used to convert API responses back to our enum values.
 */
const API_GAME_TYPE_TO_LOTTO_TYPE: Record<string, LottoType> = {
  KENO: LottoType.EST_KENO,
  JOKKER: LottoType.EST_JOKKER,
  BINGO: LottoType.EST_BINGO,
  VIKINGLOTTO: LottoType.VIKINGLOTTO,
  EURO: LottoType.EUROJACKPOT,
};

/**
 * Converts a LottoType to the Estonian API's expected game type string.
 * Falls back to the original value if no mapping exists.
 */
function toApiGameType(lottoType: LottoType): string {
  return LOTTO_TYPE_TO_API_GAME_TYPE[lottoType] ?? lottoType;
}

/**
 * Converts an Estonian API game type string back to internal LottoType.
 * Falls back to the original value if no mapping exists.
 */
export function fromApiGameType(apiGameType: string): LottoType {
  return API_GAME_TYPE_TO_LOTTO_TYPE[apiGameType] ?? (apiGameType as LottoType);
}

export const ESTONIAN_LOTTO_DRAWS_URL = 'https://www.eestiloto.ee/app/ajaxDrawStatistic';
export const ESTONIAN_LOTTO_RESULT_URL = 'https://www.eestiloto.ee/et/results/';

@injectable({scope: BindingScope.SINGLETON})
export class EstonianLottoApiClient {
  constructor(
    @inject('services.LoggerService')
    protected loggerService: LoggerService,
  ) {}

  async getEstonianLottoResult(): Promise<AxiosResponse> {
    try {
      return await axios.get(ESTONIAN_LOTTO_RESULT_URL, {
        headers: getEstonianLottoHeaders(),
      });
    } catch (error) {
      this.loggerService.logError({
        message: 'Could not load results view. Issue on eestilotto.ee side.',
        errorConstructor: HttpErrors.BadRequest,
        data: axios.isAxiosError(error) ? error.response?.data : error,
      });
    }
  }

  async getEstonianLottoDraws(
    payload: EstonianLottoPayloadDto,
    client?: AxiosInstance,
    headers?: AxiosRequestConfig['headers'],
  ): Promise<EstonianLottoDrawsResultDto> {
    const clientInstance: AxiosInstance = client ?? axios;
    const config: AxiosRequestConfig = {
      headers: headers ?? getEstonianLottoHeaders(),
    };

    try {
      const response: AxiosResponse<EstonianLottoDrawsResultDto> = await clientInstance.post(
        ESTONIAN_LOTTO_DRAWS_URL,
        payload,
        config,
      );

      return response.data;
    } catch (error) {
      this.loggerService.logError({
        message: `[${payload.gameTypes}] Could not fetch lotto draws. Issue on eestilotto.ee side.`,
        errorConstructor: HttpErrors.BadRequest,
        data: axios.isAxiosError(error) ? error.response?.data : error,
      });
    }
  }

  async getAllEstonianLottoDraws(
    data: EstonianLottoSearchDto,
    csrfToken: string,
    client?: AxiosInstance,
  ): Promise<EstonianLottoDrawDto[]> {
    let pageIndex = 1;

    const headers = getEstonianLottoHeaders();
    const payload = this.generatePayloadForEstonianLotto({...data, pageIndex}, csrfToken);
    const initialResponse: EstonianLottoDrawsResultDto = await this.getEstonianLottoDraws(
      payload,
      client,
      headers,
    );

    let allDraws: EstonianLottoDrawDto[] = initialResponse.draws;
    const totalCount = initialResponse.drawCount;

    if (!allDraws?.length) {
      return [];
    }

    if (totalCount > allDraws.length) {
      while (allDraws.length < totalCount) {
        pageIndex += 1;
        const nextPagePayload = this.generatePayloadForEstonianLotto(
          {...data, pageIndex},
          csrfToken,
        );
        const nextPageResponse: EstonianLottoDrawsResultDto = await this.getEstonianLottoDraws(
          nextPagePayload,
          client,
          headers,
        );

        const draws = nextPageResponse.draws;

        if (!draws || draws.length === 0) {
          break;
        }

        allDraws = allDraws.concat(draws);
      }
    }

    return allDraws;
  }

  private generatePayloadForEstonianLotto(
    data: PageableEstonianLottoSearchDto,
    csrfToken: string,
  ): EstonianLottoPayloadDto {
    const dateTo = data.dateTo ? formatDate(data.dateTo, DateFormat.European) : '';
    const dateFrom = data.dateFrom ? formatDate(data.dateFrom, DateFormat.European) : '';

    return new EstonianLottoPayloadDto({
      gameTypes: toApiGameType(data.lottoType),
      dateFrom,
      dateTo,
      drawLabelFrom: '',
      drawLabelTo: '',
      pageIndex: data.pageIndex.toString(),
      orderBy: 'drawDate_desc',
      sortLabelNumeric: 'true',
      csrfToken,
    });
  }
}
