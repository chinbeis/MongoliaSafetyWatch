import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Shield, Eye, LifeBuoy, BookOpen, Users, Smartphone, CheckCircle2 } from "lucide-react";
import { t } from "@/lib/translations";

export const metadata: Metadata = pageMetadata(t.educationPage.title, t.educationPage.description);

// Content review (2026-11-11): advice is phrased as general guidance, not as
// statements of law or procedure. Emergency numbers match /report, which is
// verified against official sources.

export default function EducationPage() {
  return (
    <div className="min-h-screen">
      
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-5 py-10 sm:py-14">
          <div className="max-w-3xl">
            <div className="inline-block px-3 py-1.5 bg-teal-500/15 text-teal-200 rounded-md text-xs font-semibold mb-4 uppercase tracking-wide">
              <BookOpen className="w-3 h-3 inline mr-1.5" aria-hidden />
              Боловсрол ба сэргийлэлт
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-50 mb-5">
              {t.educationPage.title}
            </h1>
            
            <p className="text-lg text-slate-400 leading-relaxed">
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
          <section className="surface-card rounded-xl overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-white/5 bg-gradient-to-r from-sky-500/10 to-transparent">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-sky-500/20 text-sky-200 rounded-lg flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-50 mb-2">
                    Хүүхдийн аюулгүй байдал
                  </h2>
                  <p className="text-slate-400">
                    Эцэг эхчүүдэд зориулсан практик зөвлөмж
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              <p className="text-slate-300 mb-6 leading-relaxed">
                Хүүхдийг хамгаалахад идэвхтэй хяналт, нээлттэй харилцаа шаардлагатай. 
                Хүүхдэд хил хязгаар, тухгүй байдал мэдэрсэн үед юу хийх талаар зааж өгөөрэй.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-50 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-sky-400" />
                    Үндсэн зарчмууд
                  </h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex gap-3">
                      <span className="text-sky-400 font-bold">•</span>
                      <span><strong>Биеийн аюулгүй байдал:</strong> Хүүхдэд тэдний бие зөвхөн өөрийнх нь гэдгийг заах</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-sky-400 font-bold">•</span>
                      <span><strong>Итгэж болох хүмүүс:</strong> Ярилцаж болох 3-5 итгэлтэй хүнийг тодорхойлоход туслах</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-sky-400 font-bold">•</span>
                      <span><strong>Нууцгүй байх:</strong> Бие махбодын хүрэлцэх эсвэл бэлэгтэй холбоотой нууц хадгалахгүй байх</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-sky-400 font-bold">•</span>
                      <span><strong>Нээлттэй харилцаа:</strong> Өдөр бүр сургуулийн болон найзуудын талаар ярилцах</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-5">
                  <h3 className="font-semibold text-sky-200 mb-3 flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Цахим аюулгүй байдал
                  </h3>
                  <ul className="space-y-2.5 text-sm text-sky-300/80">
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
          <section className="surface-card rounded-xl overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-white/5 bg-gradient-to-r from-sky-500/10 to-transparent">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-sky-500/20 text-sky-200 rounded-lg flex items-center justify-center shrink-0">
                  <Eye className="w-6 h-6" aria-hidden />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-50 mb-2">
                    Мэхлэн татах үйлдлээс сэргийлэх
                  </h2>
                  <p className="text-slate-400">
                    Грүүминг гэж юу вэ, хэрхэн таних вэ?
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              <p className="text-slate-300 mb-6 leading-relaxed">
                Грүүминг буюу мэхлэн татах гэдэг нь хүүхдийг мөлжих зорилгоор тэдний итгэлийг 
                олж авах процесс юм. Энэ нь удаан хугацааны туршид тогтвортой явагддаг тул 
                эрт таних нь маш чухал.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border border-white/10 bg-white/5 rounded-xl p-5">
                  <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-sky-300" aria-hidden />
                    Анзаарах шинж тэмдгүүд
                  </h3>
                  <ul className="space-y-2.5 text-sm text-slate-300">
                    <li>• Хэт их бэлэг өгөх, онцгой анхаарал тавих</li>
                    <li>• Хүүхэдтэй ганцаараа байхыг хичээх</li>
                    <li>• Нууцаар тусгаарлах, &quot;манай нууц&quot; гэж хэлэх</li>
                    <li>• Бие махбодын хүрэлцэх хязгаарыг зөрчих</li>
                    <li>• Хүүхдийг бусдаас тусгаарлах оролдлого</li>
                    <li>• Насны ялгаатай холбоо харилцаа</li>
                  </ul>
                </div>

                <div className="border border-teal-500/20 bg-teal-500/10 rounded-xl p-5">
                  <h3 className="font-bold text-teal-100 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" aria-hidden />
                    Сэргийлэх арга замууд
                  </h3>
                  <ul className="space-y-2.5 text-sm text-teal-100/90">
                    <li>• Цахим орчны идэвхийг тогтмол хянах</li>
                    <li>• Цахим аюулгүй байдлыг ярилцах</li>
                    <li>• Зан төлвийн өөрчлөлтийг ажиглах</li>
                    <li>• Нээлттэй харилцааг бүрдүүлэх</li>
                    <li>• Хүүхдийн найзуудыг танин мэдэх</li>
                    <li>• Итгэж болох насанд хүрэгчдийг тодорхойлох</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-slate-50">Санамж:</strong> Хэрэв ийм зан үйл ажиглагдвал хүүхэдтэйгээ тайван ярилцаж,
                  108 хүүхдийн тусламжийн утас эсвэл мэргэжлийн байгууллагаас зөвлөгөө аваарай. Эрт анзаарах нь
                  хүүхдийг хамгаалахад тусалдаг.
                </p>
              </div>
            </div>
          </section>

          {/* Community Safety */}
          <section className="surface-card rounded-xl overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-white/5 bg-gradient-to-r from-teal-500/10 to-transparent">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-500/20 text-teal-200 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-50 mb-2">
                    Олон нийтийн идэвхжил
                  </h2>
                  <p className="text-slate-400">
                    Хамтдаа аюулгүй орчин бүрдүүлэх
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              <p className="text-slate-300 mb-6 leading-relaxed">
                Аюулгүй нийгэм бүрдүүлэх нь зөвхөн хувь хүний асуудал биш юм. 
                Олон нийт идэвхтэй оролцсоноор илүү найдвартай орчин бүрдүүлэх боломжтой.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <h3 className="font-semibold text-slate-50 mb-2">Хөршүүдтэйгээ танилцах</h3>
                  <p className="text-sm text-slate-400">
                    Хөрш орчмынхоо хүмүүсийг мэдэх нь аюулгүй байдлыг нэмэгдүүлнэ
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <h3 className="font-semibold text-slate-50 mb-2">Сэжигтэй үйлдлийг мэдэгдэх</h3>
                  <p className="text-sm text-slate-400">
                    Ямар нэгэн хачирхалтай зүйл анзаарвал цагдаад мэдэгдэх
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <h3 className="font-semibold text-slate-50 mb-2">Орчны гэрэлтүүлэг</h3>
                  <p className="text-sm text-slate-400">
                    Орц, гудамж, хашааны гэрэлтүүлгийг сайжруулах нь хүмүүсийг илүү аюулгүй байлгахад тусалж болно
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <h3 className="font-semibold text-slate-50 mb-2">Хүүхдийн төлөө идэвхтэй байх</h3>
                  <p className="text-sm text-slate-400">
                    Сургууль, хорооны аюулгүй байдлын хөтөлбөрт оролцох
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Emergency Action */}
          <section className="surface-card text-white rounded-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-teal-500/20 text-teal-200 rounded-lg flex items-center justify-center shrink-0">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Сэжиглэж байгаа бол юу хийх вэ?
                  </h2>
                  <p className="text-slate-300">
                    Яаралтай тохиолдолд авах арга хэмжээ
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 bg-white/10 rounded-lg border border-white/20">
                  <span className="bg-teal-500 text-slate-950 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    1
                  </span>
                  <div>
                    <h3 className="font-bold mb-1">Аюулгүй байдлыг хангах</h3>
                    <p className="text-sm text-slate-300">
                      Яаралтай үед <strong className="text-white">102</strong> (цагдаа) эсвэл <strong className="text-white">103</strong> (түргэн тусламж) руу залгана. Хүүхэдтэй холбоотой бол <strong className="text-white">108</strong> (хүүхдийн тусламжийн утас).{" "}
                      <Link href="/report" className="underline text-teal-200">Бүх дугаар</Link>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-white/10 rounded-lg border border-white/20">
                  <span className="bg-teal-500 text-slate-950 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    2
                  </span>
                  <div>
                    <h3 className="font-bold mb-1">Мэргэжлийн байгууллагад хандах</h3>
                    <p className="text-sm text-slate-300">
                      Цагдаагийн байгууллага эсвэл 108 Хүүхдийн яаралтай тусламж, хамгаалах төвд хандах
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-white/10 rounded-lg border border-white/20">
                  <span className="bg-teal-500 text-slate-950 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    3
                  </span>
                  <div>
                    <h3 className="font-bold mb-1">Нотлох баримт хадгалах</h3>
                    <p className="text-sm text-slate-300">
                      Мессеж, зураг, видео зэрэг нотлох баримтыг устгахгүй хадгалах
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}