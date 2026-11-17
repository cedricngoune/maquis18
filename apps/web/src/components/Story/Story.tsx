import { SiteImage } from '../SiteImage/SiteImage';
import styles from './Story.module.css';

export function Story() {
  return (
    <section id="histoire" className={`container section ${styles.story}`}>
      <SiteImage
        file="story.webp"
        alt="L'équipe en cuisine"
        height={420}
        className={styles.photo}
        sizes="(max-width: 900px) 100vw, 480px"
      />
      <div className={styles.text}>
        <p className="eyebrow">Notre histoire</p>
        <h2 className="section-title">Des recettes de famille, de Conakry à Paris.</h2>
        <p className={styles.body}>
          Tout a commencé dans la cuisine familiale, à Conakry. Aujourd’hui, nous partageons ces recettes transmises de
          génération en génération, avec la même règle : du fait maison, des ingrédients de qualité, et des assiettes
          qui rassasient.
        </p>
      </div>
    </section>
  );
}
