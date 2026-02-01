"use client";

import { Phone, ExternalLink, AlertCircle, Info } from "lucide-react";

export default function ReportPage() {
  const emergencyContacts = [
    { 
      title: "Цагдаагийн яаралтай тусламж", 
      number: "102", 
      description: "Шуурхай тусламж авах болон гэмт хэрэг мэдээлэх"
    },
    { 
      title: "Хүүхэд хамгаалал", 
      number: "108", 
      description: "Хүүхдийн аюулгүй байдалтай холбоотой дуудлага"
    },
    { 
      title: "Эмнэлгийн яаралтай тусламж", 
      number: "103", 
      description: "Яаралтай түргэн тусламж дуудах"
    },
    { 
      title: "Гал түймэр, аврах ажиллагаа", 
      number: "105", 
      description: "Гал түймэр болон гамшгийн үед дуудах"
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-5 py-10 sm:py-14">
          <div className="inline-block px-3 py-1.5 bg-amber-100 text-amber-800 rounded-md text-xs font-semibold mb-4 uppercase tracking-wide">
            <AlertCircle className="w-3 h-3 inline mr-1.5" />
            Анхааруулга
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-bold text-stone-900 mb-5">
            Мэдээлэх сувгууд
          </h1>
          
          <div className="bg-amber-50 border-l-4 border-amber-600 p-5 rounded-r-lg">
            <p className="text-stone-700 leading-relaxed">
              <strong className="text-stone-900">Анхаар:</strong> Энэхүү платформ нь зөвхөн боловсрол, 
              статистикийн нөөс юм. Бид гэмт хэргийн мэдээллийг хүлээж авдаггүй. 
              Хэрэв танд яаралтай тусламж хэрэгтэй бол доорх албан ёсны дугаарууд руу шууд холбогдоно уу.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-10">
        
        {/* Emergency numbers */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-stone-900 mb-6">
            Яаралтай дугаарууд
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {emergencyContacts.map((contact) => (
              <div 
                key={contact.number} 
                className="bg-white border border-stone-200 rounded-xl p-6 hover:border-stone-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-stone-900 mb-1.5">
                      {contact.title}
                    </h3>
                    <p className="text-sm text-stone-600 leading-relaxed">
                      {contact.description}
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-stone-900 shrink-0">
                    {contact.number}
                  </div>
                </div>
                
                <a 
                  href={`tel:${contact.number}`}
                  className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-lg hover:bg-stone-800 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Дуудах
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 mb-8">
          <h3 className="text-lg font-bold text-stone-900 mb-5">
            Мэдээлэх үед юу хэлэх вэ?
          </h3>
          
          <ol className="space-y-3.5 text-stone-700">
            <li className="flex gap-3">
              <span className="font-bold text-stone-900 shrink-0">1.</span>
              <span>Өөрийн аюулгүй байдлыг эхлээд хангах</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-stone-900 shrink-0">2.</span>
              <span>Юу болсон, хаана, хэзээ болсныг тодорхой хэлэх</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-stone-900 shrink-0">3.</span>
              <span>Холбогдох утасны дугаараа үлдээх</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-stone-900 shrink-0">4.</span>
              <span>Нотлох баримт байвал хадгалах (зураг, мессеж, видео)</span>
            </li>
          </ol>
        </div>

        {/* Online resources */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-stone-900 mb-5">
            Онлайн нөөц
          </h3>
          
          <div className="space-y-3">
            <a
              href="https://police.gov.mn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-5 bg-white border border-stone-200 rounded-xl hover:border-stone-300 hover:bg-stone-50 transition-all group"
            >
              <div>
                <div className="font-semibold text-stone-900 mb-1">
                  Цагдаагийн Ерөнхий Газар
                </div>
                <div className="text-sm text-stone-600">
                  Албан ёсны вэбсайт болон онлайн мэдээлэх систем
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors shrink-0" />
            </a>

            <a
              href="#"
              target="https://www.gov.mn/mn/organization/cfga"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-5 bg-white border border-stone-200 rounded-xl hover:border-stone-300 hover:bg-stone-50 transition-all group"
            >
              <div>
                <div className="font-semibold text-stone-900 mb-1">
                  Гэр бүл, хүүхэд, залуучуудын хөгжлийн газар
                </div>
                <div className="text-sm text-stone-600">
                  Хүүхэд хамгааллын мэдээлэл болон дэмжлэг
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors shrink-0" />
            </a>

            <a
              href="#"
              target="https://www.cfga.gov.mn/website/home.aspx"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-5 bg-white border border-stone-200 rounded-xl hover:border-stone-300 hover:bg-stone-50 transition-all group"
            >
              <div>
                <div className="font-semibold text-stone-900 mb-1">
                  Хүүхэд хамгааллын үндэсний төв
                </div>
                <div className="text-sm text-stone-600">
                  Мэргэжлийн зөвлөгөө, сэтгэл зүйн дэмжлэг
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors shrink-0" />
            </a>
          </div>
        </div>

        {/* Privacy info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex gap-3 items-start mb-4">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <h4 className="font-semibold text-blue-900">
              Нууцлал ба аюулгүй байдал
            </h4>
          </div>
          <ul className="text-sm text-blue-900 space-y-2 leading-relaxed">
            <li>• Бүх яаралтай дуудлага үнэ төлбөргүй, нууцлалтай</li>
            <li>• Та нэр нууцаар мэдээлж болно</li>
            <li>• Яриа хэлээр харилцах боломжгүй бол текст мессеж илгээх боломжтой</li>
            <li>• Таны аюулгүй байдлыг хангах нь цагдаагийн үүрэг юм</li>
          </ul>
        </div>

      </div>
    </div>
  );
}