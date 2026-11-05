const PARIS_TIME_ZONE = 'Europe/Paris';

/** Current date and time in Paris, as "YYYY-MM-DD" and "HH:mm" strings */
export function getParisNow(now: Date = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: PARIS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
  };
}

/** "19:30" → 1170 */
export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Day of week (0 = Sunday … 6 = Saturday) of a "YYYY-MM-DD" date */
export function getDayOfWeek(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** True if the string is a real calendar date (rejects 2026-02-31) */
export function isValidCalendarDate(date: string): boolean {
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date);
}
