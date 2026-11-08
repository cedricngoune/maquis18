import type { Reservation } from '@prisma/client';
import { RESTAURANT } from '@maquis18/shared';
import { buildReservationSms } from './reservation-sms';

const reservation = {
  date: new Date('2030-03-12T00:00:00Z'),
  time: '20:00',
  guests: 4,
} as Reservation;

describe('buildReservationSms', () => {
  it('summarises a new request', () => {
    expect(buildReservationSms('received', reservation)).toBe(
      'Maquis 18 : demande reçue pour le mar. 12 mars à 20h00 (4 pers.). Nous vous confirmons très vite.',
    );
  });

  it('announces the confirmation', () => {
    expect(buildReservationSms('confirmed', reservation)).toBe(
      'Maquis 18 : votre table est confirmée le mar. 12 mars à 20h00 (4 pers.). À bientôt !',
    );
  });

  it('gives the restaurant phone number on cancellation', () => {
    expect(buildReservationSms('cancelled', reservation)).toContain(RESTAURANT.phone.display);
  });

  it('never ends with a double full stop', () => {
    for (const kind of ['received', 'confirmed', 'cancelled'] as const) {
      expect(buildReservationSms(kind, reservation)).not.toContain('..');
    }
  });
});
