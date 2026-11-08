import styles from './PhotoPlaceholder.module.css';

type PhotoPlaceholderProps = {
  label: string;
  height: number;
  className?: string;
};

/** Stand-in for a real photo until the images are chosen (Unsplash, Pexels…) */
export function PhotoPlaceholder({ label, height, className }: PhotoPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`Photo : ${label}`}
      className={`${styles.placeholder} ${className ?? ''}`}
      style={{ height }}
    >
      <span className={styles.label}>Photo · {label}</span>
    </div>
  );
}
