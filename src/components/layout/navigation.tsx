"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Menu, X, Phone } from "lucide-react";
import { useState } from "react";
import { t } from "@/lib/translations";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 text-stone-900 group">
            <div className="w-9 h-9 bg-stone-900 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-base leading-tight">{t.title}</div>
              <div className="text-xs text-stone-500">Монгол Улс</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/map" label={t.map} active={pathname === "/map"} />
            <NavLink href="/stats" label={t.stats} active={pathname === "/stats"} />
            <NavLink href="/education" label={t.education} active={pathname === "/education"} />
            <NavLink href="/report" label={t.reporting} active={pathname === "/report"} />
          </div>

          {/* Emergency button + Mobile menu */}
          <div className="flex items-center gap-3">
            <Link 
              href="/report" 
              className="hidden sm:flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              <Phone className="w-4 h-4" />
              {t.emergencyContacts}
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 transition-colors"
              aria-label="Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-stone-200">
          <div className="px-5 py-4 space-y-1">
            <MobileNavLink href="/map" label={t.map} active={pathname === "/map"} onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/stats" label={t.stats} active={pathname === "/stats"} onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/education" label={t.education} active={pathname === "/education"} onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/report" label={t.reporting} active={pathname === "/report"} onClick={() => setIsOpen(false)} />
            
            <div className="pt-3">
              <Link 
                href="/report" 
                className="flex items-center justify-center gap-2 w-full bg-stone-900 text-white px-4 py-3 rounded-lg text-sm font-medium"
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

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
        active 
          ? "text-stone-900 bg-stone-100" 
          : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
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
        active 
          ? "text-stone-900 bg-stone-100" 
          : "text-stone-700 hover:bg-stone-50"
      }`}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="bg-white border-t border-stone-200">
      <div className="max-w-6xl mx-auto px-5 py-12">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          
          {/* About */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-stone-900">{t.title}</span>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed max-w-sm">
              Олон нийтийн оролцоонд тулгуурласан аюулгүй байдлын мэдээллийн платформ. 
              Бид нэгтгэсэн өгөгдлийг ашиглан иргэдийнхээ аюулгүй байдлыг хангах мэдээллийг хүргэдэг.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-stone-900 mb-4 text-sm">
              Навигаци
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/map" className="text-stone-600 hover:text-stone-900 transition-colors">
                  {t.map}
                </Link>
              </li>
              <li>
                <Link href="/stats" className="text-stone-600 hover:text-stone-900 transition-colors">
                  {t.stats}
                </Link>
              </li>
              <li>
                <Link href="/education" className="text-stone-600 hover:text-stone-900 transition-colors">
                  {t.education}
                </Link>
              </li>
              <li>
                <Link href="/data-sources" className="text-stone-600 hover:text-stone-900 transition-colors">
                  {t.dataSources}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-stone-900 mb-4 text-sm">
              Хууль зүй
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="text-stone-600 hover:text-stone-900 transition-colors">
                  {t.about}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-stone-600 hover:text-stone-900 transition-colors">
                  {t.terms}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-stone-600 hover:text-stone-900 transition-colors">
                  {t.privacy}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-stone-200">
          <p className="text-xs text-stone-500 text-center">
            © {new Date().getFullYear()} Олон нийтийн аюулгүй байдлын платформ. 
            Цагдаагийн албан ёсны портал биш.
          </p>
        </div>
      </div>
    </footer>
  );
}
