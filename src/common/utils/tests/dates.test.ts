import {expect} from '@loopback/testlab'; // adjust the import path as needed

import {DateFormat} from '../../types';
import {formatDate} from '../dates';

describe('formatDate', () => {
  it('should format date', () => {
    expect(formatDate('2025-05-12', DateFormat.European)).to.eql('12.05.2025');
  });

  it('should format date', () => {
    expect(formatDate('2025-05-12', DateFormat.European)).to.eql('12.05.2025');
  });
});
