import { notFound } from "next/navigation";
import Link from "next/link";
import { readdirSync } from "fs";
import { join } from "path";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Droplets, Calendar, User } from "lucide-react";

// Auto-discover all MDX slugs from content/insights/ at build time
export function generateStaticParams() {
  try {
    const dir = join(process.cwd(), "content", "insights");
    return readdirSync(dir)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => ({ slug: f.replace(/\.mdx$/, "") }));
  } catch {
    return [{ slug: "nc-emc-hearings-march-2026" }];
  }
}

const POSTS: Record<string, {
  title: string;
  date: string;
  author: string;
  tags: string[];
  Component: React.ComponentType;
}> = {};

// Dynamically load MDX content
async function getPost(slug: string) {
  try {
    const mod = await import(`@/content/insights/${slug}.mdx`);
    return mod;
  } catch {
    return null;
  }
}

export default async function InsightPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mod = await getPost(slug);

  if (!mod) notFound();

  const Content = mod.default;
  const meta = mod.frontmatter ?? {};

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[var(--bg-main)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Droplets className="h-6 w-6" style={{ color: "var(--brand-accent)" }} />
            <span className="text-lg font-bold tracking-tight">
              Tosson<span style={{ color: "var(--brand-accent)" }}>Analytics</span>
            </span>
          </Link>
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/insights"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Insights
        </Link>

        {/* Article header */}
        <header className="mb-10">
          {meta.tags && (
            <div className="mb-4 flex flex-wrap gap-2">
              {meta.tags.map((tag: string) => (
                <Badge
                  key={tag}
                  className="border-0 text-[10px]"
                  style={{ background: "rgba(0,212,170,0.1)", color: "var(--brand-accent)" }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <h1 className="text-2xl font-bold leading-snug lg:text-3xl">
            {meta.title ?? slug}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/40">
            {meta.date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {meta.date}
              </span>
            )}
            {meta.author && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {meta.author}
              </span>
            )}
          </div>
          {meta.summary && (
            <p className="mt-4 text-base text-white/55 font-[var(--font-source-sans)] leading-relaxed border-l-2 border-[var(--brand-accent)] pl-4">
              {meta.summary}
            </p>
          )}
        </header>

        {/* MDX body */}
        <div className="prose prose-invert prose-sm max-w-none
          prose-headings:font-bold prose-headings:text-white
          prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-base prose-h3:mt-6
          prose-p:text-white/65 prose-p:leading-relaxed prose-p:font-[var(--font-source-sans)]
          prose-strong:text-white/90 prose-strong:font-semibold
          prose-a:text-[var(--brand-accent)] prose-a:no-underline hover:prose-a:underline
          prose-li:text-white/65 prose-li:font-[var(--font-source-sans)]
          prose-hr:border-white/10
          prose-blockquote:border-[var(--brand-accent)] prose-blockquote:text-white/50
          prose-code:text-[var(--brand-accent)] prose-code:bg-white/5 prose-code:rounded prose-code:px-1">
          <Content />
        </div>
      </article>
    </main>
  );
}
