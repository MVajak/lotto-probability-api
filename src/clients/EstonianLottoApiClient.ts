import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';

import {DateFormat} from '../common/types';
import {formatDate} from '../common/utils/dates';
import {EstonianLottoDrawDto} from '../models/EstonianLotto/EstonianLottoDrawDto';
import {EstonianLottoDrawsResultDto} from '../models/EstonianLotto/EstonianLottoDrawsResultDto';
import {EstonianLottoPayloadDto} from '../models/EstonianLotto/EstonianLottoPayloadDto';
import {LoggerService} from '../services/logger/loggerService';

import {getEstonianLottoHeaders} from './helpers/getEstonianLottoHeaders';
import {EstonianLottoSearchDto, PageableEstonianLottoSearchDto} from './types';

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
        message: 'Could not fetch lotto draws. Issue on eestilotto.ee side.',
        errorConstructor: HttpErrors.BadRequest,
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
      gameTypes: data.lottoType,
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
