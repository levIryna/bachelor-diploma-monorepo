type LoaderProps = {
  /** Width and height in pixels. */
  size?: number;
};

const DEFAULT_SIZE = 15;

export function Loader({ size = DEFAULT_SIZE }: LoaderProps) {
  return (
    <span
      role="status"
      aria-label="Завантаження"
      className="inline-block animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand-600)]"
      style={{ width: size, height: size }}
    />
  );
}
