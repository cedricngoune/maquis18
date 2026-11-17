'use client';

import { useState, type FormEvent } from 'react';
import type { CategoryDto } from '@maquis18/shared';
import styles from './admin.module.css';

type CategoryHeaderProps = {
  category: CategoryDto;
  dishCount: number;
  isFirst: boolean;
  isLast: boolean;
  isBusy: boolean;
  onRename: (name: string) => Promise<unknown>;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
};

/** Category title with its actions: move up/down, rename inline, delete (only when empty) */
export function CategoryHeader({
  category,
  dishCount,
  isFirst,
  isLast,
  isBusy,
  onRename,
  onMove,
  onDelete,
}: CategoryHeaderProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [name, setName] = useState(category.name);
  const [error, setError] = useState<string | null>(null);

  const handleRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await onRename(name);
      setIsRenaming(false);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Une erreur est survenue.');
    }
  };

  if (isRenaming) {
    return (
      <form className={styles.categoryHeader} onSubmit={handleRename}>
        <label className="visually-hidden" htmlFor={`rename-${category.id}`}>
          Nouveau nom de la catégorie {category.name}
        </label>
        <input
          id={`rename-${category.id}`}
          className={`${styles.input} ${styles.categoryInput}`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          required
          autoFocus
        />
        <button type="submit" className={styles.buttonPrimarySmall} disabled={isBusy}>
          Enregistrer
        </button>
        <button
          type="button"
          className={styles.buttonGhostSmall}
          onClick={() => {
            setIsRenaming(false);
            setName(category.name);
            setError(null);
          }}
        >
          Annuler
        </button>
        {error && (
          <span role="alert" className={styles.errorText}>
            {error}
          </span>
        )}
      </form>
    );
  }

  return (
    <div className={styles.categoryHeader}>
      <h2 id={`category-${category.id}`} className={styles.categoryTitle}>
        {category.name} <span className={styles.muted}>({dishCount})</span>
      </h2>
      <div className={styles.rowActions}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => onMove(-1)}
          disabled={isFirst || isBusy}
          aria-label={`Monter la catégorie ${category.name}`}
        >
          ↑
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => onMove(1)}
          disabled={isLast || isBusy}
          aria-label={`Descendre la catégorie ${category.name}`}
        >
          ↓
        </button>
        <button type="button" className={styles.buttonGhostSmall} onClick={() => setIsRenaming(true)}>
          Renommer<span className="visually-hidden"> {category.name}</span>
        </button>
        {isConfirmingDelete ? (
          <>
            <button type="button" className={styles.buttonDangerSmall} onClick={onDelete} disabled={isBusy}>
              Confirmer la suppression
            </button>
            <button type="button" className={styles.buttonGhostSmall} onClick={() => setIsConfirmingDelete(false)}>
              Garder
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.buttonGhostSmall}
            onClick={() => setIsConfirmingDelete(true)}
            disabled={dishCount > 0}
            title={dishCount > 0 ? 'Videz d’abord la catégorie pour pouvoir la supprimer' : undefined}
          >
            Supprimer<span className="visually-hidden"> {category.name}</span>
          </button>
        )}
      </div>
    </div>
  );
}
