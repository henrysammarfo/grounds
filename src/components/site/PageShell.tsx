import type { ReactNode } from "react";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="pt-[120px]">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mx-auto w-full max-w-[1080px] px-6 pb-10 pt-8">
      <p className="t-caption anim-fade mb-4 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-accent-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        {eyebrow}
      </p>
      <h1 className="t-display-sm anim-wipe max-w-[18ch]">{title}</h1>
      {sub && <p className="t-body anim-rise mt-5 max-w-[62ch] text-muted-foreground">{sub}</p>}
      {children && <div className="anim-rise mt-8">{children}</div>}
    </header>
  );
}
