import { Check, HelpCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = ["Claims", "Evidence", "Trajectory", "Human gate"];

/**
 * Fixed-geometry product mockup card (548 × 340 design pixels).
 * Everything inside scales from --dp so the composition never reflows.
 */
export function VerdictCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "card-float surface-card anim-rise relative overflow-hidden rounded-[16px]",
        className,
      )}
      style={
        {
          "--u": "548px",
          "--dp": "calc(var(--u) / 548)",
          width: "min(var(--u), 92vw)",
          height: "calc(min(var(--u), 92vw) * 340 / 548)",
        } as React.CSSProperties
      }
    >
      <div
        className="absolute inset-0 origin-top-left"
        style={{
          width: 548,
          height: 340,
          transform: "scale(calc(min(var(--u), 92vw) / 548px))",
        }}
      >
        <p className="t-eyebrow absolute left-[19px] top-[21px] whitespace-nowrap">
          # acme/ledger-core · README claim pack
        </p>
        <p className="t-title absolute left-[18px] top-[47px] whitespace-nowrap">
          Claim verdict
        </p>

        <div className="absolute left-[15px] top-[81px] flex h-7 items-center">
          <div className="relative h-7 w-[50px]">
            {["bg-ink", "bg-accent", "bg-muted-foreground"].map((c, i) => (
              <span
                key={c}
                className={cn(
                  "absolute top-0 h-7 w-7 rounded-full border-2 border-surface-panel",
                  c,
                )}
                style={{ left: i * 11 }}
              />
            ))}
          </div>
          <Clock className="ml-[16px] h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
          <span className="t-meta ml-[9px] whitespace-nowrap">
            Today at 10:30 a.m. <span className="px-2.5">•</span> 3 claims
            <span className="px-2.5">•</span> 1 mismatch
          </span>
        </div>

        <div className="absolute inset-x-0 top-[129px] h-[30px]">
          {tabs.map((t, i) => (
            <span
              key={t}
              className={cn(
                "t-tab absolute top-0 flex h-[30px] items-center whitespace-nowrap",
                i === 0
                  ? "rounded-t-lg bg-surface-panel px-[18px] text-ink-soft"
                  : "text-muted-foreground",
              )}
              style={{ left: [19, 130, 218, 320][i] }}
            >
              {t}
              {i === 0 && (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" />
              )}
            </span>
          ))}
        </div>

        <div className="absolute left-[19px] top-[160px] h-[169px] w-[511px] rounded-b-lg rounded-tr-lg bg-surface-panel">
          <p className="t-heading absolute left-3 top-2.5 whitespace-nowrap">Key findings</p>

          <Row
            top={36}
            tone="ok"
            title="Python 3.11 support confirmed"
            owner="Evidence: pyproject.toml · CI matrix"
          />
          <Row
            top={87}
            tone="warn"
            title="“No credentials committed” — partial"
            owner="Evidence: fixtures/aws_sample.env:3 (test fixture)"
          />
        </div>
      </div>
    </div>
  );
}

function Row({
  top,
  tone,
  title,
  owner,
}: {
  top: number;
  tone: "ok" | "warn";
  title: string;
  owner: string;
}) {
  return (
    <div
      className="absolute left-[13px] h-[46px] w-[485px] rounded-lg border border-border-row bg-surface-panel shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      style={{ top }}
    >
      <span
        className={cn(
          "absolute left-[7px] top-[7px] flex h-[15px] w-[15px] items-center justify-center rounded-full",
          tone === "ok" ? "bg-success" : "bg-warning",
        )}
      >
        {tone === "ok" ? (
          <Check className="h-2.5 w-2.5 text-on-dark" strokeWidth={3.4} />
        ) : (
          <HelpCircle className="h-2.5 w-2.5 text-on-dark" strokeWidth={3} />
        )}
      </span>
      <p className="t-item absolute left-[33px] top-[10px] whitespace-nowrap">{title}</p>
      <p className="t-caption absolute left-[33px] top-[27px] whitespace-nowrap">{owner}</p>
    </div>
  );
}
