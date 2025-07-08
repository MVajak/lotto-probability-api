import {BindingScope, injectable} from '@loopback/core';
import {Where} from '@loopback/filter/src/query';
import {repository} from '@loopback/repository';
import {Options} from '@loopback/repository/src/common-types';

import {LottoDrawResult, LottoDrawResultCreateDto} from '../../models/LottoDrawResult';
import {LottoDrawResultRepository} from '../../repositories/lottoDrawResultRepository';

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

  async deleteAll(where: Where, options?: Options): Promise<void> {
    await this.lottoDrawResultRepository.deleteAll(where, options);
  }

  async hardDeleteAll(where: Where, options?: Options): Promise<void> {
    await this.lottoDrawResultRepository.hardDeleteAll(where, options);
  }
}
