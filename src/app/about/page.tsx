export default function AboutPage() {
  return (
    <div className="min-h-screen">

      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-5 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-50 mb-5">
            Платформын тухай
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
            Олон нийтийн аюулгүй байдал ба гэмт хэргийн мэдээллийн платформ нь Монгол улсын иргэдэд 
            аюулгүй байдлын нэгтгэсэн өгөгдлийг ил тод, нэр хаяггүйгээр хүргэх зорилготой хараат бус санаачилга юм.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-10">
        
        {/* Mission */}
        <section className="surface-card rounded-xl p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-50 mb-4">
            Бидний эрхэм зорилго
          </h2>
          <p className="text-slate-300 leading-relaxed mb-5">
            Бид өгөгдлийн ил тод байдал болон боловсролоор дамжуулан илүү мэдээлэлтэй, 
            аюулгүй хамт олныг төлөвшүүлэхийг зорьдог.
          </p>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-slate-50 font-bold shrink-0">•</span>
              <p className="text-slate-300">
                Аюулгүй байдлын чиг хандлагын талаарх олон нийтийн мэдлэгийг дээшлүүлэх
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-50 font-bold shrink-0">•</span>
              <p className="text-slate-300">
                Гэмт хэргээс урьдчилан сэргийлэх боловсролын нөөцөөр хангах
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-50 font-bold shrink-0">•</span>
              <p className="text-slate-300">
                Найдвартай өгөгдөлд тулгуурласан олон нийтийн аюулгүй байдлын санаачилгыг дэмжих
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-50 font-bold shrink-0">•</span>
              <p className="text-slate-300">
                Мэдээллийн ил тод байдлыг сурталчлах
              </p>
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-50 mb-6">
            Ёс зүйн зарчмууд
          </h2>
          <p className="text-slate-300 leading-relaxed mb-8">
            Бид иргэдийнхээ нууцлалыг дээд зэргээр хангаж, платформыг зөвхөн аюулгүй байдлын 
            төлөө ажиллуулах ёс зүйн хатуу хязгаарлалт дор ажилладаг.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            <div className="surface-card rounded-xl p-6">
              <h3 className="font-bold text-slate-50 mb-2">
                Нууцлал хамгийн түрүүнд
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Бид хэзээ ч хувь хүний нэр, зураг, тодорхой хаяг болон таних боломжтой мэдээллийг нийтлэхгүй.
              </p>
            </div>

            <div className="surface-card rounded-xl p-6">
              <h3 className="font-bold text-slate-50 mb-2">
                Төвийг сахих
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Бид бодит, объектив хэллэгийг ашигладаг бөгөөд дуулиан шуугиантай эсвэл айдас төрүүлэх үг хэрэглэхээс зайлсхийдэг.
              </p>
            </div>

            <div className="surface-card rounded-xl p-6">
              <h3 className="font-bold text-slate-50 mb-2">
                Нийтийн сайн сайхан
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Аюулгүй байдлын өгөгдөлд хандах эрх нь хүн бүрт үнэ төлбөргүй бөгөөд хэзээ ч арилжааны зорилгоор ашиглагдахгүй.
              </p>
            </div>

            <div className="surface-card rounded-xl p-6">
              <h3 className="font-bold text-slate-50 mb-2">
                Албан ёсны эх сурвалж
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Бүх өгөгдлийг хэрэглэгчийн мэдээллээс бус, зөвхөн баталгаажсан албан ёсны эх сурвалжуудаас авдаг.
              </p>
            </div>

          </div>
        </section>

        {/* Who we are */}
        <section className="surface-card rounded-xl p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-50 mb-4">
            Бид хэн бэ?
          </h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            Бид нь Монголын аюулгүй байдал, нийгмийн асуудалд санаа тавьдаг иргэд, 
            технологийн мэргэжилтнүүд, өгөгдлийн шинжээчдийн бүлэг юм.
          </p>
          <p className="text-slate-300 leading-relaxed">
            Энэхүү платформ нь засгийн газар, цагдаагийн албан ёсны портал биш бөгөөд 
            зөвхөн олон нийтэд мэдээлэл өгөх боловсролын зорилготой санаачилга билээ.
          </p>
        </section>

        {/* Contact */}
        <section className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-sky-200 mb-3">
            Холбоо барих
          </h2>
          <p className="text-sm text-sky-300/80 leading-relaxed mb-4">
            Хэрэв танд санал, хүсэлт, асуулт байвал бидэнтэй холбогдоно уу.
            Бид таны саналыг сонсох, илүү сайн болоход хамтран ажиллахад бэлэн байна.
          </p>
          <p className="text-sm text-sky-300/80">
            И-мэйл: <a href="mailto:info@catchpred.mn" className="font-semibold underline text-sky-300">info@catchpred.mn</a>
          </p>
        </section>

      </div>
    </div>
  );
}