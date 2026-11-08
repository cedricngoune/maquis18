import type { Metadata } from 'next';
import { RESERVATION_RETENTION_MONTHS, RESTAURANT } from '@maquis18/shared';
import { LegalPage } from '@/components/LegalPage/LegalPage';
import styles from '@/components/LegalPage/LegalPage.module.css';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  alternates: { canonical: '/confidentialite' },
};

/* Items in [BRACKETS] must be completed before going live. */
export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Politique de confidentialité" updatedAt="7 novembre 2026">
      <p className={styles.notice}>
        {RESTAURANT.name} est un restaurant fictif (projet de démonstration). Cette politique décrit ce que fait
        réellement le site avec les données saisies.
      </p>

      <h2>Responsable du traitement</h2>
      <p>Cédric Ngouné, éditeur du site — contact : [E-MAIL DE CONTACT].</p>

      <h2>Données collectées et pourquoi</h2>
      <ul>
        <li>
          <strong>Réservation</strong> : nom, téléphone, adresse e-mail, date, heure et nombre de personnes. Elles
          servent uniquement à enregistrer votre réservation et à vous envoyer le récapitulatif et la confirmation par
          e-mail et par SMS.
        </li>
        <li>
          <strong>Sécurité</strong> : votre adresse IP est utilisée au moment de l’envoi du formulaire pour bloquer les
          abus (nombre de tentatives, vérification anti-robot). Elle n’est pas enregistrée en base de données.
        </li>
        <li>
          <strong>Espace administrateur</strong> : l’adresse e-mail du gestionnaire, pour la connexion.
        </li>
      </ul>
      <p>Aucune donnée n’est utilisée à des fins publicitaires, ni vendue, ni cédée.</p>

      <h2>Base légale</h2>
      <ul>
        <li>Réservation : mesures précontractuelles prises à votre demande (article 6.1.b du RGPD).</li>
        <li>Protection contre les abus : intérêt légitime à sécuriser le service (article 6.1.f du RGPD).</li>
      </ul>

      <h2>Durée de conservation</h2>
      <p>
        Les réservations sont <strong>supprimées automatiquement {RESERVATION_RETENTION_MONTHS} mois</strong> après la
        date du repas. Les limites anti-abus liées à votre adresse IP sont effacées au bout de 10 minutes.
      </p>

      <h2>Destinataires et sous-traitants</h2>
      <p>
        Vos données sont accessibles au seul gestionnaire du restaurant, et traitées par les prestataires techniques
        suivants :
      </p>
      <ul>
        <li>Hébergement : Vercel (site) et [HÉBERGEUR DE L’API] (API et base de données) ;</li>
        <li>Envoi des e-mails : [PRESTATAIRE E-MAIL] ;</li>
        <li>Envoi des SMS : [PRESTATAIRE SMS] ;</li>
        <li>Vérification anti-robot : Cloudflare Turnstile.</li>
      </ul>
      <p>
        Certains de ces prestataires sont situés hors de l’Union européenne (notamment aux États-Unis). Les transferts
        sont encadrés par les clauses contractuelles types de la Commission européenne ou le cadre de protection des
        données UE–États-Unis.
      </p>

      <h2>Cookies</h2>
      <p>
        Le site public ne dépose aucun cookie de mesure d’audience ni de publicité. Seul l’espace administrateur utilise
        un cookie technique de session, indispensable à la connexion. Ces cookies ne nécessitent pas votre consentement.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez accéder à vos données, les faire rectifier ou supprimer, vous opposer à leur traitement, en demander
        la limitation ou la portabilité, en écrivant à [E-MAIL DE CONTACT]. Si vous estimez que vos droits ne sont pas
        respectés, vous pouvez adresser une réclamation à la CNIL (cnil.fr).
      </p>
    </LegalPage>
  );
}
