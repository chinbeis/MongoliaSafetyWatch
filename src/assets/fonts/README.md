# Fonts for generated images

`Inter-ExtraBold-subset.ttf` is used only by `src/app/opengraph-image.tsx`
(the satori renderer behind `next/og` needs a TTF that contains Mongolian
Cyrillic, including ө ү Ө Ү).

- Font: Inter, weight 800, by Rasmus Andersson — https://rsms.me/inter/
- License: SIL Open Font License 1.1 — https://openfontlicense.org
- Source: Google Fonts (fonts.gstatic.com, Inter v20), retrieved 2026-11-11
- Subset with fontTools `pyftsubset` to Basic Latin, Latin-1, Cyrillic,
  Cyrillic Supplement, general punctuation, ₮ and №.
