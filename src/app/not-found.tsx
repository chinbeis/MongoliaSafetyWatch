import Link from "next/link";

export default function Custom404() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-black text-slate-700 mb-4">404</h1>
        <h2 className="text-2xl font-extrabold text-slate-50 mb-4">Хуудас олдсонгүй</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto font-medium">
          Таны хайсан хуудас байхгүй эсвэл шилжсэн байна.
          Дээрх цэсийг ашиглан хэрэгцээт мэдээллээ олно уу.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-8 py-4 bg-teal-500 text-slate-950 rounded-2xl font-bold hover:bg-teal-400 transition-all shadow-lg"
        >
          Нүүр хуудас руу буцах
        </Link>
      </div>
    </div>
  );
}
