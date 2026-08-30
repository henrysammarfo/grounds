import {
  Brain,
  FileCode2,
  Search,
  FlaskConical,
  BadgeCheck,
  UserCheck,
  FileJson,
} from "lucide-react";
import type { TrajectoryStep } from "@/lib/grounds-data";

const nodeIcon = {
  plan: Brain,
  read: FileCode2,
  grep: Search,
  test: FlaskConical,
  verify: BadgeCheck,
  gate: UserCheck,
  report: FileJson,
} as const;

export function TrajectoryList({ steps }: { steps: TrajectoryStep[] }) {
  return (
    <ol className="relative space-y-5 border-l border-border pl-7">
      {steps.map((s) => {
        const key = s.node as keyof typeof nodeIcon;
        const Icon = nodeIcon[key] ?? Brain;
        return (
          <li key={s.id} className="relative">
            <span className="absolute -left-[41px] flex h-7 w-7 items-center justify-center rounded-full bg-ink">
              <Icon className="h-3.5 w-3.5 text-on-dark" strokeWidth={2.2} />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="t-caption rounded-md bg-accent-soft px-2 py-0.5 uppercase text-accent-foreground">
                {s.node}
              </span>
              <p className="t-item">{s.label}</p>
              <span className="t-caption ml-auto">{s.duration}</span>
            </div>
            <p className="t-meta mt-1.5">{s.detail}</p>
          </li>
        );
      })}
    </ol>
  );
}
