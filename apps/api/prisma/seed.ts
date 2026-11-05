import { DishTag, PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

type SeedDish = { name: string; description: string; priceInCents: number; tags: DishTag[] };

const menu: { name: string; slug: string; dishes: SeedDish[] }[] = [
  {
    name: 'Plats',
    slug: 'plats',
    dishes: [
      { name: 'Attiéké poisson braisé', description: 'Semoule de manioc, poisson braisé entier, oignons et piment frais.', priceInCents: 1400, tags: ['HOMEMADE', 'SPICY'] },
      { name: 'Foutou banane, sauce graine', description: 'Purée de banane plantain et manioc, sauce noix de palme et viande.', priceInCents: 1300, tags: ['HOMEMADE'] },
      { name: 'Mafé de bœuf', description: 'Bœuf mijoté dans une sauce à l’arachide, riz blanc.', priceInCents: 1200, tags: ['HOMEMADE'] },
      { name: 'Poulet yassa', description: 'Poulet mariné au citron et aux oignons confits, riz parfumé.', priceInCents: 1200, tags: ['HOMEMADE'] },
      { name: 'Riz gras', description: 'Riz cuit dans une sauce tomate épicée, légumes et viande.', priceInCents: 1000, tags: ['SPICY'] },
      { name: 'Mafé de légumes', description: 'Légumes de saison, sauce arachide, riz blanc.', priceInCents: 1100, tags: ['VEGETARIAN'] },
    ],
  },
  {
    name: 'Accompagnements',
    slug: 'accompagnements',
    dishes: [
      { name: 'Alloco', description: 'Banane plantain frite, sauce pimentée maison.', priceInCents: 400, tags: ['VEGETARIAN'] },
      { name: 'Attiéké nature', description: 'Semoule de manioc légère.', priceInCents: 300, tags: ['VEGETARIAN'] },
    ],
  },
  {
    name: 'Boissons maison',
    slug: 'boissons',
    dishes: [
      { name: 'Bissap', description: 'Infusion d’hibiscus, menthe fraîche.', priceInCents: 350, tags: ['HOMEMADE'] },
      { name: 'Gingembre', description: 'Jus de gingembre pressé, citron vert.', priceInCents: 350, tags: ['HOMEMADE', 'SPICY'] },
      { name: 'Bouye', description: 'Jus de pain de singe, onctueux.', priceInCents: 400, tags: ['HOMEMADE'] },
    ],
  },
  {
    name: 'Desserts',
    slug: 'desserts',
    dishes: [
      { name: 'Dégué', description: 'Mil et yaourt sucré, vanille.', priceInCents: 450, tags: ['HOMEMADE'] },
      { name: 'Beignets', description: 'Petits beignets moelleux, sucre glace.', priceInCents: 400, tags: ['VEGETARIAN'] },
    ],
  },
];

async function main() {
  // Start from a clean menu so the seed can be re-run safely
  await prisma.dish.deleteMany();
  await prisma.category.deleteMany();
  await prisma.openingHour.deleteMany();

  for (const [categoryIndex, category] of menu.entries()) {
    await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        position: categoryIndex,
        dishes: {
          create: category.dishes.map((dish, dishIndex) => ({ ...dish, position: dishIndex })),
        },
      },
    });
  }

  // Open 7 days a week, 11:00 – 22:00
  await prisma.openingHour.createMany({
    data: Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, opensAt: '11:00', closesAt: '22:00' })),
  });

  // Admin account for the back-office (credentials come from apps/api/.env)
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@maquis18.fr').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD manquant dans apps/api/.env');
  }
  const passwordHash = await hash(adminPassword, 12);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  });

  console.log(`Seed terminé : carte, horaires et compte admin (${adminEmail}) créés.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
