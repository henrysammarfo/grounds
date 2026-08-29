import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { GroundsWordmark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const links = [
  { to: "/product", label: "Product" },
  { to: "/pricing", label: "Pricing" },
  { to: "/blog", label: "Blog" },
  { to: "/docs", label: "Docs" },
  { to: "/faq", label: "FAQ" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-5 sm:pt-[43px]">
      <nav
        className={cn(
          "pill-nav anim-drop pointer-events-auto relative mx-auto flex h-[52px] w-full max-w-[880px] items-center px-3 sm:px-5",
        )}
        aria-label="Main"
      >
        <Link to="/" className="ml-2 flex items-center text-on-dark">
          <GroundsWordmark />
        </Link>

        <div className="ml-auto hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="t-ui text-on-dark/85 transition-colors hover:text-on-dark"
              activeProps={{ className: "text-on-dark" }}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/dashboard" className="btn-light h-[34px] rounded-[17px] px-4">
            Open dashboard
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.4} />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-on-dark lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+8px)] flex w-[240px] flex-col gap-1 rounded-[20px] bg-surface-nav p-[10px] lg:hidden">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="t-ui rounded-xl px-3.5 py-3 text-on-dark hover:bg-on-dark/10"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/brand"
              onClick={() => setOpen(false)}
              className="t-ui rounded-xl px-3.5 py-3 text-on-dark hover:bg-on-dark/10"
            >
              Brand
            </Link>
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="btn-light mt-1.5 h-[42px] rounded-[17px]"
            >
              Open dashboard
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}
