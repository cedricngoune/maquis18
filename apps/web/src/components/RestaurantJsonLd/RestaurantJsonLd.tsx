import { RESTAURANT, type MenuDto } from '@maquis18/shared';
import { SITE_URL } from '@/lib/site';

type RestaurantJsonLdProps = {
  menu: MenuDto;
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * schema.org "Restaurant" data, read by Google to show the restaurant
 * (hours, address, price range, menu) directly in search results and Maps.
 * Test it with https://search.google.com/test/rich-results
 */
export function RestaurantJsonLd({ menu }: RestaurantJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${SITE_URL}/#restaurant`,
    name: RESTAURANT.name,
    description: RESTAURANT.description,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image`,
    telephone: RESTAURANT.phone.e164,
    priceRange: RESTAURANT.priceRange,
    servesCuisine: RESTAURANT.cuisines,
    address: {
      '@type': 'PostalAddress',
      streetAddress: RESTAURANT.address.street,
      postalCode: RESTAURANT.address.postalCode,
      addressLocality: RESTAURANT.address.city,
      addressCountry: RESTAURANT.address.country,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAYS,
      opens: RESTAURANT.openingHours.opens,
      closes: RESTAURANT.openingHours.closes,
    },
    acceptsReservations: `${SITE_URL}/#reserver`,
    sameAs: [RESTAURANT.instagram.url],
    hasMenu: {
      '@type': 'Menu',
      url: `${SITE_URL}/#carte`,
      hasMenuSection: menu.map((category) => ({
        '@type': 'MenuSection',
        name: category.name,
        hasMenuItem: category.dishes.map((dish) => ({
          '@type': 'MenuItem',
          name: dish.name,
          description: dish.description,
          offers: { '@type': 'Offer', price: (dish.priceInCents / 100).toFixed(2), priceCurrency: 'EUR' },
        })),
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify escapes quotes; "<" is escaped too so a dish name can never close the <script> tag
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
