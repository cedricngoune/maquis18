import { RESTAURANT, formatRestaurantAddress, summarizeOpeningHours, type OpeningHourDto } from '@maquis18/shared';
import styles from './PracticalInfo.module.css';

type PracticalInfoProps = {
  openingHours: OpeningHourDto[];
};

export function PracticalInfo({ openingHours }: PracticalInfoProps) {
  return (
    <section id="infos" className={`container section ${styles.info}`}>
      <div className={styles.details}>
        <h2 className="section-title">Nous trouver</h2>
        <div className={styles.block}>
          <strong>Adresse</strong>
          <span>{formatRestaurantAddress()}</span>
          <span className={styles.muted}>Métro {RESTAURANT.metro}</span>
        </div>
        <div className={styles.block}>
          <strong>Horaires</strong>
          {summarizeOpeningHours(openingHours).map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <div className={styles.block}>
          <strong>Contact</strong>
          <a href={`tel:${RESTAURANT.phone.e164}`}>{RESTAURANT.phone.display}</a>
          <a href={RESTAURANT.instagram.url} target="_blank" rel="noreferrer">
            {RESTAURANT.instagram.handle}
          </a>
        </div>
      </div>
      <div role="img" aria-label="Plan d'accès" className={styles.map}>
        Plan d’accès (carte interactive)
      </div>
    </section>
  );
}
