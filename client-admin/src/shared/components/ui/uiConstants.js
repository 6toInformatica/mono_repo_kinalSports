export const CONTROL =
  'min-h-11 w-full rounded-[10px] border bg-white px-3.5 text-sm text-ink placeholder:text-ink-soft/70 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-surface disabled:text-ink-soft';

export const borderFor = (error) =>
  error ? 'border-2 border-danger' : 'border-line-strong focus:border-brand';

export const TH = 'px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft';
export const TD = 'px-5 py-3.5 align-middle text-sm text-ink';

export const paginate = (items, page, size) => {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, totalPages);
  return {
    totalPages,
    current,
    items: items.slice((current - 1) * size, current * size),
  };
};
