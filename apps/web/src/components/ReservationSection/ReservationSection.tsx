'use client';

import Link from 'next/link';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { MAX_GUESTS, RESERVATION_RETENTION_MONTHS, SLOT_MINUTES, type ReservationDto } from '@maquis18/shared';
import { createReservation } from '@/lib/reservations';
import { Turnstile } from '../Turnstile/Turnstile';
import styles from './ReservationSection.module.css';

type FormStatus = 'idle' | 'submitting' | 'success';
type FormFields = { date: string; time: string; guests: number; name: string; phone: string; email: string };
type FieldName = keyof FormFields | 'captchaToken';
type FieldErrors = Partial<Record<FieldName, string>>;

const INITIAL_FORM: FormFields = { date: '', time: '', guests: 2, name: '', phone: '', email: '' };

/** Today's date in the visitor's time zone, as YYYY-MM-DD (min value of the date input) */
const getTodayIsoDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** Quarter-hour slots between two times, inclusive */
const slotsBetween = (from: string, to: string) =>
  Array.from({ length: (toMinutes(to) - toMinutes(from)) / SLOT_MINUTES + 1 }, (_, index) =>
    toTime(toMinutes(from) + index * SLOT_MINUTES),
  );

/** Bookable times shown in the dropdown (the API remains the source of truth) */
const TIME_SLOT_GROUPS = [
  { label: 'Midi', slots: slotsBetween('11:00', '14:45') },
  { label: 'Après-midi', slots: slotsBetween('15:00', '17:45') },
  { label: 'Soir', slots: slotsBetween('18:00', '21:30') },
];

/** True when the slot is on today's date and already passed (visitor's time zone) */
const isPastSlot = (date: string, time: string) => {
  const now = new Date();
  return date === getTodayIsoDate() && toMinutes(time) <= now.getHours() * 60 + now.getMinutes();
};

const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );

export function ReservationSection() {
  const [form, setForm] = useState<FormFields>(INITIAL_FORM);
  const [honeypot, setHoneypot] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([]);
  const [reservation, setReservation] = useState<ReservationDto | null>(null);

  const updateField = (field: keyof FormFields, value: string | number) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      // A new date can make the chosen time already passed (e.g. switching to today)
      if (field === 'date' && next.time && isPastSlot(next.date, next.time)) next.time = '';
      return next;
    });
    // The visitor is fixing this field: hide its previous error
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    if (field === 'time' || field === 'date' || field === 'guests') setSuggestedTimes([]);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const field = event.target.name as keyof FormFields;
    updateField(field, field === 'guests' ? Number(event.target.value) : event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!captchaToken) {
      setFieldErrors({ captchaToken: 'Merci de patienter pendant la vérification anti-robot.' });
      return;
    }

    setStatus('submitting');
    setGeneralError(null);
    setFieldErrors({});
    setSuggestedTimes([]);

    const result = await createReservation({ ...form, captchaToken, website: honeypot });

    // A Turnstile token is single-use: always ask for a new one after a submission
    setCaptchaResetKey((key) => key + 1);

    if (result.ok) {
      setReservation(result.reservation);
      setStatus('success');
      setForm(INITIAL_FORM);
      return;
    }

    setFieldErrors(result.error.errors ?? {});
    setSuggestedTimes(result.error.suggestedTimes ?? []);
    // Show the general message only when no field-level message explains the problem
    setGeneralError(result.error.errors ? null : result.error.message);
    setStatus('idle');
  };

  const fieldProps = (field: keyof FormFields) => ({
    id: `reservation-${field}`,
    name: field,
    onChange: handleChange,
    'aria-invalid': Boolean(fieldErrors[field]),
    'aria-describedby': fieldErrors[field] ? `reservation-${field}-error` : undefined,
    className: `${styles.input} ${fieldErrors[field] ? styles.inputError : ''}`,
  });

  const errorMessage = (field: FieldName) =>
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
            Vous recevez un récapitulatif par e-mail et par SMS, puis la confirmation dès que nous avons validé votre
            table. Pour les groupes de plus de {MAX_GUESTS} personnes, appelez-nous directement.
          </p>
        </div>

        {status === 'success' && reservation ? (
          <div role="status" className={styles.panel}>
            <h3 className={styles.confirmTitle}>Merci {reservation.name}, c’est noté !</h3>
            <p>
              Table pour {reservation.guests} {reservation.guests > 1 ? 'personnes' : 'personne'}, le{' '}
              {formatDate(reservation.date)} à {reservation.time.replace(':', ' h ')}.
            </p>
            <p>
              Un récapitulatif vient d’être envoyé à <strong>{reservation.email}</strong> et par SMS. Vous serez prévenu
              de la même façon dès que la réservation sera confirmée.
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
              <div className={styles.selectWrapper}>
                <select required value={form.time} {...fieldProps('time')}>
                  <option value="" disabled>
                    Choisir un créneau
                  </option>
                  {TIME_SLOT_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.slots.map((slot) => (
                        <option key={slot} value={slot} disabled={isPastSlot(form.date, slot)}>
                          {slot.replace(':', ' h ')}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {/* Clock icon: decorative, clicks go through to the select */}
                <svg
                  className={styles.selectIcon}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </div>
              {errorMessage('time')}
              {suggestedTimes.length > 0 && (
                <div className={styles.suggestions} role="group" aria-label="Créneaux disponibles">
                  {suggestedTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={styles.suggestion}
                      onClick={() => updateField('time', time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="reservation-guests">Nombre de personnes</label>
              <input type="number" min={1} max={MAX_GUESTS} required value={form.guests} {...fieldProps('guests')} />
              {errorMessage('guests')}
            </div>
            <div className={styles.field}>
              <label htmlFor="reservation-name">Nom</label>
              <input
                type="text"
                autoComplete="name"
                placeholder="Votre nom"
                required
                value={form.name}
                {...fieldProps('name')}
              />
              {errorMessage('name')}
            </div>
            <div className={styles.field}>
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
            <div className={styles.field}>
              <label htmlFor="reservation-email">E-mail</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.fr"
                required
                value={form.email}
                {...fieldProps('email')}
              />
              {errorMessage('email')}
            </div>

            {/* Honeypot: invisible to humans and screen readers, bots tend to fill every field */}
            <div className={styles.honeypot} aria-hidden="true">
              <label htmlFor="reservation-website">Site web</label>
              <input
                id="reservation-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
              />
            </div>

            <div className={`${styles.fullWidth} ${styles.captcha}`}>
              <Turnstile onTokenChange={setCaptchaToken} resetKey={captchaResetKey} />
              {errorMessage('captchaToken')}
            </div>

            <p className={`${styles.privacy} ${styles.fullWidth}`}>
              Vos coordonnées servent uniquement à gérer votre réservation et sont supprimées{' '}
              {RESERVATION_RETENTION_MONTHS} mois après votre venue. <Link href="/confidentialite">En savoir plus</Link>
            </p>

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
