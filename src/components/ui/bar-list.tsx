/**
 * Horizontal bars rendered as plain HTML (no chart library): one series, a
 * single hue, every value directly labelled. Server-renderable and readable
 * without JavaScript or colour.
 */
export interface BarListItem {
  key: string;
  label: string;
  /** Numeric value for the bar length; null draws no bar. */
  value: number | null;
  /** Text shown at the end of the row (already formatted). */
  display: string;
  hint?: string;
  indent?: boolean;
}

export function BarList({ items, ariaLabel }: { items: BarListItem[]; ariaLabel: string }) {
  const max = Math.max(1, ...items.map((item) => item.value ?? 0));
  return (
    <ul className="space-y-2.5" aria-label={ariaLabel}>
      {items.map((item) => (
        <li key={item.key} className={item.indent ? "pl-4" : undefined}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className={`min-w-0 ${item.indent ? "text-slate-400" : "text-slate-200"}`}>{item.label}</span>
            <span className="mono-data shrink-0 font-semibold text-slate-50">{item.display}</span>
          </div>
          <div className="h-2 rounded-full bg-white/5" aria-hidden>
            {item.value != null && item.value > 0 ? (
              <div
                className={`h-2 rounded-full ${item.indent ? "bg-teal-500/50" : "bg-teal-400"}`}
                style={{ width: `${Math.max(1.5, (item.value / max) * 100)}%` }}
              />
            ) : null}
          </div>
          {item.hint ? <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.hint}</p> : null}
        </li>
      ))}
    </ul>
  );
}
