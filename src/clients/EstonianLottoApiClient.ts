import {BindingScope, injectable} from '@loopback/core';
import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';

import {EstonianLottoDrawDto} from '../models/EstonianLotto/EstonianLottoDrawDto';
import {EstonianLottoDrawsResultDto} from '../models/EstonianLotto/EstonianLottoDrawsResultDto';
import {EstonianLottoPayloadDto} from '../models/EstonianLotto/EstonianLottoPayloadDto';
import {LottoSearchDto} from '../models/LottoNumbers/LottoSearchDto';

import {getEstonianLottoHeaders} from './helpers/getEstonianLottoHeaders';

export const ESTONIAN_LOTTO_DRAWS_URL = 'https://www.eestiloto.ee/app/ajaxDrawStatistic';
export const ESTONIAN_LOTTO_RESULT_URL = 'https://www.eestiloto.ee/et/results/';

type PageableLottoSearchDto = LottoSearchDto & {pageIndex: number};

@injectable({scope: BindingScope.SINGLETON})
export class EstonianLottoApiClient {
  constructor() {}

  async getEstonianLottoResult(): Promise<AxiosResponse> {
    return axios.get(ESTONIAN_LOTTO_RESULT_URL, {
      headers: getEstonianLottoHeaders(),
    });
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

    const response: AxiosResponse<EstonianLottoDrawsResultDto> = await clientInstance.post(
      ESTONIAN_LOTTO_DRAWS_URL,
      payload,
      config,
    );

    return response.data;
  }

  async getAllEstonianLottoDraws(
    data: LottoSearchDto,
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
    data: PageableLottoSearchDto,
    csrfToken: string,
  ): EstonianLottoPayloadDto {
    return new EstonianLottoPayloadDto({
      gameTypes: data.lottoType,
      dateFrom: data.dateFrom ?? '',
      dateTo: data.dateTo ?? '',
      drawLabelFrom: '',
      drawLabelTo: '',
      pageIndex: data.pageIndex.toString(),
      orderBy: 'drawDate_desc',
      sortLabelNumeric: 'true',
      csrfToken,
    });
  }
}
