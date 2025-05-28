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
