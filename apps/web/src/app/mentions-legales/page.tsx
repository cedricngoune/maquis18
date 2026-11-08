import type { Metadata } from 'next';
import Link from 'next/link';
import { RESTAURANT } from '@maquis18/shared';
import { LegalPage } from '@/components/LegalPage/LegalPage';
import styles from '@/components/LegalPage/LegalPage.module.css';

export const metadata: Metadata = {
  title: 'Mentions légales',
  alternates: { canonical: '/mentions-legales' },
};

/*
 * Items in [BRACKETS] must be completed before going live.
 * For a real restaurant, the publisher is the restaurant's company (name, legal form,
 * capital, registered office, SIRET/RCS, VAT number), not the developer.
 */
export default function LegalNoticePage() {
  return (
    <LegalPage title="Mentions légales" updatedAt="7 novembre 2026">
      <p className={styles.notice}>
        {RESTAURANT.name} est un restaurant <strong>fictif</strong>. Ce site est un projet de démonstration réalisé pour
        un portfolio : aucune réservation n’engage un établissement réel.
      </p>

      <h2>Éditeur du site</h2>
      <p>
        Cédric Ngouné, développeur web
        <br />
        Contact : [E-MAIL DE CONTACT]
      </p>
      <p>Directeur de la publication : Cédric Ngouné.</p>

      <h2>Hébergement</h2>
      <p>
        <strong>Site web</strong> : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com
      </p>
      <p>
        <strong>API et base de données</strong> : [NOM ET ADRESSE DE L’HÉBERGEUR DE L’API]
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, le design et le code de ce site sont la propriété de leur auteur, sauf mention contraire. Toute
        reproduction sans autorisation est interdite.
      </p>
      <p>Crédits photos : [AUTEURS ET SOURCES DES PHOTOS].</p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données collectées lors d’une réservation est décrit dans notre{' '}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalPage>
  );
}
