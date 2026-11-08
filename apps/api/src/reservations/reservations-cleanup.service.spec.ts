import { ReservationsCleanupService, subtractMonths } from './reservations-cleanup.service';

describe('subtractMonths', () => {
  it.each([
    ['2026-11-07', 12, '2025-11-07'],
    ['2026-01-15', 1, '2025-12-15'],
    ['2026-03-31', 1, '2026-02-28'], // end of month is clamped
    ['2028-02-29', 12, '2027-02-28'],
  ])('%s minus %i month(s) is %s', (date, months, expected) => {
    expect(subtractMonths(date, months)).toBe(expected);
  });
});

describe('ReservationsCleanupService', () => {
  afterEach(() => jest.useRealTimers());

  it('deletes the reservations older than the retention period', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-07T02:00:00Z')); // 03:00 in Paris
    const deleteMany = jest.fn().mockResolvedValue({ count: 3 });
    const service = new ReservationsCleanupService({ reservation: { deleteMany } } as never);

    await expect(service.deleteExpiredReservations()).resolves.toBe(3);
    expect(deleteMany).toHaveBeenCalledWith({ where: { date: { lt: new Date('2025-11-07T00:00:00Z') } } });
  });
});
