'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { MAX_GUESTS, type CreateReservationRequest, type ReservationDto, type ReservationField } from '@maquis18/shared';
import { createReservation } from '@/lib/reservations';
import styles from './ReservationSection.module.css';

type FormStatus = 'idle' | 'submitting' | 'success';
type FieldErrors = Partial<Record<ReservationField, string>>;

const INITIAL_FORM: CreateReservationRequest = { date: '', time: '', guests: 2, name: '', phone: '' };

/** Today's date in the visitor's time zone, as YYYY-MM-DD (min value of the date input) */
const getTodayIsoDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );

export function ReservationSection() {
  const [form, setForm] = useState<CreateReservationRequest>(INITIAL_FORM);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<ReservationDto | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const field = name as ReservationField;
    setForm((current) => ({ ...current, [field]: field === 'guests' ? Number(value) : value }));
    // The visitor is fixing this field: hide its previous error
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    setGeneralError(null);
    setFieldErrors({});

    const result = await createReservation(form);

    if (result.ok) {
      setReservation(result.reservation);
      setStatus('success');
      setForm(INITIAL_FORM);
      return;
    }

    setFieldErrors(result.error.errors ?? {});
    // Show the general message only when no field-level message explains the problem
    setGeneralError(result.error.errors ? null : result.error.message);
    setStatus('idle');
  };

  const fieldProps = (field: ReservationField) => ({
    id: `reservation-${field}`,
    name: field,
    onChange: handleChange,
    'aria-invalid': Boolean(fieldErrors[field]),
    'aria-describedby': fieldErrors[field] ? `reservation-${field}-error` : undefined,
    className: `${styles.input} ${fieldErrors[field] ? styles.inputError : ''}`,
  });

  const errorMessage = (field: ReservationField) =>
    fieldErrors[field] ? (
      <span id={`reservation-${field}-error`} className={styles.errorText}>
        {fieldErrors[field]}
      </span>
    ) : null;

  const isSubmitting = status === 'submitting';

  return (
    <section id="reserver" className={styles.wrapper}>
      <div className={`container section ${styles.inner}`}>
        <div className={styles.intro}>
          <p className={`eyebrow ${styles.eyebrow}`}>Réservation</p>
          <h2 className={styles.title}>Réservez votre table</h2>
          <p className={styles.lead}>
            Nous confirmons chaque réservation par SMS. Pour les groupes de plus de {MAX_GUESTS} personnes,
            appelez-nous directement.
          </p>
        </div>

        {status === 'success' && reservation ? (
          <div role="status" className={styles.panel}>
            <h3 className={styles.confirmTitle}>Merci {reservation.name}, c’est noté !</h3>
            <p>
              Table pour {reservation.guests} {reservation.guests > 1 ? 'personnes' : 'personne'}, le{' '}
              {formatDate(reservation.date)} à {reservation.time.replace(':', ' h ')}. Vous recevrez un SMS de
              confirmation.
            </p>
            <button type="button" className="button button--outline" onClick={() => setStatus('idle')}>
              Nouvelle réservation
            </button>
          </div>
        ) : (
          <form className={`${styles.panel} ${styles.form}`} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="reservation-date">Date</label>
              <input type="date" min={getTodayIsoDate()} required value={form.date} {...fieldProps('date')} />
              {errorMessage('date')}
            </div>
            <div className={styles.field}>
              <label htmlFor="reservation-time">Heure</label>
              <input type="time" min="11:00" max="21:30" step={900} required value={form.time} {...fieldProps('time')} />
              {errorMessage('time')}
            </div>
            <div className={styles.field}>
              <label htmlFor="reservation-guests">Nombre de personnes</label>
              <input type="number" min={1} max={MAX_GUESTS} required value={form.guests} {...fieldProps('guests')} />
              {errorMessage('guests')}
            </div>
            <div className={styles.field}>
              <label htmlFor="reservation-name">Nom</label>
              <input type="text" autoComplete="name" placeholder="Votre nom" required value={form.name} {...fieldProps('name')} />
              {errorMessage('name')}
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="reservation-phone">Téléphone</label>
              <input
                type="tel"
                autoComplete="tel"
                placeholder="06 00 00 00 00"
                required
                value={form.phone}
                {...fieldProps('phone')}
              />
              {errorMessage('phone')}
            </div>

            {generalError && (
              <p role="alert" className={`${styles.errorText} ${styles.fullWidth}`}>
                {generalError}
              </p>
            )}

            <button
              type="submit"
              className={`button button--primary ${styles.fullWidth}`}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Envoi en cours…' : 'Confirmer la réservation'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
