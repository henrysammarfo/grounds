import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/site/PageShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/grounds-data";

const title = "GROUNDS FAQ — claim packs, sandboxing and scoring";
const description =
  "Answers on what GROUNDS verifies, how gold claim packs work, what runs in the sandbox, and where the accuracy numbers come from.";

export const Route = createFileRoute("/faq")({
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
  component: FaqPage,
});

function FaqPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="FAQ"
        title="Questions reviewers actually ask"
        sub="If something here is still unclear, send the repository and the claim — the answer will be a trajectory."
      />
      <section className="mx-auto max-w-[820px] px-6 pb-20">
        <Accordion type="single" collapsible className="panel px-2">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`i${i}`} className="border-border-row px-5">
              <AccordionTrigger className="t-heading py-6 text-left hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="t-meta pb-6 pr-8">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-secondary p-8">
          <p className="t-heading max-w-[38ch]">Still deciding? Read the repro guide first.</p>
          <Link to="/docs" className="btn-ink hover:opacity-90">
            Repro guide
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
