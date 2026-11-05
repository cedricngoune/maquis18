import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AdminDishDto, ApiErrorResponse, CategoryDto, MenuDto } from '@maquis18/shared';
import { PrismaService } from '../prisma/prisma.service';
import { toAdminDishDto, toDishDto } from './dish.mapper';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

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
    await this.findDishOrThrow(id);
    await this.prisma.dish.delete({ where: { id } });
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
