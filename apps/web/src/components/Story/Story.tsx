import { PhotoPlaceholder } from '../PhotoPlaceholder/PhotoPlaceholder';
import styles from './Story.module.css';

export function Story() {
  return (
    <section id="histoire" className={`container section ${styles.story}`}>
      <PhotoPlaceholder label="L'équipe en cuisine" height={420} className={styles.photo} />
      <div className={styles.text}>
        <p className="eyebrow">Notre histoire</p>
        <h2 className="section-title">Des recettes de famille, de Conakry à Paris.</h2>
        <p className={styles.body}>
          Tout a commencé dans la cuisine familiale, à Conakry. Aujourd’hui, nous partageons ces recettes transmises de
          génération en génération, avec la même règle : du fait maison, des ingrédients de qualité, et des assiettes qui
          rassasient.
        </p>
      </div>
    </section>
  );
}
