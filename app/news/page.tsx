import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { CountyNewsClient } from "@/components/county-news/CountyNewsClient";

export const metadata: Metadata = {
  title: "PFAS News by County | Tosson Environmental Analytics",
  description:
    "Real-time PFAS and water contaminant news for all 100 North Carolina counties, " +
    "analysed by Gemma 4 AI in Dr. Soneye's expert voice.",
};

export default function CountyNewsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-white">
      <Navbar active="news" />
      <CountyNewsClient />
      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-white/30">
        <p className="font-semibold text-white/50">Tosson Environmental Analytics LLC</p>
        <p className="mt-1">North Carolina · tossonanalytics.com</p>
      </footer>
    </main>
  );
}
