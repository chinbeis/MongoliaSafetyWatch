export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-5 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-5xl font-bold text-stone-900 mb-3">
            Үйлчилгээний нөхцөл
          </h1>
          <p className="text-sm text-stone-500">
            Хүчин төгөлдөр болсон огноо: 2026 оны 2-р сарын 1
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-10">
        
        <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 space-y-8">
          
          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">
              1. Нөхцөлийг хүлээн зөвшөөрөх
            </h2>
            <p className="text-stone-700 leading-relaxed">
              Энэхүү платформыг ашигласнаар та Үйлчилгээний нөхцөлийг дагаж мөрдөхөө зөвшөөрч байна. 
              Хэрэв та эдгээр нөхцөлийг зөвшөөрөхгүй бол платформыг ашиглахаас татгалзана уу.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">
              2. Платформын зорилго
            </h2>
            <p className="text-stone-700 leading-relaxed">
              Энэхүү платформ нь зөвхөн боловсрол болон мэдээлэл өгөх зорилготой. Энэ нь нэгтгэсэн, 
              нэр хаяггүй аюулгүй байдлын өгөгдлийг хүргэдэг. Энэ нь Цагдаагийн Ерөнхий Газар болон 
              бусад хууль сахиулах байгууллагын албан ёсны мэдээлэх портал биш юм.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">
              3. Өгөгдлийн ашиглалт
            </h2>
            <p className="text-stone-700 leading-relaxed mb-4">
              Хэрэглэгчид статистик мэдээллийг хувийн, боловсролын эсвэл судалгааны зорилгоор үзэх, 
              шинжлэх эрхтэй. Өгөгдлийг дахин нийтлэхдээ энэхүү платформ болон анхны эх сурвалжийг 
              заавал дурдах ёстой.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
              <p className="text-sm text-amber-900 font-semibold">
                Анхааруулга: Хэрэглэгчид өгөгдлийг нэр хаягтай холбох, хувь хүнийг танихыг оролдох, 
                эсвэл мэдээллийг гүтгэх зорилгоор ашиглахыг хатуу хориглоно.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">
              4. Хариуцлагаас чөлөөлөх
            </h2>
            <p className="text-stone-700 leading-relaxed">
              Бид мэдээллийн үнэн зөв байдлыг хангахыг хичээдэг ч өгөгдлийг &quot;байгаагаар нь&quot; хүргэдэг. 
              Өгөгдөлд үндэслэн гаргасан аливаа шийдвэр, эсвэл өгөгдлийн алдаа дутагдалд платформ 
              хариуцлага хүлээхгүй.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">
              5. Өөрчлөлт
            </h2>
            <p className="text-stone-700 leading-relaxed">
              Бид эдгээр нөхцөлийг хэдийд ч өөрчлөх эрхтэй. Өөрчлөлт орсноос хойш платформыг 
              үргэлжлүүлэн ашиглах нь шинэ нөхцөлийг зөвшөөрсөнд тооцогдоно.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}