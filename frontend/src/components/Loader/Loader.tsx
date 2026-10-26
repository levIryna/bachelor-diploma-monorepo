type LoaderProps = {
  /** Width and height in pixels. */
  size?: number;
  tone?: 'default' | 'light';
};

const DEFAULT_SIZE = 15;

const toneClass = {
  default: 'border-[var(--color-border)] border-t-[var(--color-brand-600)]',
  light: 'border-white/30 border-t-white',
};

export function Loader({ size = DEFAULT_SIZE, tone = 'default' }: LoaderProps) {
  return (
    <span
      role="status"
      aria-label="Завантаження"
      className={['inline-block animate-spin rounded-full border-2', toneClass[tone]].join(' ')}
      style={{ width: size, height: size }}
    />
  );
}
