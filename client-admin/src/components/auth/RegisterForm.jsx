export function RegisterForm({ onSwitch }) {
  return (
    <form className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Juan"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div>
          <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-1.5">
            Apellido
          </label>
          <input
            id="surname"
            name="surname"
            type="text"
            placeholder="Pérez"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
          Nombre de Usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="juanperez123"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="correo@ejemplo.com"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
          Teléfono
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          maxLength={16}
          placeholder="+502 1234-5678"
          pattern="^\+\d{1,3}\s\d{1,4}-\d{4}$"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        <p className="mt-1 text-xs text-gray-500">Incluye el código de país</p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      <div>
        <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-1.5">
          Foto de Perfil
        </label>
        <input
          id="profilePicture"
          name="profilePicture"
          type="file"
          accept="image/*"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
        <p className="mt-1 text-xs text-gray-500">Formatos: JPG, PNG. Tamaño máximo: 5MB</p>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 mt-2 text-sm"
      >
        Registrarse
      </button>

      <p className="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
        >
          Inicia sesión
        </button>
      </p>
    </form>
  );
}
