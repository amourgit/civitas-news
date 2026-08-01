import { describe, it, expect } from 'vitest';
import { formatDateFull, formatDateRelative } from '../formatDate';

describe('formatDate utilities', () => {
  it('formats full date correctly', () => {
    const isoString = '2025-05-15T10:00:00Z';
    const formatted = formatDateFull(isoString);
    expect(formatted).toContain('2025');
  });

  it('formats relative date correctly for recent time', () => {
    const now = new Date().toISOString();
    const formatted = formatDateRelative(now);
    expect(formatted).toMatch(/À l'instant|Il y a/);
  });
});
