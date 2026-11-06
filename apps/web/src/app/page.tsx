import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { Hero } from '@/components/Hero/Hero';
import { KeyInfo } from '@/components/KeyInfo/KeyInfo';
import { LunchOffer } from '@/components/LunchOffer/LunchOffer';
import { MenuSection } from '@/components/MenuSection/MenuSection';
import { PracticalInfo } from '@/components/PracticalInfo/PracticalInfo';
import { ReservationSection } from '@/components/ReservationSection/ReservationSection';
import { Reviews } from '@/components/Reviews/Reviews';
import { Story } from '@/components/Story/Story';
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
