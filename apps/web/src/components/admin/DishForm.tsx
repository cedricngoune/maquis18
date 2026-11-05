'use client';

import { useState, type FormEvent } from 'react';
import {
  DISH_TAG_LABELS,
  DISH_TAGS,
  type AdminDishDto,
  type CategoryDto,
  type CreateDishRequest,
  type DishTag,
} from '@maquis18/shared';
import { AdminApiError } from '@/lib/admin-api';
import styles from './admin.module.css';

type DishFormProps = {
  categories: CategoryDto[];
  /** Dish being edited; omitted when creating a new one */
  dish?: AdminDishDto;
  submitLabel: string;
  onSubmit: (values: CreateDishRequest) => Promise<unknown>;
  onCancel: () => void;
};

/** "12,50" or "12.5" → 1250; null when the text is not a valid price */
const parsePriceToCents = (text: string): number | null => {
  const normalized = text.replace(',', '.').replace('€', '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
};

const centsToText = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

export function DishForm({ categories, dish, submitLabel, onSubmit, onCancel }: DishFormProps) {
  const [name, setName] = useState(dish?.name ?? '');
  const [description, setDescription] = useState(dish?.description ?? '');
  const [price, setPrice] = useState(dish ? centsToText(dish.priceInCents) : '');
  const [categoryId, setCategoryId] = useState(dish?.categoryId ?? categories[0]?.id ?? '');
  const [tags, setTags] = useState<DishTag[]>(dish?.tags ?? []);
  const [isAvailable, setIsAvailable] = useState(dish?.isAvailable ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: DishTag) =>
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneralError(null);

    const priceInCents = parsePriceToCents(price);
    if (priceInCents === null) {
      setErrors({ priceInCents: 'Indiquez un prix valide, par exemple 12,50.' });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit({ name, description, priceInCents, categoryId, tags, isAvailable });
    } catch (error) {
      if (error instanceof AdminApiError && error.body.errors) setErrors(error.body.errors);
      else setGeneralError(error instanceof Error ? error.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const idPrefix = `dish-${dish?.id ?? 'new'}`;
  const describedBy = (field: string) => (errors[field] ? `${idPrefix}-${field}-error` : undefined);
  const fieldError = (field: string) =>
    errors[field] ? (
      <span id={`${idPrefix}-${field}-error`} className={styles.errorText}>
        {errors[field]}
      </span>
    ) : null;

  return (
    <form className={styles.dishForm} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor={`${idPrefix}-name`}>Nom du plat</label>
        <input
          id={`${idPrefix}-name`}
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy('name')}
        />
        {fieldError('name')}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${idPrefix}-price`}>Prix (€)</label>
        <input
          id={`${idPrefix}-price`}
          className={styles.input}
          inputMode="decimal"
          placeholder="12,50"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          aria-invalid={Boolean(errors.priceInCents)}
          aria-describedby={describedBy('priceInCents')}
        />
        {fieldError('priceInCents')}
      </div>

      <div className={`${styles.field} ${styles.span2}`}>
        <label htmlFor={`${idPrefix}-description`}>Description</label>
        <textarea
          id={`${idPrefix}-description`}
          className={`${styles.input} ${styles.textarea}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={2}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={describedBy('description')}
        />
        {fieldError('description')}
      </div>

      <div className={styles.field}>
        <label htmlFor={`${idPrefix}-category`}>Catégorie</label>
        <select
          id={`${idPrefix}-category`}
          className={styles.input}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-invalid={Boolean(errors.categoryId)}
          aria-describedby={describedBy('categoryId')}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {fieldError('categoryId')}
      </div>

      <fieldset className={styles.fieldset}>
        <legend>Étiquettes</legend>
        <div className={styles.checkboxRow}>
          {DISH_TAGS.map((tag) => (
            <label key={tag} className={styles.checkbox}>
              <input type="checkbox" checked={tags.includes(tag)} onChange={() => toggleTag(tag)} />
              {DISH_TAG_LABELS[tag]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className={`${styles.checkbox} ${styles.span2}`}>
        <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
        Visible sur la carte du site
      </label>

      {generalError && (
        <p role="alert" className={`${styles.errorText} ${styles.span2}`}>
          {generalError}
        </p>
      )}

      <div className={`${styles.formActions} ${styles.span2}`}>
        <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement…' : submitLabel}
        </button>
        <button type="button" className={styles.buttonGhost} onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
