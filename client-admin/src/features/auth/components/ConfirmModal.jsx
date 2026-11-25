import { useUIStore } from '../store/uiStore';
import { Button } from '../../../shared/components/ui/Button.jsx';
import { Modal } from '../../../shared/components/ui/Modal.jsx';

export const UiConfirmHost = () => {
  const confirm = useUIStore((s) => s.confirm);
  const closeConfirm = useUIStore((s) => s.closeConfirm);

  const handleCancel = () => {
    confirm?.onCancel?.();
    closeConfirm();
  };

  const handleConfirm = async () => {
    try {
      await Promise.resolve(confirm?.onConfirm?.());
    } catch {
      // Los stores registran el error y cada vista lo muestra por toast
    } finally {
      closeConfirm();
    }
  };

  return (
    <Modal
      open={Boolean(confirm)}
      title={confirm?.title ?? ''}
      onClose={handleCancel}
      size='md'
      footer={
        <>
          <Button variant='secondary' onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            variant={confirm?.danger === false ? 'primary' : 'danger'}
            onClick={() => void handleConfirm()}
          >
            {confirm?.confirmLabel ?? 'Confirmar'}
          </Button>
        </>
      }
    >
      <p className='text-sm text-ink-soft'>{confirm?.message}</p>
    </Modal>
  );
};
