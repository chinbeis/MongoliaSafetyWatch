"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { Disclaimer } from "@/components/ui/disclaimer";
import { BarChart3, PieChart as PieChartIcon, TrendingDown, Download, Info, Calendar } from "lucide-react";
import { t } from "@/lib/translations";

// Sample Data
const BY_CATEGORY = [
  { name: "Хулгай", value: 4500, color: "#3b82f6" },
  { name: "Хүчирхийлэл", value: 2100, color: "#ef4444" },
  { name: "Хүүхэдтэй холбоотой", value: 1800, color: "#a855f7" },
  { name: "Бусад", value: 850, color: "#64748b" },
];

const BY_YEAR = [
  { year: "2019", count: 11200 },
  { year: "2020", count: 9800 },
  { year: "2021", count: 10500 },
  { year: "2022", count: 12100 },
  { year: "2023", count: 12800 },
  { year: "2024", count: 12450 },
];

const BY_REGION = [
  { region: "Улаанбаатар", count: 7200 },
  { region: "Дархан-Уул", count: 1100 },
  { region: "Орхон", count: 950 },
  { region: "Сэлэнгэ", count: 600 },
  { region: "Дорнод", count: 550 },
  { region: "Бусад", count: 2050 },
];

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-5 py-10 sm:py-14">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="inline-block px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-xs font-semibold mb-4 uppercase tracking-wide">
                <Info className="w-3 h-3 inline mr-1.5" />
                Өгөгдлийн ил тод байдал
              </div>
              
              <h1 className="text-3xl sm:text-5xl font-bold text-stone-900 mb-4">
                {t.stats}
              </h1>
              
              <p className="text-lg text-stone-600 max-w-2xl leading-relaxed">
                Монгол улсын хэмжээнд бүртгэгдсэн олон нийтийн аюулгүй байдлын мэдээллийн шинжилгээ. 
                Бүх тоо баримт нь бүс нутгийн нэгтгэсэн дүн юм.
              </p>
            </div>

            <button className="inline-flex items-center gap-2.5 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20 self-start lg:self-auto">
              <Download className="w-4 h-4" />
              Нэгтгэсэн CSV татах
            </button>
          </div>
        </div>
      </div>

      {/* Key metrics summary */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-5 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            
            <div>
              <div className="text-sm font-medium text-blue-100 mb-2 uppercase tracking-wide">
                Нийт бүртгэгдсэн
              </div>
              <div className="text-4xl font-bold mb-1">12,450</div>
              <div className="text-sm text-blue-200">2024 оны дүн</div>
            </div>

            <div>
              <div className="text-sm font-medium text-blue-100 mb-2 uppercase tracking-wide flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Өмнөх жилтэй
              </div>
              <div className="text-4xl font-bold mb-1">-4.2%</div>
              <div className="text-sm text-blue-200">350 багассан</div>
            </div>

            <div>
              <div className="text-sm font-medium text-blue-100 mb-2 uppercase tracking-wide">
                Хамрах хүрээ
              </div>
              <div className="text-4xl font-bold mb-1">21</div>
              <div className="text-sm text-blue-200">Аймаг, нийслэл</div>
            </div>

          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="max-w-6xl mx-auto px-5 py-12">
        
        {/* Year trend */}
        <div className="bg-white rounded-xl border border-stone-200 p-8 mb-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-stone-900">
                  Жил бүрийн хэргийн тоо
                </h2>
              </div>
              <p className="text-sm text-stone-500">
                Сүүлийн 6 жилийн статистик мэдээлэл
              </p>
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={BY_YEAR}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="year" 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    borderRadius: "12px", 
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                  cursor={{ stroke: "#3b82f6", strokeWidth: 2, strokeDasharray: '4 4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} 
                  activeDot={{ r: 7 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Category breakdown */}
          <div className="bg-white rounded-xl border border-stone-200 p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <PieChartIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-stone-900">
                    Ангиллаар (2024)
                  </h2>
                </div>
                <p className="text-sm text-stone-500">
                  Гол төрлүүдийн харьцаа
                </p>
              </div>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={BY_CATEGORY}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {BY_CATEGORY.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#fff", 
                      borderRadius: "12px", 
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    align="center" 
                    verticalAlign="bottom" 
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '15px', fontSize: '13px' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category details as list */}
          <div className="bg-white rounded-xl border border-stone-200 p-8">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-stone-900 mb-2">
                Дэлгэрэнгүй задаргаа
              </h3>
              <p className="text-sm text-stone-500">
                2024 оны ангилал тус бүрийн тоо
              </p>
            </div>

            <div className="space-y-4">
              {BY_CATEGORY.map((cat, idx) => {
                const total = BY_CATEGORY.reduce((sum, c) => sum + c.value, 0);
                const percentage = ((cat.value / total) * 100).toFixed(1);
                
                return (
                  <div key={idx} className="border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-semibold text-stone-900">{cat.name}</span>
                      </div>
                      <span className="text-sm font-medium text-stone-500">{percentage}%</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-stone-900">
                        {cat.value.toLocaleString()}
                      </span>
                      <span className="text-sm text-stone-500">тохиолдол</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Regional comparison */}
        <div className="bg-white rounded-xl border border-stone-200 p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-stone-900">
                  Бүс нутгийн тархалт
                </h2>
              </div>
              <p className="text-sm text-stone-500">
                Аймаг, нийслэлээр бүртгэгдсэн тоо (2024)
              </p>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BY_REGION}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="region" 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: "#f9fafb" }}
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    borderRadius: "12px", 
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3b82f6" 
                  radius={[8, 8, 0, 0]} 
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info disclaimer */}
        <div className="mt-12 max-w-3xl mx-auto">
          <Disclaimer 
            variant="info" 
            className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6"
          />
        </div>

        {/* Additional context */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex gap-4">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">
                Өгөгдлийн тухай
              </h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                Энэхүү статистик мэдээлэл нь Цагдаагийн Ерөнхий Газрын албан ёсны мэдээлэлд 
                үндэслэсэн бөгөөд хувь хүний нууцлалыг хамгаалах зорилгоор бүс нутгаар нэгтгэн 
                харуулсан болно. Тоо баримт нь жил бүр шинэчлэгдэнэ.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}