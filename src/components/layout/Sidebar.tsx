import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/", label: "POS", end: true, adminOnly: false },
  { to: "/dashboard", label: "Sales Revenue", adminOnly: false }, // Cashier can now see Sales Revenue
  { to: "/products", label: "Products", adminOnly: false, requireProductAccess: true },
  { to: "/sales", label: "Sales History", adminOnly: false },
  { to: "/settings", label: "Settings", adminOnly: true },
  { to: "/accounts", label: "Account Management", adminOnly: true },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-white">
      <div className="border-b border-slate-800 px-5 py-6">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Local POS</p>
        <h1 className="mt-1 text-xl font-bold">Shop POS</h1>
        <p className="mt-1 text-xs text-slate-400">Educational & sari-sari items</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map((link) => {
          if (link.adminOnly && user?.role !== 'admin') return null;
          if (link.requireProductAccess && user?.role !== 'admin' && !user?.can_manage_products) return null;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white text-left transition"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}
