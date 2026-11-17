import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AdminDishDto, ApiErrorResponse, CategoryDto, MenuDto } from '@maquis18/shared';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService, slugify } from '../storage/storage.service';
import { toAdminDishDto, toDishDto } from './dish.mapper';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';

@Injectable()
export class MenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /** Full public menu: categories in order, each with its available dishes */
  async getMenu(): Promise<MenuDto> {
    const categories = await this.prisma.category.findMany({
      orderBy: { position: 'asc' },
      include: {
        dishes: {
          where: { isAvailable: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      dishes: category.dishes.map(toDishDto),
    }));
  }

  // ---------- Admin ----------

  async listCategories(): Promise<CategoryDto[]> {
    return this.prisma.category.findMany({
      orderBy: { position: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  }

  async createCategory(name: string): Promise<CategoryDto> {
    const last = await this.prisma.category.findFirst({ orderBy: { position: 'desc' }, select: { position: true } });
    return this.prisma.category.create({
      data: { name, slug: await this.uniqueSlug(name), position: (last?.position ?? -1) + 1 },
      select: { id: true, name: true, slug: true },
    });
  }

  /** Renaming keeps the slug: it may already be used in links (/#carte, anchors) */
  async renameCategory(id: string, name: string): Promise<CategoryDto> {
    await this.findCategoryOrThrow(id);
    return this.prisma.category.update({ where: { id }, data: { name }, select: { id: true, name: true, slug: true } });
  }

  /** Saves the new order in one transaction; the list must contain every category exactly once */
  async reorderCategories(ids: string[]): Promise<CategoryDto[]> {
    const existing = await this.prisma.category.findMany({ select: { id: true } });
    const sameSet =
      ids.length === existing.length && new Set(ids).size === ids.length && existing.every((c) => ids.includes(c.id));
    if (!sameSet) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'La liste doit contenir chaque catégorie une seule fois.',
      } satisfies ApiErrorResponse);
    }

    await this.prisma.$transaction(
      ids.map((id, position) => this.prisma.category.update({ where: { id }, data: { position } })),
    );
    return this.listCategories();
  }

  /** Refused while the category still has dishes: deleting it would silently delete them too */
  async deleteCategory(id: string): Promise<void> {
    await this.findCategoryOrThrow(id);
    const dishCount = await this.prisma.dish.count({ where: { categoryId: id } });
    if (dishCount > 0) {
      throw new ConflictException({
        statusCode: 409,
        message: `Cette catégorie contient encore ${dishCount} plat${dishCount > 1 ? 's' : ''}. Déplacez-les ou supprimez-les d’abord.`,
      } satisfies ApiErrorResponse);
    }
    await this.prisma.category.delete({ where: { id } });
  }

  private async findCategoryOrThrow(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Catégorie introuvable.');
    return category;
  }

  /** "Plats" → "plats", or "plats-2" if "plats" is taken */
  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    const taken = await this.prisma.category.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    const slugs = new Set(taken.map((category) => category.slug));
    let slug = base;
    for (let suffix = 2; slugs.has(slug); suffix++) slug = `${base}-${suffix}`;
    return slug;
  }

  /** Every dish, unavailable ones included, in menu order */
  async listDishes(): Promise<AdminDishDto[]> {
    const dishes = await this.prisma.dish.findMany({
      orderBy: [{ category: { position: 'asc' } }, { position: 'asc' }],
    });
    return dishes.map(toAdminDishDto);
  }

  async createDish(dto: CreateDishDto): Promise<AdminDishDto> {
    await this.assertCategoryExists(dto.categoryId);

    // New dishes go at the end of their category
    const last = await this.prisma.dish.findFirst({
      where: { categoryId: dto.categoryId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const dish = await this.prisma.dish.create({
      data: { ...dto, position: (last?.position ?? -1) + 1 },
    });
    return toAdminDishDto(dish);
  }

  async updateDish(id: string, dto: UpdateDishDto): Promise<AdminDishDto> {
    await this.findDishOrThrow(id);
    if (dto.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }

    const dish = await this.prisma.dish.update({ where: { id }, data: dto });
    return toAdminDishDto(dish);
  }

  async deleteDish(id: string): Promise<void> {
    const dish = await this.findDishOrThrow(id);
    await this.prisma.dish.delete({ where: { id } });
    await this.storage.remove(dish.imageUrl);
  }

  /** Replaces the dish photo; the previous file is deleted only once the new one is saved */
  async setDishImage(id: string, file: Buffer): Promise<AdminDishDto> {
    const dish = await this.findDishOrThrow(id);
    const imagePath = await this.storage.saveImage(file, 'dishes', dish.name);

    const updated = await this.prisma.dish.update({ where: { id }, data: { imageUrl: imagePath } });
    if (dish.imageUrl !== imagePath) await this.storage.remove(dish.imageUrl);
    return toAdminDishDto(updated);
  }

  async removeDishImage(id: string): Promise<AdminDishDto> {
    const dish = await this.findDishOrThrow(id);
    const updated = await this.prisma.dish.update({ where: { id }, data: { imageUrl: null } });
    await this.storage.remove(dish.imageUrl);
    return toAdminDishDto(updated);
  }

  private async findDishOrThrow(id: string) {
    const dish = await this.prisma.dish.findUnique({ where: { id } });
    if (!dish) {
      throw new NotFoundException('Plat introuvable.');
    }
    return dish;
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      const body: ApiErrorResponse = {
        statusCode: 400,
        message: 'Catégorie introuvable.',
        errors: { categoryId: 'Catégorie introuvable.' },
      };
      throw new BadRequestException(body);
    }
  }
}
