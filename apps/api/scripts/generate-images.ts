/**
 * Generates the photos of the dishes (and of the website) with an AI image model.
 *
 *   yarn images:generate                  dishes without a photo
 *   yarn images:generate --all            every dish (replaces the existing photos)
 *   yarn images:generate --dish "Alloco"  a single dish
 *   yarn images:generate --site           hero and story photos of the website
 *   yarn images:generate --dry-run        shows what would be generated, calls nothing
 *   yarn images:generate --export-prompts writes docs/prompts-images.md (to generate by hand, for free)
 *
 * Needs OPENAI_API_KEY in apps/api/.env (except --dry-run and --export-prompts).
 * Optional: OPENAI_IMAGE_MODEL (default gpt-image-2), OPENAI_IMAGE_QUALITY (default medium).
 */
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { StorageService } from '../src/storage/storage.service';
import { DISH_SCENES, SITE_IMAGES, buildDishPrompt } from './image-prompts';
import { generateImage, type ImageOptions } from './openai-images';

config({ path: resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const dishName = args.includes('--dish') ? (args[args.indexOf('--dish') + 1] ?? null) : null;

const REPO_ROOT = resolve(__dirname, '../../..');
const WEB_IMAGES_DIR = join(REPO_ROOT, 'apps/web/public/images');

function imageOptions(): ImageOptions {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY manquant dans apps/api/.env');
    process.exit(1);
  }
  return {
    apiKey,
    model: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2',
    size: '1536x1024', // landscape, like the menu cards
    quality: (process.env.OPENAI_IMAGE_QUALITY as ImageOptions['quality']) ?? 'medium',
  };
}

async function exportPrompts() {
  const lines = [
    '# Prompts des images IA — Maquis 18',
    '',
    'À coller dans un générateur d’images (ChatGPT, Copilot, Firefly…). Format conseillé : paysage 3:2.',
    'Ensuite, envoyez chaque image depuis l’admin (La carte → « Ajouter une photo »).',
    'Généré par `yarn images:generate --export-prompts`.',
    '',
    '## Plats',
    '',
    ...Object.keys(DISH_SCENES).flatMap((name) => [
      `### ${name}`,
      '',
      '```',
      buildDishPrompt({ name, description: '' }),
      '```',
      '',
    ]),
    '## Images du site',
    '',
    ...SITE_IMAGES.flatMap((image) => [
      `### ${image.file} (à placer dans apps/web/public/images/)`,
      '',
      '```',
      image.prompt,
      '```',
      '',
    ]),
  ];
  const file = join(REPO_ROOT, 'docs/prompts-images.md');
  await mkdir(join(REPO_ROOT, 'docs'), { recursive: true });
  await writeFile(file, lines.join('\n'));
  console.log(`Prompts écrits dans ${file}`);
}

async function generateSiteImages(dryRun: boolean) {
  const options = dryRun ? null : imageOptions();
  await mkdir(WEB_IMAGES_DIR, { recursive: true });

  for (const image of SITE_IMAGES) {
    console.log(`→ ${image.file}`);
    if (!options) continue;
    const generated = await generateImage(image.prompt, options);
    const webp = await sharp(generated)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    await writeFile(join(WEB_IMAGES_DIR, image.file), webp);
    console.log(`  ✓ enregistrée dans apps/web/public/images/${image.file}`);
  }
}

async function generateDishImages(dryRun: boolean) {
  const prisma = new PrismaClient();
  const storage = new StorageService();
  try {
    const dishes = await prisma.dish.findMany({
      where: dishName ? { name: dishName } : flag('all') ? {} : { imageUrl: null },
      orderBy: [{ category: { position: 'asc' } }, { position: 'asc' }],
    });
    if (dishes.length === 0) {
      console.log(
        dishName
          ? `Aucun plat nommé « ${dishName} ».`
          : 'Tous les plats ont déjà une photo (utilisez --all pour les refaire).',
      );
      return;
    }

    const options = dryRun ? null : imageOptions();
    let failures = 0;
    for (const [index, dish] of dishes.entries()) {
      console.log(`[${index + 1}/${dishes.length}] ${dish.name}`);
      if (!options) {
        console.log(`  prompt : ${buildDishPrompt(dish)}`);
        continue;
      }
      try {
        const generated = await generateImage(buildDishPrompt(dish), options);
        const imagePath = await storage.saveImage(generated, 'dishes', dish.name);
        await prisma.dish.update({ where: { id: dish.id }, data: { imageUrl: imagePath } });
        await storage.remove(dish.imageUrl); // previous photo, if any
        console.log(`  ✓ ${imagePath}`);
      } catch (error) {
        failures++;
        console.error(`  ✗ ${(error as Error).message}`);
      }
    }
    if (failures)
      console.log(`\n${failures} image(s) en échec : relancez la commande, seules les manquantes seront refaites.`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const dryRun = flag('dry-run');
  if (flag('export-prompts')) return exportPrompts();
  if (flag('site')) return generateSiteImages(dryRun);
  return generateDishImages(dryRun);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
