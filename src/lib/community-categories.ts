/**
 * Community pin categories. Colours are Okabe–Ito hues (violet replaces grey
 * for "other") and deliberately avoid red — a pin is a neighbour's note, not
 * an alarm.
 *
 * Validated with the dataviz palette checker on the dark map surface, all
 * pairs: normal-vision floor PASS (worst ΔE 17.0), CVD in the 6–8 warn band
 * (green↔pink 7.6, deutan). Six categories cannot clear every all-pairs gate
 * on a map, so colour is never the only carrier of identity: the popup, the
 * feed and the legend chips always show the label, and the chips filter the
 * map to one category at a time.
 */
export const COMMUNITY_CATEGORIES = [
  { value: "suspicious_activity", label: "Сэжигтэй хөдөлгөөн", color: "#56B4E9" },
  { value: "theft", label: "Хулгай", color: "#E69F00" },
  { value: "violence", label: "Хүчирхийлэл", color: "#CC79A7" },
  { value: "harassment", label: "Дарамт, доромжлол", color: "#F0E442" },
  { value: "child_safety", label: "Хүүхдийн аюулгүй байдал", color: "#009E73" },
  { value: "other", label: "Бусад", color: "#7C6CF0" },
] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number]["value"];

export const COMMUNITY_CATEGORY_VALUES = COMMUNITY_CATEGORIES.map((category) => category.value) as [
  CommunityCategory,
  ...CommunityCategory[],
];

const BY_VALUE = new Map<string, (typeof COMMUNITY_CATEGORIES)[number]>(
  COMMUNITY_CATEGORIES.map((category) => [category.value, category])
);

export function getCategoryLabel(value: string): string | undefined {
  return BY_VALUE.get(value)?.label;
}

export function getCategoryColor(value: string): string {
  return BY_VALUE.get(value)?.color ?? "#94A3B8";
}

/** Pins disappear from the public map after this many days. */
export const REPORT_TTL_DAYS = 30;
/** Pins older than this render faded. */
export const REPORT_FADE_AFTER_DAYS = 14;

/** The only shape of a pin that ever leaves the server. */
export interface PublicCommunityReport {
  id: string;
  category: CommunityCategory;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  createdAt: string;
}
