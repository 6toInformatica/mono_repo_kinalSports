export function LoginForm({ onSwitch }) {
  return (
    <form className="space-y-5">
      <div>
        <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700 mb-1.5">
          Email o Usuario
        </label>
        <input
          id="emailOrUsername"
          name="emailOrUsername"
          type="text"
          placeholder="correo@ejemplo.com o usuario"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
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

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 text-sm"
      >
        Iniciar Sesión
      </button>

      <p className="text-center text-sm text-gray-600">
        ¿No tienes cuenta?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
        >
          Regístrate
        </button>
      </p>
    </form>
  );
}
