/**
 * Every country a member can say they are in.
 *
 * Codes only. The names come from `Intl.DisplayNames`, which the platform
 * already ships and keeps right — including the ones a hand-typed table gets
 * wrong, like Côte d'Ivoire and the several countries whose official name
 * changed this century. Writing two hundred and forty-nine names out here
 * would be two hundred and forty-nine chances to spell somebody's country
 * incorrectly on their own profile.
 *
 * ISO 3166-1 alpha-2, which is also what a flag emoji is made of, so the flag
 * needs no second table either.
 */
export const COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
  "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
  "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
  "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
  "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
  "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
  "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
  "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
  "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
] as const;

export type MemberCountryCode = (typeof COUNTRY_CODES)[number];

/**
 * What people actually type, where it is not the name the platform uses.
 *
 * The field is free text and always has been, so what is already in the
 * database is whatever anybody felt like writing. These are the spellings
 * worth catching rather than an attempt at every one: a member who wrote
 * something nobody can resolve still has their words shown, just without a
 * flag beside them.
 */
export const COUNTRY_ALIASES: Record<string, MemberCountryCode> = {
  uk: "GB",
  "united kingdom": "GB",
  "great britain": "GB",
  britain: "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  "northern ireland": "GB",
  usa: "US",
  "u.s.": "US",
  "u.s.a.": "US",
  america: "US",
  "united states of america": "US",
  "south korea": "KR",
  "north korea": "KP",
  russia: "RU",
  vietnam: "VN",
  "viet nam": "VN",
  "czech republic": "CZ",
  czechia: "CZ",
  holland: "NL",
  "the netherlands": "NL",
  uae: "AE",
  "ivory coast": "CI",
  turkey: "TR",
  "cape verde": "CV",
  burma: "MM",
  "hong kong": "HK",
  macau: "MO",
  taiwan: "TW",
  laos: "LA",
  syria: "SY",
  bolivia: "BO",
  moldova: "MD",
  tanzania: "TZ",
  venezuela: "VE",
  brunei: "BN",
  "east timor": "TL",
  swaziland: "SZ",
  "vatican city": "VA",
  palestine: "PS",
};
