import { createFileRoute } from "@tanstack/react-router";
import { Download, Shirt, Palette, Type } from "lucide-react";
import { PageShell, PageHeader } from "@/components/site/PageShell";
import { GroundsMark, GroundsWordmark } from "@/components/brand/Logo";

const title = "GROUNDS brand kit — logo, palette and merch";
const description =
  "The GROUNDS mark, wordmark, colour tokens and typography — plus the one-colour lockups used for hoodies, tees and caps.";

export const Route = createFileRoute("/brand")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BrandPage,
});

const swatches = [
  { name: "Ink", value: "#000000", cls: "bg-ink" },
  { name: "Signal cyan", value: "#38C6EC", cls: "bg-accent" },
  { name: "Paper", value: "#FFFFFF", cls: "bg-background border border-border" },
  { name: "Surface", value: "#F2F2F2", cls: "surface-card" },
  { name: "Verified", value: "#2A9A30", cls: "bg-success" },
  { name: "Partial", value: "#F6A825", cls: "bg-warning" },
];

function BrandPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Brand"
        title="One mark: a claim, a verdict, a ground line"
        sub="An open ring is the unverified claim. The cyan check is the verdict. The bar underneath is the evidence it stands on. It prints in one colour, so it survives embroidery and screen print."
      />

      <section className="mx-auto max-w-[1080px] px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-border">
            <GroundsMark className="h-24 w-24 text-ink" />
          </div>
          <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-ink">
            <GroundsWordmark className="scale-150" />
          </div>
          <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-accent">
            <GroundsMark className="h-24 w-24 text-ink" accent={false} />
          </div>
        </div>
        <p className="t-caption mt-4">
          Minimum clear space equals the height of the ground bar. Never rotate, never outline,
          never place the cyan check on a cyan field.
        </p>
      </section>

      <section className="border-y border-border bg-secondary">
        <div className="mx-auto max-w-[1080px] px-6 py-16">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-accent" strokeWidth={2} />
            <h2 className="t-heading">Palette</h2>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {swatches.map((s) => (
              <div key={s.name}>
                <div className={`h-24 rounded-xl ${s.cls}`} />
                <p className="t-item mt-3">{s.name}</p>
                <p className="t-caption mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-6 py-16">
        <div className="flex items-center gap-3">
          <Type className="h-5 w-5 text-accent" strokeWidth={2} />
          <h2 className="t-heading">Typography</h2>
        </div>
        <div className="panel mt-8 divide-y divide-border-row">
          {[
            ["Display", "Figtree 470 · −5.72% tracking", "t-display-sm"],
            ["Heading", "Figtree 511 · −2% tracking", "t-heading"],
            ["Body", "Figtree 470 · −4.75% tracking", "t-body"],
            ["Caption", "Figtree 388 · −2.95% tracking", "t-caption"],
          ].map(([name, spec, cls]) => (
            <div
              key={name}
              className="flex flex-wrap items-baseline justify-between gap-4 px-6 py-6"
            >
              <p className={cls}>Grounds every claim in evidence</p>
              <p className="t-caption">
                {name} · {spec}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-6 pb-20">
        <div className="flex items-center gap-3">
          <Shirt className="h-5 w-5 text-accent" strokeWidth={2} />
          <h2 className="t-heading">Merch lockups</h2>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="flex aspect-square flex-col items-center justify-center gap-4 rounded-2xl bg-ink">
            <GroundsMark className="h-16 w-16 text-on-dark" />
            <p className="t-caption text-on-dark/60">Hoodie · left chest · 70mm</p>
          </div>
          <div className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-border">
            <p
              className="text-ink"
              style={{
                fontSize: 34,
                fontWeight: "var(--fw-black)",
                letterSpacing: "-0.05em",
              }}
            >
              GROUNDS
            </p>
            <p className="t-caption max-w-[22ch] text-center">
              “Evidence over prose.” Tee · back print · 280mm
            </p>
          </div>
          <div className="flex aspect-square flex-col items-center justify-center gap-4 rounded-2xl bg-accent">
            <GroundsMark className="h-16 w-16 text-ink" accent={false} />
            <p className="t-caption text-accent-foreground">Cap · embroidery · one colour</p>
          </div>
        </div>
        <a
          href="/favicon.ico"
          download
          className="btn-ink mt-10 hover:opacity-90"
          aria-label="Download the GROUNDS brand assets"
        >
          <Download className="h-4 w-4" strokeWidth={2.2} />
          Download brand kit
        </a>
      </section>
    </PageShell>
  );
}
