import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Strength } from "@/lib/password-strength";

const BAR_COLORS = [
  "bg-destructive",
  "bg-destructive",
  "bg-warning",
  "bg-accent",
  "bg-success",
];

export function PasswordStrength({
  password,
  strength,
  breach,
  checking,
}: {
  password: string;
  strength: Strength;
  breach: number | null;
  checking: boolean;
}) {
  if (!password) return null;

  return (
    <div className="mt-3">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < strength.score ? BAR_COLORS[strength.score] : "bg-secondary",
            )}
          />
        ))}
      </div>
      <p className="t-caption mt-2 flex items-center gap-1.5" role="status" aria-live="polite">
        {checking ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
        ) : breach && breach > 0 ? (
          <ShieldAlert className="h-3.5 w-3.5 text-destructive" strokeWidth={2} />
        ) : (
          <ShieldCheck className="h-3.5 w-3.5 text-success" strokeWidth={2} />
        )}
        <span>
          Strength: {strength.label}
          {checking && " · checking breach database…"}
          {!checking && breach !== null && breach > 0 && (
            <span className="text-destructive">
              {" "}
              · found in {breach.toLocaleString()} known breaches — pick another
            </span>
          )}
        </span>
      </p>
      {strength.hints.length > 0 && (
        <ul className="t-caption mt-1.5 list-disc space-y-0.5 pl-4">
          {strength.hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
