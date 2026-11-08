import Link from 'next/link';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.logo}>
          Maquis <span>18</span>
        </span>
        <span>Projet de démonstration · Design &amp; développement : Cédric Ngouné</span>
        <nav aria-label="Informations légales" className={styles.legal}>
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
        </nav>
      </div>
    </footer>
  );
}
