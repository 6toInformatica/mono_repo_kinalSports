import { Link, useLocation } from "react-router-dom";

export function Sidebar() {
  const location = useLocation();

  const items = [
    { label: "Canchas", to: "/dashboard/fields" },
    { label: "Reservaciones", to: "/dashboard/reservations" },
  ];

  return (
    <aside className="w-60 bg-white min-h-[calc(100vh-4rem)] p-4 shadow-sm">
      <ul className="space-y-1">
        {items.map((item) => {
          const active = location.pathname === item.to;

          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`block px-4 py-2 rounded-lg font-medium transition-colors
                 ${active ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"}
                `}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
