import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { Navbar } from "@/components/Navbar";
import { RegulatoryWatchClient } from "@/components/regulatory-watch/RegulatoryWatchClient";

export const metadata: Metadata = {
  title: "NC Regulatory Watch | Tosson Environmental Analytics",
  description:
    "Daily monitoring of NC DEQ, EMC, NCUC, and EPA actions affecting North Carolina — public comment windows, rulemaking, enforcement, and energy filings.",
  keywords: [
    "NC regulatory watch",
    "NC DEQ rulemaking",
    "EMC environmental",
    "NCUC hearings",
    "EPA North Carolina",
    "PFAS regulations",
    "environmental compliance",
  ],
};

function loadDigest(): { html: string; title: string } {
  try {
    const filePath = join(process.env.HOME ?? "/home/temitope", "knowledge", "nc-regulatory-digest.md");
    const raw = readFileSync(filePath, "utf-8");

    // Extract the title from the first markdown heading
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : "NC Regulatory Digest";

    // Extract the HTML inside the ```html ... ``` fenced block
    const htmlMatch = raw.match(/```html\s*([\s\S]*?)```/);
    if (htmlMatch) {
      return { html: htmlMatch[1].trim(), title };
    }

    // Fallback: return the whole file as plain text in a <pre>
    return { html: `<pre>${raw}</pre>`, title };
  } catch {
    return {
      html: "<p>Digest unavailable — please check back shortly.</p>",
      title: "NC Regulatory Digest",
    };
  }
}

export default function RegulatoryWatchPage() {
  const { html, title } = loadDigest();

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-white">
      <Navbar active="regulatory-watch" />
      <RegulatoryWatchClient digestHtml={html} digestTitle={title} />
      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-white/30">
        <p className="font-semibold text-white/50">Tosson Environmental Analytics LLC</p>
        <p className="mt-1">North Carolina · tossonanalytics.com</p>
      </footer>
    </main>
  );
}
