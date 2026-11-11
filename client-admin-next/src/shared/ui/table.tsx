import type { ReactNode } from "react";
import { DEFAULT_AVATAR, resolveImage } from "@/shared/lib/images";

export function Avatar({
  src,
  size = 36,
}: {
  src?: string | null;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolveImage(src) ?? DEFAULT_AVATAR}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full border border-line object-cover"
      style={{ width: size, height: size }}
    />
  );
}

/** Contenedor con desplazamiento horizontal propio (la página nunca se desborda) */
export function TableCard({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-white">
      <div className="overflow-x-auto">{children}</div>
      {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
    </div>
  );
}

export const TH =
  "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft";
export const TD = "px-5 py-3.5 align-middle text-sm text-ink";

export function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const button =
    "min-h-11 min-w-11 rounded-[10px] border border-line-strong bg-white px-3 text-sm font-semibold text-brand disabled:opacity-40";
  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-ink-soft">
        {total} resultado{total === 1 ? "" : "s"} · página {page} de{" "}
        {totalPages}
      </span>
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          className={button}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className={button}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
}

export const paginate = <T,>(items: T[], page: number, size: number) => {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, totalPages);
  return {
    totalPages,
    current,
    items: items.slice((current - 1) * size, current * size),
  };
};

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-3">{children}</div>;
}
