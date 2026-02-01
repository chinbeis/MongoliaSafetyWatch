"use client";

import { Shield, UserCheck, AlertTriangle, LifeBuoy, BookOpen, Video, Download, ExternalLink, Users, Smartphone, CheckCircle2 } from "lucide-react";
import { t } from "@/lib/translations";
import Link from "next/link";

export default function EducationPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-5 py-10 sm:py-14">
          <div className="max-w-3xl">
            <div className="inline-block px-3 py-1.5 bg-green-100 text-green-800 rounded-md text-xs font-semibold mb-4 uppercase tracking-wide">
              <BookOpen className="w-3 h-3 inline mr-1.5" />
              Боловсрол ба сэргийлэлт
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-bold text-stone-900 mb-5">
              {t.learnPrevention}
            </h1>
            
            <p className="text-lg text-stone-600 leading-relaxed">
              Гэмт хэргээс урьдчилан сэргийлэх, эмзэг бүлгийнхнийг хамгаалах мэдлэгээр олон нийтийг чадваржуулах. 
              Боловсрол бол аюулгүй нийгмийн анхны алхам юм.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-10">
        
        {/* Main educational content */}
        <div className="space-y-8">
          
          {/* Child Safety */}
          <section className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-stone-100 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-2">
                    Хүүхдийн аюулгүй байдал
                  </h2>
                  <p className="text-stone-600">
                    Эцэг эхчүүдэд зориулсан практик зөвлөмж
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              <p className="text-stone-700 mb-6 leading-relaxed">
                Хүүхдийг хамгаалахад идэвхтэй хяналт, нээлттэй харилцаа шаардлагатай. 
                Хүүхдэд хил хязгаар, тухгүй байдал мэдэрсэн үед юу хийх талаар зааж өгөөрэй.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-stone-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    Үндсэн зарчмууд
                  </h3>
                  <ul className="space-y-3 text-sm text-stone-700">
                    <li className="flex gap-3">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Биеийн аюулгүй байдал:</strong> Хүүхдэд тэдний бие зөвхөн өөрийнх нь гэдгийг заах</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Итгэж болох хүмүүс:</strong> Ярилцаж болох 3-5 итгэлтэй хүнийг тодорхойлоход туслах</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Нууцгүй байх:</strong> Бие махбодын хүрэлцэх эсвэл бэлэгтэй холбоотой нууц хадгалахгүй байх</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-blue-600 font-bold">•</span>
                      <span><strong>Нээлттэй харилцаа:</strong> Өдөр бүр сургуулийн болон найзуудын талаар ярилцах</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Цахим аюулгүй байдал
                  </h3>
                  <ul className="space-y-2.5 text-sm text-blue-800">
                    <li>• Хүүхдийн гар утас, компьютер ашиглалтыг хянах</li>
                    <li>• Танихгүй хүмүүстэй чатлахгүй байх талаар ярилцах</li>
                    <li>• Хувийн мэдээллээ хуваалцахгүй байх</li>
                    <li>• Цахим дарамт, занал мэдэгдэх</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Grooming Prevention */}
          <section className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-stone-100 bg-gradient-to-r from-rose-50 to-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-rose-600 text-white rounded-lg flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-2">
                    Мэхлэн татах үйлдлээс сэргийлэх
                  </h2>
                  <p className="text-stone-600">
                    Грүүминг гэж юу вэ, хэрхэн таних вэ?
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              <p className="text-stone-700 mb-6 leading-relaxed">
                Грүүминг буюу мэхлэн татах гэдэг нь хүүхдийг мөлжих зорилгоор тэдний итгэлийг 
                олж авах процесс юм. Энэ нь удаан хугацааны туршид тогтвортой явагддаг тул 
                эрт таних нь маш чухал.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border-2 border-amber-200 bg-amber-50 rounded-xl p-5">
                  <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Анхааруулах дохионууд
                  </h3>
                  <ul className="space-y-2.5 text-sm text-amber-900">
                    <li>• Хэт их бэлэг өгөх, онцгой анхаарал тавих</li>
                    <li>• Хүүхэдтэй ганцаараа байхыг хичээх</li>
                    <li>• Нууцаар тусгаарлах, &quot;манай нууц&quot; гэж хэлэх</li>
                    <li>• Бие махбодын хүрэлцэх хязгаарыг зөрчих</li>
                    <li>• Хүүхдийг бусдаас тусгаарлах оролдлого</li>
                    <li>• Насны ялгаатай холбоо харилцаа</li>
                  </ul>
                </div>

                <div className="border-2 border-green-200 bg-green-50 rounded-xl p-5">
                  <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Сэргийлэх арга замууд
                  </h3>
                  <ul className="space-y-2.5 text-sm text-green-900">
                    <li>• Цахим орчны идэвхийг тогтмол хянах</li>
                    <li>• Цахим аюулгүй байдлыг ярилцах</li>
                    <li>• Зан төлвийн өөрчлөлтийг ажиглах</li>
                    <li>• Нээлттэй харилцааг бүрдүүлэх</li>
                    <li>• Хүүхдийн найзуудыг танин мэдэх</li>
                    <li>• Итгэж болох насанд хүрэгчдийг тодорхойлох</li>
                  </ul>
                </div>
              </div>

              <div className="bg-stone-100 border border-stone-200 rounded-lg p-5">
                <p className="text-sm text-stone-700 leading-relaxed">
                  <strong className="text-stone-900">Санамж:</strong> Хэрэв танд эсвэл таны хүүхэдэд ийм 
                  зан үйл гарч байгаа мэт санагдвал даруй мэргэжлийн байгууллагад хандана уу. 
                  Эртэд илрүүлэх нь таны хүүхдийг хамгаалах хамгийн сайн арга юм.
                </p>
              </div>
            </div>
          </section>

          {/* Community Safety */}
          <section className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-stone-100 bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-lg flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-2">
                    Олон нийтийн идэвхжил
                  </h2>
                  <p className="text-stone-600">
                    Хамтдаа аюулгүй орчин бүрдүүлэх
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              <p className="text-stone-700 mb-6 leading-relaxed">
                Аюулгүй нийгэм бүрдүүлэх нь зөвхөн хувь хүний асуудал биш юм. 
                Олон нийт идэвхтэй оролцсоноор илүү найдвартай орчин бүрдүүлэх боломжтой.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-stone-50 rounded-lg p-5 border border-stone-200">
                  <h4 className="font-semibold text-stone-900 mb-2">Хөршүүдтэйгээ танилцах</h4>
                  <p className="text-sm text-stone-600">
                    Хөрш орчмынхоо хүмүүсийг мэдэх нь аюулгүй байдлыг нэмэгдүүлнэ
                  </p>
                </div>
                <div className="bg-stone-50 rounded-lg p-5 border border-stone-200">
                  <h4 className="font-semibold text-stone-900 mb-2">Сэжигтэй үйлдлийг мэдэгдэх</h4>
                  <p className="text-sm text-stone-600">
                    Ямар нэгэн хачирхалтай зүйл анзаарвал цагдаад мэдэгдэх
                  </p>
                </div>
                <div className="bg-stone-50 rounded-lg p-5 border border-stone-200">
                  <h4 className="font-semibold text-stone-900 mb-2">Гэрэл, камерын системийг суурилуулах</h4>
                  <p className="text-sm text-stone-600">
                    Гадна орчны гэрэлтүүлэг нь аюул заналыг бууруулна
                  </p>
                </div>
                <div className="bg-stone-50 rounded-lg p-5 border border-stone-200">
                  <h4 className="font-semibold text-stone-900 mb-2">Хүүхдийн төлөө идэвхтэй байх</h4>
                  <p className="text-sm text-stone-600">
                    Сургууль, хорооны аюулгүй байдлын хөтөлбөрт оролцох
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Emergency Action */}
          <section className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Сэжиглэж байгаа бол юу хийх вэ?
                  </h2>
                  <p className="text-stone-300">
                    Яаралтай тохиолдолд авах арга хэмжээ
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 bg-white/10 rounded-lg border border-white/20">
                  <span className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold mb-1">Аюулгүй байдлыг хангах</h4>
                    <p className="text-sm text-stone-300">
                      Яаралтай тусламж дуудах: <strong className="text-white">102</strong> (цагдаа) эсвэл <strong className="text-white">108</strong> (түргэн тусламж)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-white/10 rounded-lg border border-white/20">
                  <span className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold mb-1">Мэргэжлийн байгууллагад хандах</h4>
                    <p className="text-sm text-stone-300">
                      Цагдаагийн байгууллага эсвэл Хүүхэд хамгааллын төвд холбогдох
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-white/10 rounded-lg border border-white/20">
                  <span className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold mb-1">Нотлох баримт хадгалах</h4>
                    <p className="text-sm text-stone-300">
                      Мессеж, зураг, видео зэрэг нотлох баримтыг устгахгүй хадгалах
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Resources & Monetization Opportunities */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Premium Course CTA - Monetization */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <Video className="w-6 h-6 shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold mb-2">Онлайн сургалт</h3>
                  <p className="text-sm text-blue-100 mb-4">
                    Эцэг эхчүүдэд зориулсан гүнзгийрүүлсэн видео сургалт ба мастер класс
                  </p>
                  <ul className="text-sm text-blue-100 space-y-2 mb-6">
                    <li>• 12+ видео хичээл</li>
                    <li>• Мэргэжлийн зөвлөхтэй зөвлөлдөх</li>
                    <li>• Гэрчилгээ олгоно</li>
                  </ul>
                  <button className="w-full bg-white text-blue-700 font-bold py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                    Дэлгэрэнгүй үзэх
                  </button>
                </div>
              </div>
            </div>

            {/* Free Resources */}
            <div className="bg-white border-2 border-stone-200 rounded-xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <Download className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">Үнэгүй материал</h3>
                  <p className="text-sm text-stone-600 mb-4">
                    Татаж авч болох гарын авлага болон мэдээлэл
                  </p>
                  <div className="space-y-3">
                    <Link 
                      href="#" 
                      className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-stone-700">Эцэг эхийн гарын авлага (PDF)</span>
                      <Download className="w-4 h-4 text-stone-400 group-hover:text-stone-600" />
                    </Link>
                    <Link 
                      href="#" 
                      className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors group"
                    >
                      <span className="text-sm font-medium text-stone-700">Хүүхдэд зориулсан раашан</span>
                      <Download className="w-4 h-4 text-stone-400 group-hover:text-stone-600" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Workshop/Webinar CTA - Monetization */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <Users className="w-6 h-6 shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold mb-2">Семинар ба уулзалт</h3>
                  <p className="text-sm text-purple-100 mb-4">
                    Ирэх долоо хоног: &quot;Цахим аюулгүй байдал ба эцэг эхийн үүрэг&quot;
                  </p>
                  <div className="bg-white/20 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold mb-1">Хэзээ?</p>
                    <p className="text-sm">2026.02.15 | 18:00-20:00</p>
                  </div>
                  <button className="w-full bg-white text-purple-700 font-bold py-3 px-4 rounded-lg hover:bg-purple-50 transition-colors">
                    Бүртгүүлэх
                  </button>
                </div>
              </div>
            </div>

            {/* Consultation Service - Monetization */}
            <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <UserCheck className="w-6 h-6 shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold mb-2">Хувийн зөвлөгөө</h3>
                  <p className="text-sm text-amber-100 mb-4">
                    Мэргэжлийн сэтгэл зүйчтэй нэг нэгний зөвлөлдөх боломж
                  </p>
                  <ul className="text-sm text-amber-100 space-y-2 mb-6">
                    <li>• Нууцлал баталгаатай</li>
                    <li>• Онлайн болон биечлэн</li>
                    <li>• Гэр бүлийн зөвлөгөө</li>
                  </ul>
                  <button className="w-full bg-white text-amber-700 font-bold py-3 px-4 rounded-lg hover:bg-amber-50 transition-colors">
                    Цаг захиалах
                  </button>
                </div>
              </div>
            </div>

          </section>

          {/* External Resources */}
          <section className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              Холбоотой байгууллагууд
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a 
                href="https://police.gov.mn/home?locale=en" 
                target="https://police.gov.mn/home?locale=en"
                className="flex items-center justify-between p-4 border border-stone-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <span className="font-medium text-stone-700">Цагдаагийн Ерөнхий Газар</span>
                <ExternalLink className="w-4 h-4 text-stone-400" />
              </a>
              <a 
                href="https://www.gov.mn/mn/news/all/39c9640a-6f7b-40e8-8b3f-962d29e56b56" 
                target="https://www.gov.mn/mn/news/all/39c9640a-6f7b-40e8-8b3f-962d29e56b56"
                className="flex items-center justify-between p-4 border border-stone-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <span className="font-medium text-stone-700">Хүүхэд хамгааллын үндэсний төв</span>
                <ExternalLink className="w-4 h-4 text-stone-400" />
              </a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}