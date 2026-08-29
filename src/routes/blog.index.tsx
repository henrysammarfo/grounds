import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageShell, PageHeader } from "@/components/site/PageShell";
import { posts } from "@/lib/grounds-data";

const title = "GROUNDS blog — notes on documentation honesty";
const description =
  "Field notes on verifying engineering claims: why AI READMEs lie, why the verify node matters, and how the human gate saves reviewer time.";

export const Route = createFileRoute("/blog/")({
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
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Blog"
        title="Notes from the evidence layer"
        sub="Short, measured write-ups from building a claim-verification agent under a deadline."
      />
      <section className="mx-auto max-w-[1080px] px-6 pb-20">
        <div className="panel divide-y divide-border-row">
          {posts.map((p) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group flex flex-col gap-3 px-7 py-8 transition-colors hover:bg-secondary md:flex-row md:items-center md:justify-between"
            >
              <div className="max-w-[62ch]">
                <p className="t-caption mb-2">
                  {p.tag} · {p.date} · {p.readingTime}
                </p>
                <h2 className="t-heading">{p.title}</h2>
                <p className="t-meta mt-2">{p.excerpt}</p>
              </div>
              <ArrowUpRight
                className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent"
                strokeWidth={2}
              />
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
