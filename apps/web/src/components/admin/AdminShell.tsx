'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { UserMenu } from './UserMenu';
import styles from './admin.module.css';

const NAV_LINKS = [
  { href: '/admin', label: 'Réservations' },
  { href: '/admin/carte', label: 'La carte' },
];

/** Layout of every protected admin page: redirects to the login page when there is no session */
export function AdminShell({ children }: { children: ReactNode }) {
  const { session, isReady, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isReady && !session) router.replace('/admin/login');
  }, [isReady, session, router]);

  if (!isReady || !session) {
    return <p className={styles.loading}>Chargement…</p>;
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link href="/admin" className={styles.brand}>
            Maquis <span>18</span> · Admin
          </Link>
          <nav aria-label="Administration" className={styles.nav}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={styles.navLink}
                aria-current={pathname === link.href ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <UserMenu email={session.admin.email} onLogout={logout} />
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
