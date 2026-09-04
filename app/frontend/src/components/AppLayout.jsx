import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutGrid, MessageSquareText, User, LogOut, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/discover", label: "Discover", icon: LayoutGrid, testid: "nav-discover" },
  { to: "/matches", label: "Matches", icon: MessageSquareText, testid: "nav-matches" },
  { to: "/profile", label: "Profile", icon: User, testid: "nav-profile" },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/discover" data-testid="nav-logo" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center shadow-sm group-hover:shadow-md transition-shadow">
              <Building2 className="w-5 h-5" strokeWidth={2.25} />
            </div>
            <div className="font-heading font-extrabold text-lg tracking-tight text-slate-900">BizMatch</div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = loc.pathname === item.to || loc.pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-testid={item.testid}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {user && user !== false && (
              <div className="hidden sm:block text-right">
                <div className="text-xs uppercase tracking-widest font-mono text-slate-500 font-semibold">
                  {user.role}
                </div>
                <div className="text-sm font-semibold text-slate-900 leading-tight">{user.display_name}</div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              data-testid="nav-logout-button"
              onClick={async () => { await logout(); nav("/"); }}
              className="text-slate-600 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden border-t border-slate-200 bg-white">
          <div className="grid grid-cols-3">
            {NAV_ITEMS.map((item) => {
              const active = loc.pathname === item.to || loc.pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-testid={`${item.testid}-mobile`}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 text-xs font-medium",
                    active ? "text-slate-900" : "text-slate-500"
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}
