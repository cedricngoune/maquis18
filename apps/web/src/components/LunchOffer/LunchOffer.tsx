import styles from './LunchOffer.module.css';

export function LunchOffer() {
  return (
    <section className="container" aria-labelledby="formule-titre" style={{ paddingTop: 72 }}>
      <div className={styles.card}>
        <div className={styles.text}>
          <p className={styles.eyebrow}>Du lundi au vendredi, 11 h – 15 h</p>
          <h2 id="formule-titre" className={styles.title}>
            Formule midi : plat + boisson maison
          </h2>
        </div>
        <span className={styles.price}>12 €</span>
      </div>
    </section>
  );
}
