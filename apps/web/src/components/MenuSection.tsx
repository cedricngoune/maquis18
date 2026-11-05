'use client';

import { useState } from 'react';
import { DISH_TAG_LABELS, formatPrice, type MenuDto } from '@maquis18/shared';
import styles from './MenuSection.module.css';

type MenuSectionProps = {
  menu: MenuDto;
};

export function MenuSection({ menu }: MenuSectionProps) {
  const [selectedSlug, setSelectedSlug] = useState(menu[0]?.slug);
  const selectedCategory = menu.find((category) => category.slug === selectedSlug) ?? menu[0];

  return (
    <section id="carte" className={styles.wrapper}>
      <div className="container section">
        <div className={styles.head}>
          <div>
            <p className="eyebrow">La carte</p>
            <h2 className="section-title">Un voyage en Afrique de l’Ouest</h2>
          </div>

          {menu.length > 0 && (
            <div role="tablist" aria-label="Catégories de la carte" className={styles.tabs}>
              {menu.map((category) => {
                const isSelected = category.slug === selectedCategory?.slug;
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    id={`tab-${category.slug}`}
                    aria-selected={isSelected}
                    aria-controls="menu-panel"
                    className={`${styles.tab} ${isSelected ? styles.tabSelected : ''}`}
                    onClick={() => setSelectedSlug(category.slug)}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedCategory ? (
          <ul
            id="menu-panel"
            role="tabpanel"
            aria-labelledby={`tab-${selectedCategory.slug}`}
            className={styles.grid}
          >
            {selectedCategory.dishes.map((dish) => (
              <li key={dish.id} className={styles.card}>
                {dish.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dish.imageUrl} alt={dish.name} className={styles.photo} />
                ) : (
                  <div role="img" aria-label={`Photo : ${dish.name}`} className={styles.photo}>
                    Photo · {dish.name}
                  </div>
                )}
                <div className={styles.body}>
                  <div className={styles.titleRow}>
                    <h3 className={styles.name}>{dish.name}</h3>
                    <span className={styles.price}>{formatPrice(dish.priceInCents)}</span>
                  </div>
                  <p className={styles.description}>{dish.description}</p>
                  {dish.tags.length > 0 && (
                    <ul className={styles.tags} aria-label="Caractéristiques">
                      {dish.tags.map((tag) => (
                        <li key={tag} className={styles.tag}>
                          {DISH_TAG_LABELS[tag]}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>La carte est momentanément indisponible. Revenez dans quelques instants.</p>
        )}
      </div>
    </section>
  );
}
