import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowRight, Droplets } from "lucide-react";

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  author: string;
  tags: string[];
  summary: string;
}

function parseFrontmatter(source: string): Record<string, string | string[]> {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const meta: Record<string, string | string[]> = {};
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const raw = line.slice(colon + 1).trim();
    if (raw.startsWith("[")) {
      meta[key] = raw.slice(1, -1).split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
    } else {
      meta[key] = raw.replace(/^"|"$/g, "");
    }
  }
  return meta;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return iso; }
}

function getAllPosts(): PostMeta[] {
  const dir = join(process.cwd(), "content", "insights");
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith(".mdx"));
    return files
      .map((file) => {
        const slug = file.replace(/\.mdx$/, "");
        const source = readFileSync(join(dir, file), "utf-8");
        const meta = parseFrontmatter(source);
        return {
          slug,
          title:   (meta.title  as string) ?? slug,
          date:    formatDate((meta.date as string) ?? ""),
          author:  (meta.author as string) ?? "Dr. Temitope D. Soneye, PhD",
          tags:    (meta.tags   as string[]) ?? [],
          summary: (meta.summary as string) ?? "",
        };
      })
      .sort((a, b) => {
        // Sort by raw ISO date descending — derive from filename for daily posts
        const da = a.slug.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? a.date;
        const db = b.slug.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? b.date;
        return db.localeCompare(da);
      });
  } catch {
    return [];
  }
}

export default function InsightsPage() {
  const posts = getAllPosts();

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
          <div className="hidden items-center gap-6 text-sm font-medium text-white/70 sm:flex">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/insights" className="text-white">Insights</Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 flex items-center gap-3">
          <BookOpen className="h-7 w-7" style={{ color: "var(--brand-accent)" }} />
          <div>
            <h1 className="text-2xl font-bold">News & Regulatory Insights</h1>
            <p className="text-sm text-white/40">
              PFAS policy, NC legislation, and scientific developments — through the lens of applied research
            </p>
          </div>
        </div>

        {posts.length === 0 ? (
          <p className="text-white/40 text-sm">No posts yet. Check back tomorrow.</p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/insights/${post.slug}`}
                className="block group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="border-0 text-[10px]"
                      style={{ background: "rgba(0,212,170,0.1)", color: "var(--brand-accent)" }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h2 className="text-lg font-bold leading-snug group-hover:text-[var(--brand-accent)] transition-colors">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-white/50 font-[var(--font-source-sans)] leading-relaxed">
                  {post.summary}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-white/30">
                    {post.date} · {post.author}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--brand-accent)" }}>
                    Read more <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
