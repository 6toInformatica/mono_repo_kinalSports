import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../../features/auth/store/authStore.js";

export function AvatarUser() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  const toggleMenu = () => setOpen((prev) => !prev);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="relative" ref={dropdownRef}>

      <img
        onClick={toggleMenu}
        src={user?.profilePicture || "/default-avatar.png"}
        alt={user?.username}
        className="w-10 h-10 rounded-full object-cover border cursor-pointer"
      />

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg animate-fadeIn z-50">

          <div className="px-4 py-3 border-b">
            <p className="font-semibold text-gray-800">{user?.username}</p>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          </div>

          <ul className="p-2 text-sm text-gray-700 font-medium">
            <li>
              <Link
                to="/dashboard"
                className="block w-full p-2 rounded-md hover:bg-gray-100"
              >
                Dashboard
              </Link>
            </li>

            <li>
              <Link
                to="/dashboard/settings"
                className="block w-full p-2 rounded-md hover:bg-gray-100"
              >
                Settings
              </Link>
            </li>

            <li>
              <button
                onClick={handleLogout}
                className="block w-full text-left p-2 rounded-md hover:bg-red-100 text-red-600"
              >
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
