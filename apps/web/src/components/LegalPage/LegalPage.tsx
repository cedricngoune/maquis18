import Link from 'next/link';
import type { ReactNode } from 'react';
import { Footer } from '../Footer/Footer';
import styles from './LegalPage.module.css';

type LegalPageProps = {
  title: string;
  updatedAt: string;
  children: ReactNode;
};

/** Shared layout of the legal pages: simple header, readable text column, site footer */
export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <Link href="/" className={styles.logo}>
            Maquis <span>18</span>
          </Link>
          <Link href="/" className={styles.back}>
            ← Retour au site
          </Link>
        </div>
      </header>
      <main className={`container ${styles.main}`}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Dernière mise à jour : {updatedAt}</p>
        <div className={styles.content}>{children}</div>
      </main>
      <Footer />
    </>
  );
}
