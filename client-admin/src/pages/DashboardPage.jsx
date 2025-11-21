import { Button, Typography } from "@material-tailwind/react";

export const DashboardPage = ({ user, onLogout, children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Typography variant="h5" color="blue-gray" className="font-bold">
                Kinal Sports Admin
              </Typography>
            </div>
            
            <div className="flex items-center gap-4">
              <Typography variant="small" color="blue-gray">
                Bienvenido, {user?.name || 'Usuario'}
              </Typography>
              <Button 
                size="sm" 
                variant="outlined" 
                onClick={onLogout}
                className="capitalize"
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar + Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-[calc(100vh-4rem)]">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <a 
                  href="/home" 
                  className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                >
                  Home
                </a>
              </li>
              <li>
                <a 
                  href="/productos" 
                  className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                >
                  Productos
                </a>
              </li>
              <li>
                <a 
                  href="/clientes" 
                  className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                >
                  Clientes
                </a>
              </li>
              <li>
                <a 
                  href="/ventas" 
                  className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                >
                  Ventas
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
