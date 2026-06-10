"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Menu, X, Phone, Radar } from "lucide-react";
import { useState } from "react";
import { t } from "@/lib/translations";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex justify-between h-16 items-center gap-3">
          <Link href="/" className="flex items-center gap-3 text-slate-50 group">
            <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-slate-950" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-base leading-tight">{t.title}</div>
              <div className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                <Radar className="w-3 h-3" /> Аюулгүй байдлын мэдээллийн сүлжээ
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1 rounded-xl bg-white/5 px-1.5 py-1">
            <NavLink href="/map" label={t.map} active={pathname === "/map"} />
            <NavLink href="/community-map" label={t.communityMap} active={pathname === "/community-map"} />
            <NavLink href="/stats" label={t.stats} active={pathname === "/stats"} />
            <NavLink href="/education" label={t.education} active={pathname === "/education"} />
            <NavLink href="/report" label={t.reporting} active={pathname === "/report"} />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/report"
              className="hidden sm:flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-500 transition-colors"
            >
              <Phone className="w-4 h-4" />
              {t.emergencyContacts}
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-50 transition-colors"
              aria-label="Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-slate-950/95 border-t border-white/5">
          <div className="px-5 py-4 space-y-1">
            <MobileNavLink href="/map" label={t.map} active={pathname === "/map"} onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/community-map" label={t.communityMap} active={pathname === "/community-map"} onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/stats" label={t.stats} active={pathname === "/stats"} onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/education" label={t.education} active={pathname === "/education"} onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/report" label={t.reporting} active={pathname === "/report"} onClick={() => setIsOpen(false)} />

            <div className="pt-3">
              <Link
                href="/report"
                className="flex items-center justify-center gap-2 w-full bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-semibold"
                onClick={() => setIsOpen(false)}
              >
                <Phone className="w-4 h-4" />
                {t.emergencyContacts}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, label, active, wallboard = false }: { href: string; label: string; active: boolean; wallboard?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 text-sm font-semibold transition-colors rounded-lg ${
        wallboard
          ? active
            ? "text-white bg-white/10"
            : "text-slate-300 hover:text-white"
          : active
          ? "text-slate-950 bg-teal-500 shadow-sm"
          : "text-slate-400 hover:text-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({ href, label, active, onClick }: { href: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      className={`block px-4 py-3 text-base font-medium transition-colors rounded-lg ${
        active ? "text-teal-300 bg-white/10" : "text-slate-300 hover:bg-white/5"
      }`}
      onClick={onClick}
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

  return (
    <footer className="bg-slate-950/60 border-t border-white/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-9">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-slate-950" />
              </div>
              <span className="font-bold text-slate-50">{t.title}</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Нэгтгэсэн өгөгдөл дээр суурилсан олон нийтийн аюулгүй байдлын мэдээллийн платформ. Албан ёсны байгууллагын сувгийг орлохгүй.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-50 mb-4 text-sm">Навигаци</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/map" className="text-slate-400 hover:text-teal-300 transition-colors">{t.map}</Link></li>
              <li><Link href="/community-map" className="text-slate-400 hover:text-teal-300 transition-colors">{t.communityMap}</Link></li>
              <li><Link href="/stats" className="text-slate-400 hover:text-teal-300 transition-colors">{t.stats}</Link></li>
              <li><Link href="/education" className="text-slate-400 hover:text-teal-300 transition-colors">{t.education}</Link></li>
              <li><Link href="/data-sources" className="text-slate-400 hover:text-teal-300 transition-colors">{t.dataSources}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-50 mb-4 text-sm">Хууль зүй</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="text-slate-400 hover:text-teal-300 transition-colors">{t.about}</Link></li>
              <li><Link href="/terms" className="text-slate-400 hover:text-teal-300 transition-colors">{t.terms}</Link></li>
              <li><Link href="/privacy" className="text-slate-400 hover:text-teal-300 transition-colors">{t.privacy}</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-7 border-t border-white/5">
          <p className="text-xs text-slate-500 text-center">
            © {new Date().getFullYear()} Олон нийтийн аюулгүй байдлын платформ. Цагдаагийн албан ёсны портал биш.
          </p>
        </div>
      </div>
    </footer>
  );
}
