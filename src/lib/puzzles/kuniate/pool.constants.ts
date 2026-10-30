/*
 * THE COUNTRIES KUNIATE ASKS FOR, read from Kuni's figures on 2026-10-30 (`@johnmorrisdotca/kuni` 1.4.0) and written here as plain
 * codes, because the generator runs before any of the packages has been fetched, and a server's check
 * must not bring them into a page's function. `kuniate.test.ts` holds this list to the packages: that every code has a
 * name, a capital, a point on the map and an outline, and a flag wherever a flag is asked.
 *
 * WHO IS ASKED FOR. The answers are the 193 members of the United Nations and its two observer states; every other
 * place on Kuni's list (a territory, a dependency, Kosovo, Taiwan) can be guessed and is never the answer.
 * Easy is the people's best-known: the G20, the European Union and the sixty most populous. Medium adds
 * up to the hundred and twenty most populous. Hard is all of them.
 */

const words = (spelled: string): readonly string[] => spelled.trim().split(" ");

export const KUNIATE_EASY: readonly string[] = words(
  "AF AO AR AT AU BD BE BF BG BR CA CD CI CM CN CO CY CZ DE DK DZ EE EG ES ET FI FR GB GH GR " +
  "HR HU ID IE IN IQ IR IT JP KE KP KR LK LT LU LV MA MG ML MM MT MX MY MZ NE NG NL NP PE PH " +
  "PK PL PT RO RU SA SD SE SI SK SY TH TR TZ UA UG US UZ VE VN YE ZA ",
);

export const KUNIATE_MEDIUM: readonly string[] = words(
  "AE AF AO AR AT AU AZ BD BE BF BG BI BJ BO BR BY CA CD CG CH CI CL CM CN CO CR CU CY CZ DE " +
  "DK DO DZ EC EE EG ES ET FI FR GB GH GN GR GT HN HR HT HU ID IE IL IN IQ IR IT JO JP KE KG " +
  "KH KP KR KZ LA LB LK LR LT LU LV LY MA MG ML MM MT MW MX MY MZ NE NG NL NO NP NZ PE PG PH " +
  "PK PL PS PT PY RO RS RU RW SA SD SE SG SI SK SL SN SO SS SV SY TD TG TH TJ TM TN TR TZ UA " +
  "UG US UZ VE VN YE ZA ZM ZW ",
);

export const KUNIATE_HARD: readonly string[] = words(
  "AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD " +
  "CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA " +
  "GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI " +
  "KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU " +
  "MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW " +
  "SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TZ " +
  "UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW ",
);

/** Every place that can be guessed: Kuni's 250. */
export const KUNIATE_GUESSES: ReadonlySet<string> = new Set(words(
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ " +
  "BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM " +
  "DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS " +
  "GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN " +
  "KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ " +
  "MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM " +
  "PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV " +
  "SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI " +
  "VN VU WF WS XK YE YT ZA ZM ZW ",
));

/** Answers Hata has no flag for at 1.7.2: asked by outline or capital, never by a flag. */
export const KUNIATE_NO_FLAG: ReadonlySet<string> = new Set(["OM"]);
