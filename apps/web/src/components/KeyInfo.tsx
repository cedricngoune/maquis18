import styles from './KeyInfo.module.css';

const KEY_FACTS = [
  { title: '7 j/7', detail: 'De 11 h à 22 h' },
  { title: 'Dès 10 €', detail: 'Des plats généreux' },
  { title: 'Bio & maison', detail: 'Préparé chaque jour' },
  { title: 'Sur place', detail: 'ou à emporter' },
];

export function KeyInfo() {
  return (
    <section aria-label="Informations clés" className={styles.band}>
      <ul className={`container ${styles.list}`}>
        {KEY_FACTS.map((fact) => (
          <li key={fact.title} className={styles.item}>
            <span className={styles.title}>{fact.title}</span>
            <span>{fact.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
