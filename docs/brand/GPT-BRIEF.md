# Brief for the next brand round

What the site found when it put the v4 kit to work. Section 1 is a
question that needs an answer before anything is redrawn; 2 and 3 are
requests. The prompt at the end can be pasted as-is.

## 1. The stone order is not the same on light and dark marks

START-HERE.md says the motif is identical everywhere: **black, ivory, ivory,
ivory, black** (●○○○●). The light-background marks follow it. Every
dark-background mark inverts it to ○●●●○:

| Mark | Stones |
| --- | --- |
| itsutsu-stacked-light, one-ink, sticker-ivory, stones, wordmark-light, hero-light | ●○○○● |
| itsutsu-stacked-dark, sticker-moss, sticker-charcoal, avatar-charcoal, stones-reversed, wordmark-dark, hero-dark | ○●●●○ |

That is a colour inversion of the whole artwork rather than of the
background: the two ends have changed colour, so the motif itself has
changed. The guide's own rule for dark backgrounds is about *borders* — the
stones keep their colours and the borders flip so an ivory stone does not
look undersized on charcoal — which is exactly what stones-matrix-dark does.

Decision needed: is ●○○○● the motif (as written), or does it invert on dark?
If the former, the seven dark marks need redrawing with the stones kept and
only the borders flipped. The site currently shows ●○○○● in light mode and
○●●●○ in dark mode, which means the mark changes when the theme does.

## 2. Small marks for the five game families

The games page groups the thirty games into families. Each family heading
would carry a mark drawn in the kit's language — stones, ink, the same
15-unit radius and 5-unit border — one per family, monochrome so it works in
both themes:

- **Five in a row** 五目 — the plain motif, or five in a diagonal
- **Captures** 取り — a stone lifted out of a pair
- **Drops** 落とし — stones stacked from the bottom of a column
- **Pieces and twists** 駒と回し — a domino of two stones; a quarter-turn arrow
- **Small boards** 小盤 — a 3×3 of stones

Square canvas, 240 × 240 like the stacked mark, transparent, one ink.

## 3. Housekeeping in the kit

- START-HERE.md refers to `matrix/stones-matrix.svg`; the files are at the
  root of the kit, not in a `matrix/` folder.
- START-HERE.md still describes itself as "this v3 package" under a v4 title.
- The hero files carry a canvas `<rect>` fill. The site strips it to lay the
  hero on paper (public/brand/onpage/). A transparent master would save that
  step; the filled version can stay as the standalone.

## What the site already made from the kit, and does not need

- favicon.ico (matrix at 32px and up, i-and-stone icon at 16 and 24)
- apple-icon.png 180, icon-192.png, icon-512.png (maskable), from the avatar
- opengraph-image.png 1200 × 630: the hero on paper with the tagline

## Prompt

> The Itsutsu brand kit v4 (attached) has one inconsistency and two gaps.
>
> 1. The guide says the five-stone motif is identical everywhere: black,
>    ivory, ivory, ivory, black. The light marks follow it, but every
>    dark-background mark (stacked-dark, sticker-moss, sticker-charcoal,
>    avatar-charcoal, stones-reversed, wordmark-dark, hero-dark) inverts the
>    stones to ivory, black, black, black, ivory. Confirm which is intended.
>    If the guide is right, redraw those seven with the stones unchanged and
>    only the borders flipped for contrast — the way stones-matrix-dark
>    already handles it.
> 2. Draw five family marks, 240 × 240, transparent, single ink, in the same
>    stone geometry (15-unit radius, 5-unit border, 42-unit spacing): five in
>    a row; captures (a stone lifted from a pair); drops (stones stacked in a
>    column); pieces and twists (a two-stone domino with a quarter-turn
>    arrow); small boards (a 3 × 3 of stones). Provide light and dark
>    versions of each.
> 3. Fix START-HERE.md: the matrix files are at the kit root, not under
>    matrix/; and the text still calls itself v3. Add a transparent master of
>    the hero alongside the filled one.
