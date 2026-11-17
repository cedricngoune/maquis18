import type { AdminDishDto, DishDto } from '@maquis18/shared';
import type { Dish } from '@prisma/client';
import { toPublicImageUrl } from '../storage/storage.paths';

export const toDishDto = (dish: Dish): DishDto => ({
  id: dish.id,
  name: dish.name,
  description: dish.description,
  priceInCents: dish.priceInCents,
  tags: dish.tags,
  imageUrl: toPublicImageUrl(dish.imageUrl), // stored as "/uploads/…", served as an absolute URL
  isAvailable: dish.isAvailable,
});

export const toAdminDishDto = (dish: Dish): AdminDishDto => ({
  ...toDishDto(dish),
  categoryId: dish.categoryId,
});
