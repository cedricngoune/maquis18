import styles from './Header.module.css';

const NAV_LINKS = [
  { href: '#carte', label: 'La carte' },
  { href: '#histoire', label: 'Notre histoire' },
  { href: '#infos', label: 'Infos pratiques' },
];

export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <a href="#top" className={styles.logo} aria-label="Maquis 18, retour en haut de page">
          Maquis <span>18</span>
        </a>
        <nav aria-label="Navigation principale" className={styles.nav}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.link}>
              {link.label}
            </a>
          ))}
          <a href="#reserver" className="button button--primary">
            Réserver
          </a>
        </nav>
      </div>
    </header>
  );
}
