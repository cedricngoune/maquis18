import { RESTAURANT, type MenuDto, type OpeningHourDto } from '@maquis18/shared';
import { SITE_URL } from '@/lib/site';

type RestaurantJsonLdProps = {
  menu: MenuDto;
  openingHours: OpeningHourDto[];
};

/** schema.org day names, indexed like JavaScript (0 = Sunday) */
const SCHEMA_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * schema.org "Restaurant" data, read by Google to show the restaurant
 * (hours, address, price range, menu) directly in search results and Maps.
 * Test it with https://search.google.com/test/rich-results
 */
export function RestaurantJsonLd({ menu, openingHours }: RestaurantJsonLdProps) {
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
    openingHoursSpecification: openingHours.map((hour) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SCHEMA_DAYS[hour.dayOfWeek],
      opens: hour.opensAt,
      closes: hour.closesAt,
    })),
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
