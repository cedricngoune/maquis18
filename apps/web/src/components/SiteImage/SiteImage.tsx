import Image from 'next/image';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PhotoPlaceholder } from '../PhotoPlaceholder/PhotoPlaceholder';
import styles from './SiteImage.module.css';

type SiteImageProps = {
  /** File name in public/images, e.g. "hero.webp" (created by `yarn images:generate --site`) */
  file: string;
  alt: string;
  height: number;
  className?: string;
  /** true for the image visible without scrolling: loaded first (better LCP) */
  priority?: boolean;
  /** Hint for the browser: rendered width of the image, used to pick the right size */
  sizes: string;
};

/**
 * Photo of the site (hero, story…). Shows the placeholder as long as the image file
 * doesn't exist yet. The check runs on the server, at build/render time.
 */
export function SiteImage({ file, alt, height, className, priority, sizes }: SiteImageProps) {
  const exists = existsSync(join(process.cwd(), 'public', 'images', file));
  if (!exists) return <PhotoPlaceholder label={alt} height={height} className={className} />;

  return (
    <div className={`${styles.frame} ${className ?? ''}`} style={{ height }}>
      {/* next/image serves resized AVIF/WebP versions adapted to each screen */}
      <Image src={`/images/${file}`} alt={alt} fill sizes={sizes} priority={priority} className={styles.image} />
    </div>
  );
}
