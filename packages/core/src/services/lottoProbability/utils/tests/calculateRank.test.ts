import {expect} from '@loopback/testlab';

import {calculateRank} from '../calculateRank';

describe('calculateRank', () => {
  it('returns empty map for empty input', () => {
    const result = calculateRank(new Map());

    expect(result.size).to.equal(0);
  });

  it('returns rank 1 for single element', () => {
    const frequencies = new Map([[7, 0.5]]);

    const result = calculateRank(frequencies);

    expect(result.get(7)).to.equal(1);
  });

  it('assigns sequential ranks for distinct frequencies', () => {
    // Frequencies: 0.5 > 0.3 > 0.1
    const frequencies = new Map([
      [1, 0.3],
      [2, 0.5],
      [3, 0.1],
    ]);

    const result = calculateRank(frequencies);

    expect(result.get(2)).to.equal(1); // Highest frequency
    expect(result.get(1)).to.equal(2);
    expect(result.get(3)).to.equal(3); // Lowest frequency
  });

  it('assigns same rank to tied frequencies (standard competition ranking)', () => {
    // Two numbers tie for rank 1
    const frequencies = new Map([
      [1, 0.5],
      [2, 0.5],
      [3, 0.3],
    ]);

    const result = calculateRank(frequencies);

    // Both tied numbers get rank 1
    expect(result.get(1)).to.equal(1);
    expect(result.get(2)).to.equal(1);
    // Next number gets rank 3 (not 2) - standard competition ranking
    expect(result.get(3)).to.equal(3);
  });

  it('handles multiple ties correctly', () => {
    // Three-way tie for rank 1, then two-way tie
    const frequencies = new Map([
      [1, 0.5],
      [2, 0.5],
      [3, 0.5],
      [4, 0.3],
      [5, 0.3],
      [6, 0.1],
    ]);

    const result = calculateRank(frequencies);

    // Three-way tie for rank 1
    expect(result.get(1)).to.equal(1);
    expect(result.get(2)).to.equal(1);
    expect(result.get(3)).to.equal(1);
    // Two-way tie for rank 4 (skips 2, 3)
    expect(result.get(4)).to.equal(4);
    expect(result.get(5)).to.equal(4);
    // Last gets rank 6 (skips 5)
    expect(result.get(6)).to.equal(6);
  });

  it('handles all same frequencies (all tied)', () => {
    const frequencies = new Map([
      [1, 0.25],
      [2, 0.25],
      [3, 0.25],
      [4, 0.25],
    ]);

    const result = calculateRank(frequencies);

    // All should have rank 1
    expect(result.get(1)).to.equal(1);
    expect(result.get(2)).to.equal(1);
    expect(result.get(3)).to.equal(1);
    expect(result.get(4)).to.equal(1);
  });

  it('handles zero frequencies', () => {
    const frequencies = new Map([
      [1, 0.5],
      [2, 0],
      [3, 0],
    ]);

    const result = calculateRank(frequencies);

    expect(result.get(1)).to.equal(1);
    // Both zeros tie for rank 2
    expect(result.get(2)).to.equal(2);
    expect(result.get(3)).to.equal(2);
  });

  it('handles large number of entries', () => {
    // Create 50 entries with different frequencies
    const frequencies = new Map<number, number>();
    for (let i = 1; i <= 50; i++) {
      frequencies.set(i, i / 100); // 0.01, 0.02, ..., 0.50
    }

    const result = calculateRank(frequencies);

    // Number 50 has highest frequency (0.50), should be rank 1
    expect(result.get(50)).to.equal(1);
    // Number 1 has lowest frequency (0.01), should be rank 50
    expect(result.get(1)).to.equal(50);
    // All entries should have a rank
    expect(result.size).to.equal(50);
  });

  it('handles decimal precision correctly', () => {
    // These should NOT be considered equal (different frequencies)
    const frequencies = new Map([
      [1, 0.1234],
      [2, 0.1235],
    ]);

    const result = calculateRank(frequencies);

    expect(result.get(2)).to.equal(1); // Higher
    expect(result.get(1)).to.equal(2); // Lower
  });

  it('preserves digit keys in result map', () => {
    const frequencies = new Map([
      [42, 0.5],
      [7, 0.3],
      [13, 0.1],
    ]);

    const result = calculateRank(frequencies);

    expect(result.has(42)).to.be.true();
    expect(result.has(7)).to.be.true();
    expect(result.has(13)).to.be.true();
    expect(result.has(1)).to.be.false();
  });
});
