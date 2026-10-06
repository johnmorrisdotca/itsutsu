/**
 * xp.*: the XP toast, a player's standing, credit from other sites and which total a board counts.
 *
 * One area of the phrase catalogue, joined into `PHRASES` by `i18n.constants.ts`.
 * A new area is a new `phrases.<area>.constants.ts` and one line there.
 */
export const PHRASES_XP = {
  /*
   * The XP toast. It shipped in 0.158.4 with these five as fixed English in
   * `xp.constants.ts`, so a Japanese reader was paid in their own language
   * and told about it in somebody else's. The unit is spelt out rather than
   * left as the letters: "XP" is a name only to an English reader.
   */
  "xp.unit": "XP",
  "xp.pointsEarned": "Points earned",
  "xp.dismiss": "Dismiss",
  "xp.levelUp": "Level up",
  "xp.nextLevel": "Next level: {name}",

  /*
   * A person's standing on their own page — the level and the total, under
   * their record. John: "View Person should always show this prominent info…
   * the Name of the person, Stats/Record and XP + XP level Name." The words a
   * table heading already says in English ("XP", "Level") are said here in the
   * reader's language, since this is a sentence about somebody and not a column.
   */
  "xp.level": "Level",
  "xp.toNext": "{count} to {name}",
  "xp.atTheTop": "The top of the ladder.",
  "xp.board": "Where everybody stands by experience",

  /*
   * Experience credited for another site's record, and which total a board is
   * counting. John: "we will show filters, that show worldwide XP with a
   * justification that they have put in their time or mileage on other sites)
   * and the Itsutsu only XP as well". `{games}` is drawn as a count that says it
   * was counted elsewhere; `{sites}` is a list the speaker joins (`Speaker.list`: "a, b and c", "a、b、c").
   */
  "xp.imported.includes": "Includes {xp} XP for {games} games played on {sites}.",
  "xp.imported.includesElsewhere": "Includes {xp} XP credited for games played on other sites.",
  "xp.scope.everywhere": "Counting everywhere: experience earned here, plus credit for games played on other sites.",
  "xp.scope.here": "Counting this site only: experience earned here, and nothing credited from elsewhere.",
  "xp.scope.countEverywhere": "Include worldwide",
} as const;
