import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../ui/Badge";

const links = [
  { to: "/", label: "POS", end: true },
  { to: "/dashboard", label: "Sales Revenue" },
];

export function Sidebar() {
  const { logout } = useAuth();
  
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-white">
      <div className="border-b border-slate-800 px-5 py-6">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Local POS</p>
          <Badge tone="warning">DEMO</Badge>
        </div>
        <h1 className="mt-2 text-xl font-bold">Shop POS</h1>
        <p className="mt-1 text-xs text-slate-400">Educational & sari-sari items</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map((link) => (
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
        ))}
        
        <div className="mt-4 px-4 py-3 text-xs text-slate-500">
          <p>Other pages (Products, History, Settings) are disabled in this web demo.</p>
        </div>
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
