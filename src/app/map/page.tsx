"use client";

import { MapWrapper } from "@/components/map/map-wrapper";
import { t } from "@/lib/translations";
import { Filter, Map as MapIcon, Info, Calendar, Layers } from "lucide-react";
import { useState } from "react";

// Sample aggregated grid data - Ulaanbaatar coordinates
const SAMPLE_GRID_DATA = [
  { lat: 47.9188, lng: 106.9173, count: 45 },
  { lat: 47.9231, lng: 106.8845, count: 20 },
  { lat: 47.9012, lng: 106.9456, count: 35 },
  { lat: 47.9356, lng: 106.9012, count: 12 },
  { lat: 47.8945, lng: 106.8723, count: 28 },
  { lat: 47.9100, lng: 106.9300, count: 52 },
  { lat: 47.9050, lng: 106.8900, count: 18 },
  { lat: 47.9280, lng: 106.9100, count: 31 },
  { lat: 47.9150, lng: 106.9500, count: 42 },
  { lat: 47.8980, lng: 106.9200, count: 25 },
];

export default function MapPage() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedCategory, setSelectedCategory] = useState("all");

  return (
    <div className="min-h-screen bg-stone-50">
      
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-5 py-8 sm:py-12">
          
          <div className="inline-block px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-xs font-semibold mb-4 uppercase tracking-wide">
            <MapIcon className="w-3 h-3 inline mr-1.5" />
            Интерактив зураглал
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-bold text-stone-900 mb-4">
            {t.map}
          </h1>
          
          <p className="text-lg text-stone-600 max-w-2xl leading-relaxed">
            Мэдээллийг дор хаяж 1км радиустай сүлжээнд нэгтгэж хувь хүний нууцыг хамгаалсан болно. 
            Энэхүү зураглал нь тодорхой байршлыг бус олон нийтийн аюулгүй байдлын чиг хандлагыг харуулна.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sidebar filters */}
          <aside className="lg:col-span-3 space-y-4">
            
            {/* Filter card */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-stone-100">
                <Filter className="w-5 h-5 text-stone-700" />
                <h2 className="font-semibold text-stone-900">
                  Шүүлтүүр
                </h2>
              </div>
              
              {/* Year selector */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Он
                </label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 hover:border-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="2024">2024 (Сүүлийн 12 сар)</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </select>
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  <Layers className="w-3 h-3 inline mr-1" />
                  Ангилал
                </label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 hover:border-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="all">Бүх ангилал</option>
                  <option value="theft">Хулгай</option>
                  <option value="violence">Хүчирхийлэл</option>
                  <option value="child">Хүүхэдтэй холбоотой</option>
                  <option value="fraud">Залилан мэхлэлт</option>
                </select>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-4">
                Зургийн тайлбар
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-700" />
                  <span className="text-sm text-stone-700 font-medium">Өндөр нягтрал (40+)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-orange-500" />
                  <span className="text-sm text-stone-700 font-medium">Дунд зэрэг (20-40)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-yellow-400" />
                  <span className="text-sm text-stone-700 font-medium">Бага нягтрал (10-20)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <span className="text-sm text-stone-700 font-medium">Маш бага (&lt;10)</span>
                </div>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 mb-1">
                    Нууцлалын хамгаалалт
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Нэгтгэсэн хамгийн бага радиус: 1км. Бид хувь хүний нууцыг чандлан хамгаална.
                  </p>
                </div>
              </div>
            </div>

          </aside>

          {/* Map area */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              {/* Map container */}
              <div className="h-[500px] sm:h-[650px] relative">
                <MapWrapper data={SAMPLE_GRID_DATA} />
              </div>
              
              {/* Map footer */}
              <div className="border-t border-stone-200 px-5 py-4 bg-stone-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500">
                  <span className="font-medium">
                    Сүүлд шинэчлэгдсэн: <strong className="text-stone-700">2026-02-01</strong>
                  </span>
                  <span className="font-medium">
                    Эх сурвалж: Цагдаагийн Ерөнхий Газар
                  </span>
                </div>
              </div>
            </div>

            {/* Additional info */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-semibold text-blue-900 mb-2">
                Хэрхэн ашиглах вэ?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1.5 leading-relaxed">
                <li>• Зургийг товшиж ойртуулах/алслуулах боломжтой</li>
                <li>• Өнгөний нягтрал нь тухайн бүсэд бүртгэгдсэн тохиолдлын тоог илэрхийлнэ</li>
                <li>• Шүүлтүүр ашиглан тодорхой он, ангиллаар харах боломжтой</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}