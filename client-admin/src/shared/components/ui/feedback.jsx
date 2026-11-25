/** Estados con color y punto (se distinguen también sin color) */
const BADGE_TONES = {
  warning: { box: 'bg-amber-100 text-amber-800', dot: 'bg-amber-600' },
  success: { box: 'bg-green-100 text-green-800', dot: 'bg-green-600' },
  neutral: { box: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' },
  info: { box: 'bg-brand-soft text-brand', dot: 'bg-brand' },
  danger: { box: 'bg-red-100 text-red-800', dot: 'bg-red-600' },
};

export function Badge({ tone = 'info', dot = false, children }) {
  const classes = BADGE_TONES[tone] ?? BADGE_TONES.info;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold ${classes.box}`}
    >
      {dot && <span aria-hidden='true' className={`size-[7px] rounded-full ${classes.dot}`} />}
      {children}
    </span>
  );
}

export function Skeleton({ className = '' }) {
  return <div aria-hidden='true' className={`skeleton rounded-md ${className}`} />;
}

/** Tarjetas de carga para las secciones en cuadrícula */
export function CardGridSkeleton({ count = 6 }) {
  return (
    <div role='status' aria-label='Cargando' className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className='overflow-hidden rounded-[14px] border border-line bg-white'>
          <Skeleton className='h-44 rounded-none' />
          <div className='flex flex-col gap-2 p-4'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-3 w-1/2' />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div role='status' aria-label='Cargando' className='flex flex-col gap-4 p-5'>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className='flex gap-6'>
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className='h-3.5 flex-1' />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className='flex flex-col items-center gap-2 rounded-[14px] border border-dashed border-line-strong bg-white px-6 py-12 text-center'>
      <p className='font-display text-lg font-semibold text-ink'>{title}</p>
      <p className='max-w-sm text-sm text-ink-soft'>{message}</p>
      {action && <div className='mt-3'>{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div
      role='alert'
      className='flex flex-wrap items-center gap-3 rounded-[14px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900'
    >
      <span>{message}</span>
      {onRetry && (
        <button
          type='button'
          onClick={onRetry}
          className='ml-auto min-h-11 rounded-[10px] border border-red-200 bg-white px-4 font-semibold text-danger'
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

/** Encabezado de sección: título, descripción y acción principal */
export function PageHeader({ title, description, action }) {
  return (
    <header className='flex flex-wrap items-center gap-4'>
      <div className='flex flex-col gap-1'>
        <h1 className='font-display text-[30px] font-bold text-brand'>{title}</h1>
        <p className='text-[15px] text-ink-soft'>{description}</p>
      </div>
      {action && <div className='ml-auto flex flex-wrap gap-3'>{action}</div>}
    </header>
  );
}
