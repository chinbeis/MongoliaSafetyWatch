export default function DataSourcesPage() {
  const sources = [
    {
      name: "Цагдаагийн Ерөнхий Газар",
      url: "https://police.gov.mn",
      description: "Жил бүрийн гэмт хэргийн статистик болон бүс нутгийн аюулгүй байдлын тайлан.",
      lastUpdated: "2026 оны 1-р сар",
      frequency: "Улирал тутам",
    },
    {
      name: "Үндэсний Статистикийн Хороо (ҮСХ)",
      url: "https://1212.mn",
      description: "Шүүх болон гэмт хэргийн үзүүлэлт бүхий албан ёсны нийгэм, эдийн засгийн өгөгдөл.",
      lastUpdated: "2025 оны 12-р сар",
      frequency: "Сар тутам",
    },
    {
      name: "Гэр бүл, хүүхэд, залуучуудын хөгжлийн газар",
      url: "https://fcy.gov.mn",
      description: "Хүүхэд хамгаалал болон гэр бүлийн харилцаатай холбоотой статистик мэдээлэл.",
      lastUpdated: "2025 оны 11-р сар",
      frequency: "Хагас жил тутам",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 font-medium">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Мэдээллийн эх сурвалж</h1>
      <p className="text-slate-500 mb-12 leading-relaxed text-lg">
        Бид мэдээллийн ил тод байдлыг эрхэмлэдэг. Энэхүү платформ дээрх бүх мэдээллийг Монгол Улсын төрийн болон төрийн бус албан ёсны байгууллагуудаас авсан болно.
      </p>

      <div className="space-y-8">
        {sources.map((source) => (
          <div key={source.name} className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-soft">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">{source.name}</h2>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
              >
                Албан ёсны вэбсайт
              </a>
            </div>
            <p className="text-slate-500 mb-8">{source.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Сүүлд шинэчлэгдсэн</p>
                <p className="text-sm font-bold text-slate-700">{source.lastUpdated}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Шинэчлэх давтамж</p>
                <p className="text-sm font-bold text-slate-700">{source.frequency}</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Өгөгдлийн төрөл</p>
                <p className="text-sm font-bold text-slate-700">Нэгтгэсэн / Нэр хаяггүй</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 p-8 bg-slate-900 text-white rounded-[2rem]">
        <h3 className="font-extrabold mb-4 text-xl">Арга зүй</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Өгөгдлийг боловсруулахдаа хувь хүний мэдээлэл болон тодорхой GPS координатыг устгадаг. Зургийн сүлжээнд 1км-ээс багагүй радиуст нэгтгэл хийдэг бөгөөд энэ нь тодорхой хэргийг байршлаар нь мөрдөх боломжгүй болгодог. Статистик мэдээллийг иргэдийн нууцлалыг хангах үүднээс бүхэлтгэж харуулдаг.
        </p>
      </div>
    </div>
  );
}
