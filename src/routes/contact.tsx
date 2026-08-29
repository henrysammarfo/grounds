import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { PageShell, PageHeader } from "@/components/site/PageShell";

const title = "Contact GROUNDS — send a repo and a claim you doubt";
const description =
  "Reach the GROUNDS team about pilots, self-hosted runners, gold pack authoring, or a claim you want verified.";

export const Route = createFileRoute("/contact")({
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
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Contact"
        title="Send the claim you least believe"
        sub="We will run it against the repository and send back the trajectory, not an opinion."
      />
      <section className="mx-auto grid max-w-[1080px] gap-10 px-6 pb-20 md:grid-cols-[1.2fr_1fr]">
        <form
          className="panel space-y-5 p-8"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
            toast.success("Message queued — we reply with a trajectory.");
          }}
        >
          {[
            { id: "name", label: "Name", type: "text", ph: "Ada Mensah" },
            { id: "email", label: "Work email", type: "email", ph: "ada@company.com" },
            { id: "repo", label: "Repository or PR link", type: "text", ph: "github.com/org/repo/pull/482" },
          ].map((f) => (
            <div key={f.id}>
              <label htmlFor={f.id} className="t-item mb-2 block">
                {f.label}
              </label>
              <input
                id={f.id}
                type={f.type}
                required
                placeholder={f.ph}
                className="t-body h-11 w-full rounded-xl border border-border bg-background px-4 outline-none focus:border-accent"
              />
            </div>
          ))}
          <div>
            <label htmlFor="claim" className="t-item mb-2 block">
              The claim
            </label>
            <textarea
              id="claim"
              rows={4}
              required
              placeholder="“All migrations are reversible and tested.”"
              className="t-body w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
            />
          </div>
          <button type="submit" className="btn-ink w-full hover:opacity-90">
            <Send className="h-4 w-4" strokeWidth={2.2} />
            {sent ? "Sent" : "Send claim"}
          </button>
        </form>

        <aside className="space-y-6">
          <div className="panel p-7">
            <Mail className="h-5 w-5 text-accent" strokeWidth={2} />
            <p className="t-item mt-4">hello@grounds.dev</p>
            <p className="t-meta mt-1">Replies within one working day.</p>
          </div>
          <div className="panel p-7">
            <MapPin className="h-5 w-5 text-accent" strokeWidth={2} />
            <p className="t-item mt-4">Accra, Ghana</p>
            <p className="t-meta mt-1">Remote-first, UTC+0.</p>
          </div>
          <div className="rounded-2xl bg-ink p-7">
            <p className="t-heading text-on-dark">Pilot in a week</p>
            <p className="t-meta mt-2 text-on-dark/70">
              Ten packs authored from your own repositories, scored against a baseline you can
              re-run yourself.
            </p>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}
