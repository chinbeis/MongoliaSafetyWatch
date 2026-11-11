"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Menu, X, Phone, Radar } from "lucide-react";
import { useState } from "react";
import { t } from "@/lib/translations";

const NAV_ITEMS = [
  { href: "/map", label: t.map },
  { href: "/community-map", label: t.communityMap },
  { href: "/stats", label: t.stats },
  { href: "/education", label: t.education },
  { href: "/report", label: t.reporting },
] as const;

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-lg" aria-label={t.nav.main}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-teal-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-slate-950"
      >
        {t.nav.skipToContent}
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-5">
        <div className="flex justify-between h-16 items-center gap-3">
          <Link href="/" className="flex items-center gap-3 text-slate-50 min-h-11">
            <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-slate-950" aria-hidden />
            </div>
            <span className="sr-only sm:hidden">{t.title}</span>
            <div className="hidden sm:block">
              <div className="font-bold text-base leading-tight">{t.title}</div>
              <div className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                <Radar className="w-3 h-3" aria-hidden /> {t.nav.brandTagline}
              </div>
            </div>
          </Link>

          <ul className="hidden md:flex items-center gap-1 rounded-xl bg-white/5 px-1.5 py-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} label={item.label} active={pathname === item.href} />
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            {/* Emergency numbers are one tap away on every screen size. */}
            <Link
              href="/report"
              className="flex min-h-11 items-center gap-2 bg-red-600 text-white px-3 sm:px-4 rounded-xl text-sm font-semibold hover:bg-red-500 transition-colors"
            >
              <Phone className="w-4 h-4" aria-hidden />
              <span className="sm:hidden">{t.nav.emergencyShort}</span>
              <span className="hidden sm:inline">{t.emergencyContacts}</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-300 hover:text-slate-50 hover:bg-white/5 transition-colors"
              aria-label={isOpen ? t.nav.closeMenu : t.nav.openMenu}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? <X className="w-6 h-6" aria-hidden /> : <Menu className="w-6 h-6" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {isOpen ? (
        <div id="mobile-menu" className="md:hidden bg-slate-950/95 border-t border-white/5">
          <ul className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`flex min-h-12 items-center px-4 text-base font-medium transition-colors rounded-lg ${
                    pathname === item.href ? "text-teal-200 bg-white/10" : "text-slate-200 hover:bg-white/5"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-10 items-center px-4 text-sm font-semibold transition-colors rounded-lg ${
        active ? "text-slate-950 bg-teal-500 shadow-sm" : "text-slate-300 hover:text-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}

export function Footer() {
  const pathname = usePathname();

  // Monitor pages render their own status bar.
  if (pathname === "/map" || pathname === "/community-map") {
    return null;
  }

  const linkClass = "inline-flex min-h-9 items-center text-slate-400 hover:text-teal-300 transition-colors";

  return (
    <footer className="bg-slate-950/60 border-t border-white/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-9">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-slate-950" aria-hidden />
              </div>
              <span className="font-bold text-slate-50">{t.title}</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">{t.nav.footerAbout}</p>
          </div>

          <nav aria-label={t.nav.footerNavigation}>
            <h2 className="font-semibold text-slate-50 mb-3 text-sm">{t.nav.footerNavigation}</h2>
            <ul className="space-y-1 text-sm">
              <li><Link href="/map" className={linkClass}>{t.map}</Link></li>
              <li><Link href="/community-map" className={linkClass}>{t.communityMap}</Link></li>
              <li><Link href="/stats" className={linkClass}>{t.stats}</Link></li>
              <li><Link href="/education" className={linkClass}>{t.education}</Link></li>
              <li><Link href="/data-sources" className={linkClass}>{t.dataSources}</Link></li>
            </ul>
          </nav>

          <nav aria-label={t.nav.footerLegal}>
            <h2 className="font-semibold text-slate-50 mb-3 text-sm">{t.nav.footerLegal}</h2>
            <ul className="space-y-1 text-sm">
              <li><Link href="/about" className={linkClass}>{t.about}</Link></li>
              <li><Link href="/terms" className={linkClass}>{t.terms}</Link></li>
              <li><Link href="/privacy" className={linkClass}>{t.privacy}</Link></li>
            </ul>
          </nav>
        </div>

        <div className="pt-7 border-t border-white/5">
          <p className="text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} {t.nav.footerCopyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
