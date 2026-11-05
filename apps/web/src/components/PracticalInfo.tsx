import styles from './PracticalInfo.module.css';

export function PracticalInfo() {
  return (
    <section id="infos" className={`container section ${styles.info}`}>
      <div className={styles.details}>
        <h2 className="section-title">Nous trouver</h2>
        <div className={styles.block}>
          <strong>Adresse</strong>
          <span>[ADRESSE FICTIVE], 75018 Paris</span>
          <span className={styles.muted}>Métro [STATION LA PLUS PROCHE]</span>
        </div>
        <div className={styles.block}>
          <strong>Horaires</strong>
          <span>Tous les jours, 11 h – 22 h</span>
        </div>
        <div className={styles.block}>
          <strong>Contact</strong>
          <a href="tel:+33155106263">01 55 10 62 63</a>
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
            @maquis18.paris
          </a>
        </div>
      </div>
      <div role="img" aria-label="Plan d'accès" className={styles.map}>
        Plan d’accès (carte interactive)
      </div>
    </section>
  );
}
