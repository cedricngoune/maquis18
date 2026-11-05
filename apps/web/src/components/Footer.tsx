import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.logo}>
          Maquis <span>18</span>
        </span>
        <span>Projet de démonstration · Design &amp; développement : Cédric Ngouné</span>
      </div>
    </footer>
  );
}
