'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import {
  DISH_TAG_LABELS,
  formatPrice,
  type AdminDishDto,
  type CategoryDto,
  type CreateDishRequest,
  type ReorderCategoriesRequest,
  type UpdateDishRequest,
} from '@maquis18/shared';
import { useAuth } from '@/components/admin/AuthProvider';
import { CategoryHeader } from '@/components/admin/CategoryHeader';
import { DishForm } from '@/components/admin/DishForm';
import { DishPhoto } from '@/components/admin/DishPhoto';
import styles from '@/components/admin/admin.module.css';

const DISHES_KEY = ['admin', 'dishes'];
const CATEGORIES_KEY = ['admin', 'categories'];

export default function AdminMenuPage() {
  const { request } = useAuth();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const categoriesQuery = useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: () => request<CategoryDto[]>('/admin/categories'),
  });
  const dishesQuery = useQuery({
    queryKey: DISHES_KEY,
    queryFn: () => request<AdminDishDto[]>('/admin/dishes'),
  });

  const refreshDishes = () => queryClient.invalidateQueries({ queryKey: DISHES_KEY });

  const createMutation = useMutation({
    mutationFn: (values: CreateDishRequest) => request<AdminDishDto>('/admin/dishes', { method: 'POST', body: values }),
    onSuccess: () => {
      setIsCreating(false);
      return refreshDishes();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateDishRequest }) =>
      request<AdminDishDto>(`/admin/dishes/${id}`, { method: 'PATCH', body: values }),
    onSuccess: () => {
      setEditingId(null);
      return refreshDishes();
    },
  });
  // Separate from updateMutation: its errors are shown in the page, while form errors stay inside the form
  const toggleMutation = useMutation({
    mutationFn: (dish: AdminDishDto) =>
      request<AdminDishDto>(`/admin/dishes/${dish.id}`, { method: 'PATCH', body: { isAvailable: !dish.isAvailable } }),
    onSuccess: refreshDishes,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => request<void>(`/admin/dishes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setDeletingId(null);
      return refreshDishes();
    },
  });

  // ---------- Categories ----------
  const refreshCategories = () => queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => request<CategoryDto>('/admin/categories', { method: 'POST', body: { name } }),
    onSuccess: () => {
      setIsAddingCategory(false);
      setNewCategoryName('');
      return refreshCategories();
    },
  });
  const renameCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      request<CategoryDto>(`/admin/categories/${id}`, { method: 'PATCH', body: { name } }),
    onSuccess: refreshCategories,
  });
  const reorderCategoriesMutation = useMutation({
    mutationFn: (ids: string[]) =>
      request<CategoryDto[]>('/admin/categories/reorder', {
        method: 'POST',
        body: { ids } satisfies ReorderCategoriesRequest,
      }),
    // Shows the new order immediately, without waiting for a refetch
    onSuccess: (ordered) => queryClient.setQueryData(CATEGORIES_KEY, ordered),
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => request<void>(`/admin/categories/${id}`, { method: 'DELETE' }),
    onSuccess: refreshCategories,
  });

  const categories = categoriesQuery.data ?? [];
  const dishes = dishesQuery.data ?? [];
  const mutationError =
    toggleMutation.error ?? deleteMutation.error ?? reorderCategoriesMutation.error ?? deleteCategoryMutation.error;

  const moveCategory = (index: number, direction: -1 | 1) => {
    const ids = categories.map((category) => category.id);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    reorderCategoriesMutation.mutate(ids);
  };

  const handleCreateCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createCategoryMutation.mutate(newCategoryName);
  };

  if (categoriesQuery.isPending || dishesQuery.isPending) {
    return <p className={styles.muted}>Chargement de la carte…</p>;
  }
  if (categoriesQuery.isError || dishesQuery.isError) {
    return (
      <p role="alert" className={styles.errorText}>
        {(categoriesQuery.error ?? dishesQuery.error)?.message}
      </p>
    );
  }

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>La carte</h1>
          <p className={styles.pageSubtitle}>Les modifications apparaissent sur le site en moins d’une minute.</p>
        </div>
        <div className={styles.rowActions}>
          {!isAddingCategory && (
            <button type="button" className={styles.buttonGhost} onClick={() => setIsAddingCategory(true)}>
              Nouvelle catégorie
            </button>
          )}
          {!isCreating && (
            <button type="button" className={styles.buttonPrimary} onClick={() => setIsCreating(true)}>
              Ajouter un plat
            </button>
          )}
        </div>
      </div>

      {isAddingCategory && (
        <form className={`${styles.card} ${styles.inlineForm}`} onSubmit={handleCreateCategory}>
          <div className={styles.field}>
            <label htmlFor="new-category">Nom de la nouvelle catégorie</label>
            <input
              id="new-category"
              className={styles.input}
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              maxLength={40}
              required
              autoFocus
            />
          </div>
          <button type="submit" className={styles.buttonPrimary} disabled={createCategoryMutation.isPending}>
            Créer
          </button>
          <button type="button" className={styles.buttonGhost} onClick={() => setIsAddingCategory(false)}>
            Annuler
          </button>
          {createCategoryMutation.isError && (
            <p role="alert" className={`${styles.errorText} ${styles.span2}`}>
              {createCategoryMutation.error.message}
            </p>
          )}
        </form>
      )}

      {isCreating && (
        <section className={styles.card} aria-label="Nouveau plat">
          <h2 className={styles.cardTitle}>Nouveau plat</h2>
          <DishForm
            categories={categories}
            submitLabel="Ajouter le plat"
            onSubmit={(values) => createMutation.mutateAsync(values)}
            onCancel={() => setIsCreating(false)}
          />
        </section>
      )}

      {mutationError && (
        <p role="alert" className={styles.errorText}>
          {mutationError.message}
        </p>
      )}

      {categories.map((category, index) => {
        const categoryDishes = dishes.filter((dish) => dish.categoryId === category.id);
        return (
          <section key={category.id} className={styles.categoryBlock} aria-labelledby={`category-${category.id}`}>
            <CategoryHeader
              category={category}
              dishCount={categoryDishes.length}
              isFirst={index === 0}
              isLast={index === categories.length - 1}
              isBusy={reorderCategoriesMutation.isPending || deleteCategoryMutation.isPending}
              onRename={(name) => renameCategoryMutation.mutateAsync({ id: category.id, name })}
              onMove={(direction) => moveCategory(index, direction)}
              onDelete={() => deleteCategoryMutation.mutate(category.id)}
            />

            {categoryDishes.length === 0 ? (
              <p className={styles.empty}>Aucun plat dans cette catégorie.</p>
            ) : (
              <ul className={styles.dishList}>
                {categoryDishes.map((dish) =>
                  editingId === dish.id ? (
                    <li key={dish.id} className={styles.card}>
                      <DishForm
                        categories={categories}
                        dish={dish}
                        submitLabel="Enregistrer"
                        onSubmit={(values) => updateMutation.mutateAsync({ id: dish.id, values })}
                        onCancel={() => setEditingId(null)}
                      />
                    </li>
                  ) : (
                    <li key={dish.id} className={`${styles.dishRow} ${dish.isAvailable ? '' : styles.dishHidden}`}>
                      <DishPhoto dish={dish} />
                      <div className={styles.dishMain}>
                        <div className={styles.dishTitleRow}>
                          <strong>{dish.name}</strong>
                          <span className={styles.price}>{formatPrice(dish.priceInCents)}</span>
                          {!dish.isAvailable && (
                            <span className={`${styles.badge} ${styles.badgeCANCELLED}`}>Masqué</span>
                          )}
                        </div>
                        <p className={styles.dishDescription}>{dish.description}</p>
                        {dish.tags.length > 0 && (
                          <p className={styles.muted}>{dish.tags.map((tag) => DISH_TAG_LABELS[tag]).join(' · ')}</p>
                        )}
                      </div>

                      <div className={styles.rowActions}>
                        {deletingId === dish.id ? (
                          <>
                            <button
                              type="button"
                              className={styles.buttonDangerSmall}
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(dish.id)}
                            >
                              Confirmer la suppression
                            </button>
                            <button
                              type="button"
                              className={styles.buttonGhostSmall}
                              onClick={() => setDeletingId(null)}
                            >
                              Garder
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={styles.buttonGhostSmall}
                              disabled={toggleMutation.isPending}
                              onClick={() => toggleMutation.mutate(dish)}
                            >
                              {dish.isAvailable ? 'Masquer' : 'Afficher'}
                              <span className="visually-hidden"> {dish.name}</span>
                            </button>
                            <button
                              type="button"
                              className={styles.buttonGhostSmall}
                              onClick={() => setEditingId(dish.id)}
                            >
                              Modifier<span className="visually-hidden"> {dish.name}</span>
                            </button>
                            <button
                              type="button"
                              className={styles.buttonGhostSmall}
                              onClick={() => setDeletingId(dish.id)}
                            >
                              Supprimer<span className="visually-hidden"> {dish.name}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
