'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  RESERVATION_STATUS_LABELS,
  type AdminReservationDto,
  type ReservationStatus,
  type UpdateReservationStatusRequest,
} from '@maquis18/shared';
import { useAuth } from '@/components/admin/AuthProvider';
import styles from '@/components/admin/admin.module.css';

const toIsoDate = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

const shiftDay = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
};

const formatLongDate = (isoDate: string) =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(`${isoDate}T12:00:00`),
  );

/** Which buttons each status offers */
const ACTIONS: Record<ReservationStatus, { label: string; status: ReservationStatus; primary?: boolean }[]> = {
  PENDING: [
    { label: 'Confirmer', status: 'CONFIRMED', primary: true },
    { label: 'Annuler', status: 'CANCELLED' },
  ],
  CONFIRMED: [{ label: 'Annuler', status: 'CANCELLED' }],
  CANCELLED: [{ label: 'Rétablir', status: 'PENDING' }],
};

export default function AdminReservationsPage() {
  const { request } = useAuth();
  const queryClient = useQueryClient();
  const today = toIsoDate(new Date());
  const [date, setDate] = useState(today);

  const reservationsQuery = useQuery({
    queryKey: ['admin', 'reservations', date],
    queryFn: () => request<AdminReservationDto[]>(`/admin/reservations?date=${date}`),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) =>
      request<AdminReservationDto>(`/admin/reservations/${id}`, {
        method: 'PATCH',
        body: { status } satisfies UpdateReservationStatusRequest,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reservations'] }),
  });

  const reservations = reservationsQuery.data ?? [];
  const active = reservations.filter((reservation) => reservation.status !== 'CANCELLED');
  const totalGuests = active.reduce((sum, reservation) => sum + reservation.guests, 0);
  const pendingCount = reservations.filter((reservation) => reservation.status === 'PENDING').length;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Réservations</h1>
          <p className={styles.pageSubtitle}>{formatLongDate(date)}</p>
        </div>
        <div className={styles.dayPicker}>
          <button
            type="button"
            className={styles.buttonGhost}
            onClick={() => setDate(shiftDay(date, -1))}
            aria-label="Jour précédent"
          >
            ←
          </button>
          <label className="visually-hidden" htmlFor="reservations-date">
            Choisir un jour
          </label>
          <input
            id="reservations-date"
            type="date"
            className={styles.input}
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
          <button
            type="button"
            className={styles.buttonGhost}
            onClick={() => setDate(shiftDay(date, 1))}
            aria-label="Jour suivant"
          >
            →
          </button>
          {date !== today && (
            <button type="button" className={styles.buttonGhost} onClick={() => setDate(today)}>
              Aujourd’hui
            </button>
          )}
        </div>
      </div>

      <ul className={styles.stats} aria-label="Résumé du jour">
        <li className={styles.stat}>
          <span className={styles.statValue}>{active.length}</span> réservations
        </li>
        <li className={styles.stat}>
          <span className={styles.statValue}>{totalGuests}</span> couverts
        </li>
        <li className={styles.stat}>
          <span className={styles.statValue}>{pendingCount}</span> à confirmer
        </li>
      </ul>

      {statusMutation.isError && (
        <p role="alert" className={styles.errorText}>
          {statusMutation.error.message}
        </p>
      )}

      {reservationsQuery.isPending ? (
        <p className={styles.muted}>Chargement des réservations…</p>
      ) : reservationsQuery.isError ? (
        <p role="alert" className={styles.errorText}>
          {reservationsQuery.error.message}
        </p>
      ) : reservations.length === 0 ? (
        <p className={styles.empty}>Aucune réservation ce jour-là.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Heure</th>
                <th scope="col">Nom</th>
                <th scope="col">Pers.</th>
                <th scope="col">Contact</th>
                <th scope="col">Statut</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr
                  key={reservation.id}
                  className={reservation.status === 'CANCELLED' ? styles.rowCancelled : undefined}
                >
                  <td className={styles.time}>{reservation.time}</td>
                  <td>{reservation.name}</td>
                  <td>{reservation.guests}</td>
                  <td>
                    <a href={`tel:${reservation.phone.replace(/\s/g, '')}`}>{reservation.phone}</a>
                    {reservation.email && (
                      <>
                        <br />
                        <a href={`mailto:${reservation.email}`} className={styles.muted}>
                          {reservation.email}
                        </a>
                      </>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge${reservation.status}`]}`}>
                      {RESERVATION_STATUS_LABELS[reservation.status]}
                    </span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      {ACTIONS[reservation.status].map((action) => (
                        <button
                          key={action.status}
                          type="button"
                          className={action.primary ? styles.buttonPrimarySmall : styles.buttonGhostSmall}
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ id: reservation.id, status: action.status })}
                        >
                          {action.label}
                          <span className="visually-hidden"> la réservation de {reservation.name}</span>
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
