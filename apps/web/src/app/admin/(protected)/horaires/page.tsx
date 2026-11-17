'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import {
  DAY_NAMES,
  SLOT_MINUTES,
  minutesToTime,
  type OpeningDayInput,
  type UpdateOpeningHoursRequest,
} from '@maquis18/shared';
import { useAuth } from '@/components/admin/AuthProvider';
import styles from '@/components/admin/admin.module.css';
import { AdminApiError } from '@/lib/admin-api';

const HOURS_KEY = ['admin', 'opening-hours'];

/** 06:00 → 23:45, every quarter hour */
const TIME_OPTIONS = Array.from({ length: ((24 - 6) * 60) / SLOT_MINUTES }, (_, index) =>
  minutesToTime(6 * 60 + index * SLOT_MINUTES),
);

export default function AdminOpeningHoursPage() {
  const { request } = useAuth();
  const hoursQuery = useQuery({
    queryKey: HOURS_KEY,
    queryFn: () => request<OpeningDayInput[]>('/admin/opening-hours'),
  });

  if (hoursQuery.isPending) return <p className={styles.muted}>Chargement des horaires…</p>;
  if (hoursQuery.isError) {
    return (
      <p role="alert" className={styles.errorText}>
        {hoursQuery.error.message}
      </p>
    );
  }
  // The form starts from the loaded week and keeps its own editable draft
  return <OpeningHoursForm initialDays={hoursQuery.data} />;
}

function OpeningHoursForm({ initialDays }: { initialDays: OpeningDayInput[] }) {
  const { request } = useAuth();
  const queryClient = useQueryClient();
  const [days, setDays] = useState<OpeningDayInput[]>(initialDays);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const saveMutation = useMutation({
    mutationFn: (body: UpdateOpeningHoursRequest) =>
      request<OpeningDayInput[]>('/admin/opening-hours', { method: 'PUT', body }),
    onSuccess: (saved) => {
      queryClient.setQueryData(HOURS_KEY, saved);
      setDays(saved);
      setErrors({});
      setSavedAt(new Date());
    },
    onError: (error) => {
      if (error instanceof AdminApiError && error.body.errors) setErrors(error.body.errors);
    },
  });

  const updateDay = (index: number, changes: Partial<OpeningDayInput>) => {
    setDays((current) => current.map((day, i) => (i === index ? { ...day, ...changes } : day)));
    setSavedAt(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate({ days });
  };

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Horaires d’ouverture</h1>
          <p className={styles.pageSubtitle}>
            Ils s’affichent sur le site et définissent les créneaux réservables (jusqu’à 30 minutes avant la fermeture).
          </p>
        </div>
      </div>

      <form className={styles.card} onSubmit={handleSubmit}>
        <ul className={styles.hoursList}>
          {days.map((day, index) => {
            const error = errors[`days.${index}.closesAt`] ?? errors[`days.${index}.opensAt`];
            return (
              <li key={day.dayOfWeek} className={styles.hoursRow}>
                <label className={`${styles.checkbox} ${styles.hoursDay}`}>
                  <input
                    type="checkbox"
                    checked={day.isOpen}
                    onChange={(event) => updateDay(index, { isOpen: event.target.checked })}
                  />
                  {DAY_NAMES[day.dayOfWeek]}
                </label>

                {day.isOpen ? (
                  <div className={styles.hoursTimes}>
                    <label className="visually-hidden" htmlFor={`opens-${day.dayOfWeek}`}>
                      Ouverture le {DAY_NAMES[day.dayOfWeek].toLowerCase()}
                    </label>
                    <select
                      id={`opens-${day.dayOfWeek}`}
                      className={styles.input}
                      value={day.opensAt}
                      onChange={(event) => updateDay(index, { opensAt: event.target.value })}
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option key={time}>{time}</option>
                      ))}
                    </select>
                    <span aria-hidden="true">–</span>
                    <label className="visually-hidden" htmlFor={`closes-${day.dayOfWeek}`}>
                      Fermeture le {DAY_NAMES[day.dayOfWeek].toLowerCase()}
                    </label>
                    <select
                      id={`closes-${day.dayOfWeek}`}
                      className={styles.input}
                      value={day.closesAt}
                      onChange={(event) => updateDay(index, { closesAt: event.target.value })}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? `hours-error-${day.dayOfWeek}` : undefined}
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option key={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className={styles.muted}>Fermé</span>
                )}

                {error && (
                  <span id={`hours-error-${day.dayOfWeek}`} className={`${styles.errorText} ${styles.hoursError}`}>
                    {error}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {errors.days && (
          <p role="alert" className={styles.errorText}>
            {errors.days}
          </p>
        )}
        {saveMutation.isError && !(saveMutation.error instanceof AdminApiError && saveMutation.error.body.errors) && (
          <p role="alert" className={styles.errorText}>
            {saveMutation.error.message}
          </p>
        )}

        <div className={styles.formActions}>
          <button type="submit" className={styles.buttonPrimary} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer les horaires'}
          </button>
          {savedAt && (
            <span role="status" className={styles.successText}>
              Horaires enregistrés. Le site est mis à jour en moins d’une minute.
            </span>
          )}
        </div>
      </form>
    </>
  );
}
