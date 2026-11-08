import type { ConfigService } from '@nestjs/config';
import { Prisma, type Reservation } from '@prisma/client';
import type { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

/**
 * In-memory stand-in for the part of Prisma the service uses.
 * The real queries (filters, sums, transactions) are covered by the e2e tests against PostgreSQL.
 */
function createFakePrisma() {
  const rows: Reservation[] = [];
  const sameSlot = (row: Reservation, where: { date: Date; time?: string; status: { in: string[] } }) =>
    row.date.getTime() === where.date.getTime() &&
    (where.time === undefined || row.time === where.time) &&
    where.status.in.includes(row.status);

  const reservation = {
    aggregate: jest.fn(async ({ where }) => ({
      _sum: { guests: rows.filter((row) => sameSlot(row, where)).reduce((sum, row) => sum + row.guests, 0) || null },
    })),
    groupBy: jest.fn(async ({ where }) => {
      const byTime = new Map<string, number>();
      rows
        .filter((row) => sameSlot(row, where))
        .forEach((row) => byTime.set(row.time, (byTime.get(row.time) ?? 0) + row.guests));
      return [...byTime].map(([time, guests]) => ({ time, _sum: { guests } }));
    }),
    create: jest.fn(async ({ data }) => {
      const row = {
        id: `r${rows.length + 1}`,
        status: 'PENDING',
        createdAt: new Date(),
        email: null,
        ...data,
      } as Reservation;
      rows.push(row);
      return { ...row };
    }),
    findUnique: jest.fn(async ({ where }) => {
      const row = rows.find((candidate) => candidate.id === where.id);
      return row ? { ...row } : null; // copies, like Prisma: callers can't mutate the "database"
    }),
    update: jest.fn(async ({ where, data }) => ({
      ...Object.assign(
        rows.find((row) => row.id === where.id)!,
        data,
      ),
    })),
    findMany: jest.fn(async () => [...rows]),
  };

  const prisma: {
    rows: Reservation[];
    reservation: typeof reservation;
    openingHour: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  } = {
    rows,
    reservation,
    openingHour: {
      findUnique: jest.fn(async ({ where }) => ({
        id: 'h',
        dayOfWeek: where.dayOfWeek,
        opensAt: '11:00',
        closesAt: '22:00',
      })),
    },
    $transaction: jest.fn(async (callback: (tx: unknown) => unknown): Promise<unknown> => callback(prisma)),
  };
  return prisma;
}

const validDto = (overrides: Partial<CreateReservationDto> = {}): CreateReservationDto => ({
  date: '2030-03-12',
  time: '20:00',
  guests: 2,
  name: 'Awa Diallo',
  phone: '06 12 34 56 78',
  email: 'awa@example.com',
  captchaToken: 'token',
  ...overrides,
});

describe('ReservationsService', () => {
  let prisma: ReturnType<typeof createFakePrisma>;
  let mail: { send: jest.Mock };
  let sms: { send: jest.Mock };
  let captcha: { assertHuman: jest.Mock };
  let service: ReservationsService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2030-03-10T10:00:00Z')); // two days before the booked date
    prisma = createFakePrisma();
    mail = { send: jest.fn().mockResolvedValue(true) };
    sms = { send: jest.fn().mockResolvedValue(true) };
    captcha = { assertHuman: jest.fn().mockResolvedValue(undefined) };
    const config = { get: (key: string) => (key === 'RESERVATION_SLOT_CAPACITY' ? '6' : undefined) } as ConfigService;
    service = new ReservationsService(prisma as never, mail as never, sms as never, captcha as never, config);
  });

  afterEach(() => jest.useRealTimers());

  describe('create', () => {
    it('saves a pending reservation and notifies the customer by e-mail and SMS', async () => {
      const result = await service.create(validDto(), '1.2.3.4');

      expect(result).toMatchObject({ date: '2030-03-12', time: '20:00', guests: 2, status: 'PENDING' });
      expect(captcha.assertHuman).toHaveBeenCalledWith('token', '1.2.3.4');
      expect(mail.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'awa@example.com' }));
      expect(sms.send).toHaveBeenCalledWith('06 12 34 56 78', expect.stringContaining('demande reçue'));
    });

    it('rejects a filled honeypot before any other work', async () => {
      await expect(service.create(validDto({ website: 'http://spam.example' }))).rejects.toThrow('Requête refusée.');
      expect(captcha.assertHuman).not.toHaveBeenCalled();
      expect(prisma.rows).toHaveLength(0);
    });

    it('stops when the captcha check fails', async () => {
      captcha.assertHuman.mockRejectedValue(new Error('captcha'));

      await expect(service.create(validDto())).rejects.toThrow('captcha');
      expect(prisma.rows).toHaveLength(0);
    });

    it.each([
      ['a past date', { date: '2030-03-09' }, 'date'],
      ['a time already passed today', { date: '2030-03-10', time: '11:00' }, 'date'], // it is 11:00 in Paris
      ['an impossible date', { date: '2030-02-31' }, 'date'],
      ['a time before opening', { time: '10:45' }, 'time'],
      ['a time less than 30 minutes before closing', { time: '21:45' }, 'time'],
    ])('rejects %s', async (_label, overrides, field) => {
      await expect(service.create(validDto(overrides))).rejects.toMatchObject({
        response: { errors: { [field]: expect.any(String) } },
      });
      expect(prisma.rows).toHaveLength(0);
    });

    it('accepts the last bookable slot (30 minutes before closing)', async () => {
      await expect(service.create(validDto({ time: '21:30' }))).resolves.toMatchObject({ time: '21:30' });
    });

    describe('slot capacity (6 seats in this test)', () => {
      it('accepts bookings until the slot is exactly full', async () => {
        await service.create(validDto({ guests: 4 }));
        await expect(service.create(validDto({ guests: 2 }))).resolves.toBeDefined();
      });

      it('refuses a group that does not fit, and suggests the closest slots with room', async () => {
        await service.create(validDto({ guests: 4 }));
        await service.create(validDto({ time: '19:45', guests: 5 })); // 19:45 can't seat 2 more

        await expect(service.create(validDto({ guests: 3 }))).rejects.toMatchObject({
          response: {
            errors: { time: expect.stringContaining('complet') },
            suggestedTimes: ['20:15', '19:30', '20:30'],
          },
        });
      });

      it('frees the seats of a cancelled reservation', async () => {
        const first = await service.create(validDto({ guests: 6 }));
        await service.updateStatus(first.id, 'CANCELLED');

        await expect(service.create(validDto({ guests: 6 }))).resolves.toBeDefined();
      });

      it('retries when PostgreSQL detects a concurrent booking (serialization conflict)', async () => {
        const conflict = new Prisma.PrismaClientKnownRequestError('conflict', { code: 'P2034', clientVersion: 'test' });
        prisma.$transaction.mockRejectedValueOnce(conflict);

        await expect(service.create(validDto())).resolves.toBeDefined();
        expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('updateStatus', () => {
    it('notifies the customer when a reservation is confirmed, only once', async () => {
      const { id } = await service.create(validDto());
      mail.send.mockClear();
      sms.send.mockClear();

      await service.updateStatus(id, 'CONFIRMED');
      await service.updateStatus(id, 'CONFIRMED'); // same status again: no second message

      expect(mail.send).toHaveBeenCalledTimes(1);
      expect(mail.send.mock.calls[0][0].subject).toContain('confirmée');
      expect(sms.send).toHaveBeenCalledTimes(1);
    });

    it('does not notify when a cancelled reservation is restored to pending', async () => {
      const { id } = await service.create(validDto());
      await service.updateStatus(id, 'CANCELLED');
      mail.send.mockClear();

      await service.updateStatus(id, 'PENDING');

      expect(mail.send).not.toHaveBeenCalled();
    });

    it('rejects an unknown reservation', async () => {
      await expect(service.updateStatus('missing', 'CONFIRMED')).rejects.toThrow('Réservation introuvable.');
    });
  });
});
