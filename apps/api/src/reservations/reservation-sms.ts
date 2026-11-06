import type { Reservation } from '@prisma/client';

type SmsKind = 'received' | 'confirmed' | 'cancelled';

const RESTAURANT_PHONE = '01 00 00 00 00';

/** "mar. 12 mars" — short, an SMS has little room */
const formatShortDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date);

/** Kept short on purpose: accented characters reduce an SMS to 70 characters per segment */
export function buildReservationSms(kind: SmsKind, reservation: Reservation): string {
  const when = `${formatShortDate(reservation.date)} à ${reservation.time.replace(':', 'h')}`;
  const guests = `${reservation.guests} pers.`; // used in parentheses: no double full stop

  switch (kind) {
    case 'received':
      return `Maquis 18 : demande reçue pour le ${when} (${guests}). Nous vous confirmons très vite.`;
    case 'confirmed':
      return `Maquis 18 : votre table est confirmée le ${when} (${guests}). À bientôt !`;
    case 'cancelled':
      return `Maquis 18 : votre réservation du ${when} est annulée. Une question ? ${RESTAURANT_PHONE}`;
  }
}
