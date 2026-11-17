import {
  DEFAULT_OPENING_HOURS,
  formatTimeFr,
  getBookableSlots,
  summarizeOpeningHours,
  type OpeningHourDto,
} from '@maquis18/shared';

const day = (dayOfWeek: number, opensAt = '11:00', closesAt = '22:00'): OpeningHourDto => ({
  dayOfWeek,
  opensAt,
  closesAt,
});

describe('opening hours helpers (packages/shared)', () => {
  describe('formatTimeFr', () => {
    it.each([
      ['11:00', '11 h'],
      ['09:00', '9 h'],
      ['21:30', '21 h 30'],
    ])('formats %s as "%s"', (time, expected) => expect(formatTimeFr(time)).toBe(expected));
  });

  describe('summarizeOpeningHours', () => {
    it('says "Tous les jours" when every day has the same hours', () => {
      expect(summarizeOpeningHours(DEFAULT_OPENING_HOURS)).toEqual(['Tous les jours, 11 h – 22 h']);
    });

    it('groups consecutive days and lists closed days, Monday first', () => {
      const hours = [day(1), day(2), day(3), day(4), day(5), day(6, '12:00', '23:00')]; // closed on Sunday
      expect(summarizeOpeningHours(hours)).toEqual([
        'Lundi – Vendredi : 11 h – 22 h',
        'Samedi : 12 h – 23 h',
        'Dimanche : fermé',
      ]);
    });

    it('says "Fermé" when no day is open', () => {
      expect(summarizeOpeningHours([])).toEqual(['Fermé']);
    });
  });

  describe('getBookableSlots', () => {
    it('offers quarter hours from opening to 30 minutes before closing, grouped by service', () => {
      const groups = getBookableSlots(DEFAULT_OPENING_HOURS, '2030-03-12');

      expect(groups?.map((group) => group.label)).toEqual(['Midi', 'Après-midi', 'Soir']);
      expect(groups?.[0].slots[0]).toBe('11:00');
      expect(groups?.[2].slots.at(-1)).toBe('21:30');
      expect(groups?.flatMap((group) => group.slots)).toHaveLength(43);
    });

    it('returns null on a closed day', () => {
      const closedOnTuesday = DEFAULT_OPENING_HOURS.filter((hour) => hour.dayOfWeek !== 2);
      expect(getBookableSlots(closedOnTuesday, '2030-03-12')).toBeNull(); // 12 March 2030 is a Tuesday
    });

    it('drops empty groups (evening-only opening)', () => {
      const groups = getBookableSlots([day(2, '18:00', '23:00')], '2030-03-12');
      expect(groups).toEqual([{ label: 'Soir', slots: expect.arrayContaining(['18:00', '22:30']) }]);
    });
  });
});
