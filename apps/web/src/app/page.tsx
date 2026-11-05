import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { KeyInfo } from '@/components/KeyInfo';
import { LunchOffer } from '@/components/LunchOffer';
import { MenuSection } from '@/components/MenuSection';
import { PracticalInfo } from '@/components/PracticalInfo';
import { ReservationSection } from '@/components/ReservationSection';
import { Reviews } from '@/components/Reviews';
import { Story } from '@/components/Story';
import { fetchMenu } from '@/lib/api';

export default async function HomePage() {
  // Server-side fetch: the menu is in the HTML Google receives (SEO)
  const menu = await fetchMenu();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <KeyInfo />
        <Story />
        <MenuSection menu={menu} />
        <LunchOffer />
        <Reviews />
        <ReservationSection />
        <PracticalInfo />
      </main>
      <Footer />
    </>
  );
}
