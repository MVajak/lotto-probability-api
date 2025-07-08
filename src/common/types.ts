export enum LottoType {
  EURO = 'EURO',
  VIKINGLOTTO = 'VIKINGLOTTO',
  BINGO = 'BINGO',
  KENO = 'KENO',
  JOKKER = 'JOKKER',
}

export interface NumberStat {
  position: number | null;
  digit: number;
  count: number;
  probability: number;
}

export enum DateFormat {
  European = 'dd.MM.yyyy',
}

export const OVERALL_PROBABILITY_LOTTO = [
  LottoType.EURO,
  LottoType.VIKINGLOTTO,
  LottoType.KENO,
  LottoType.BINGO,
];
export const POSITIONAL_PROBABILITY_LOTTO = [LottoType.JOKKER];

export const ALL_PROBABILITY_LOTTO = [
  ...OVERALL_PROBABILITY_LOTTO,
  ...POSITIONAL_PROBABILITY_LOTTO,
];
