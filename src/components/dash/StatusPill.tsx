import { CircleCheck, CircleAlert, CircleDashed, Clock3 } from "lucide-react";
import type { CaseStatus, ClaimLabel } from "@/lib/grounds-data";
import { cn } from "@/lib/utils";

const map: Record<CaseStatus, { label: string; cls: string; icon: typeof CircleCheck }> = {
  verified: { label: "Verified", cls: "bg-success/10 text-success", icon: CircleCheck },
  mismatch: { label: "Mismatch", cls: "bg-destructive/10 text-destructive", icon: CircleAlert },
  "needs-human": { label: "Needs human", cls: "bg-warning/15 text-warning", icon: CircleDashed },
  queued: { label: "Queued", cls: "bg-muted text-muted-foreground", icon: Clock3 },
};

export function StatusPill({ status }: { status: CaseStatus }) {
  const s = map[status];
  return (
    <span
      className={cn(
        "t-caption inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1",
        s.cls,
      )}
    >
      <s.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {s.label}
    </span>
  );
}

export function LabelPill({ label, muted }: { label: ClaimLabel; muted?: boolean }) {
  const tone =
    label === "true"
      ? "bg-success/10 text-success"
      : label === "false"
        ? "bg-destructive/10 text-destructive"
        : "bg-warning/15 text-warning";
  return (
    <span
      className={cn(
        "t-caption inline-flex rounded-md px-2 py-1 capitalize",
        muted ? "bg-muted text-muted-foreground" : tone,
      )}
    >
      {label}
    </span>
  );
}
