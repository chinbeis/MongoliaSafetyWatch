/** Calm, coarse relative ages in Mongolian ("3 цагийн өмнө"). */
export function formatRelativeAge(iso: string, now = Date.now()) {
  const diffMinutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (diffMinutes < 1) return "Дөнгөж сая";
  if (diffMinutes < 60) return `${diffMinutes} минутын өмнө`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} цагийн өмнө`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} хоногийн өмнө`;
}

export function ageInDays(iso: string, now = Date.now()) {
  return (now - new Date(iso).getTime()) / 86_400_000;
}
