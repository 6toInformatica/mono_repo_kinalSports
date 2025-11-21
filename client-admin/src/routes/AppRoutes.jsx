import { Routes, Route, Navigate } from 'react-router-dom';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<div className="p-6"><h1 className="text-2xl font-bold">Home</h1></div>} />
      <Route path="/productos" element={<div className="p-6"><h1 className="text-2xl font-bold">Productos</h1></div>} />
      <Route path="/clientes" element={<div className="p-6"><h1 className="text-2xl font-bold">Clientes</h1></div>} />
      <Route path="/ventas" element={<div className="p-6"><h1 className="text-2xl font-bold">Ventas</h1></div>} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};
