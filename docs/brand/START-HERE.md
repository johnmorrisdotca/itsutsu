# Itsutsu logo package — current direction

Version 4 contains the complete current Itsutsu asset set from v3, plus the new `stones-matrix` artwork. No prior assets were removed from the complete set.

This v3 package contains only the approved identity assets. Earlier banner, below-kanji, and exploratory preview files are excluded.

## Hero / page header

Use `itsutsu-hero-light.svg` or `itsutsu-hero-dark.svg`. The hero is a wide 1320 × 360 composition: a rounded-square 五つ avatar on the left and a large plain `itsutsu` wordmark on the right. The combined artwork is centered within the canvas. The wordmark intentionally has no trailing stones.

## Compact marks

`itsutsu-stacked-light.svg` and `itsutsu-stacked-dark.svg` are transparent square masters. The avatar files are rounded-square applications. The sticker files are round applications. Use `itsutsu-icon.svg` for a compact i-and-stone icon and `itsutsu-one-ink.svg` for single-ink printing.

## Stone and wordmark rules

The five-stone motif is identical everywhere: black / ivory / ivory / ivory / black, radius 15 units, 5-unit border, and 42-unit center spacing. Ivory is `#FFFEF9`; ink is `#22231F`. The i-dot is intentionally different: radius 5.9 units with a 3-unit border. It uses an ivory fill with ink outline on light lettering, and a black fill with ivory outline on dark lettering.

Use the outlined SVG artwork directly. Scale the complete SVG proportionally, including strokes. For stickers or print, ask the printer to prepare bleed, cut path, and any white-ink underbase.

## Text wordmark

`itsutsu-wordmark-light.svg` and `itsutsu-wordmark-dark.svg` are plain lowercase text logos with the marble i-dot and five stones. The Japanese mark is deliberately separate; this v3 package does not include the old text-with-kanji-below variants.

Write `Itsutsu` in prose and lowercase `itsutsu` in the Latin logo. `五つ` is the Japanese name. The hero is for large page headers; the square avatar and stacked marks are for compact placements.

## Stones matrix

`matrix/stones-matrix.svg` and `matrix/stones-matrix-dark.svg` are the 5×5 marble matrix. Every cell is a marble: `x` is black and `o` is ivory. The light version uses charcoal borders around ivory marbles; the dark version uses ivory borders so the marbles remain visually full-sized. The matrix uses the same 15-unit radius, 5-unit border, and 42-unit center spacing as the hero stones.
