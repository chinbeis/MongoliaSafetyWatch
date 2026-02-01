"use client";

import Link from "next/link";
import { Shield, BarChart3, Map as MapIcon, BookOpen, ExternalLink, ArrowRight, AlertCircle } from "lucide-react";
import { Disclaimer } from "@/components/ui/disclaimer";
import { t } from "@/lib/translations";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Privacy notice - clean and direct */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-start gap-3 text-sm">
            <Shield className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700 leading-relaxed">
              <strong className="font-semibold">Нууцлалын баталгаа:</strong> {t.anonymizedOnly} — {t.noPersonal}. {t.eduResource}.
            </p>
          </div>
        </div>
      </div>

      {/* Hero - clean and focused */}
      <section className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {t.tagline}
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {t.heroDescription}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Link 
                href="/map"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded hover:bg-gray-800 transition-colors"
              >
                <MapIcon className="w-5 h-5" />
                {t.viewMap}
              </Link>
              
              <Link 
                href="/stats"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                {t.viewStats}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* National overview */}
      <section className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-12">
          
          <div className="grid md:grid-cols-2 gap-12">
            
            {/* Left side - context */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Улсын хэмжээний өгөгдөл
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t.nationwideSummary}
              </h2>
              
              <p className="text-gray-600 leading-relaxed">
                Иргэдийнхээ нууцлалыг хамгаалах үүднээс өгөгдлийг нэр хаяггүй, нэгтгэн харуулсан болно. Энэхүү мэдээлэл нь олон нийтийн боловсрол, урьдчилан сэргийлэх арга хэмжээнд зориулагдсан.
              </p>
            </div>

            {/* Right side - stats */}
            <div>
              <div className="space-y-6">
                
                <div className="border-l-4 border-gray-900 pl-4">
                  <div className="text-3xl font-bold text-gray-900 mb-1">12,450</div>
                  <div className="text-sm text-gray-600 font-medium">
                    {t.totalReported}
                  </div>
                </div>

                <div className="border-l-4 border-gray-400 pl-4">
                  <div className="text-3xl font-bold text-gray-900 mb-1">-4.2%</div>
                  <div className="text-sm text-gray-600 font-medium">
                    {t.vsPrevious}
                  </div>
                </div>

                <div className="border-l-4 border-gray-400 pl-4">
                  <div className="text-3xl font-bold text-gray-900 mb-1">21 бүс</div>
                  <div className="text-sm text-gray-600 font-medium">
                    {t.regionsCovered}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Tools section */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Танд хэрхэн туслах вэ?
            </h2>
            <p className="text-gray-600">
              Таны аюулгүй байдал, нууцлалд зориулсан хэрэгслүүд.
            </p>
          </div>

          {/* Feature cards - simple grid */}
          <div className="grid gap-4 mb-8">
            
            {/* Map */}
            <Link 
              href="/map"
              className="group border border-gray-300 rounded p-6 hover:border-gray-900 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <MapIcon className="w-6 h-6 text-gray-900" />
                    <h3 className="text-lg font-bold text-gray-900">
                      {t.map}
                    </h3>
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed">
                    Нэгтгэсэн өгөгдөл ашиглан бүс нутгийн аюулгүй байдлын чиг хандлагыг харах.
                  </p>
                </div>
                
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors flex-shrink-0 ml-4" />
              </div>
            </Link>

            {/* Stats and Education side by side */}
            <div className="grid md:grid-cols-2 gap-4">
              
              {/* Stats */}
              <Link 
                href="/stats"
                className="group border border-gray-300 rounded p-6 hover:border-gray-900 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 className="w-6 h-6 text-gray-900" />
                  <h3 className="text-lg font-bold text-gray-900">
                    {t.stats}
                  </h3>
                </div>
                
                <p className="text-gray-600 leading-relaxed mb-3">
                  Жил бүрийн болон бүс нутгийн статистик мэдээллийг хялбархан шинжлэх.
                </p>
                
                <div className="text-sm text-gray-500 group-hover:text-gray-900 transition-colors">
                  Үзэх →
                </div>
              </Link>

              {/* Education */}
              <Link 
                href="/education"
                className="group border border-gray-300 rounded p-6 hover:border-gray-900 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="w-6 h-6 text-gray-900" />
                  <h3 className="text-lg font-bold text-gray-900">
                    {t.learnPrevention}
                  </h3>
                </div>
                
                <p className="text-gray-600 leading-relaxed mb-3">
                  Хүүхдийн аюулгүй байдал болон олон нийтийн боловсролын гарын авлага.
                </p>
                
                <div className="text-sm text-gray-500 group-hover:text-gray-900 transition-colors">
                  Үзэх →
                </div>
              </Link>

            </div>

            {/* Report - emphasized but not alarming */}
            <a 
              href="/report"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gray-900 text-white rounded p-6 hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertCircle className="w-6 h-6" />
                    <h3 className="text-lg font-bold">
                      {t.reportCrime}
                    </h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    Цагдаагийн байгууллага болон яаралтай тусламжийн албан ёсны сувгууд.
                  </p>
                </div>
                
                <ExternalLink className="w-5 h-5 flex-shrink-0 ml-4 opacity-75" />
              </div>
            </a>

          </div>

          {/* Disclaimer */}
          <div className="max-w-3xl">
            <Disclaimer 
              variant="info"
              className="bg-gray-50 border border-gray-300 rounded p-5"
            />
          </div>

        </div>
      </section>
    </div>
  );
}