export const COMMUNITY_CATEGORIES = [
  { value: "suspicious_activity", label: "Сэжигтэй хөдөлгөөн" },
  { value: "theft", label: "Хулгай" },
  { value: "violence", label: "Хүчирхийлэл" },
  { value: "harassment", label: "Дарамт / дарамталсан" },
  { value: "child_safety", label: "Хүүхдийн аюулгүй байдал" },
  { value: "other", label: "Бусад" },
] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number]["value"];

const LABEL_BY_VALUE = new Map<string, string>(
  COMMUNITY_CATEGORIES.map((category) => [category.value, category.label])
);

export function getCategoryLabel(value: string): string | undefined {
  return LABEL_BY_VALUE.get(value);
}
