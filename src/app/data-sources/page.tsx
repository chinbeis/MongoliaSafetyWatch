import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { ExternalLink } from "lucide-react";
import geoSources from "../../../public/geo/SOURCES.json";
import { formatMonthLabel, getMeta } from "@/lib/crime-snapshot";
import { GRID_CELL_METERS, MAX_RADIUS_M, MIN_RADIUS_M } from "@/lib/geo-privacy";
import { REPORT_TTL_DAYS } from "@/lib/community-categories";
import { t } from "@/lib/translations";

export const metadata: Metadata = pageMetadata(t.dataSources, "Энэ сайтад ашигласан албан ёсны статистик, газрын зургийн хил, суурь зургийн эх сурвалж ба арга зүй.");

type GeoSource = { sourceName: string; datasetUrl: string; license: string; licenseUrl: string; attribution: string; retrieved: string };

function formatDate(iso: string) {
  const [date] = iso.split("T");
  return date;
}

const TABLE_ROLES: Record<string, string> = {
  totals: "Нийт бүртгэгдсэн гэмт хэрэг, аймаг, нийслэлээр, сар бүрийн өссөн дүн — нүүр хуудас, газрын зураг, статистикийн гол тоо.",
  circumstances: "Гэмт хэрэг үйлдэгдсэн нөхцөл байдал (гэр бүлийн хүчирхийлэл, согтуурал гэх мэт 6 давхцах үзүүлэлт).",
  rates: "16 ба түүнээс дээш насны 10 000 хүнд ногдох бүртгэгдсэн гэмт хэрэг — газрын зургийн өнгө, бүс нутгийн харьцуулалт.",
  crimeTypes: "Гэмт хэргийн төрөл, аймаг болон Улаанбаатарын дүүргээр, жилээр. Сумын түвшний мөрийг нийтлэхгүй.",
};

