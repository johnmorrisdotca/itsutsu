# ENJA-08. Party and card games in English and Japanese, including the words packages hand back

Board key: `party-and-card-games-in-english-and-japanese-including-the-words-packages-hand-b`.
Kind: feature. Priority normal. Needs ENJA-05.

## Where

- `src/components/party/` and `src/lib/party/` (about 330 strings across Dots and Boxes, Tenka, Hitotsu, Mancala, Yacht, Gunjin, Mexican Train and the others).
- `src/lib/cardGames/cardGames.copy.ts`.
- Online tables, the hand-over screens, `PartySeatColour`, the dice roller.

## The packages

- Hitotsu's engine returns English (`colourWords`, `hitotsuWords`), and Itsutsu shows them on screen and in aria-labels (`HitotsuTableTop.tsx`). Take Japanese from the site's phrases now. Also open a Hitotsu package ticket for Japanese defaults, and for card words moved out of the engine.
- Tenka's territory names are English data. A Japanese sibling for the classic world and Europe maps, with the reviewer's names. The handover already lists 49 Europe names and 11 regions as waiting for a Japanese reader.
- Korokoro already takes `locale`. Check that Itsutsu passes the speaker's.

## Done when

These paths are off the pending list, and every table has been played to its end in Japanese.
