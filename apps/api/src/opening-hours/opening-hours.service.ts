import { BadRequestException, Injectable } from '@nestjs/common';
import {
  LAST_BOOKING_BEFORE_CLOSING_MINUTES,
  WEEK_ORDER,
  timeToMinutes,
  type ApiErrorResponse,
  type OpeningDayInput,
  type OpeningHourDto,
} from '@maquis18/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { OpeningDayDto } from './dto/update-opening-hours.dto';

const DEFAULT_WINDOW = { opensAt: '11:00', closesAt: '22:00' };

/** Opening hours: one row per open day; a day without a row is closed */
@Injectable()
export class OpeningHoursService {
  constructor(private readonly prisma: PrismaService) {}

  /** Open days only, Monday first (what the public site needs) */
  async list(): Promise<OpeningHourDto[]> {
    const rows = await this.prisma.openingHour.findMany();
    return WEEK_ORDER.flatMap((day) => {
      const row = rows.find((candidate) => candidate.dayOfWeek === day);
      return row ? [{ dayOfWeek: row.dayOfWeek, opensAt: row.opensAt, closesAt: row.closesAt }] : [];
    });
  }

  /** All 7 days, closed ones included (what the admin form needs) */
  async listWeek(): Promise<OpeningDayInput[]> {
    const open = await this.list();
    return WEEK_ORDER.map((day) => {
      const hour = open.find((candidate) => candidate.dayOfWeek === day);
      return hour ? { ...hour, isOpen: true } : { dayOfWeek: day, isOpen: false, ...DEFAULT_WINDOW };
    });
  }

  /** Replaces the whole week in one transaction: either every day is saved, or none */
  async replaceWeek(days: OpeningDayDto[]): Promise<OpeningDayInput[]> {
    this.assertWeekIsValid(days);

    const openDays = days.filter((day) => day.isOpen);
    await this.prisma.$transaction([
      this.prisma.openingHour.deleteMany(),
      this.prisma.openingHour.createMany({
        data: openDays.map(({ dayOfWeek, opensAt, closesAt }) => ({ dayOfWeek, opensAt, closesAt })),
      }),
    ]);
    return this.listWeek();
  }

  private assertWeekIsValid(days: OpeningDayDto[]): void {
    const errors: Record<string, string> = {};

    const distinctDays = new Set(days.map((day) => day.dayOfWeek));
    if (distinctDays.size !== 7) {
      errors.days = 'Chaque jour de la semaine doit apparaître une seule fois.';
    }

    days.forEach((day, index) => {
      if (!day.isOpen) return;
      // At least 30 minutes, otherwise no table could ever be booked that day
      if (timeToMinutes(day.closesAt) - timeToMinutes(day.opensAt) < LAST_BOOKING_BEFORE_CLOSING_MINUTES) {
        errors[`days.${index}.closesAt`] = 'La fermeture doit être au moins 30 minutes après l’ouverture.';
      }
    });

    if (Object.keys(errors).length > 0) {
      const body: ApiErrorResponse = { statusCode: 400, message: 'Certains horaires sont invalides.', errors };
      throw new BadRequestException(body);
    }
  }
}
