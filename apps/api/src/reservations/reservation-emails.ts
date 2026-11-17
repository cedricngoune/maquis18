import { RESTAURANT as RESTAURANT_INFO, formatRestaurantAddress } from '@maquis18/shared';
import type { Reservation } from '@prisma/client';
import type { MailMessage } from '../mail/mail.service';

export type CustomerEmailKind = 'received' | 'confirmed' | 'cancelled' | 'cancelledByCustomer';

const RESTAURANT = {
  name: RESTAURANT_INFO.name,
  address: formatRestaurantAddress(),
  phone: RESTAURANT_INFO.phone.display,
};

const COPY: Record<CustomerEmailKind, { subject: string; title: string; intro: string }> = {
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
  cancelledByCustomer: {
    subject: 'Votre annulation est bien prise en compte',
    title: 'Réservation annulée',
    intro: 'Nous avons bien annulé votre réservation, comme vous l’avez demandé. À bientôt, nous l’espérons !',
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

type EmailOptions = {
  /** Link to the self-service cancellation page; shown while the reservation is still active */
  manageUrl?: string;
};

export function buildReservationEmail(
  kind: CustomerEmailKind,
  reservation: Reservation & { email: string },
  { manageUrl }: EmailOptions = {},
): MailMessage {
  const copy = COPY[kind];
  const showCancelLink = Boolean(manageUrl) && (kind === 'received' || kind === 'confirmed');
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
    ...(showCancelLink ? [`Un empêchement ? Annulez en un clic : ${manageUrl}`, ''] : []),
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
      </table>${
        showCancelLink
          ? `
      <p style="margin:24px 0 0;line-height:1.6">Un empêchement ? Prévenez-nous en un clic, la table sera proposée à d’autres clients.</p>
      <p style="margin:12px 0 0"><a href="${manageUrl}" style="display:inline-block;padding:12px 20px;border:1px solid #2f4a3a;border-radius:999px;color:#2f4a3a;font-weight:bold;text-decoration:none">Annuler ma réservation</a></p>`
          : ''
      }
      <p style="margin:24px 0 0;font-size:14px;color:#4a4038;line-height:1.6">
        ${RESTAURANT.name} · ${RESTAURANT.address}<br>${RESTAURANT.phone}
      </p>
    </td></tr>
  </table>
</body>
</html>`;

  return { to: reservation.email, subject: `${copy.subject} — ${RESTAURANT.name}`, html, text };
}

// ---------- Notification to the restaurant ----------

export type RestaurantEmailKind = 'new' | 'cancelledByCustomer';

/** E-mail sent to the restaurant: everything needed to call the customer back, plus a link to the admin */
export function buildRestaurantEmail(
  kind: RestaurantEmailKind,
  reservation: Reservation,
  { to, adminUrl }: { to: string; adminUrl: string },
): MailMessage {
  const date = formatDate(reservation.date);
  const time = reservation.time.replace(':', ' h ');
  const guests = `${reservation.guests} ${reservation.guests > 1 ? 'personnes' : 'personne'}`;
  const title = kind === 'new' ? 'Nouvelle demande de réservation' : 'Réservation annulée par le client';
  const rows: [string, string][] = [
    ['Nom', reservation.name],
    ['Date', date],
    ['Heure', time],
    ['Table pour', guests],
    ['Téléphone', reservation.phone],
    ['E-mail', reservation.email ?? '—'],
  ];

  const text = [
    title,
    '',
    ...rows.map(([label, value]) => `${label} : ${value}`),
    '',
    kind === 'new' ? `À confirmer dans l’admin : ${adminUrl}` : `Voir le planning : ${adminUrl}`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:24px;background:#faf4ea;font-family:Arial,Helvetica,sans-serif;color:#2a2420">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
    <tr><td>
      <h1 style="margin:0 0 20px;font-size:22px;color:#2f4a3a">${title}</h1>
      <table role="presentation" style="width:100%;background:#f3e9d8;border-radius:12px;padding:12px">
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:6px 12px;color:#4a4038">${label}</td><td style="padding:6px 12px;font-weight:bold">${escapeHtml(value)}</td></tr>`,
          )
          .join('')}
      </table>
      <p style="margin:24px 0 0"><a href="${adminUrl}" style="display:inline-block;padding:12px 20px;background:#c1502e;border-radius:999px;color:#ffffff;font-weight:bold;text-decoration:none">${
        kind === 'new' ? 'Confirmer dans l’admin' : 'Voir le planning'
      }</a></p>
    </td></tr>
  </table>
</body>
</html>`;

  const subject =
    kind === 'new'
      ? `Nouvelle réservation : ${reservation.name}, ${guests}, ${date} à ${time}`
      : `Annulation : ${reservation.name}, ${date} à ${time}`;
  return { to, subject, html, text };
}
