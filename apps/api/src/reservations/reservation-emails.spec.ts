import type { Reservation } from '@prisma/client';
import { buildReservationEmail } from './reservation-emails';

const reservation = {
  name: 'Awa Diallo',
  email: 'awa@example.com',
  date: new Date('2030-03-12T00:00:00Z'),
  time: '19:30',
  guests: 1,
} as Reservation & { email: string };

describe('buildReservationEmail', () => {
  it('addresses the customer with the reservation details', () => {
    const email = buildReservationEmail('received', reservation);

    expect(email.to).toBe('awa@example.com');
    expect(email.subject).toContain('bien reçue');
    expect(email.text).toContain('Bonjour Awa Diallo');
    expect(email.text).toContain('mardi 12 mars 2030');
    expect(email.text).toContain('19 h 30');
    expect(email.text).toContain('1 personne');
  });

  it.each([
    ['confirmed', 'confirmée'],
    ['cancelled', 'annulée'],
  ] as const)('uses the right subject for "%s"', (kind, word) => {
    expect(buildReservationEmail(kind, reservation).subject).toContain(word);
  });

  it('escapes the name in the HTML version (it comes from a public form)', () => {
    const email = buildReservationEmail('received', { ...reservation, name: '<script>alert(1)</script>' });

    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });
});
