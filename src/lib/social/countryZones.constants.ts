import type { MemberCountryCode } from "./countries.constants";

/**
 * ONE REPRESENTATIVE TIME ZONE PER COUNTRY, FOR GUESSING WHEN A MEMBER'S DAY ENDS.
 *
 * John: "For timezones assign on signup etc. if a country is assigned choose
 * the best guess."
 *
 * The reason it exists: `Member.timeZone` is `@default("")` and almost nobody
 * has ever opened their profile to set it, so every one of those members had
 * their day reckoned in UTC — which ended the site owner's day, in Vancouver,
 * at five in the afternoon and left the XP ledger empty on the day XP shipped.
 * A country is something we often DO know, and a country is usually enough.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT IS A GUESS, AND IT IS ONLY EVER THE THIRD CHOICE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A zone the member chose is never overwritten. The zone their BROWSER reports
 * beats this, because the browser is measuring and this is inferring. See
 * `zoneGuess.ts` for the order and `memberZone.ts` for who applies it.
 *
 * For the 216 countries that have exactly one zone this is not a guess at all —
 * those rows were generated from `new Intl.Locale("und-XX").getTimeZones()`, so
 * there are no typos in them and nothing to keep in step by hand. Every row was
 * then fed back through `Intl.DateTimeFormat` to prove the platform knows it.
 *
 * The 31 marked `// several` ARE guesses: the most populous zone of a country
 * that has more than one. **Canada is the one this gets wrong for the person who
 * found the bug.** It has twenty-three zones, the guess is `America/Toronto`
 * because Ontario holds the most people, and John is in Vancouver — three hours
 * out. That is the shape of the worst case: a member in a large country away
 * from its biggest city gets a day boundary wrong by a few hours until their
 * browser or their own hand corrects it. Which is exactly why a guessed zone is
 * SHOWN as a guess and can be replaced in one press.
 *
 * Two codes are deliberately absent — BV (Bouvet Island) and HM (Heard and
 * McDonald Islands) — because nobody lives there and CLDR names no zone for
 * them. A code with no row here gets no guess, which falls to the UTC floor
 * rather than to a made-up answer.
 */
