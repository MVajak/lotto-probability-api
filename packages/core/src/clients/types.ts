import type {LottoDrawSearchDto} from '../models';

export type EstonianLottoSearchDto = Partial<LottoDrawSearchDto> &
  Pick<LottoDrawSearchDto, 'lottoType'>;
export type PageableEstonianLottoSearchDto = EstonianLottoSearchDto & {pageIndex: number};
