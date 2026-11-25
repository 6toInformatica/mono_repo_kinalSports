import { resolveAvatarUrl, defaultAvatarImg } from '../../utils/avatar.js';

export function Avatar({ src, size = 36 }) {
  return (
    <img
      src={resolveAvatarUrl(src, defaultAvatarImg)}
      alt=''
      width={size}
      height={size}
      className='shrink-0 rounded-full border border-line object-cover'
      style={{ width: size, height: size }}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = defaultAvatarImg;
      }}
    />
  );
}

/** Contenedor con desplazamiento horizontal propio (la página nunca se desborda) */
export function TableCard({ children, footer }) {
  return (
    <div className='overflow-hidden rounded-[14px] border border-line bg-white'>
      <div className='overflow-x-auto'>{children}</div>
      {footer && <div className='border-t border-line px-5 py-3'>{footer}</div>}
    </div>
  );
}

export function Pagination({ page, totalPages, total, onChange }) {
  const button =
    'min-h-11 min-w-11 rounded-[10px] border border-line-strong bg-white px-3 text-sm font-semibold text-brand disabled:opacity-40';
  return (
    <nav aria-label='Paginación' className='flex flex-wrap items-center gap-3'>
      <span className='text-sm text-ink-soft'>
        {total} resultado{total === 1 ? '' : 's'} · página {page} de {totalPages}
      </span>
      <div className='ml-auto flex gap-2'>
        <button
          type='button'
          className={button}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Anterior
        </button>
        <button
          type='button'
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

export function FilterBar({ children }) {
  return <div className='flex flex-wrap items-end gap-3'>{children}</div>;
}
