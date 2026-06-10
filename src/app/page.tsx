"use client";

import Link from "next/link";
import {
  Shield,
  BarChart3,
  Map as MapIcon,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Radar,
  Activity,
  Globe2,
  Users,
} from "lucide-react";
import { Disclaimer } from "@/components/ui/disclaimer";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { t } from "@/lib/translations";

const quickStats = [
  { label: "Сүүлийн 30 хоногийн нэгтгэл", value: 1284, delta: "+3.1%" },
  { label: "Илүү анхаарах бүс", value: 16, delta: "-2" },
  { label: "Хамрагдсан аймаг, дүүрэг", value: 21, delta: "100%" },
  { label: "Шинэчлэгдсэн зөвлөмж", value: 42, delta: "Саяхан" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen pb-16">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute -left-28 top-16 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-5 py-16 md:py-20">
          <div className="anim-rise inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-300 mb-6">
            <span className="live-dot" />
            <Globe2 className="w-3.5 h-3.5 text-teal-300" />
            Нээлттэй, нэгтгэсэн мэдээлэл
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <h1 className="anim-rise anim-d-1 text-4xl md:text-6xl font-black text-slate-50 leading-[1.05] mb-5">
                Аюулгүй байдлын мэдээллийг
                <br />
                <span className="bg-gradient-to-r from-teal-300 via-teal-200 to-sky-300 bg-clip-text text-transparent">
                  ойлгомжтой байдлаар нэг дор
                </span>
              </h1>

              <p className="anim-rise anim-d-2 text-slate-400 text-lg leading-relaxed max-w-2xl mb-8">
                Энэ сайт бол айлгах гэж биш, илүү ойлгомжтой мэдээлэл өгөх гэж хийгдсэн. Та газрын зураг,
                тоон мэдээлэл, урьдчилан сэргийлэх зөвлөмжийг нэг дороос харж болно.
              </p>

              <div className="anim-rise anim-d-3 flex flex-wrap gap-3 mb-8">
                <Link
                  href="/map"
                  className="group inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-slate-950 font-semibold transition-all hover:bg-teal-400 hover:shadow-[0_12px_32px_-12px_rgba(45,212,191,0.6)] active:scale-[0.98]"
                >
                  <MapIcon className="w-4.5 h-4.5" />
                  {t.viewMap}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/stats"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-slate-200 font-semibold transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.98]"
                >
                  <BarChart3 className="w-4.5 h-4.5" />
                  {t.viewStats}
                </Link>
              </div>

              <div className="anim-rise anim-d-4 inline-flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-4 max-w-2xl">
                <Shield className="w-5 h-5 text-teal-300 mt-0.5" />
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="font-bold text-slate-100">Нууцлалын тухай:</strong> энэ платформ дээр хувь хүнийг танихуйц мэдээлэл нийтлэхгүй.
                  Зөвхөн нэгтгэсэн мэдээлэл, олон нийтэд хэрэгтэй тайлбар, зөвлөмжийг харуулна.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="surface-card hover-lift anim-rise anim-d-2 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm uppercase tracking-wider text-slate-400 font-semibold inline-flex items-center gap-2">
                    <span className="live-dot" />
                    Өнөөдрийн тойм
                  </h2>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="space-y-3">
                  {quickStats.map((item) => (
                    <div key={item.label} className="flex items-end justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide">{item.label}</p>
                        <AnimatedNumber
                          value={item.value}
                          durationMs={1400}
                          className="mono-data text-2xl font-bold text-slate-50 mt-0.5 block"
                        />
                      </div>
                      <span className="text-xs font-semibold rounded-full bg-teal-500/15 text-teal-300 px-2.5 py-1">{item.delta}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="surface-card hover-lift anim-rise anim-d-4 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Radar className="w-4 h-4 text-amber-300" />
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-300">Хэрэглэхэд амар</p>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
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
            <h2 className="text-2xl md:text-3xl font-black text-slate-50 mb-2">Танд хэрхэн туслах вэ?</h2>
            <p className="text-slate-400">Энд байгаа хэсгүүдийг өдөр тутам хэрэглэхэд ойлгомжтой байхаар хийсэн.</p>
          </div>
          <div className="hidden md:block h-px w-44 panel-divider" />
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <Link
            href="/map"
            className="surface-card hover-lift group rounded-2xl p-6 lg:col-span-6"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="h-10 w-10 rounded-xl bg-teal-500/15 text-teal-300 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <MapIcon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 transition-all group-hover:text-teal-300 group-hover:translate-x-1" />
            </div>
            <h3 className="text-xl font-bold text-slate-50 mb-2">{t.map}</h3>
            <p className="text-slate-400 leading-relaxed">
              Аль бүсэд илүү анхаарах хэрэгтэй байгааг нэгтгэсэн байдлаар хурдан харах хэсэг.
            </p>
          </Link>

          <Link
            href="/community-map"
            className="surface-card hover-lift group rounded-2xl p-6 lg:col-span-3"
          >
            <Users className="w-6 h-6 text-teal-300 mb-4 transition-transform duration-300 group-hover:scale-110" />
            <h3 className="text-lg font-bold text-slate-50 mb-2">{t.communityMap}</h3>
            <p className="text-sm text-slate-400 mb-3">Иргэдийн оруулсан аноним тэмдэглэгээг шууд харах хэсэг.</p>
            <span className="text-sm font-semibold text-teal-300 inline-flex items-center gap-1">
              Үзэх
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link
            href="/stats"
            className="surface-card hover-lift group rounded-2xl p-6 lg:col-span-3"
          >
            <BarChart3 className="w-6 h-6 text-teal-300 mb-4 transition-transform duration-300 group-hover:scale-110" />
            <h3 className="text-lg font-bold text-slate-50 mb-2">{t.stats}</h3>
            <p className="text-sm text-slate-400 mb-3">Тоон мэдээллийг жил, бүсээр нь илүү нямбай харьцуулах хэсэг.</p>
            <span className="text-sm font-semibold text-teal-300 inline-flex items-center gap-1">
              Үзэх
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link
            href="/education"
            className="surface-card hover-lift group rounded-2xl p-6 lg:col-span-6"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="h-10 w-10 rounded-xl bg-sky-500/15 text-sky-300 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <BookOpen className="w-5 h-5" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 transition-all group-hover:text-sky-300 group-hover:translate-x-1" />
            </div>
            <h3 className="text-xl font-bold text-slate-50 mb-2">{t.learnPrevention}</h3>
            <p className="text-slate-400 leading-relaxed">Аюулгүй байдлын тухай энгийн, хэрэгтэй зөвлөмжүүд.</p>
          </Link>

          <Link
            href="/report"
            className="hover-lift lg:col-span-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 transition-colors hover:bg-red-500/15"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-bold text-red-200">{t.reportCrime}</h3>
                </div>
                <p className="text-sm text-red-300/80">Яаралтай нөхцөлд ашиглах албан ёсны холбоо, мэдээлэх сувгууд.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red-400 shrink-0" />
            </div>
          </Link>
        </div>

        <div className="mt-8 max-w-4xl">
          <Disclaimer variant="info" className="rounded-2xl border border-white/10 bg-white/5 p-5" />
        </div>
      </section>
    </div>
  );
}
