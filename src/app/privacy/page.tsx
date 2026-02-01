export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-5 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-5xl font-bold text-stone-900 mb-3">
            Нууцлалын бодлого
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
              1. Өгөгдлийн нэгтгэл ба нэр хаяггүй байдал
            </h2>
            <p className="text-stone-700 leading-relaxed mb-4">
              Энэхүү платформын үндсэн зарчим нь хувь хүний нууцыг хамгаалах явдал юм. 
              Бид хувь хүний мэдээллийг цуглуулдаггүй, хадгалдаггүй, нийтэлдэггүй. 
              Бүх өгөгдлийг дараах аргаар боловсруулдаг:
            </p>
            <div className="space-y-2">
              <div className="flex gap-3">
                <span className="text-stone-900 font-bold shrink-0">•</span>
                <p className="text-stone-700">
                  Нэр, зураг болон тодорхой хаягийг бүрэн устгадаг
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-stone-900 font-bold shrink-0">•</span>
                <p className="text-stone-700">
                  Хэргийн байршлыг бүс нутгийн түвшинд эсвэл 1км-ээс багагүй радиуст нэгтгэдэг
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-stone-900 font-bold shrink-0">•</span>
                <p className="text-stone-700">
                  Тодорхой цаг хугацааг жил эсвэл сарын түвшинд ерөнхийлөн харуулдаг
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">
              2. Бидний цуглуулдаг мэдээлэл
            </h2>
            <p className="text-stone-700 leading-relaxed">
              Бид хэрэглэгчийн бүртгэл шаарддаггүй. Платформын хүртээмжийг сайжруулах зорилгоор 
              зөвхөн хүн таних боломжгүй вэб аналитик (хөтчийн төрөл, төхөөрөмж г.м) мэдээллийг 
              цуглуулж болно.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">
              3. Cookies (Күүки)
            </h2>
            <p className="text-stone-700 leading-relaxed">
              Интерактив зураглал болон статистикийн хэсгийг хэвийн ажиллуулахын тулд зайлшгүй 
              шаардлагатай күүки ашигладаг. Та хөтчийнхөө тохиргооноос күүкиг идэвхгүй болгож болох 
              ч энэ нь зарим функцийг хязгаарлаж болзошгүй.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">
              4. Гуравдагч талын үйлчилгээ
            </h2>
            <p className="text-stone-700 leading-relaxed">
              Бид зураглалын зорилгоор MapLibre GL JS болон нээлттэй OpenStreetMap өгөгдлийг ашигладаг. 
              Эдгээр үйлчилгээ нь өөрийн нууцлалын бодлогын дагуу ажиллана.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">
              5. Холбоо барих
            </h2>
            <p className="text-stone-700 leading-relaxed">
              Нууцлалын бодлого болон өгөгдөл нэгтгэх арга зүйтэй холбоотой асуулт байвал 
              &quot;Бидний тухай&quot; хуудас дээрх сувгаар хандана уу.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}