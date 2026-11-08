import { RESTAURANT as RESTAURANT_INFO, formatRestaurantAddress } from '@maquis18/shared';
import type { Reservation } from '@prisma/client';
import type { MailMessage } from '../mail/mail.service';

type EmailKind = 'received' | 'confirmed' | 'cancelled';

const RESTAURANT = {
  name: RESTAURANT_INFO.name,
  address: formatRestaurantAddress(),
  phone: RESTAURANT_INFO.phone.display,
};

const COPY: Record<EmailKind, { subject: string; title: string; intro: string }> = {
  received: {
    subject: 'Votre demande de réservation est bien reçue',
    title: 'Demande bien reçue',
    intro: 'Merci pour votre demande ! Nous la vérifions et revenons vers vous très vite pour la confirmer.',
  },
  confirmed: {
    subject: 'Votre table est confirmée',
    title: 'Réservation confirmée',
    intro: 'Bonne nouvelle : votre table est confirmée. Nous avons hâte de vous accueillir.',
  },
  cancelled: {
    subject: 'Votre réservation est annulée',
    title: 'Réservation annulée',
    intro:
      'Votre réservation a été annulée. Si vous pensez qu’il s’agit d’une erreur, appelez-nous, nous trouverons une solution.',
  },
};

/** Escapes text before putting it in the HTML e-mail (the name comes from a public form) */
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

export function buildReservationEmail(kind: EmailKind, reservation: Reservation & { email: string }): MailMessage {
  const copy = COPY[kind];
  const date = formatDate(reservation.date);
  const time = reservation.time.replace(':', ' h ');
  const guests = `${reservation.guests} ${reservation.guests > 1 ? 'personnes' : 'personne'}`;
  const name = escapeHtml(reservation.name);

  const text = [
    `Bonjour ${reservation.name},`,
    '',
    copy.intro,
    '',
    `Date : ${date}`,
    `Heure : ${time}`,
    `Table pour : ${guests}`,
    '',
    `${RESTAURANT.name} · ${RESTAURANT.address} · ${RESTAURANT.phone}`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:24px;background:#faf4ea;font-family:Arial,Helvetica,sans-serif;color:#2a2420">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
    <tr><td style="background:#2f4a3a;padding:24px 32px;color:#faf4ea;font-size:24px;font-weight:bold">
      Maquis <span style="color:#d9a441">18</span>
    </td></tr>
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 16px;font-size:24px;color:#2f4a3a">${copy.title}</h1>
      <p style="margin:0 0 16px;line-height:1.6">Bonjour ${name},</p>
      <p style="margin:0 0 24px;line-height:1.6">${copy.intro}</p>
      <table role="presentation" style="width:100%;background:#f3e9d8;border-radius:12px;padding:16px">
        <tr><td style="padding:6px 12px;color:#4a4038">Date</td><td style="padding:6px 12px;font-weight:bold">${date}</td></tr>
        <tr><td style="padding:6px 12px;color:#4a4038">Heure</td><td style="padding:6px 12px;font-weight:bold">${time}</td></tr>
        <tr><td style="padding:6px 12px;color:#4a4038">Table pour</td><td style="padding:6px 12px;font-weight:bold">${guests}</td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:14px;color:#4a4038;line-height:1.6">
        ${RESTAURANT.name} · ${RESTAURANT.address}<br>${RESTAURANT.phone}
      </p>
    </td></tr>
  </table>
</body>
</html>`;

  return { to: reservation.email, subject: `${copy.subject} — ${RESTAURANT.name}`, html, text };
}
