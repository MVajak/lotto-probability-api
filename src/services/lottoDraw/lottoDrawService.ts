import {BindingScope, injectable} from '@loopback/core';
import {Filter} from '@loopback/filter';
import {Where} from '@loopback/filter/src/query';
import {repository} from '@loopback/repository';
import {Options} from '@loopback/repository/src/common-types';

import {LottoDraw, LottoDrawCreateDto, LottoDrawRelations} from '../../models/LottoDraw';
import {LottoDrawSearchDto} from '../../models/LottoNumbers/LottoDrawSearchDto';
import {LottoDrawRepository} from '../../repositories/lottoDrawRepository';

@injectable({scope: BindingScope.SINGLETON})
export class LottoDrawService {
  constructor(
    @repository(LottoDrawRepository)
    private lottoDrawRepository: LottoDrawRepository,
  ) {}

  async findDraws(data: LottoDrawSearchDto, options?: Options): Promise<LottoDrawRelations[]> {
    const {lottoType, dateFrom, dateTo} = data;
    const filter: Filter<LottoDrawRelations> = {
      where: {
        and: [
          {drawDate: {gte: new Date(dateFrom)}},
          {drawDate: {lte: new Date(dateTo)}},
          {gameTypeName: lottoType},
        ],
      },
      include: [{relation: 'results'}],
    };

    return this.lottoDrawRepository.find(filter, options);
  }

  async find(filter: Filter<LottoDraw>, options?: Options): Promise<LottoDraw[]> {
    return this.lottoDrawRepository.find(filter, options);
  }

  async createAll(entities: LottoDrawCreateDto[], options?: Options): Promise<LottoDraw[]> {
    if (!entities.length) {
      return [];
    }

    return this.lottoDrawRepository.createAll(entities, options);
  }

  async upsertAll(entities: LottoDrawCreateDto[], options?: Options): Promise<LottoDraw[]> {
    if (!entities.length) {
      return [];
    }

    return this.lottoDrawRepository.upsertAll(entities, options);
  }

  async deleteAll(where: Where, options?: Options): Promise<void> {
    await this.lottoDrawRepository.deleteAll(where, options);
  }

  async hardDeleteAll(where: Where, options?: Options): Promise<void> {
    await this.lottoDrawRepository.hardDeleteAll(where, options);
  }
}
