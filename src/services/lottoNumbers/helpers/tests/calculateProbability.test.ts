import {expect} from '@loopback/testlab';

import {LottoType} from '../../../../common/types';
import {
  countAllNumbersWithPositionalProbability,
  countAllNumbersWithProbability,
} from '../calculateProbability';
import {
  BINGO_CENTER_NUMBER_RANGE,
  BINGO_CENTER_SQUARE_GAME_WIN_CLASS,
  BINGO_CORNER_NUMBER_RANGE,
  BINGO_CORNER_SQUARE_GAME_WIN_CLASS,
  BINGO_DIAGONAL_NUMBER_RANGE,
  BINGO_DIAGONAL_SQUARE_GAME_WIN_CLASS,
  BINGO_PRIMARY_NUMBER_RANGE,
  EURO_PRIMARY_NUMBER_RANGE,
  EURO_SECONDARY_NUMBER_RANGE,
  JOKKER_PRIMARY_NUMBER_RANGE,
  KENO_PRIMARY_NUMBER_RANGE,
  VIKING_PRIMARY_NUMBER_RANGE,
  VIKING_SECONDARY_NUMBER_RANGE,
} from '../constants';

describe('calculateProbability', () => {
  describe('countAllNumbersWithProbability', () => {
    it('should return stats with correct counts and probabilities', () => {
      const numbers = [1, 1, 2, 3, 3, 3];
      const result = countAllNumbersWithProbability(numbers, LottoType.EURO);

      const stat1 = result.find(stat => stat.digit === 1);
      const stat3 = result.find(stat => stat.digit === 3);
      const totalCount = numbers.length;

      expect(stat1?.count).to.equal(2);
      expect(stat3?.count).to.equal(3);
      expect(stat1?.probability).to.be.approximately(2 / totalCount, 0.0001);
      expect(stat3?.probability).to.be.approximately(3 / totalCount, 0.0001);
    });

    it('should include all numbers in range, even if not present', () => {
      const numbers = [1, 2, 3];
      const result = countAllNumbersWithProbability(numbers, LottoType.EURO);

      expect(result.length).to.equal(EURO_PRIMARY_NUMBER_RANGE);
      expect(result.find(r => r.digit === 4)?.count).to.equal(0);
    });

    it('should return probability 0 for all if input is empty', () => {
      const result = countAllNumbersWithProbability([], LottoType.EURO);

      expect(result.every(r => r.count === 0)).to.be.true();
      expect(result.every(r => r.probability === 0)).to.be.true();
    });

    it('should handle BINGO win class and map correct range', () => {
      const numbers = [1, 2, 3, 3, 4, 5, 3, 1];
      const result = countAllNumbersWithProbability(
        numbers,
        LottoType.BINGO,
        false,
        BINGO_CENTER_SQUARE_GAME_WIN_CLASS,
      );

      expect(result.length).to.equal(BINGO_CENTER_NUMBER_RANGE);
    });

    it('should return empty list if range is 0 (invalid type)', () => {
      const result = countAllNumbersWithProbability([1, 2, 3], 'UNKNOWN' as LottoType);

      expect(result.length).to.equal(0);
    });

    describe('range path coverage', () => {
      it(`${LottoType.EURO} - should return primary range`, () => {
        const result = countAllNumbersWithProbability([1, 2], LottoType.EURO, false);
        expect(result.length).to.equal(EURO_PRIMARY_NUMBER_RANGE);
      });

      it(`${LottoType.EURO} - should return secondary range`, () => {
        const result = countAllNumbersWithProbability([1, 2], LottoType.EURO, true);
        expect(result.length).to.equal(EURO_SECONDARY_NUMBER_RANGE);
      });

      it(`${LottoType.KENO} - should return primary range`, () => {
        const result = countAllNumbersWithProbability([1], LottoType.KENO);
        expect(result.length).to.equal(KENO_PRIMARY_NUMBER_RANGE);
      });

      it(`${LottoType.VIKINGLOTTO} - should return primary range`, () => {
        const result = countAllNumbersWithProbability([1], LottoType.VIKINGLOTTO, false);
        expect(result.length).to.equal(VIKING_PRIMARY_NUMBER_RANGE);
      });

      it(`${LottoType.VIKINGLOTTO} - should return secondary range`, () => {
        const result = countAllNumbersWithProbability([1], LottoType.VIKINGLOTTO, true);
        expect(result.length).to.equal(VIKING_SECONDARY_NUMBER_RANGE);
      });

      it(`${LottoType.BINGO} - should return center win class`, () => {
        const result = countAllNumbersWithProbability(
          [1],
          LottoType.BINGO,
          false,
          BINGO_CENTER_SQUARE_GAME_WIN_CLASS,
        );
        expect(result.length).to.equal(BINGO_CENTER_NUMBER_RANGE);
      });

      it(`${LottoType.BINGO} - should return corner win class`, () => {
        const result = countAllNumbersWithProbability(
          [1],
          LottoType.BINGO,
          false,
          BINGO_CORNER_SQUARE_GAME_WIN_CLASS,
        );
        expect(result.length).to.equal(BINGO_CORNER_NUMBER_RANGE);
      });

      it(`${LottoType.BINGO} - should return diagonal win class`, () => {
        const result = countAllNumbersWithProbability(
          [1],
          LottoType.BINGO,
          false,
          BINGO_DIAGONAL_SQUARE_GAME_WIN_CLASS,
        );
        expect(result.length).to.equal(BINGO_DIAGONAL_NUMBER_RANGE);
      });

      it(`${LottoType.BINGO} - should return unknown win class (fallback)`, () => {
        const result = countAllNumbersWithProbability([1], LottoType.BINGO, false);
        expect(result.length).to.equal(BINGO_PRIMARY_NUMBER_RANGE);
      });

      it(`${LottoType.JOKKER} - should return primary range`, () => {
        const result = countAllNumbersWithProbability([1], LottoType.JOKKER);
        expect(result.length).to.equal(JOKKER_PRIMARY_NUMBER_RANGE);
      });

      it(`Unknown LottoType - should return empty array`, () => {
        const result = countAllNumbersWithProbability([1], 'UNKNOWN' as LottoType);
        expect(result.length).to.equal(0);
      });
    });
  });

  describe('countAllNumbersWithProbability', () => {
    it('should return empty array when input is empty', () => {
      const result = countAllNumbersWithPositionalProbability([], LottoType.KENO);
      expect(result).to.deepEqual([]);
    });

    it('should throw an error when sets have inconsistent lengths', () => {
      const sets = [[1, 2], [3]];
      expect(() => countAllNumbersWithPositionalProbability(sets, LottoType.KENO)).to.throw(
        'All sets must be of equal length',
      );
    });

    it('should correctly compute frequencies and probabilities per position', () => {
      const sets = [
        [1, 2],
        [1, 3],
        [2, 2],
      ];

      const result = countAllNumbersWithPositionalProbability(sets, LottoType.KENO);

      const pos0_digit1 = result.find(r => r.position === 0 && r.digit === 1);
      const pos0_digit2 = result.find(r => r.position === 0 && r.digit === 2);
      const pos1_digit2 = result.find(r => r.position === 1 && r.digit === 2);

      expect(pos0_digit1?.count).to.equal(2);
      expect(pos0_digit1?.probability).to.be.approximately(2 / 3, 0.0001);

      expect(pos0_digit2?.count).to.equal(1);
      expect(pos0_digit2?.probability).to.be.approximately(1 / 3, 0.0001);

      expect(pos1_digit2?.count).to.equal(2);
      expect(pos1_digit2?.probability).to.be.approximately(2 / 3, 0.0001);
    });

    it('includes all digits in number range even if not present', () => {
      const sets = [
        [1, 1],
        [1, 1],
      ];

      const result = countAllNumbersWithPositionalProbability(sets, LottoType.KENO);
      const pos0Stats = result.filter(r => r.position === 0);

      expect(pos0Stats.length).to.equal(KENO_PRIMARY_NUMBER_RANGE + 1);
      expect(pos0Stats.find(r => r.digit === 2)?.count).to.equal(0);
      expect(pos0Stats.find(r => r.digit === 1)?.count).to.equal(2);
    });

    it('returns probability of 0 when count is 0', () => {
      const sets = [
        [5, 5],
        [5, 5],
      ];

      const result = countAllNumbersWithPositionalProbability(sets, LottoType.KENO);
      const unused = result.find(r => r.position === 0 && r.digit === 10);

      expect(unused?.count).to.equal(0);
      expect(unused?.probability).to.equal(0);
    });
  });
});
