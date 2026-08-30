import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter, Plus, ChevronRight, Flame, Inbox } from "lucide-react";
import { toast } from "sonner";
import type { CaseStatus } from "@/lib/grounds-data";
import { StatusPill } from "@/components/dash/StatusPill";
import { useWorkspace } from "@/lib/workspace-context";
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
  const navigate = useNavigate();
  const { cases, newClaimPack, importSample, workspace } = useWorkspace();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CaseStatus | "all">("all");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [repo, setRepo] = useState("");
  const [claimA, setClaimA] = useState("All unit tests pass.");
  const [claimB, setClaimB] = useState("No secrets are committed in this repository.");

  const rows = useMemo(
    () =>
      cases.filter(
        (c) =>
          (status === "all" || c.status === status) &&
          (c.title + c.repo + c.id).toLowerCase().includes(q.toLowerCase()),
      ),
    [cases, q, status],
  );

  function onCreate() {
    const pack = newClaimPack({
      title: title.trim() || "New honesty pack",
      repo: repo.trim() || "my-repo",
      source: "README",
      claimTexts: [claimA, claimB].map((s) => s.trim()).filter(Boolean),
    });
    if (!pack) {
      toast.error("Sign in required");
      return;
    }
    toast.success(`Created ${pack.id} in ${workspace.workspaceName}`);
    setCreating(false);
    setTitle("");
    setRepo("");
    navigate({ to: "/dashboard/cases/$caseId", params: { caseId: pack.slug } });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-display-sm">Claim packs</h1>
          <p className="t-meta mt-2">
            {cases.length} pack{cases.length === 1 ? "" : "s"} in{" "}
            <strong className="text-ink font-medium">{workspace.workspaceName}</strong> — other
            accounts cannot see these.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!workspace.importedContestSample && (
            <button
              type="button"
              className="btn-outline-ink hover:bg-secondary"
              onClick={() => {
                importSample();
                toast.success("Contest gold-pack sample imported into YOUR workspace only");
              }}
            >
              Import contest sample
            </button>
          )}
          <button
            type="button"
            className="btn-ink hover:opacity-90"
            onClick={() => setCreating(true)}
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            New claim pack
          </button>
        </div>
      </div>

      {creating && (
        <div className="panel space-y-4 p-6">
          <p className="t-item">New claim pack</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="t-caption mb-1.5 block">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="README honesty check"
                className="t-body h-10 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="t-caption mb-1.5 block">Repo name</span>
              <input
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="acme/payments-api"
                className="t-body h-10 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-accent"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="t-caption mb-1.5 block">Claim 1</span>
              <input
                value={claimA}
                onChange={(e) => setClaimA(e.target.value)}
                className="t-body h-10 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-accent"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="t-caption mb-1.5 block">Claim 2</span>
              <input
                value={claimB}
                onChange={(e) => setClaimB(e.target.value)}
                className="t-body h-10 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-accent"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-ink hover:opacity-90" onClick={onCreate}>
              Create pack
            </button>
            <button
              type="button"
              className="btn-outline-ink hover:bg-secondary"
              onClick={() => setCreating(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-border-row px-5 py-4">
          <div className="relative min-w-[220px] flex-1">
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
            <li className="px-6 py-16 text-center">
              <Inbox className="mx-auto h-6 w-6 text-muted-foreground" strokeWidth={1.8} />
              <p className="t-item mt-3">No packs in this workspace yet</p>
              <p className="t-caption mt-1">
                Create a claim pack — it stays private to your account.
              </p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
