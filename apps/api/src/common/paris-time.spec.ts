import { getDayOfWeek, getParisNow, isValidCalendarDate, toMinutes } from './paris-time';

describe('paris-time', () => {
  describe('toMinutes', () => {
    it.each([
      ['00:00', 0],
      ['11:00', 660],
      ['19:30', 1170],
      ['23:59', 1439],
    ])('converts %s to %i minutes', (time, minutes) => {
      expect(toMinutes(time)).toBe(minutes);
    });
  });

  describe('getDayOfWeek', () => {
    it('returns 0 for a Sunday and 6 for a Saturday', () => {
      expect(getDayOfWeek('2026-11-08')).toBe(0);
      expect(getDayOfWeek('2026-11-07')).toBe(6);
    });
  });

  describe('isValidCalendarDate', () => {
    it('accepts real dates, including 29 February of a leap year', () => {
      expect(isValidCalendarDate('2026-11-07')).toBe(true);
      expect(isValidCalendarDate('2028-02-29')).toBe(true);
    });

    it.each(['2026-02-29', '2026-02-31', '2026-13-01', '2026-04-31'])('rejects %s', (date) => {
      expect(isValidCalendarDate(date)).toBe(false);
    });
  });

  describe('getParisNow', () => {
    it('uses Paris time in winter (UTC+1)', () => {
      expect(getParisNow(new Date('2026-01-15T22:30:00Z'))).toEqual({ date: '2026-01-15', time: '23:30' });
    });

    it('uses Paris time in summer (UTC+2) and changes day before UTC does', () => {
      expect(getParisNow(new Date('2026-07-15T22:30:00Z'))).toEqual({ date: '2026-07-16', time: '00:30' });
    });
  });
});
