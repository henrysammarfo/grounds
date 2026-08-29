import { createFileRoute } from "@tanstack/react-router";
import { Plus, Minus } from "lucide-react";
import { PageShell, PageHeader } from "@/components/site/PageShell";
import { changelog } from "@/lib/grounds-data";
import { cn } from "@/lib/utils";

const title = "GROUNDS changelog — every experiment, with evidence";
const description =
  "What changed in the agent graph and what it did to accuracy, cost and human time — including the experiments we removed.";

export const Route = createFileRoute("/changelog")({
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
  component: ChangelogPage,
});

function ChangelogPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Changelog"
        title="Each entry carries its evidence cell"
        sub="Experiments that did not pay for themselves were removed, and the removal is part of the record."
      />
      <section className="mx-auto max-w-[820px] px-6 pb-20">
        <ol className="relative border-l border-border pl-8">
          {changelog.map((c) => (
            <li key={c.version} className="relative pb-12 last:pb-0">
              <span
                className={cn(
                  "absolute -left-[41px] flex h-6 w-6 items-center justify-center rounded-full",
                  c.kind === "removed" ? "bg-warning" : "bg-accent",
                )}
              >
                {c.kind === "removed" ? (
                  <Minus className="h-3.5 w-3.5 text-on-dark" strokeWidth={3} />
                ) : (
                  <Plus className="h-3.5 w-3.5 text-accent-foreground" strokeWidth={3} />
                )}
              </span>
              <p className="t-caption">
                v{c.version} · {c.date}
              </p>
              <h2 className="t-heading mt-2">{c.title}</h2>
              <p className="t-meta mt-2 max-w-[62ch]">{c.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </PageShell>
  );
}
