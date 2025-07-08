import {model, property} from '@loopback/repository';

@model()
export class EstonianLottoDrawWinningsDto {
  @property({
    type: 'number',
    required: true,
    nullable: true,
  })
  winClass: number | null;

  @property({
    type: 'string',
    required: true,
    nullable: true,
  })
  secWinningNumber: string | null;

  @property({
    type: 'string',
    required: true,
  })
  winningNumber: string;
}
