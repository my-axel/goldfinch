import {
  toDateObject,
  toISODateString,
  formatDisplayDate,
  parseFormDate,
} from '../lib/dateUtils';

describe('dateUtils', () => {
  describe('toDateObject', () => {
    it('converts valid inputs to Date objects', () => {
      const date = new Date('2024-03-15');
      expect(toDateObject(date)).toEqual(date);
      expect(toDateObject('2024-03-15')).toEqual(new Date('2024-03-15'));
    });

    it('returns null for invalid inputs', () => {
      expect(toDateObject(null)).toBeNull();
      expect(toDateObject('invalid')).toBeNull();
    });
  });

  describe('toISODateString', () => {
    it('formats dates to YYYY-MM-DD', () => {
      const date = new Date('2024-03-15');
      expect(toISODateString(date)).toBe('2024-03-15');
    });

    it('returns empty string for invalid inputs', () => {
      expect(toISODateString(null)).toBe('');
      expect(toISODateString('invalid')).toBe('');
    });
  });

  describe('formatDisplayDate', () => {
    it('formats dates according to locale', () => {
      const date = new Date('2024-03-15');
      expect(formatDisplayDate(date, 'en-US')).toBe('03/15/2024');
      expect(formatDisplayDate(date, 'de-DE')).toBe('15.03.2024');
    });

    it('returns empty string for invalid inputs', () => {
      expect(formatDisplayDate(null)).toBe('');
      expect(formatDisplayDate('invalid')).toBe('');
    });
  });

  describe('parseFormDate', () => {
    it('parses date strings to UTC midnight', () => {
      const result = parseFormDate('2024-03-15');
      expect(result.toISOString().split('T')[0]).toBe('2024-03-15');
      expect(result.getUTCHours()).toBe(0);
    });

    it('throws for invalid dates', () => {
      expect(() => parseFormDate('invalid')).toThrow();
    });
  });
}); 