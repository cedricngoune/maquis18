import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RESERVATION_RETENTION_MONTHS } from '@maquis18/shared';
import { getParisNow } from '../common/paris-time';
import { PrismaService } from '../prisma/prisma.service';

/** "2026-11-07" minus 12 months → "2025-11-07" (end of month is clamped: 2024-02-29 minus 12 months → 2023-02-28) */
export function subtractMonths(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 - months, 1));
  const lastDayOfTargetMonth = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDayOfTargetMonth));
  return target.toISOString().slice(0, 10);
}

/**
 * GDPR "limited retention": every night, deletes the reservations whose meal
 * took place more than RESERVATION_RETENTION_MONTHS months ago.
 * The privacy policy promises it, this service makes it true.
 */
@Injectable()
export class ReservationsCleanupService {
  private readonly logger = new Logger(ReservationsCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 3 * * *', { name: 'reservations-cleanup', timeZone: 'Europe/Paris' })
  async deleteExpiredReservations(): Promise<number> {
    const cutoff = subtractMonths(getParisNow().date, RESERVATION_RETENTION_MONTHS);
    const { count } = await this.prisma.reservation.deleteMany({
      where: { date: { lt: new Date(`${cutoff}T00:00:00Z`) } },
    });
    if (count > 0) {
      this.logger.log(`${count} réservation(s) antérieure(s) au ${cutoff} supprimée(s) (durée de conservation).`);
    }
    return count;
  }
}
