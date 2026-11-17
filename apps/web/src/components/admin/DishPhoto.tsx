'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type ChangeEvent } from 'react';
import { MAX_IMAGE_UPLOAD_BYTES, type AdminDishDto } from '@maquis18/shared';
import { AdminApiError } from '@/lib/admin-api';
import { useAuth } from './AuthProvider';
import styles from './admin.module.css';

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';
const MAX_MEGABYTES = MAX_IMAGE_UPLOAD_BYTES / 1024 / 1024;

type DishPhotoProps = {
  dish: AdminDishDto;
};

/** Thumbnail of a dish with "Changer / Ajouter" and "Retirer" photo actions */
export function DishPhoto({ dish }: DishPhotoProps) {
  const { request } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tooLarge, setTooLarge] = useState(false);
  const inputId = `photo-${dish.id}`;

  const refreshDishes = () => queryClient.invalidateQueries({ queryKey: ['admin', 'dishes'] });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return request<AdminDishDto>(`/admin/dishes/${dish.id}/image`, { method: 'POST', body: formData });
    },
    onSuccess: refreshDishes,
  });
  const removeMutation = useMutation({
    mutationFn: () => request<AdminDishDto>(`/admin/dishes/${dish.id}/image`, { method: 'DELETE' }),
    onSuccess: refreshDishes,
  });

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // lets the same file be chosen again after an error
    if (!file) return;
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setTooLarge(true); // checked here to avoid a long useless upload (the API refuses it anyway)
      return;
    }
    setTooLarge(false);
    uploadMutation.mutate(file);
  };

  const error = uploadMutation.error ?? removeMutation.error;
  const errorMessage =
    tooLarge || (error instanceof AdminApiError && error.status === 413)
      ? `Image trop lourde (${MAX_MEGABYTES} Mo maximum).`
      : error instanceof AdminApiError
        ? (error.body.errors?.image ?? error.message)
        : error?.message;
  const isBusy = uploadMutation.isPending || removeMutation.isPending;

  return (
    <div className={styles.dishPhoto}>
      {dish.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- image served by the API, already resized
        <img src={dish.imageUrl} alt="" className={styles.dishThumb} />
      ) : (
        <div className={`${styles.dishThumb} ${styles.dishThumbEmpty}`} aria-hidden="true">
          Pas de photo
        </div>
      )}

      <div className={styles.dishPhotoActions}>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_TYPES}
          className="visually-hidden"
          onChange={handleFile}
          disabled={isBusy}
        />
        <button
          type="button"
          className={styles.buttonGhostSmall}
          onClick={() => inputRef.current?.click()}
          disabled={isBusy}
        >
          {uploadMutation.isPending ? 'Envoi…' : dish.imageUrl ? 'Changer la photo' : 'Ajouter une photo'}
          <span className="visually-hidden"> de {dish.name}</span>
        </button>
        {dish.imageUrl && (
          <button type="button" className={styles.linkButton} onClick={() => removeMutation.mutate()} disabled={isBusy}>
            Retirer<span className="visually-hidden"> la photo de {dish.name}</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <span role="alert" className={styles.errorText}>
          {errorMessage}
        </span>
      )}
    </div>
  );
}
