import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import { DevBanner } from "../DevBanner";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: IconHome },
  { to: "/clients", label: "Clients", icon: IconUsers },
  { to: "/appointments", label: "Appointments", icon: IconCalendar },
  { to: "/site", label: "Site & content", icon: IconLayout },
  { to: "/settings", label: "Settings", icon: IconSettings },
];

export function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const configured = isFirebaseConfigured();

  async function handleSignOut() {
    if (!auth) return;
    await signOut(auth);
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <DevBanner />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:flex md:flex-col">
          <div className="flex h-14 items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Studio admin
            </span>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 p-2">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 md:hidden">
              Menu — use wider screen for nav
            </span>
            <div className="flex flex-1 items-center justify-end gap-2">
              <ThemeToggle />
              {configured && user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Sign out
                </button>
              ) : null}
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 md:hidden">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                isActive ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500 dark:text-zinc-500",
              ].join(" ")
            }
          >
            <Icon className="h-5 w-5" />
            <span className="truncate px-0.5">{label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>
      <div className="h-16 md:hidden" aria-hidden />
    </div>
  );
}

function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.classList.contains("dark") ? "light" : "dark";
    if (next === "dark") {
      root.classList.add("dark");
      try {
        localStorage.removeItem("theme");
      } catch {
        /* ignore */
      }
    } else {
      root.classList.remove("dark");
      try {
        localStorage.setItem("theme", "light");
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      aria-label="Toggle theme"
    >
      Theme
    </button>
  );
}

function IconHome({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconUsers({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCalendar({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconLayout({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function IconSettings({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
