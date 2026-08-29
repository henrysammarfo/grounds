import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { posts } from "@/lib/grounds-data";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = posts.find((p) => p.slug === params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Post not found — GROUNDS" }, { name: "robots", content: "noindex" }],
      };
    }
    const t = `${loaderData.post.title} — GROUNDS`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.post.excerpt },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.post.excerpt },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: PostNotFound,
  component: PostPage,
});

function PostNotFound() {
  return (
    <PageShell>
      <div className="mx-auto max-w-[720px] px-6 py-20">
        <h1 className="t-display-sm">That post doesn’t exist</h1>
        <Link to="/blog" className="btn-ink mt-8 hover:opacity-90">
          Back to the blog
        </Link>
      </div>
    </PageShell>
  );
}

function PostPage() {
  const { post } = Route.useLoaderData();
  return (
    <PageShell>
      <article className="mx-auto max-w-[720px] px-6 pb-20 pt-8">
        <Link to="/blog" className="t-caption inline-flex items-center gap-1.5 hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
          All posts
        </Link>
        <p className="t-caption mt-8">
          {post.tag} · {post.date} · {post.readingTime}
        </p>
        <h1 className="t-display-sm anim-wipe mt-3">{post.title}</h1>
        <div className="mt-8 space-y-6">
          {post.body.map((p) => (
            <p key={p} className="t-body text-ink-soft">
              {p}
            </p>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-border p-7">
          <p className="t-heading">See it on a real claim pack</p>
          <p className="t-meta mt-2">
            The dashboard replays every trajectory that produced these numbers.
          </p>
          <Link to="/dashboard" className="btn-ink mt-6 hover:opacity-90">
            Open dashboard
          </Link>
        </div>
      </article>
    </PageShell>
  );
}