export default function DataSourcesPage() {
  const meta = getMeta();
  const geo = geoSources as unknown as Record<string, GeoSource>;

  return (
    <div className="max-w-4xl mx-auto px-5 py-12 lg:py-16">
      <h1 className="text-3xl font-extrabold text-slate-50 mb-4">{t.dataSources}</h1>
      <p className="text-slate-400 mb-10 leading-relaxed text-lg">
        Энэ сайт дээрх албан ёсны бүх тоо Үндэсний статистикийн хорооны нээлттэй өгөгдлийн сангаас (1212.mn)
        авсан нэгтгэсэн статистик юм. Бид тоо зохиодоггүй, засварладаггүй. Одоогийн өгөгдөл{" "}
        <strong className="text-slate-200">{formatMonthLabel(meta.dataThrough)}</strong> хүртэлх хугацааг хамарна.
      </p>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-50 mb-4">Үндэсний статистикийн хороо (1212.mn)</h2>
        <p className="text-sm text-slate-400 mb-5">
          Анхдагч мэдээллийг Цагдаагийн ерөнхий газар бүрдүүлж, ҮСХ нийтэлдэг. Сар бүрийн дунд үед шинэчлэгддэг бөгөөд бид
          сард хоёр удаа шалгаж, шинэ өгөгдлийг хүний хяналтаар оруулдаг.
        </p>
        <div className="space-y-4">
          {Object.entries(meta.sources).map(([key, source]) => (
            <article key={source.tableId} className="surface-card rounded-2xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div>
                  <p className="mono-data text-xs text-teal-300 mb-1">{source.tableId}</p>
                  <h3 className="font-bold text-slate-50 leading-snug">{source.title}</h3>
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-teal-300 hover:text-teal-200"
                >
                  1212.mn
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
              <p className="text-sm text-slate-400 mb-4">{TABLE_ROLES[key]}</p>
              <dl className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 text-sm">
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">ҮСХ-д шинэчлэгдсэн</dt>
                  <dd className="mono-data text-slate-200">{formatDate(source.updated)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Бид татсан</dt>
                  <dd className="mono-data text-slate-200">{formatDate(meta.generatedAt)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-50 mb-4">Газрын зураг</h2>
        <div className="space-y-4">
          {Object.entries(geo).map(([file, source]) => (
            <article key={file} className="surface-card rounded-2xl p-5 sm:p-6 text-sm">
              <p className="mono-data text-xs text-teal-300 mb-1">{file}</p>
              <p className="text-slate-200 mb-2">{source.attribution}</p>
              <p className="text-slate-400">
                Лиценз:{" "}
                <a href={source.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-teal-300 hover:underline">
                  {source.license}
                </a>{" "}
                ·{" "}
                <a href={source.datasetUrl} target="_blank" rel="noopener noreferrer" className="text-teal-300 hover:underline">
                  Эх файл
                </a>{" "}
                · Татсан: <span className="mono-data">{source.retrieved}</span>
              </p>
            </article>
          ))}
          <article className="surface-card rounded-2xl p-5 sm:p-6 text-sm">
            <p className="text-slate-200 mb-2">
              Суурь зураг: OpenFreeMap, өгөгдөл ©{" "}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-teal-300 hover:underline">
                OpenStreetMap contributors
              </a>
              .
            </p>
            <p className="text-slate-400">Суурь зургийн хавтангуудыг таны хөтөч tiles.openfreemap.org-оос шууд татна.</p>
          </article>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-6 sm:p-8">
        <h2 className="font-extrabold mb-4 text-xl text-slate-50">Арга зүй</h2>
        <ul className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <li>
            <strong className="text-slate-100">Нэгтгэлийн түвшин.</strong> Албан ёсны тоог аймаг, нийслэлийн түвшинд, харин
            Улаанбаатарын хувьд дүүргийн түвшинд харуулна. Сумын түвшний мэдээлэл нийтлэхгүй.
          </li>
          <li>
            <strong className="text-slate-100">Жижиг тоо.</strong> 1-ээс 4 хүртэлх тоог «&lt;5» гэж харуулна. Анхдагч эх
            сурвалж эдгээрийг нээлттэй нийтэлдэг тул энэ нь нэмэлт болгоомжлол юм.
          </li>
          <li>
            <strong className="text-slate-100">Хүн амд ногдох түвшин.</strong> Бүс нутгийг харьцуулахдаа ҮСХ-ны нийтэлсэн 16+
            насны 10 000 хүнд ногдох үзүүлэлтийг ашиглана. Энэ нь бүтэн жилээр нийтлэгддэг тул тухайн оны дүн гараагүй үед
            хамгийн сүүлийн бүтэн жилийн түвшинг тэмдэглэгээтэйгээр харуулна. Бүртгэгдсэн тоо хүн амын тооноос хамаардаг тул
            «эрсдэл» гэж ангилахгүй.
          </li>
          <li>
            <strong className="text-slate-100">Оны дундах харьцуулалт.</strong> Тухайн оны 1–N-р сарын өссөн дүнг өмнөх оны
            мөн 1–N-р сарын дүнтэй харьцуулна. Бүтэн бус оныг өмнөх бүтэн жилтэй харьцуулахгүй.
          </li>
          <li>
            <strong className="text-slate-100">Давхцах үзүүлэлт.</strong> «Согтуургаар», «Бүлэглэн» гэх мэт нөхцөл байдлын
            үзүүлэлтүүдэд нэг хэрэг хэд хэдэн удаа орж болох тул тэдгээрийг нэмж нийт дүн гаргахгүй.
          </li>
          <li>
            <strong className="text-slate-100">Засвар.</strong> ҮСХ өмнөх сарын дүнг засварлах тохиолдол бий (өссөн дүн
            буурах). Бид эх сурвалжийн сүүлийн хувилбарыг өөрчлөлтгүй харуулна.
          </li>
          <li>
            <strong className="text-slate-100">Иргэдийн зураг.</strong> Иргэдийн тэмдэглэгээ албан ёсны статистикт
            ордоггүй. Байршлыг сервер дээр ~{GRID_CELL_METERS} м-ийн торонд бөөрөнхийлж, радиусыг {MIN_RADIUS_M}–
            {MAX_RADIUS_M} м-ээр хязгаарлана. Тэмдэглэгээ {REPORT_TTL_DAYS} хоногийн дараа нийтийн зургаас алга болно.
          </li>
        </ul>
      </section>
    </div>
  );
}
