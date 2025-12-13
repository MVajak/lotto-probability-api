import {BindingScope, injectable} from '@loopback/core';
import type {Where} from '@loopback/filter/src/query';
import {repository} from '@loopback/repository';
import type {Options} from '@loopback/repository/src/common-types';

import type {LottoDrawResult, LottoDrawResultCreateDto} from '@lotto/database';
import {LottoDrawResultRepository} from '@lotto/database';

@injectable({scope: BindingScope.SINGLETON})
export class LottoDrawResultService {
  constructor(
    @repository(LottoDrawResultRepository)
    private lottoDrawResultRepository: LottoDrawResultRepository,
  ) {}

  async createAll(
    entities: LottoDrawResultCreateDto[],
    options?: Options,
  ): Promise<LottoDrawResult[]> {
    if (!entities.length) {
      return [];
    }

    return this.lottoDrawResultRepository.createAll(entities, options);
  }

  async upsertAll(
    entities: LottoDrawResultCreateDto[],
    options?: Options,
  ): Promise<LottoDrawResult[]> {
    if (!entities.length) {
      return [];
    }

    return this.lottoDrawResultRepository.upsertAll(entities, options);
  }

  async deleteAll(where: Where, options?: Options): Promise<void> {
    await this.lottoDrawResultRepository.deleteAll(where, options);
  }

  async hardDeleteAll(where: Where, options?: Options): Promise<void> {
    await this.lottoDrawResultRepository.hardDeleteAll(where, options);
  }
}
