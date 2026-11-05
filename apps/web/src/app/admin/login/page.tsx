'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/admin/AuthProvider';
import styles from '@/components/admin/admin.module.css';
import { AdminApiError } from '@/lib/admin-api';

export default function AdminLoginPage() {
  const { session, isReady, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already logged in: go straight to the dashboard
  useEffect(() => {
    if (isReady && session) router.replace('/admin');
  }, [isReady, session, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      router.replace('/admin');
    } catch (caught) {
      setError(caught instanceof AdminApiError ? caught.message : 'Une erreur est survenue.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.loginPage}>
      <form className={styles.loginCard} onSubmit={handleSubmit}>
        <p className={styles.brand}>
          Maquis <span>18</span> · Admin
        </p>
        <h1 className={styles.loginTitle}>Connexion</h1>

        <div className={styles.field}>
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="login-password">Mot de passe</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p role="alert" className={styles.errorText}>
            {error}
          </p>
        )}

        <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </main>
  );
}
