import type { Metadata } from 'next';
import { CancelReservation } from '@/components/CancelReservation/CancelReservation';
import { LegalPage } from '@/components/LegalPage/LegalPage';

export const metadata: Metadata = {
  title: 'Annuler ma réservation',
  robots: { index: false, follow: false }, // personal page: never in search results
};

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

/** Opened from the link in the confirmation e-mail: /reservation/annuler?token=… */
export default async function CancelReservationPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  return (
    <LegalPage title="Votre réservation" updatedAt={null}>
      <CancelReservation token={token ?? ''} />
    </LegalPage>
  );
}
