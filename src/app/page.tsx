"use client";

import Link from "next/link";
import {
  Shield,
  BarChart3,
  Map as MapIcon,
  BookOpen,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  Radar,
  Activity,
  Globe2,
} from "lucide-react";
import { Disclaimer } from "@/components/ui/disclaimer";
import { t } from "@/lib/translations";

const quickStats = [
  { label: "Сүүлийн 30 хоногийн нэгтгэл", value: "1,284", delta: "+3.1%" },
  { label: "Илүү анхаарах бүс", value: "16", delta: "-2" },
  { label: "Хамрагдсан аймаг, дүүрэг", value: "21", delta: "100%" },
  { label: "Шинэчлэгдсэн зөвлөмж", value: "42", delta: "Саяхан" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen pb-16">
      <section className="relative overflow-hidden border-b border-slate-200/70">
        <div className="absolute -left-28 top-16 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-5 py-16 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-700 mb-6">
            <Globe2 className="w-3.5 h-3.5 text-teal-700" />
            Нээлттэй, нэгтгэсэн мэдээлэл
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.05] mb-5">
                Аюулгүй байдлын мэдээллийг
                <br />
                ойлгомжтой байдлаар нэг дор
              </h1>

              <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mb-8">
                Энэ сайт бол айлгах гэж биш, илүү ойлгомжтой мэдээлэл өгөх гэж хийгдсэн. Та газрын зураг,
                тоон мэдээлэл, урьдчилан сэргийлэх зөвлөмжийг нэг дороос харж болно.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Link
                  href="/map"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-white font-semibold hover:bg-slate-800 transition-colors"
                >
                  <MapIcon className="w-4.5 h-4.5" />
                  {t.viewMap}
                </Link>
                <Link
                  href="/stats"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/90 px-6 py-3 text-slate-700 font-semibold hover:bg-white transition-colors"
                >
                  <BarChart3 className="w-4.5 h-4.5" />
                  {t.viewStats}
                </Link>
              </div>

              <div className="inline-flex items-start gap-3 rounded-xl bg-white/70 border border-slate-200 p-4 max-w-2xl">
                <Shield className="w-5 h-5 text-teal-700 mt-0.5" />
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong className="font-bold">Нууцлалын тухай:</strong> энэ платформ дээр хувь хүнийг танихуйц мэдээлэл нийтлэхгүй.
                  Зөвхөн нэгтгэсэн мэдээлэл, олон нийтэд хэрэгтэй тайлбар, зөвлөмжийг харуулна.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="surface-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm uppercase tracking-wider text-slate-500 font-semibold">Өнөөдрийн тойм</h2>
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="space-y-3">
                  {quickStats.map((item) => (
                    <div key={item.label} className="flex items-end justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">{item.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-0.5">{item.value}</p>
                      </div>
                      <span className="text-xs font-semibold rounded-full bg-teal-50 text-teal-700 px-2.5 py-1">{item.delta}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="surface-card rounded-2xl p-5 bg-slate-900/95 text-white border-transparent">
                <div className="flex items-center gap-2 mb-3">
                  <Radar className="w-4 h-4 text-amber-300" />
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-200">Хэрэглэхэд амар</p>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Газрын зургаас ерөнхий хөдөлгөөнийг харж болно. Статистик хэсгээс хугацааны өөрчлөлтийг
                  харьцуулж болно. Хэрэв тодорхой мэдээлэл өгөх шаардлагатай бол иргэдийн зураг дээр pin үлдээх боломжтой.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 py-12">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Танд хэрхэн туслах вэ?</h2>
            <p className="text-slate-600">Энд байгаа хэсгүүдийг өдөр тутам хэрэглэхэд ойлгомжтой байхаар хийсэн.</p>
          </div>
          <div className="hidden md:block h-px w-44 panel-divider" />
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <Link
            href="/map"
            className="surface-card group rounded-2xl p-6 lg:col-span-6 hover:-translate-y-0.5 transition-transform"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <MapIcon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-700 transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t.map}</h3>
            <p className="text-slate-600 leading-relaxed">
              Аль бүсэд илүү анхаарах хэрэгтэй байгааг нэгтгэсэн байдлаар хурдан харах хэсэг.
            </p>
          </Link>

          <Link
            href="/stats"
            className="surface-card group rounded-2xl p-6 lg:col-span-3 hover:-translate-y-0.5 transition-transform"
          >
            <BarChart3 className="w-6 h-6 text-slate-900 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t.stats}</h3>
            <p className="text-sm text-slate-600 mb-3">Тоон мэдээллийг жил, бүсээр нь илүү нямбай харьцуулах хэсэг.</p>
            <span className="text-sm font-semibold text-teal-700">Үзэх</span>
          </Link>

          <Link
            href="/education"
            className="surface-card group rounded-2xl p-6 lg:col-span-3 hover:-translate-y-0.5 transition-transform"
          >
            <BookOpen className="w-6 h-6 text-slate-900 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t.learnPrevention}</h3>
            <p className="text-sm text-slate-600 mb-3">Аюулгүй байдлын тухай энгийн, хэрэгтэй зөвлөмжүүд.</p>
            <span className="text-sm font-semibold text-teal-700">Үзэх</span>
          </Link>

          <a
            href="/report"
            target="_blank"
            rel="noopener noreferrer"
            className="lg:col-span-12 rounded-2xl border border-red-200 bg-red-50/80 p-6 hover:bg-red-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-bold text-red-900">{t.reportCrime}</h3>
                </div>
                <p className="text-sm text-red-800">Яаралтай нөхцөлд ашиглах албан ёсны холбоо, мэдээлэх сувгууд.</p>
              </div>
              <ExternalLink className="w-4 h-4 text-red-700 shrink-0" />
            </div>
          </a>
        </div>

        <div className="mt-8 max-w-4xl">
          <Disclaimer variant="info" className="rounded-2xl border border-slate-200 bg-white/75 p-5" />
        </div>
      </section>
    </div>
  );
}
