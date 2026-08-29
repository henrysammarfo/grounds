import { cn } from "@/lib/utils";

/**
 * GROUNDS mark — "the grounded check".
 * An open ring (the claim), a check (the verdict), a ground bar (the evidence).
 * Single-path geometry so it screen-prints cleanly on merch at one colour.
 */
export function GroundsMark({
  className,
  accent = true,
}: {
  className?: string;
  accent?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-7 w-7", className)}
    >
      <path
        d="M28 16A12 12 0 1 1 21.2 5.2"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M10.6 16.2 14.7 20.3 23.4 11.3"
        stroke={accent ? "var(--accent)" : "currentColor"}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 27.4H23.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GroundsWordmark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span
      className={cn(
        "t-wordmark inline-flex items-center gap-2",
        tone === "dark" ? "text-on-dark" : "text-ink",
        className,
      )}
    >
      <GroundsMark className="h-[22px] w-[22px]" />
      <span>
        GROUNDS
        <sup
          className="relative ml-[2px] text-[11.4px] text-accent"
          style={{ fontWeight: "var(--fw-black)", top: "-5px" }}
        >
          ✓
        </sup>
      </span>
    </span>
  );
}
