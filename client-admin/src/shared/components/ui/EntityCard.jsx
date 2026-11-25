import { Button } from './Button';
import { EditIcon } from './icons';
import defaultLogo from '../../../assets/img/kinal_sports.png';

/** Tarjeta de las secciones en cuadrícula (canchas, equipos, torneos) */
export function EntityCard({
  image,
  imageFallback = defaultLogo,
  title,
  badges,
  children,
  onEdit,
  onDeactivate,
}) {
  return (
    <article className='flex flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-[0_1px_2px_rgba(8,49,109,0.06)]'>
      <div className='flex h-44 items-center justify-center bg-brand-soft'>
        <img
          src={image ?? imageFallback}
          alt=''
          className={image ? 'size-full object-cover' : 'size-20 object-contain opacity-80'}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = imageFallback;
            event.currentTarget.className = 'size-20 object-contain opacity-80';
          }}
        />
      </div>
      <div className='flex flex-1 flex-col gap-2 p-4'>
        <h2 className='font-display text-lg font-semibold text-ink'>{title}</h2>
        {badges && <div className='flex flex-wrap gap-2'>{badges}</div>}
        <div className='flex flex-col gap-1 text-sm text-ink-soft'>{children}</div>
        <div className='mt-auto flex gap-2 pt-3'>
          <Button variant='secondary' size='sm' onClick={onEdit} className='flex-1'>
            <EditIcon /> Editar
          </Button>
          <Button variant='danger-outline' size='sm' onClick={onDeactivate}>
            Desactivar
          </Button>
        </div>
      </div>
    </article>
  );
}
