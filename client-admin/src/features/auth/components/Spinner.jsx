export const Spinner = ({ small = false }) => {
  // Variante compacta para usarse dentro de botones
  if (small) {
    return (
      <span className='inline-block animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent align-middle'></span>
    );
  }

  return (
    <div className='w-full h-screen flex items-center justify-center'>
      <div className='animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent'></div>
    </div>
  );
};
