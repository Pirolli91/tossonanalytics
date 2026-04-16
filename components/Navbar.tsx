"use client";

import Link from "next/link";
import { useState } from "react";
import { Droplets, Menu, X } from "lucide-react";

interface NavbarProps {
  active?: "dashboard" | "about" | "insights" | "services" | "news" | "regulatory-watch";
}

export function Navbar({ active }: NavbarProps) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/dashboard",        label: "Dashboard",     key: "dashboard"        },
    { href: "/news",             label: "County News",   key: "news"             },
    { href: "/regulatory-watch", label: "Reg Watch",     key: "regulatory-watch" },
    { href: "/insights",         label: "Insights",      key: "insights"         },
    { href: "/services",         label: "Services",      key: "services"         },
    { href: "/about",            label: "About",         key: "about"            },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[var(--bg-main)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Droplets className="h-6 w-6" style={{ color: "var(--brand-accent)" }} />
          <span className="text-lg font-bold tracking-tight">
            Tosson<span style={{ color: "var(--brand-accent)" }}>Analytics</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 text-sm font-medium text-white/70 sm:flex">
          {links.map(({ href, label, key }) => (
            <Link
              key={key}
              href={href}
              className={`transition-colors hover:text-white ${active === key ? "text-white" : ""}`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/about#contracting"
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--brand-accent)", color: "var(--bg-main)" }}
          >
            Work With Us
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex items-center justify-center rounded-lg p-2 text-white/60 hover:text-white sm:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-white/10 bg-[var(--bg-main)] px-6 pb-4 sm:hidden">
          <div className="flex flex-col gap-1 pt-3">
            {links.map(({ href, label, key }) => (
              <Link
                key={key}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/5 hover:text-white ${
                  active === key ? "text-white" : "text-white/60"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/about#contracting"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg px-3 py-2.5 text-center text-sm font-semibold"
              style={{ background: "var(--brand-accent)", color: "var(--bg-main)" }}
            >
              Work With Us
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
