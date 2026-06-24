import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
