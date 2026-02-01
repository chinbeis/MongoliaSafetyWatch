import Link from "next/link";

export default function Custom404() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-black text-slate-200 mb-4">404</h1>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-4">Хуудас олдсонгүй</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto font-medium">
          Таны хайсан хуудас байхгүй эсвэл шилжсэн байна. 
          Дээрх цэсийг ашиглан хэрэгцээт мэдээллээ олно уу.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          Нүүр хуудас руу буцах
        </Link>
      </div>
    </div>
  );
}
