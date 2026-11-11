import { publicEnv } from "@/lib/public-env";

/**
 * Basemap attribution, always visible and server-rendered. MapLibre's own
 * control is started collapsed (an "i" button that expands it), so this line
 * is what satisfies the OpenStreetMap / OpenMapTiles attribution requirement.
 */
export function MapAttribution({ className = "" }: { className?: string }) {
  return (
    <p
      className={`pointer-events-auto rounded-md bg-slate-950/75 px-1.5 py-0.5 text-[10px] leading-tight text-slate-300 ${className}`}
    >
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">
        {publicEnv.mapAttribution}
      </a>
    </p>
  );
}
