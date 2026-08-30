import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldAlert, Check, X, Inbox } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/workspace-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/gate")({
  component: GatePage,
});

const riskTone = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/15 text-warning",
  high: "bg-destructive/10 text-destructive",
} as const;

function GatePage() {
  const { gateQueue, decideGate, workspace } = useWorkspace();
  const [resolved, setResolved] = useState<Record<string, "approved" | "denied">>({});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="t-display-sm">Human gate</h1>
        <p className="t-meta mt-2">
          Approvals for {workspace.workspaceName}. Other tenants never see your queue.
        </p>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border-row px-6 py-4">
          <ShieldAlert className="h-4 w-4 text-accent" strokeWidth={2} />
          <p className="t-item">Pending approvals</p>
          <span className="t-caption ml-auto">{gateQueue.length} waiting</span>
        </div>

        {gateQueue.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Inbox className="mx-auto h-6 w-6 text-muted-foreground" strokeWidth={1.8} />
            <p className="t-item mt-3">Queue is clear</p>
            <p className="t-caption mt-1">Run the GROUNDS agent to raise gated actions.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border-row">
            {gateQueue.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-4 px-6 py-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="t-item">{g.action}</p>
                    <span
                      className={cn(
                        "t-caption rounded-full px-2 py-0.5 capitalize",
                        riskTone[g.risk],
                      )}
                    >
                      {g.risk} risk
                    </span>
                  </div>
                  <p className="t-caption mt-1.5">
                    {g.id} · case {g.case} · requested {g.requested}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      decideGate(g.id, "denied");
                      setResolved((r) => ({ ...r, [g.id]: "denied" }));
                      toast(`${g.id} denied — agent will report the blocked step`);
                    }}
                    className="btn-outline-ink hover:bg-secondary"
                  >
                    <X className="h-4 w-4" strokeWidth={2.2} />
                    Deny
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      decideGate(g.id, "approved");
                      setResolved((r) => ({ ...r, [g.id]: "approved" }));
                      toast.success(`${g.id} approved — run resumed`);
                    }}
                    className="btn-ink hover:opacity-90"
                  >
                    <Check className="h-4 w-4" strokeWidth={2.2} />
                    Approve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {Object.keys(resolved).length > 0 && (
        <div className="panel p-6">
          <p className="t-item">Decision log</p>
          <ul className="mt-4 space-y-2">
            {Object.entries(resolved).map(([id, decision]) => (
              <li key={id} className="t-meta">
                {id} — {decision} by you · just now
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
