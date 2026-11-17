import { ConflictException } from '@nestjs/common';
import { MenuService } from './menu.service';

describe('MenuService', () => {
  const storage = { saveImage: jest.fn(), remove: jest.fn() };
  let prisma: {
    category: Record<string, jest.Mock>;
    dish: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let service: MenuService;

  beforeEach(() => {
    storage.saveImage.mockReset().mockResolvedValue('/uploads/dishes/mafe-new.webp');
    storage.remove.mockReset().mockResolvedValue(undefined);
    prisma = {
      category: {
        findFirst: jest.fn().mockResolvedValue({ position: 3 }),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({ id: 'c1', name: 'Plats', slug: 'plats' }),
        create: jest.fn(async ({ data }) => ({ id: 'new', ...data })),
        update: jest.fn(async ({ where, data }) => ({ id: where.id, ...data })),
        delete: jest.fn(),
      },
      dish: {
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue({ id: 'd1', name: 'Mafé', imageUrl: '/uploads/dishes/mafe-old.webp' }),
        update: jest.fn(async ({ where, data }) => ({
          id: where.id,
          name: 'Mafé',
          description: '',
          priceInCents: 1200,
          tags: [],
          isAvailable: true,
          categoryId: 'c1',
          imageUrl: null,
          ...data,
        })),
      },
      $transaction: jest.fn(async (operations: unknown[]) => operations),
    };
    service = new MenuService(prisma as never, storage as never);
  });

  describe('categories', () => {
    it('creates a category at the end, with a unique slug', async () => {
      prisma.category.findMany.mockResolvedValue([{ slug: 'plats' }, { slug: 'plats-2' }]);

      await service.createCategory('Plats');

      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { name: 'Plats', slug: 'plats-3', position: 4 } }),
      );
    });

    it('refuses to delete a category that still has dishes', async () => {
      prisma.dish.count.mockResolvedValue(2);

      await expect(service.deleteCategory('c1')).rejects.toBeInstanceOf(ConflictException);
      await expect(service.deleteCategory('c1')).rejects.toThrow('2 plats');
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it('deletes an empty category', async () => {
      await service.deleteCategory('c1');
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });

    it('saves a new order only if it contains every category exactly once', async () => {
      prisma.category.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);

      await expect(service.reorderCategories(['a', 'b'])).rejects.toThrow('une seule fois');
      await expect(service.reorderCategories(['a', 'a', 'b'])).rejects.toThrow('une seule fois');

      await service.reorderCategories(['c', 'a', 'b']);
      expect(prisma.category.update).toHaveBeenCalledWith({ where: { id: 'c' }, data: { position: 0 } });
      expect(prisma.category.update).toHaveBeenCalledWith({ where: { id: 'b' }, data: { position: 2 } });
    });
  });

  describe('dish photos', () => {
    it('saves the new photo, then deletes the previous file', async () => {
      const dish = await service.setDishImage('d1', Buffer.from('image'));

      expect(storage.saveImage).toHaveBeenCalledWith(expect.any(Buffer), 'dishes', 'Mafé');
      expect(prisma.dish.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data: { imageUrl: '/uploads/dishes/mafe-new.webp' },
      });
      expect(storage.remove).toHaveBeenCalledWith('/uploads/dishes/mafe-old.webp');
      expect(dish.imageUrl).toBe('http://localhost:5000/uploads/dishes/mafe-new.webp');
    });

    it('keeps the previous photo if the new one cannot be saved', async () => {
      storage.saveImage.mockRejectedValue(new Error('not an image'));

      await expect(service.setDishImage('d1', Buffer.from('x'))).rejects.toThrow('not an image');
      expect(prisma.dish.update).not.toHaveBeenCalled();
      expect(storage.remove).not.toHaveBeenCalled();
    });

    it('removes the photo of a dish', async () => {
      await service.removeDishImage('d1');

      expect(prisma.dish.update).toHaveBeenCalledWith({ where: { id: 'd1' }, data: { imageUrl: null } });
      expect(storage.remove).toHaveBeenCalledWith('/uploads/dishes/mafe-old.webp');
    });
  });
});
