'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RESERVATION_STATUS_LABELS, RESTAURANT, type ManageReservationDto } from '@maquis18/shared';
import { cancelReservationByToken, fetchReservationByToken } from '@/lib/reservations';
import styles from './CancelReservation.module.css';

type CancelReservationProps = {
  token: string;
};

type State =
  | { step: 'loading' }
  | { step: 'error'; message: string }
  | { step: 'ready'; reservation: ManageReservationDto; justCancelled: boolean };

const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );

/** Shows the reservation behind the e-mail link and lets the customer cancel it */
export function CancelReservation({ token }: CancelReservationProps) {
  // A link without token is known to be broken from the start: no need to wait for an effect
  const [state, setState] = useState<State>(() =>
    token
      ? { step: 'loading' }
      : { step: 'error', message: 'Ce lien est incomplet. Utilisez le bouton de votre e-mail de réservation.' },
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchReservationByToken(token).then((result) =>
      setState(
        result.ok
          ? { step: 'ready', reservation: result.reservation, justCancelled: false }
          : { step: 'error', message: result.error.message },
      ),
    );
  }, [token]);

  const handleCancel = async () => {
    setIsCancelling(true);
    setCancelError(null);
    const result = await cancelReservationByToken(token);
    setIsCancelling(false);
    if (result.ok) setState({ step: 'ready', reservation: result.reservation, justCancelled: true });
    else setCancelError(result.error.message);
  };

  if (state.step === 'loading') return <p className={styles.muted}>Chargement de votre réservation…</p>;

  if (state.step === 'error') {
    return (
      <div className={styles.card}>
        <p role="alert">{state.message}</p>
        <p className={styles.muted}>
          Besoin d’aide ? Appelez-nous au <a href={`tel:${RESTAURANT.phone.e164}`}>{RESTAURANT.phone.display}</a>.
        </p>
      </div>
    );
  }

  const { reservation, justCancelled } = state;
  const guests = `${reservation.guests} ${reservation.guests > 1 ? 'personnes' : 'personne'}`;

  return (
    <div className={styles.card}>
      <dl className={styles.summary}>
        <div>
          <dt>Nom</dt>
          <dd>{reservation.name}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{formatDate(reservation.date)}</dd>
        </div>
        <div>
          <dt>Heure</dt>
          <dd>{reservation.time.replace(':', ' h ')}</dd>
        </div>
        <div>
          <dt>Table pour</dt>
          <dd>{guests}</dd>
        </div>
        <div>
          <dt>Statut</dt>
          <dd>{RESERVATION_STATUS_LABELS[reservation.status]}</dd>
        </div>
      </dl>

      {justCancelled ? (
        <p role="status" className={styles.success}>
          Votre réservation est annulée. Vous allez recevoir une confirmation par e-mail. À bientôt, nous l’espérons !
        </p>
      ) : reservation.canCancel ? (
        <>
          <p>Un empêchement ? Annulez ici : la table sera proposée à d’autres clients.</p>
          {cancelError && (
            <p role="alert" className={styles.error}>
              {cancelError}
            </p>
          )}
          <button type="button" className="button button--primary" onClick={handleCancel} disabled={isCancelling}>
            {isCancelling ? 'Annulation…' : 'Annuler ma réservation'}
          </button>
        </>
      ) : (
        <p className={styles.muted}>
          {reservation.status === 'CANCELLED'
            ? 'Cette réservation est déjà annulée.'
            : 'Cette réservation est passée : elle ne peut plus être annulée en ligne.'}
        </p>
      )}

      <p className={styles.back}>
        <Link href="/#reserver">Faire une nouvelle réservation</Link>
      </p>
    </div>
  );
}
