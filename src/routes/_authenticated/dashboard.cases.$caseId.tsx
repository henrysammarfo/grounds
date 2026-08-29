import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Play, Download, FileText, Quote } from "lucide-react";
import { toast } from "sonner";
import { cases, trajectory } from "@/lib/grounds-data";
import { StatusPill, LabelPill } from "@/components/dash/StatusPill";
import { TrajectoryList } from "@/components/dash/TrajectoryList";

export const Route = createFileRoute("/_authenticated/dashboard/cases/$caseId")({
  loader: ({ params }) => {
    const record = cases.find((c) => c.slug === params.caseId);
    if (!record) throw notFound();
    return { record };
  },
  notFoundComponent: () => (
    <div className="panel p-12 text-center">
      <p className="t-heading">That claim pack doesn’t exist</p>
      <Link to="/dashboard/cases" className="btn-ink mt-6 hover:opacity-90">
        Back to claim packs
      </Link>
    </div>
  ),
  component: CaseDetail,
});

function CaseDetail() {
  const { record } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/cases"
        className="t-caption inline-flex items-center gap-1.5 hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        Claim packs
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="t-display-sm">{record.id}</h1>
            <StatusPill status={record.status} />
          </div>
          <p className="t-meta mt-2">
            {record.repo} · {record.source} · {record.updated}
          </p>
          <p className="t-body mt-4 max-w-[60ch]">{record.title}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="btn-outline-ink hover:bg-secondary"
            onClick={() => toast.success("trajectory.jsonl exported")}
          >
            <Download className="h-4 w-4" strokeWidth={2.2} />
            Export
          </button>
          <button
            type="button"
            className="btn-ink hover:opacity-90"
            onClick={() => toast.success(`Re-running ${record.id} in a strict sandbox`)}
          >
            <Play className="h-4 w-4" strokeWidth={2.2} />
            Re-run pack
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Claims", `${record.claims.length}`],
          ["Human minutes", `${record.humanMinutes}`],
          ["Cost", `$${record.costUsd.toFixed(2)}`],
        ].map(([k, v]) => (
          <div key={k} className="panel p-5">
            <p className="t-caption">{k}</p>
            <p className="t-heading mt-2">{v}</p>
          </div>
        ))}
      </div>

      <section className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border-row px-6 py-4">
          <FileText className="h-4 w-4 text-accent" strokeWidth={2} />
          <p className="t-item">Claims vs gold</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-border-row">
                {["Claim", "Gold", "Baseline", "GROUNDS", "Evidence"].map((h) => (
                  <th key={h} className="t-caption px-6 py-3 text-left font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-row">
              {record.claims.map((c) => (
                <tr key={c.id}>
                  <td className="t-item max-w-[280px] px-6 py-4">{c.text}</td>
                  <td className="px-6 py-4">
                    <LabelPill label={c.gold} muted />
                  </td>
                  <td className="px-6 py-4">
                    <LabelPill label={c.baseline} />
                  </td>
                  <td className="px-6 py-4">
                    <LabelPill label={c.grounds} />
                  </td>
                  <td className="t-caption max-w-[280px] px-6 py-4">
                    <span className="inline-flex items-start gap-1.5">
                      <Quote className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2} />
                      {c.evidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-border-row px-6 py-4">
          <p className="t-item">Trajectory</p>
          <p className="t-caption mt-1">Full tool I/O as recorded in trajectory.jsonl</p>
        </div>
        <div className="p-6">
          <TrajectoryList steps={trajectory} />
        </div>
      </section>
    </div>
  );
}
