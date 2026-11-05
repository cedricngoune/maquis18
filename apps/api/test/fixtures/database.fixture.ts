import type { PrismaService } from '../../src/prisma/prisma.service';

/** Empties every table, children first (foreign keys) */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$transaction([
    prisma.reservation.deleteMany(),
    prisma.dish.deleteMany(),
    prisma.category.deleteMany(),
    prisma.openingHour.deleteMany(),
    prisma.adminUser.deleteMany(),
  ]);
}

/** Open every day, 11:00 – 22:00 (same as the real seed) */
export async function seedOpeningHours(prisma: PrismaService): Promise<void> {
  await prisma.openingHour.createMany({
    data: Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, opensAt: '11:00', closesAt: '22:00' })),
  });
}

export async function createCategory(prisma: PrismaService, overrides: { name?: string; slug?: string } = {}) {
  return prisma.category.create({
    data: { name: overrides.name ?? 'Plats', slug: overrides.slug ?? 'plats', position: 0 },
  });
}
