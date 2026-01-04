import { formatCurrency, formatDate, formatDateTime } from '../format';

describe('Format Utils', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(1000000)).toBe('1.000.000 ₫');
    });

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('0 ₫');
    });

    it('formats negative numbers correctly', () => {
      expect(formatCurrency(-500000)).toBe('-500.000 ₫');
    });

    it('formats decimal numbers correctly', () => {
      expect(formatCurrency(1500.50)).toContain('1.500');
    });
  });

  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const date = '2026-01-04';
      const formatted = formatDate(date);
      expect(formatted).toMatch(/04\/01\/2026/);
    });

    it('formats Date object correctly', () => {
      const date = new Date('2026-01-04');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/04\/01\/2026/);
    });
  });

  describe('formatDateTime', () => {
    it('formats datetime with time', () => {
      const date = '2026-01-04T10:30:00';
      const formatted = formatDateTime(date);
      expect(formatted).toContain('04/01/2026');
      expect(formatted).toContain('10:30');
    });
  });
});
