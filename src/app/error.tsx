"use client";

import Link from "next/link";
import { useEffect } from "react";
import { t } from "@/lib/translations";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-extrabold text-slate-50 mb-3">{t.errorTitle}</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">{t.errorBody}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center px-6 py-3 bg-teal-500 text-slate-950 rounded-xl font-bold hover:bg-teal-400 transition-colors"
          >
            {t.retry}
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center px-6 py-3 rounded-xl border border-white/10 bg-white/5 font-semibold text-slate-200 hover:bg-white/10 transition-colors"
          >
            {t.backHome}
          </Link>
        </div>
        {error.digest ? <p className="mono-data mt-6 text-xs text-slate-500">#{error.digest}</p> : null}
      </div>
    </div>
  );
}
