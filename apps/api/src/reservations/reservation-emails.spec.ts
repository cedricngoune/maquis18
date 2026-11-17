import type { Reservation } from '@prisma/client';
import { buildReservationEmail, buildRestaurantEmail } from './reservation-emails';

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

describe('cancellation link', () => {
  const manageUrl = 'https://maquis18.test/reservation/annuler?token=abc';

  it.each(['received', 'confirmed'] as const)('is offered in the "%s" e-mail', (kind) => {
    const email = buildReservationEmail(kind, reservation, { manageUrl });
    expect(email.html).toContain(manageUrl);
    expect(email.text).toContain(manageUrl);
  });

  it.each(['cancelled', 'cancelledByCustomer'] as const)('is not offered once the reservation is "%s"', (kind) => {
    expect(buildReservationEmail(kind, reservation, { manageUrl }).html).not.toContain(manageUrl);
  });
});

describe('buildRestaurantEmail', () => {
  const full = { ...reservation, phone: '06 12 34 56 78' } as Reservation;

  it('gives the restaurant the contact details and a link to the admin', () => {
    const email = buildRestaurantEmail('new', full, {
      to: 'resto@test.local',
      adminUrl: 'https://x.test/admin?date=2030-03-12',
    });

    expect(email.to).toBe('resto@test.local');
    expect(email.subject).toBe('Nouvelle réservation : Awa Diallo, 1 personne, mardi 12 mars 2030 à 19 h 30');
    expect(email.text).toContain('06 12 34 56 78');
    expect(email.text).toContain('awa@example.com');
    expect(email.html).toContain('https://x.test/admin?date=2030-03-12');
  });

  it('escapes customer data in the HTML version', () => {
    const email = buildRestaurantEmail(
      'new',
      { ...full, name: '<img src=x onerror=alert(1)>' },
      { to: 'r@t.l', adminUrl: 'https://x.test' },
    );
    expect(email.html).not.toContain('<img src=x');
  });
});
