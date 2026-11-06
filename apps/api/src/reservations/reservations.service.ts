import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LAST_BOOKING_BEFORE_CLOSING_MINUTES,
  SLOT_MINUTES,
  type AdminReservationDto,
  type ApiErrorResponse,
  type ReservationDto,
  type ReservationField,
  type ReservationStatus,
} from '@maquis18/shared';
import { Prisma, type OpeningHour, type Reservation } from '@prisma/client';
import { CaptchaService } from '../captcha/captcha.service';
import { getDayOfWeek, getParisNow, isValidCalendarDate, toMinutes } from '../common/paris-time';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { buildReservationEmail } from './reservation-emails';
import { buildReservationSms } from './reservation-sms';

/** Statuses that take seats in a slot (a cancelled table frees its seats) */
const ACTIVE_STATUSES: ReservationStatus[] = ['PENDING', 'CONFIRMED'];
const DEFAULT_SLOT_CAPACITY = 12;
const MAX_SUGGESTIONS = 3;

/** Thrown inside the transaction when the slot has no room left */
class SlotFullError extends Error {}

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);
  /** Maximum number of guests (covers) per quarter-hour slot */
  private readonly slotCapacity: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly sms: SmsService,
    private readonly captcha: CaptchaService,
    config: ConfigService,
  ) {
    this.slotCapacity = Number(config.get('RESERVATION_SLOT_CAPACITY') ?? DEFAULT_SLOT_CAPACITY);
  }

  async create(dto: CreateReservationDto, ip?: string): Promise<ReservationDto> {
    // 1. Anti-spam: a bot that fills the hidden field is stopped before any other work
    if (dto.website) {
      this.logger.warn(`Réservation refusée : champ piège rempli (IP ${ip ?? 'inconnue'})`);
      throw new BadRequestException({ statusCode: 400, message: 'Requête refusée.' } satisfies ApiErrorResponse);
    }
    await this.captcha.assertHuman(dto.captchaToken, ip);

    // 2. Business rules on the date and time
    const openingHour = await this.assertSlotIsBookable(dto.date, dto.time);
    const date = new Date(`${dto.date}T00:00:00Z`);

    // 3. Capacity check + insert, atomically
    let reservation: Reservation;
    try {
      reservation = await this.insertIfSlotHasRoom(date, dto);
    } catch (error) {
      if (!(error instanceof SlotFullError)) throw error;

      const suggestedTimes = await this.findNearbyFreeSlots(date, dto.date, dto.time, dto.guests, openingHour);
      const message = suggestedTimes.length
        ? `Ce créneau est complet. Il reste de la place à ${suggestedTimes.join(', ')}.`
        : 'Ce créneau est complet. Essayez un autre jour ou appelez-nous.';
      throw new BadRequestException({
        statusCode: 400,
        message,
        errors: { time: message },
        suggestedTimes,
      } satisfies ApiErrorResponse);
    }

    // 4. Confirmation e-mail + SMS (a sending failure is logged, the reservation stays valid)
    await this.notify('received', reservation);
    return this.toDto(reservation);
  }

  /**
   * Counts the seats already taken in the slot and inserts only if there is room.
   * "Serializable" isolation: two people booking the last seats at the same moment
   * cannot both succeed; PostgreSQL makes one of them fail, and we retry it.
   */
  private async insertIfSlotHasRoom(date: Date, dto: CreateReservationDto, attempt = 1): Promise<Reservation> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const taken = await this.countTakenSeats(tx, date, dto.time);
          if (taken + dto.guests > this.slotCapacity) {
            throw new SlotFullError();
          }
          return tx.reservation.create({
            data: { date, time: dto.time, guests: dto.guests, name: dto.name, phone: dto.phone, email: dto.email },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      // P2034 = write conflict detected by PostgreSQL: retry with fresh numbers
      const isConflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
      if (isConflict && attempt < 3) {
        return this.insertIfSlotHasRoom(date, dto, attempt + 1);
      }
      throw error;
    }
  }

  private async countTakenSeats(client: Prisma.TransactionClient | PrismaService, date: Date, time: string) {
    const result = await client.reservation.aggregate({
      _sum: { guests: true },
      where: { date, time, status: { in: ACTIVE_STATUSES } },
    });
    return result._sum.guests ?? 0;
  }

  /** Up to 3 slots, closest first, within 1 hour of the requested time, that can still seat the group */
  private async findNearbyFreeSlots(
    date: Date,
    isoDate: string,
    time: string,
    guests: number,
    openingHour: OpeningHour,
  ): Promise<string[]> {
    const requested = toMinutes(time);
    const firstSlot = toMinutes(openingHour.opensAt);
    const lastSlot = toMinutes(openingHour.closesAt) - LAST_BOOKING_BEFORE_CLOSING_MINUTES;
    const now = getParisNow();

    const candidates: number[] = [];
    for (let offset = SLOT_MINUTES; offset <= 60; offset += SLOT_MINUTES) {
      candidates.push(requested - offset, requested + offset);
    }
    const bookable = candidates.filter(
      (minutes) =>
        minutes >= firstSlot &&
        minutes <= lastSlot &&
        (isoDate !== now.date || minutes > toMinutes(now.time)),
    );

    // One query for the whole day, then count per slot in memory
    const taken = await this.prisma.reservation.groupBy({
      by: ['time'],
      _sum: { guests: true },
      where: { date, status: { in: ACTIVE_STATUSES } },
    });
    const takenByTime = new Map(taken.map((slot) => [slot.time, slot._sum.guests ?? 0]));

    return bookable
      .map(toTime)
      .filter((slot) => (takenByTime.get(slot) ?? 0) + guests <= this.slotCapacity)
      .slice(0, MAX_SUGGESTIONS);
  }

  // ---------- Admin ----------

  /** All reservations of one day (today in Paris by default), earliest first */
  async listForDay(date?: string): Promise<AdminReservationDto[]> {
    const day = date ?? getParisNow().date;
    if (!isValidCalendarDate(day)) {
      this.fail('date', 'Cette date n’existe pas.');
    }

    const reservations = await this.prisma.reservation.findMany({
      where: { date: new Date(`${day}T00:00:00Z`) },
      orderBy: [{ time: 'asc' }, { createdAt: 'asc' }],
    });
    return reservations.map((reservation) => this.toAdminDto(reservation));
  }

  async updateStatus(id: string, status: ReservationStatus): Promise<AdminReservationDto> {
    const existing = await this.prisma.reservation.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Réservation introuvable.');
    }

    const reservation = await this.prisma.reservation.update({ where: { id }, data: { status } });

    // Tell the customer, only when the status really changes
    if (existing.status !== status && (status === 'CONFIRMED' || status === 'CANCELLED')) {
      await this.notify(status === 'CONFIRMED' ? 'confirmed' : 'cancelled', reservation);
    }
    return this.toAdminDto(reservation);
  }

  // ---------- Helpers ----------

  /** E-mail and SMS are sent in parallel; neither can throw */
  private async notify(kind: 'received' | 'confirmed' | 'cancelled', reservation: Reservation): Promise<void> {
    const email = reservation.email; // null for reservations created before e-mails existed
    await Promise.all([
      email ? this.mail.send(buildReservationEmail(kind, { ...reservation, email })) : null,
      this.sms.send(reservation.phone, buildReservationSms(kind, reservation)),
    ]);
  }

  /** Business rules: a real date, not in the past, during opening hours. Returns that day's hours. */
  private async assertSlotIsBookable(date: string, time: string): Promise<OpeningHour> {
    if (!isValidCalendarDate(date)) {
      this.fail('date', 'Cette date n’existe pas.');
    }

    const now = getParisNow();
    if (date < now.date || (date === now.date && toMinutes(time) <= toMinutes(now.time))) {
      this.fail('date', 'Merci de choisir une date et une heure à venir.');
    }

    const openingHour = await this.prisma.openingHour.findUnique({
      where: { dayOfWeek: getDayOfWeek(date) },
    });
    if (!openingHour) {
      this.fail('date', 'Le restaurant est fermé ce jour-là.');
    }

    const requested = toMinutes(time);
    const lastBooking = toMinutes(openingHour.closesAt) - LAST_BOOKING_BEFORE_CLOSING_MINUTES;
    if (requested < toMinutes(openingHour.opensAt) || requested > lastBooking) {
      this.fail('time', `Nous prenons les réservations de ${openingHour.opensAt} à ${toTime(lastBooking)}.`);
    }
    return openingHour;
  }

  private fail(field: ReservationField, message: string): never {
    const body: ApiErrorResponse = { statusCode: 400, message, errors: { [field]: message } };
    throw new BadRequestException(body);
  }

  private toAdminDto(reservation: Reservation): AdminReservationDto {
    return {
      ...this.toDto(reservation),
      phone: reservation.phone,
      createdAt: reservation.createdAt.toISOString(),
    };
  }

  private toDto(reservation: Reservation): ReservationDto {
    return {
      id: reservation.id,
      date: reservation.date.toISOString().slice(0, 10),
      time: reservation.time,
      guests: reservation.guests,
      name: reservation.name,
      email: reservation.email,
      status: reservation.status,
    };
  }
}