export const COUNTRY_ZONES: Partial<Record<MemberCountryCode, string>> = {
  AD: "Europe/Andorra",
  AE: "Asia/Dubai",
  AF: "Asia/Kabul",
  AG: "America/Antigua",
  AI: "America/Anguilla",
  AL: "Europe/Tirane",
  AM: "Asia/Yerevan",
  AO: "Africa/Luanda",
  AQ: "Antarctica/McMurdo", // several
  AR: "America/Argentina/Buenos_Aires", // several
  AS: "Pacific/Pago_Pago",
  AT: "Europe/Vienna",
  AU: "Australia/Sydney", // several
  AW: "America/Aruba",
  AX: "Europe/Mariehamn",
  AZ: "Asia/Baku",
  BA: "Europe/Sarajevo",
  BB: "America/Barbados",
  BD: "Asia/Dhaka",
  BE: "Europe/Brussels",
  BF: "Africa/Ouagadougou",
  BG: "Europe/Sofia",
  BH: "Asia/Bahrain",
  BI: "Africa/Bujumbura",
  BJ: "Africa/Porto-Novo",
  BL: "America/St_Barthelemy",
  BM: "Atlantic/Bermuda",
  BN: "Asia/Brunei",
  BO: "America/La_Paz",
  BQ: "America/Kralendijk",
  BR: "America/Sao_Paulo", // several
  BS: "America/Nassau",
  BT: "Asia/Thimphu",
  BW: "Africa/Gaborone",
  BY: "Europe/Minsk",
  BZ: "America/Belize",
  CA: "America/Toronto", // several
  CC: "Indian/Cocos",
  CD: "Africa/Kinshasa", // several
  CF: "Africa/Bangui",
  CG: "Africa/Brazzaville",
  CH: "Europe/Zurich",
  CI: "Africa/Abidjan",
  CK: "Pacific/Rarotonga",
  CL: "America/Santiago", // several
  CM: "Africa/Douala",
  CN: "Asia/Shanghai", // several
  CO: "America/Bogota",
  CR: "America/Costa_Rica",
  CU: "America/Havana",
  CV: "Atlantic/Cape_Verde",
  CW: "America/Curacao",
  CX: "Indian/Christmas",
  CY: "Asia/Nicosia", // several
  CZ: "Europe/Prague",
  DE: "Europe/Berlin", // several
  DJ: "Africa/Djibouti",
  DK: "Europe/Copenhagen",
  DM: "America/Dominica",
  DO: "America/Santo_Domingo",
  DZ: "Africa/Algiers",
  EC: "America/Guayaquil", // several
  EE: "Europe/Tallinn",
  EG: "Africa/Cairo",
  EH: "Africa/El_Aaiun",
  ER: "Africa/Asmera",
  ES: "Europe/Madrid", // several
  ET: "Africa/Addis_Ababa",
  FI: "Europe/Helsinki",
  FJ: "Pacific/Fiji",
  FK: "Atlantic/Stanley",
  FM: "Pacific/Chuuk", // several
  FO: "Atlantic/Faeroe",
  FR: "Europe/Paris",
  GA: "Africa/Libreville",
  GB: "Europe/London",
  GD: "America/Grenada",
  GE: "Asia/Tbilisi",
  GF: "America/Cayenne",
  GG: "Europe/Guernsey",
  GH: "Africa/Accra",
  GI: "Europe/Gibraltar",
  GL: "America/Nuuk", // several
  GM: "Africa/Banjul",
  GN: "Africa/Conakry",
  GP: "America/Guadeloupe",
  GQ: "Africa/Malabo",
  GR: "Europe/Athens",
  GS: "Atlantic/South_Georgia",
  GT: "America/Guatemala",
  GU: "Pacific/Guam",
  GW: "Africa/Bissau",
  GY: "America/Guyana",
  HK: "Asia/Hong_Kong",
  HN: "America/Tegucigalpa",
  HR: "Europe/Zagreb",
  HT: "America/Port-au-Prince",
  HU: "Europe/Budapest",
  ID: "Asia/Jakarta", // several
  IE: "Europe/Dublin",
  IL: "Asia/Jerusalem",
  IM: "Europe/Isle_of_Man",
  IN: "Asia/Calcutta",
  IO: "Indian/Chagos",
  IQ: "Asia/Baghdad",
  IR: "Asia/Tehran",
  IS: "Atlantic/Reykjavik",
  IT: "Europe/Rome",
  JE: "Europe/Jersey",
  JM: "America/Jamaica",
  JO: "Asia/Amman",
  JP: "Asia/Tokyo",
  KE: "Africa/Nairobi",
  KG: "Asia/Bishkek",
  KH: "Asia/Phnom_Penh",
  KI: "Pacific/Tarawa", // several
  KM: "Indian/Comoro",
  KN: "America/St_Kitts",
  KP: "Asia/Pyongyang",
  KR: "Asia/Seoul",
  KW: "Asia/Kuwait",
  KY: "America/Cayman",
  KZ: "Asia/Almaty", // several
  LA: "Asia/Vientiane",
  LB: "Asia/Beirut",
  LC: "America/St_Lucia",
  LI: "Europe/Vaduz",
  LK: "Asia/Colombo",
  LR: "Africa/Monrovia",
  LS: "Africa/Maseru",
  LT: "Europe/Vilnius",
  LU: "Europe/Luxembourg",
  LV: "Europe/Riga",
  LY: "Africa/Tripoli",
  MA: "Africa/Casablanca",
  MC: "Europe/Monaco",
  MD: "Europe/Chisinau",
  ME: "Europe/Podgorica",
  MF: "America/Marigot",
  MG: "Indian/Antananarivo",
  MH: "Pacific/Majuro", // several
  MK: "Europe/Skopje",
  ML: "Africa/Bamako",
  MM: "Asia/Rangoon",
  MN: "Asia/Ulaanbaatar", // several
  MO: "Asia/Macau",
  MP: "Pacific/Saipan",
  MQ: "America/Martinique",
  MR: "Africa/Nouakchott",
  MS: "America/Montserrat",
  MT: "Europe/Malta",
  MU: "Indian/Mauritius",
  MV: "Indian/Maldives",
  MW: "Africa/Blantyre",
  MX: "America/Mexico_City", // several
  MY: "Asia/Kuala_Lumpur", // several
  MZ: "Africa/Maputo",
  NA: "Africa/Windhoek",
  NC: "Pacific/Noumea",
  NE: "Africa/Niamey",
  NF: "Pacific/Norfolk",
  NG: "Africa/Lagos",
  NI: "America/Managua",
  NL: "Europe/Amsterdam",
  NO: "Europe/Oslo",
  NP: "Asia/Katmandu",
  NR: "Pacific/Nauru",
  NU: "Pacific/Niue",
  NZ: "Pacific/Auckland", // several
  OM: "Asia/Muscat",
  PA: "America/Panama",
  PE: "America/Lima",
  PF: "Pacific/Tahiti", // several
  PG: "Pacific/Port_Moresby", // several
  PH: "Asia/Manila",
  PK: "Asia/Karachi",
  PL: "Europe/Warsaw",
  PM: "America/Miquelon",
  PN: "Pacific/Pitcairn",
  PR: "America/Puerto_Rico",
  PS: "Asia/Gaza", // several
  PT: "Europe/Lisbon", // several
  PW: "Pacific/Palau",
  PY: "America/Asuncion",
  QA: "Asia/Qatar",
  RE: "Indian/Reunion",
  RO: "Europe/Bucharest",
  RS: "Europe/Belgrade",
  RU: "Europe/Moscow", // several
  RW: "Africa/Kigali",
  SA: "Asia/Riyadh",
  SB: "Pacific/Guadalcanal",
  SC: "Indian/Mahe",
  SD: "Africa/Khartoum",
  SE: "Europe/Stockholm",
  SG: "Asia/Singapore",
  SH: "Atlantic/St_Helena",
  SI: "Europe/Ljubljana",
  SJ: "Arctic/Longyearbyen",
  SK: "Europe/Bratislava",
  SL: "Africa/Freetown",
  SM: "Europe/San_Marino",
  SN: "Africa/Dakar",
  SO: "Africa/Mogadishu",
  SR: "America/Paramaribo",
  SS: "Africa/Juba",
  ST: "Africa/Sao_Tome",
  SV: "America/El_Salvador",
  SX: "America/Lower_Princes",
  SY: "Asia/Damascus",
  SZ: "Africa/Mbabane",
  TC: "America/Grand_Turk",
  TD: "Africa/Ndjamena",
  TF: "Indian/Kerguelen",
  TG: "Africa/Lome",
  TH: "Asia/Bangkok",
  TJ: "Asia/Dushanbe",
  TK: "Pacific/Fakaofo",
  TL: "Asia/Dili",
  TM: "Asia/Ashgabat",
  TN: "Africa/Tunis",
  TO: "Pacific/Tongatapu",
  TR: "Europe/Istanbul",
  TT: "America/Port_of_Spain",
  TV: "Pacific/Funafuti",
  TW: "Asia/Taipei",
  TZ: "Africa/Dar_es_Salaam",
  UA: "Europe/Kyiv", // several
  UG: "Africa/Kampala",
  UM: "Pacific/Wake", // several
  US: "America/New_York", // several
  UY: "America/Montevideo",
  UZ: "Asia/Tashkent", // several
  VA: "Europe/Vatican",
  VC: "America/St_Vincent",
  VE: "America/Caracas",
  VG: "America/Tortola",
  VI: "America/St_Thomas",
  VN: "Asia/Saigon",
  VU: "Pacific/Efate",
  WF: "Pacific/Wallis",
  WS: "Pacific/Apia",
  YE: "Asia/Aden",
  YT: "Indian/Mayotte",
  ZA: "Africa/Johannesburg",
  ZM: "Africa/Lusaka",
  ZW: "Africa/Harare",
};
