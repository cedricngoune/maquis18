import styles from './Reviews.module.css';

/** Fictional reviews for the demo project */
const REVIEWS = [
  { author: 'Aïssatou D.', text: 'Copieux, chaud et bon. Le mafé est exactement comme celui de ma grand-mère.' },
  {
    author: 'Julien M.',
    text: 'Arrivés tard sans réserver, on nous a trouvé une table tout de suite. Accueil adorable.',
  },
  { author: 'Sarah K.', text: 'Une qualité étonnante pour le prix. Le bissap maison est une merveille.' },
];

export function Reviews() {
  return (
    <section aria-labelledby="avis-titre" className="container section">
      <div className={styles.head}>
        <h2 id="avis-titre" className="section-title">
          Ils sont repartis rassasiés
        </h2>
        <p className={styles.rating}>
          <span className={styles.score}>4,8</span> / 5 · 230 avis Google
        </p>
      </div>
      <div className={styles.grid}>
        {REVIEWS.map((review) => (
          <figure key={review.author} className={styles.card}>
            <span className={styles.stars} role="img" aria-label="5 étoiles sur 5">
              ★★★★★
            </span>
            <blockquote className={styles.quote}>« {review.text} »</blockquote>
            <figcaption className={styles.author}>{review.author}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
