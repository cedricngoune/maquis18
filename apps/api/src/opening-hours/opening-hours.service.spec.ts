import { BadRequestException } from '@nestjs/common';
import type { OpeningDayDto } from './dto/update-opening-hours.dto';
import { OpeningHoursService } from './opening-hours.service';

const week = (overrides: Partial<Record<number, Partial<OpeningDayDto>>> = {}): OpeningDayDto[] =>
  [1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => ({
    dayOfWeek,
    isOpen: true,
    opensAt: '11:00',
    closesAt: '22:00',
    ...overrides[dayOfWeek],
  }));

describe('OpeningHoursService', () => {
  let rows: { dayOfWeek: number; opensAt: string; closesAt: string }[];
  let prisma: Record<string, unknown> & { $transaction: jest.Mock };
  let service: OpeningHoursService;

  beforeEach(() => {
    rows = [
      { dayOfWeek: 0, opensAt: '12:00', closesAt: '16:00' },
      { dayOfWeek: 1, opensAt: '11:00', closesAt: '22:00' },
    ];
    const openingHour = {
      findMany: jest.fn(async () => rows),
      deleteMany: jest.fn(() => 'delete'),
      createMany: jest.fn(({ data }) => {
        rows = data;
        return 'create';
      }),
    };
    prisma = { openingHour, $transaction: jest.fn(async () => []) };
    service = new OpeningHoursService(prisma as never);
  });

  it('lists the open days, Monday first', async () => {
    expect((await service.list()).map((hour) => hour.dayOfWeek)).toEqual([1, 0]);
  });

  it('lists the whole week for the admin, closed days included', async () => {
    const week = await service.listWeek();

    expect(week).toHaveLength(7);
    expect(week[0]).toEqual({ dayOfWeek: 1, isOpen: true, opensAt: '11:00', closesAt: '22:00' });
    expect(week[1]).toMatchObject({ dayOfWeek: 2, isOpen: false });
  });

  it('replaces the week in a single transaction, keeping only open days', async () => {
    await service.replaceWeek(week({ 0: { isOpen: false } }));

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(rows).toHaveLength(6);
    expect(rows.some((row) => row.dayOfWeek === 0)).toBe(false);
  });

  it('refuses a day that closes less than 30 minutes after opening, on that day’s field', async () => {
    const promise = service.replaceWeek(week({ 3: { opensAt: '21:00', closesAt: '21:15' } }));

    await expect(promise).rejects.toBeInstanceOf(BadRequestException);
    await expect(promise).rejects.toMatchObject({ response: { errors: { 'days.2.closesAt': expect.any(String) } } });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('ignores the hours of a closed day', async () => {
    await expect(service.replaceWeek(week({ 3: { isOpen: false, closesAt: '11:00' } }))).resolves.toBeDefined();
  });

  it('refuses a week where a day appears twice', async () => {
    const duplicated = week();
    duplicated[6] = { ...duplicated[6], dayOfWeek: 1 };

    await expect(service.replaceWeek(duplicated)).rejects.toMatchObject({
      response: { errors: { days: expect.any(String) } },
    });
  });
});
