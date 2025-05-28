import {expect} from '@loopback/testlab';

import {convertToNumbers} from '../conversions';

describe('convertToNumbers', () => {
  it('should handle null input', () => {
    expect(convertToNumbers(null)).to.eql([]);
  });

  it('should handle empty string', () => {
    expect(convertToNumbers('')).to.eql([]);
  });

  it('should handle whitespace string', () => {
    expect(convertToNumbers('   ')).to.eql([]);
  });

  it('should convert single number string', () => {
    expect(convertToNumbers('123')).to.eql([123]);
  });

  it('should convert multiple comma-separated numbers', () => {
    expect(convertToNumbers('1,2,3,4,5')).to.eql([1, 2, 3, 4, 5]);
  });

  it('should handle decimal numbers', () => {
    expect(convertToNumbers('1.5,2.7,3.14')).to.eql([1.5, 2.7, 3.14]);
  });

  it('should handle negative numbers', () => {
    expect(convertToNumbers('-1,-2,-3')).to.eql([-1, -2, -3]);
  });

  it('should filter out invalid numbers', () => {
    expect(convertToNumbers('1,abc,2,xyz,3')).to.eql([1, 2, 3]);
  });

  it('should handle mixed valid and invalid values', () => {
    expect(convertToNumbers('1,abc,,2.5,null,3')).to.eql([1, 2.5, 3]);
  });

  it('should handle spaces between numbers', () => {
    expect(convertToNumbers('1, 2, 3')).to.eql([1, 2, 3]);
  });

  it('should handle empty values between commas', () => {
    expect(convertToNumbers('1,,2,,3')).to.eql([1, 2, 3]);
  });

  it('should handle scientific notation', () => {
    expect(convertToNumbers('1e2,1e-2')).to.eql([100, 0.01]);
  });
});
