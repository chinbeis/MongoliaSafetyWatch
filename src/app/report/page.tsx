import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { AlertCircle, ExternalLink, Info, Phone } from "lucide-react";
import { t } from "@/lib/translations";

export const metadata: Metadata = pageMetadata(t.reportPage.title, t.reportPage.description);

/**
 * Every number and link on this page was checked against an official source
 * on VERIFIED_ON. Re-verify before changing anything here, and update the date.
 *   101/102/103/105 — Communications Regulatory Commission of Mongolia
 *   108             — Ministry of Labour and Social Protection (Dec 2025)
 */
const VERIFIED_ON = "2026-11-11";

const EMERGENCY_NUMBERS = [
  { number: "102", title: "Цагдаа", description: "Гэмт хэрэг, зөрчил, аюулгүй байдалд заналхийлсэн нөхцөл байдлыг мэдээлэх" },
  { number: "103", title: "Түргэн тусламж", description: "Эрүүл мэндийн яаралтай тусламж дуудах" },
  { number: "101", title: "Гал түймэр", description: "Гал түймрийн аюулыг мэдээлэх" },
  { number: "105", title: "Онцгой байдал", description: "Гамшиг, ослын үеийн яаралтай хариу арга хэмжээ" },
  { number: "108", title: "Хүүхдийн тусламжийн утас", description: "Хүүхдийн яаралтай тусламж, хамгаалах төв — хүүхэд эрсдэлд орсон, хүчирхийлэлд өртсөн тохиолдолд" },
] as const;

const OFFICIAL_LINKS = [
  {
    href: "https://police.gov.mn",
    title: "Цагдаагийн ерөнхий газар",
    description: "Цагдаагийн байгууллагын албан ёсны вэбсайт",
  },
  {
    href: "https://mlsp.gov.mn/eng/content/detail/2016",
    title: "108 Хүүхдийн яаралтай тусламж, хамгаалах төв",
    description: "Хөдөлмөр, нийгмийн хамгааллын яамны мэдээлэл (англи хэлээр)",
  },
  {
    href: "https://crc.gov.mn/en/information-communication-network-and-service",
    title: "Яаралтай тусламжийн дугаарууд",
    description: "Харилцаа холбооны зохицуулах хорооны жагсаалт (англи хэлээр)",
  },
] as const;

export default function ReportPage() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-5 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-50 mb-5">{t.reportPage.title}</h1>
          <div className="flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-5">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-300 mt-0.5" aria-hidden />
            <p className="text-slate-200 leading-relaxed">{t.reportPage.notice}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-10 space-y-10">
        <section aria-labelledby="numbers-heading">
          <h2 id="numbers-heading" className="text-2xl font-bold text-slate-50 mb-6">
            {t.reportPage.numbersHeading}
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EMERGENCY_NUMBERS.map((contact) => (
              <li key={contact.number} className="surface-card rounded-2xl p-5 flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-50 mb-1">{contact.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{contact.description}</p>
                  </div>
                  <span className="mono-data text-3xl font-bold text-slate-50 shrink-0">{contact.number}</span>
                </div>
                <a
                  href={`tel:${contact.number}`}
                  className="mt-auto inline-flex min-h-12 items-center justify-center w-full gap-2 px-4 bg-teal-500 text-slate-950 text-base font-semibold rounded-xl hover:bg-teal-400 transition-colors"
                >
                  <Phone className="w-4 h-4" aria-hidden />
                  {t.reportPage.call(contact.number)}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-400">{t.reportPage.verified(VERIFIED_ON)}</p>
        </section>

        <section className="surface-card rounded-2xl p-6 sm:p-8" aria-labelledby="what-to-say">
          <h2 id="what-to-say" className="text-lg font-bold text-slate-50 mb-5">
            {t.reportPage.whatToSay}
          </h2>
          <ol className="space-y-3.5 text-slate-300 list-decimal pl-5 marker:font-bold marker:text-slate-50">
            {t.reportPage.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="official-links">
          <h2 id="official-links" className="text-lg font-bold text-slate-50 mb-5">
            {t.reportPage.officialLinks}
          </h2>
          <ul className="space-y-3">
            {OFFICIAL_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-between gap-4 p-5 surface-card rounded-2xl hover:bg-white/5 transition-colors"
                >
                  <span>
                    <span className="block font-semibold text-slate-50 mb-1">{link.title}</span>
                    <span className="block text-sm text-slate-400">{link.description}</span>
                  </span>
                  <ExternalLink className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-6">
          <div className="flex gap-3 items-start">
            <Info className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" aria-hidden />
            <div>
              <h2 className="font-semibold text-sky-100 mb-2">{t.reportPage.aboutUsTitle}</h2>
              <p className="text-sm text-sky-100/80 leading-relaxed">{t.reportPage.aboutUs}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
