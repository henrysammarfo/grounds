import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearRememberMe } from "@/lib/auth-session";

import {
  LayoutDashboard,
  FolderGit2,
  PlayCircle,
  Route as RouteIcon,
  BarChart3,
  ShieldCheck,
  Settings,
  Menu,
  X,
  Bell,
  LogOut,
  UserRound,

} from "lucide-react";
import { GroundsWordmark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "GROUNDS dashboard — claim packs, runs and approvals" },
      {
        name: "description",
        content:
          "Run claim packs, inspect trajectories, approve sandboxed actions and compare the agent against the baseline.",
      },
      { property: "og:title", content: "GROUNDS dashboard" },
      {
        property: "og:description",
        content: "Claim packs, runs, trajectories, human gate and the evaluation table.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardLayout,
});

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/cases", label: "Claim packs", icon: FolderGit2 },
  { to: "/dashboard/runs", label: "Runs", icon: PlayCircle },
  { to: "/dashboard/trajectories", label: "Trajectories", icon: RouteIcon },
  { to: "/dashboard/evaluation", label: "Evaluation", icon: BarChart3 },
  { to: "/dashboard/gate", label: "Human gate", icon: ShieldCheck },
  { to: "/dashboard/account", label: "Account", icon: UserRound },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },

] as const;

function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const initials = (email.split("@")[0] || "gr").slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    clearRememberMe();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }


  return (
    <div className="min-h-screen bg-secondary lg:flex">
      <aside
        className={cn(
          "z-40 flex w-full flex-col bg-sidebar px-4 py-5 lg:sticky lg:top-0 lg:h-screen lg:w-[248px]",
          !open && "lg:flex",
        )}
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="pl-2">
            <GroundsWordmark />
          </Link>
          <button
            type="button"
            className="text-on-dark lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <nav className={cn("mt-7 flex-1 space-y-1", open ? "block" : "hidden lg:block")}>
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: "exact" in n ? n.exact : false }}
              className="t-ui flex items-center gap-3 rounded-xl px-3 py-2.5 text-on-dark/65 transition-colors hover:bg-sidebar-accent hover:text-on-dark"
              activeProps={{ className: "bg-sidebar-accent text-on-dark" }}
            >
              <n.icon className="h-4.5 w-4.5" strokeWidth={2} />
              {n.label}
            </Link>
          ))}
        </nav>

        <div
          className={cn(
            "rounded-2xl bg-sidebar-accent p-4",
            open ? "block" : "hidden lg:block",
          )}
        >
          <p className="t-item text-on-dark">gold-pack-v1</p>
          <p className="t-caption mt-1 text-on-dark/55">10 cases · 2 adversarial</p>
          <Link
            to="/dashboard/runs"
            className="btn-light mt-4 h-9 w-full rounded-xl text-[13px]"
          >
            New run
          </Link>
        </div>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <p className="t-item">Workspace · acme engineering</p>
          <div className="flex items-center gap-4">
            <Bell className="h-4.5 w-4.5 text-muted-foreground" strokeWidth={2} />
            <span className="t-meta hidden sm:block">{email}</span>
            <Link
              to="/dashboard/account"
              aria-label="Account settings"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-on-dark"
            >
              {initials}
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="t-ui inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
              Sign out
            </button>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
