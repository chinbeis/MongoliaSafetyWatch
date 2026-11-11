/**
 * Community pin categories. Colours follow the Okabe–Ito palette (safe for
 * the common forms of colour-vision deficiency) and deliberately avoid red —
 * a pin is a neighbour's note, not an alarm.
 */
export const COMMUNITY_CATEGORIES = [
  { value: "suspicious_activity", label: "Сэжигтэй хөдөлгөөн", color: "#56B4E9" },
  { value: "theft", label: "Хулгай", color: "#E69F00" },
  { value: "violence", label: "Хүчирхийлэл", color: "#CC79A7" },
  { value: "harassment", label: "Дарамт, доромжлол", color: "#F0E442" },
  { value: "child_safety", label: "Хүүхдийн аюулгүй байдал", color: "#009E73" },
  { value: "other", label: "Бусад", color: "#94A3B8" },
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
