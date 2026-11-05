'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import styles from './admin.module.css';

type UserMenuProps = {
  email: string;
  onLogout: () => void;
};

/** Profile button that unfolds a small panel (accordion-style) with the account actions */
export function UserMenu({ email, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Close on click outside the menu, or on Escape (focus goes back to the button)
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={styles.userMenu}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.avatarButton}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? 'Fermer le menu du compte' : 'Ouvrir le menu du compte'}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
        </svg>
      </button>

      {/* Always rendered so the height can animate; "inert" keeps the closed panel out of Tab order */}
      <div id={panelId} className={`${styles.userPanel} ${isOpen ? styles.userPanelOpen : ''}`} inert={!isOpen}>
        <div className={styles.userPanelInner}>
          <p className={styles.userPanelLabel}>Connecté en tant que</p>
          <p className={styles.userPanelEmail}>{email}</p>
          <Link href="/" className={styles.userPanelLink} onClick={() => setIsOpen(false)}>
            Voir le site
          </Link>
          <button type="button" className={styles.userPanelLogout} onClick={onLogout}>
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
