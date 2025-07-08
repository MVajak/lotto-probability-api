import {LottoDrawSearchDto} from '../models/LottoNumbers/LottoDrawSearchDto';

export type EstonianLottoSearchDto = Partial<LottoDrawSearchDto> &
  Pick<LottoDrawSearchDto, 'lottoType'>;
export type PageableEstonianLottoSearchDto = EstonianLottoSearchDto & {pageIndex: number};
