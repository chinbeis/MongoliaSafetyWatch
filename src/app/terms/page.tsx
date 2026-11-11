export default function TermsPage() {
  return (
    <div className="min-h-screen">
      
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-5 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-50 mb-3">
            Үйлчилгээний нөхцөл
          </h1>
          <p className="text-sm text-slate-500">
            Сүүлд шинэчилсэн: 2026 оны 11-р сарын 11
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-10">
        
        <div className="surface-card rounded-xl p-6 sm:p-8 space-y-8">
          
          <section>
            <h2 className="text-xl font-bold text-slate-50 mb-3">
              1. Нөхцөлийг хүлээн зөвшөөрөх
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Энэхүү платформыг ашигласнаар та Үйлчилгээний нөхцөлийг дагаж мөрдөхөө зөвшөөрч байна. 
              Хэрэв та эдгээр нөхцөлийг зөвшөөрөхгүй бол платформыг ашиглахаас татгалзана уу.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-50 mb-3">
              2. Платформын зорилго
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Энэхүү платформ нь зөвхөн боловсрол болон мэдээлэл өгөх зорилготой. Энэ нь нэгтгэсэн, 
              нэр хаяггүй аюулгүй байдлын өгөгдлийг хүргэдэг. Энэ нь Цагдаагийн Ерөнхий Газар болон 
              бусад хууль сахиулах байгууллагын албан ёсны мэдээлэх портал биш юм.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-50 mb-3">
              3. Өгөгдлийн ашиглалт
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Хэрэглэгчид статистик мэдээллийг хувийн, боловсролын эсвэл судалгааны зорилгоор үзэх, 
              шинжлэх эрхтэй. Өгөгдлийг дахин нийтлэхдээ энэхүү платформ болон анхны эх сурвалжийг 
              заавал дурдах ёстой.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-5">
              <p className="text-sm text-amber-200 font-semibold">
                Анхааруулга: Хэрэглэгчид өгөгдлийг нэр хаягтай холбох, хувь хүнийг танихыг оролдох, 
                эсвэл мэдээллийг гүтгэх зорилгоор ашиглахыг хатуу хориглоно.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-50 mb-3">
              4. Иргэдийн зургийг ашиглах журам
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Иргэдийн зураг дээрх тэмдэглэгээ нь иргэдийн ажигласан зүйлийг ойролцоо бүсийн түвшинд хуваалцах зорилготой.
              Энэ нь цагдаад гэмт хэрэг мэдээлэх суваг биш бөгөөд тэмдэглэгээг баталгаажуулсан мэдээлэл гэж үзэхгүй.
            </p>
            <ul className="space-y-2 text-slate-300">
              <li>• Худал, санаатайгаар төөрөгдүүлэх тэмдэглэгээ үлдээхийг хориглоно.</li>
              <li>• Тодорхой айл, байгууллага, хүнийг онилсон, гүтгэх зорилготой тэмдэглэгээ хийхийг хориглоно.</li>
              <li>• Автомат хэрэгсэл (бот, скрипт) ашиглан тэмдэглэгээ үүсгэх, мэдэгдэл илгээхийг хориглоно.</li>
              <li>
                • Бид журам зөрчсөн гэж үзсэн тэмдэглэгээг мэдэгдэлгүйгээр нууж, устгах эрхтэй. Яаралтай үед 102 руу
                залгана уу.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-50 mb-3">
              5. Хариуцлагаас чөлөөлөх
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Бид мэдээллийн үнэн зөв байдлыг хангахыг хичээдэг ч өгөгдлийг &quot;байгаагаар нь&quot; хүргэдэг. 
              Өгөгдөлд үндэслэн гаргасан аливаа шийдвэр, эсвэл өгөгдлийн алдаа дутагдалд платформ 
              хариуцлага хүлээхгүй.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-50 mb-3">
              6. Өөрчлөлт
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Бид эдгээр нөхцөлийг хэдийд ч өөрчлөх эрхтэй. Өөрчлөлт орсноос хойш платформыг 
              үргэлжлүүлэн ашиглах нь шинэ нөхцөлийг зөвшөөрсөнд тооцогдоно.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}