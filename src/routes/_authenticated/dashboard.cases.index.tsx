import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter, Plus, ChevronRight, Flame } from "lucide-react";
import { cases, type CaseStatus } from "@/lib/grounds-data";
import { StatusPill } from "@/components/dash/StatusPill";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/cases/")({
  component: CasesPage,
});

const filters: Array<{ key: CaseStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "mismatch", label: "Mismatch" },
  { key: "needs-human", label: "Needs human" },
  { key: "verified", label: "Verified" },
  { key: "queued", label: "Queued" },
];

function CasesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CaseStatus | "all">("all");

  const rows = useMemo(
    () =>
      cases.filter(
        (c) =>
          (status === "all" || c.status === status) &&
          (c.title + c.repo + c.id).toLowerCase().includes(q.toLowerCase()),
      ),
    [q, status],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-display-sm">Claim packs</h1>
          <p className="t-meta mt-2">
            {cases.length} cases in gold-pack-v3 · 2 adversarial · gold labels frozen
          </p>
        </div>
        <button type="button" className="btn-ink hover:opacity-90">
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          New claim pack
        </button>
      </div>

      <div className="panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-border-row px-5 py-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search repo, claim or case id"
              className="t-body h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 outline-none focus:border-accent"
            />
          </div>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatus(f.key)}
                className={cn(
                  "t-caption rounded-full px-3 py-1.5 transition-colors",
                  status === f.key
                    ? "bg-ink text-on-dark"
                    : "bg-secondary text-muted-foreground hover:text-ink",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="divide-y divide-border-row">
          {rows.map((c) => (
            <li key={c.id}>
              <Link
                to="/dashboard/cases/$caseId"
                params={{ caseId: c.slug }}
                className="flex items-center gap-4 px-6 py-5 hover:bg-secondary"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="t-item truncate">{c.title}</p>
                    {c.hard && (
                      <span className="t-caption inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-accent-foreground">
                        <Flame className="h-3 w-3" strokeWidth={2.4} />
                        Hard case
                      </span>
                    )}
                  </div>
                  <p className="t-caption mt-1.5">
                    {c.id} · {c.repo} · {c.source} · {c.claims.length} claims · {c.updated}
                  </p>
                </div>
                <StatusPill status={c.status} />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="t-meta px-6 py-12 text-center">No packs match that filter.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
