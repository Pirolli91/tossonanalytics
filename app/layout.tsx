import type { Metadata } from "next";
import { Inter, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tosson Environmental Analytics | PFAS & Water Quality Data for NC",
  description:
    "Interactive PFAS and water quality dashboards for North Carolina municipalities. Federal & state contractor — HUB Eligible, NCSBE Pending. Led by Dr. Temitope D. Soneye, PhD.",
  keywords: [
    "PFAS North Carolina",
    "water quality dashboard",
    "environmental analytics",
    "GenX contamination",
    "NC DEQ",
    "PFOA PFOS monitoring",
    "environmental consulting",
    "federal contractor HUB",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sourceSans3.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[var(--font-inter)]">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
