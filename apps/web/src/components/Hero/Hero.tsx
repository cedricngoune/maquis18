import { PhotoPlaceholder } from '../PhotoPlaceholder/PhotoPlaceholder';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section id="top" className={`container ${styles.hero}`}>
      <div className={styles.text}>
        <p className="eyebrow">Cuisine guinéenne · Paris 18e</p>
        <h1 className={styles.title}>La cuisine de Guinée, faite maison, au cœur du 18e.</h1>
        <p className={styles.lead}>
          Attiéké, foutou, mafé… des plats généreux préparés chaque jour avec des produits bio, à partager sur place ou
          à emporter.
        </p>
        <div className={styles.actions}>
          <a href="#reserver" className="button button--primary">
            Réserver une table
          </a>
          <a href="#carte" className="button button--outline">
            Voir la carte
          </a>
        </div>
      </div>
      <PhotoPlaceholder label="Attiéké poisson braisé" height={520} className={styles.photo} />
    </section>
  );
}
