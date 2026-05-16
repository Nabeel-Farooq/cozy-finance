import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, ArrowLeftRight, Tag, Target, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/categories", label: "Categories", icon: Tag },
  { to: "/budgets", label: "Budgets", icon: Target },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile topbar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-sidebar/80 backdrop-blur px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground font-display text-sm font-bold">L</div>
          <span className="font-display font-semibold">Lumen</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="rounded-md p-2 hover:bg-accent" aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 border-r border-sidebar-border bg-sidebar p-4 transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
          open ? "translate-x-0 mt-[57px] md:mt-0" : "-translate-x-full md:translate-x-0"
        )}>
          <Link to="/dashboard" className="hidden md:flex items-center gap-2 px-2 py-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold">L</div>
            <span className="font-display text-lg font-semibold">Lumen</span>
          </Link>

          <nav className="mt-6 space-y-1">
            {nav.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={logout}
            className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </aside>

        {open && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
