import {expect} from '@loopback/testlab'; // adjust the import path as needed
import {Big} from 'big.js';

import {safeBig} from '../calculations';

describe('safeBig', () => {
  it('should handle null value', () => {
    expect(safeBig(null).eq(Big(0)));
  });

  it('should handle undefined value', () => {
    expect(safeBig(undefined)).to.eql(Big(0));
  });

  it('should handle empty string', () => {
    expect(safeBig('')).to.eql(Big(0));
  });

  it('should handle whitespace string', () => {
    expect(safeBig('   ')).to.eql(Big(0));
  });

  it('should handle invalid number string', () => {
    expect(safeBig('abc')).to.eql(Big(0));
  });

  it('should handle valid number string', () => {
    expect(safeBig('123.45')).to.eql(Big('123.45'));
  });

  it('should handle string with whitespace', () => {
    expect(safeBig('  123.45  ')).to.eql(Big('123.45'));
  });

  it('should handle number value', () => {
    expect(safeBig(123.45)).to.eql(Big(123.45));
  });

  it('should handle zero', () => {
    expect(safeBig(0)).to.eql(Big(0));
  });

  it('should handle negative numbers', () => {
    expect(safeBig(-123.45)).to.eql(Big(-123.45));
  });

  it('should handle Big instance', () => {
    const bigNum = Big(123.45);
    expect(safeBig(bigNum)).to.eql(bigNum);
  });

  it('should handle scientific notation string', () => {
    expect(safeBig('1e-6')).to.eql(Big('0.000001'));
  });
});
