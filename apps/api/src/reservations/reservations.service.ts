import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  LAST_BOOKING_BEFORE_CLOSING_MINUTES,
  type AdminReservationDto,
  type ApiErrorResponse,
  type ReservationDto,
  type ReservationField,
  type ReservationStatus,
} from '@maquis18/shared';
import type { Reservation } from '@prisma/client';
import { getDayOfWeek, getParisNow, isValidCalendarDate, toMinutes } from '../common/paris-time';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReservationDto): Promise<ReservationDto> {
    await this.assertSlotIsBookable(dto.date, dto.time);

    const reservation = await this.prisma.reservation.create({
      data: {
        date: new Date(`${dto.date}T00:00:00Z`),
        time: dto.time,
        guests: dto.guests,
        name: dto.name,
        phone: dto.phone,
      },
    });

    return this.toDto(reservation);
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
    return this.toAdminDto(reservation);
  }

  /** Business rules: a real date, not in the past, during opening hours */
  private async assertSlotIsBookable(date: string, time: string): Promise<void> {
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
      const lastBookingLabel = `${String(Math.floor(lastBooking / 60)).padStart(2, '0')}:${String(lastBooking % 60).padStart(2, '0')}`;
      this.fail('time', `Nous prenons les réservations de ${openingHour.opensAt} à ${lastBookingLabel}.`);
    }
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
      status: reservation.status,
    };
  }
}
