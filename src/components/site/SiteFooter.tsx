import { Link } from "@tanstack/react-router";
import { GroundsMark } from "@/components/brand/Logo";

const groups = [
  {
    title: "Product",
    items: [
      { to: "/product", label: "How it works" },
      { to: "/pricing", label: "Pricing" },
      { to: "/changelog", label: "Changelog" },
      { to: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Evidence",
    items: [
      { to: "/docs", label: "Repro guide" },
      { to: "/blog", label: "Blog" },
      { to: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    items: [
      { to: "/brand", label: "Brand & merch" },
      { to: "/contact", label: "Contact" },
      { to: "/signin", label: "Sign in" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid w-full max-w-[1080px] gap-12 px-6 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2 text-ink">
            <GroundsMark className="h-6 w-6" />
            <span className="t-wordmark text-ink">GROUNDS</span>
          </div>
          <p className="t-meta mt-4 max-w-[280px]">
            Verify engineering claims against the real repository — tools, sandboxed tests,
            and a human gate.
          </p>
          <p className="t-caption mt-6">Built in Accra. Shipped everywhere.</p>
        </div>
        {groups.map((g) => (
          <div key={g.title}>
            <p className="t-item mb-4">{g.title}</p>
            <ul className="space-y-2.5">
              {g.items.map((i) => (
                <li key={i.to}>
                  <Link to={i.to} className="t-meta hover:text-ink">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-3 px-6 py-6">
          <p className="t-caption">© 2026 GROUNDS. Evidence over prose.</p>
          <p className="t-caption">Sandboxed by default · Human approval before action</p>
        </div>
      </div>
    </footer>
  );
}
