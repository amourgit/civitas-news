import { describe, it, expect } from 'vitest';
import { formatNumber, formatFileSize } from '../formatNumber';

describe('formatNumber utilities', () => {
  it('formats large numbers cleanly', () => {
    expect(formatNumber(12500)).toBe('12.5k');
    expect(formatNumber(1500000)).toBe('1.5M');
    expect(formatNumber(500)).toBe('500');
  });

  it('formats file sizes cleanly', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2 Ko');
    expect(formatFileSize(5242880)).toBe('5 Mo');
  });
});
