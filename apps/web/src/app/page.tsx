import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header/Header';
import { Hero } from '@/components/Hero/Hero';
import { KeyInfo } from '@/components/KeyInfo/KeyInfo';
import { LunchOffer } from '@/components/LunchOffer/LunchOffer';
import { MenuSection } from '@/components/MenuSection/MenuSection';
import { PracticalInfo } from '@/components/PracticalInfo/PracticalInfo';
import { ReservationSection } from '@/components/ReservationSection/ReservationSection';
import { RestaurantJsonLd } from '@/components/RestaurantJsonLd/RestaurantJsonLd';
import { Reviews } from '@/components/Reviews/Reviews';
import { Story } from '@/components/Story/Story';
import { fetchMenu, fetchOpeningHours } from '@/lib/api';

export default async function HomePage() {
  // Server-side fetch: the menu is in the HTML Google receives (SEO)
  const [menu, openingHours] = await Promise.all([fetchMenu(), fetchOpeningHours()]);

  return (
    <>
      <RestaurantJsonLd menu={menu} openingHours={openingHours} />
      <Header />
      <main>
        <Hero />
        <KeyInfo openingHours={openingHours} />
        <Story />
        <MenuSection menu={menu} />
        <LunchOffer />
        <Reviews />
        <ReservationSection openingHours={openingHours} />
        <PracticalInfo openingHours={openingHours} />
      </main>
      <Footer />
    </>
  );
}
