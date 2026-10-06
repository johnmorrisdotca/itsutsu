import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the countries.* phrases (ENJA-10). Joined into `JA_DRAFTED`.
 * The Japanese is CLDR's name for each country in the atlas's spelling, with full-width brackets; Hong Kong, Macao and Palestine are shortened to 香港, マカオ and パレスチナ.
 * Every row has been read by the reviewer agent (`review`): the standards are `japanese-reviewer.md`, the terms `TERMS.md`.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };
const r = (text: string, back: string): DraftedPhrase => ({ text, back, review: AGENT_READ });

export const JA_DRAFTED_COUNTRIES: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "countries.AD": r(
    "アンドラ",
    "Andorra",
  ),
  "countries.AE": r(
    "アラブ首長国連邦",
    "United Arab Emirates",
  ),
  "countries.AF": r(
    "アフガニスタン",
    "Afghanistan",
  ),
  "countries.AG": r(
    "アンティグア・バーブーダ",
    "Antigua & Barbuda",
  ),
  "countries.AI": r(
    "アンギラ",
    "Anguilla",
  ),
  "countries.AL": r(
    "アルバニア",
    "Albania",
  ),
  "countries.AM": r(
    "アルメニア",
    "Armenia",
  ),
  "countries.AO": r(
    "アンゴラ",
    "Angola",
  ),
  "countries.AQ": r(
    "南極",
    "Antarctica",
  ),
  "countries.AR": r(
    "アルゼンチン",
    "Argentina",
  ),
  "countries.AS": r(
    "米領サモア",
    "American Samoa",
  ),
  "countries.AT": r(
    "オーストリア",
    "Austria",
  ),
  "countries.AU": r(
    "オーストラリア",
    "Australia",
  ),
  "countries.AW": r(
    "アルバ",
    "Aruba",
  ),
  "countries.AX": r(
    "オーランド諸島",
    "Åland Islands",
  ),
  "countries.AZ": r(
    "アゼルバイジャン",
    "Azerbaijan",
  ),
  "countries.BA": r(
    "ボスニア・ヘルツェゴビナ",
    "Bosnia & Herzegovina",
  ),
  "countries.BB": r(
    "バルバドス",
    "Barbados",
  ),
  "countries.BD": r(
    "バングラデシュ",
    "Bangladesh",
  ),
  "countries.BE": r(
    "ベルギー",
    "Belgium",
  ),
  "countries.BF": r(
    "ブルキナファソ",
    "Burkina Faso",
  ),
  "countries.BG": r(
    "ブルガリア",
    "Bulgaria",
  ),
  "countries.BH": r(
    "バーレーン",
    "Bahrain",
  ),
  "countries.BI": r(
    "ブルンジ",
    "Burundi",
  ),
  "countries.BJ": r(
    "ベナン",
    "Benin",
  ),
  "countries.BL": r(
    "サン・バルテルミー",
    "St. Barthélemy",
  ),
  "countries.BM": r(
    "バミューダ",
    "Bermuda",
  ),
  "countries.BN": r(
    "ブルネイ",
    "Brunei",
  ),
  "countries.BO": r(
    "ボリビア",
    "Bolivia",
  ),
  "countries.BQ": r(
    "オランダ領カリブ",
    "Caribbean Netherlands",
  ),
  "countries.BR": r(
    "ブラジル",
    "Brazil",
  ),
  "countries.BS": r(
    "バハマ",
    "Bahamas",
  ),
  "countries.BT": r(
    "ブータン",
    "Bhutan",
  ),
  "countries.BV": r(
    "ブーベ島",
    "Bouvet Island",
  ),
  "countries.BW": r(
    "ボツワナ",
    "Botswana",
  ),
  "countries.BY": r(
    "ベラルーシ",
    "Belarus",
  ),
  "countries.BZ": r(
    "ベリーズ",
    "Belize",
  ),
  "countries.CA": r(
    "カナダ",
    "Canada",
  ),
  "countries.CC": r(
    "ココス（キーリング）諸島",
    "Cocos (Keeling) Islands",
  ),
  "countries.CD": r(
    "コンゴ民主共和国（キンシャサ）",
    "Congo - Kinshasa",
  ),
  "countries.CF": r(
    "中央アフリカ共和国",
    "Central African Republic",
  ),
  "countries.CG": r(
    "コンゴ共和国（ブラザビル）",
    "Congo - Brazzaville",
  ),
  "countries.CH": r(
    "スイス",
    "Switzerland",
  ),
  "countries.CI": r(
    "コートジボワール",
    "Côte d’Ivoire",
  ),
  "countries.CK": r(
    "クック諸島",
    "Cook Islands",
  ),
  "countries.CL": r(
    "チリ",
    "Chile",
  ),
  "countries.CM": r(
    "カメルーン",
    "Cameroon",
  ),
  "countries.CN": r(
    "中国",
    "China",
  ),
  "countries.CO": r(
    "コロンビア",
    "Colombia",
  ),
  "countries.CR": r(
    "コスタリカ",
    "Costa Rica",
  ),
  "countries.CU": r(
    "キューバ",
    "Cuba",
  ),
  "countries.CV": r(
    "カーボベルデ",
    "Cape Verde",
  ),
  "countries.CW": r(
    "キュラソー",
    "Curaçao",
  ),
  "countries.CX": r(
    "クリスマス島",
    "Christmas Island",
  ),
  "countries.CY": r(
    "キプロス",
    "Cyprus",
  ),
  "countries.CZ": r(
    "チェコ",
    "Czechia",
  ),
  "countries.DE": r(
    "ドイツ",
    "Germany",
  ),
  "countries.DJ": r(
    "ジブチ",
    "Djibouti",
  ),
  "countries.DK": r(
    "デンマーク",
    "Denmark",
  ),
  "countries.DM": r(
    "ドミニカ国",
    "Dominica",
  ),
  "countries.DO": r(
    "ドミニカ共和国",
    "Dominican Republic",
  ),
  "countries.DZ": r(
    "アルジェリア",
    "Algeria",
  ),
  "countries.EC": r(
    "エクアドル",
    "Ecuador",
  ),
  "countries.EE": r(
    "エストニア",
    "Estonia",
  ),
  "countries.EG": r(
    "エジプト",
    "Egypt",
  ),
  "countries.EH": r(
    "西サハラ",
    "Western Sahara",
  ),
  "countries.ER": r(
    "エリトリア",
    "Eritrea",
  ),
  "countries.ES": r(
    "スペイン",
    "Spain",
  ),
  "countries.ET": r(
    "エチオピア",
    "Ethiopia",
  ),
  "countries.FI": r(
    "フィンランド",
    "Finland",
  ),
  "countries.FJ": r(
    "フィジー",
    "Fiji",
  ),
  "countries.FK": r(
    "フォークランド諸島",
    "Falkland Islands",
  ),
  "countries.FM": r(
    "ミクロネシア連邦",
    "Micronesia",
  ),
  "countries.FO": r(
    "フェロー諸島",
    "Faroe Islands",
  ),
  "countries.FR": r(
    "フランス",
    "France",
  ),
  "countries.GA": r(
    "ガボン",
    "Gabon",
  ),
  "countries.GB": r(
    "イギリス",
    "United Kingdom",
  ),
  "countries.GD": r(
    "グレナダ",
    "Grenada",
  ),
  "countries.GE": r(
    "ジョージア",
    "Georgia",
  ),
  "countries.GF": r(
    "仏領ギアナ",
    "French Guiana",
  ),
  "countries.GG": r(
    "ガーンジー",
    "Guernsey",
  ),
  "countries.GH": r(
    "ガーナ",
    "Ghana",
  ),
  "countries.GI": r(
    "ジブラルタル",
    "Gibraltar",
  ),
  "countries.GL": r(
    "グリーンランド",
    "Greenland",
  ),
  "countries.GM": r(
    "ガンビア",
    "Gambia",
  ),
  "countries.GN": r(
    "ギニア",
    "Guinea",
  ),
  "countries.GP": r(
    "グアドループ",
    "Guadeloupe",
  ),
  "countries.GQ": r(
    "赤道ギニア",
    "Equatorial Guinea",
  ),
  "countries.GR": r(
    "ギリシャ",
    "Greece",
  ),
  "countries.GS": r(
    "サウスジョージア・サウスサンドウィッチ諸島",
    "South Georgia & South Sandwich Islands",
  ),
  "countries.GT": r(
    "グアテマラ",
    "Guatemala",
  ),
  "countries.GU": r(
    "グアム",
    "Guam",
  ),
  "countries.GW": r(
    "ギニアビサウ",
    "Guinea-Bissau",
  ),
  "countries.GY": r(
    "ガイアナ",
    "Guyana",
  ),
  "countries.HK": r(
    "香港",
    "Hong Kong SAR China",
  ),
  "countries.HM": r(
    "ハード島・マクドナルド諸島",
    "Heard & McDonald Islands",
  ),
  "countries.HN": r(
    "ホンジュラス",
    "Honduras",
  ),
  "countries.HR": r(
    "クロアチア",
    "Croatia",
  ),
  "countries.HT": r(
    "ハイチ",
    "Haiti",
  ),
  "countries.HU": r(
    "ハンガリー",
    "Hungary",
  ),
  "countries.ID": r(
    "インドネシア",
    "Indonesia",
  ),
  "countries.IE": r(
    "アイルランド",
    "Ireland",
  ),
  "countries.IL": r(
    "イスラエル",
    "Israel",
  ),
  "countries.IM": r(
    "マン島",
    "Isle of Man",
  ),
  "countries.IN": r(
    "インド",
    "India",
  ),
  "countries.IO": r(
    "英領インド洋地域",
    "British Indian Ocean Territory",
  ),
  "countries.IQ": r(
    "イラク",
    "Iraq",
  ),
  "countries.IR": r(
    "イラン",
    "Iran",
  ),
  "countries.IS": r(
    "アイスランド",
    "Iceland",
  ),
  "countries.IT": r(
    "イタリア",
    "Italy",
  ),
  "countries.JE": r(
    "ジャージー",
    "Jersey",
  ),
  "countries.JM": r(
    "ジャマイカ",
    "Jamaica",
  ),
  "countries.JO": r(
    "ヨルダン",
    "Jordan",
  ),
  "countries.JP": r(
    "日本",
    "Japan",
  ),
  "countries.KE": r(
    "ケニア",
    "Kenya",
  ),
  "countries.KG": r(
    "キルギス",
    "Kyrgyzstan",
  ),
  "countries.KH": r(
    "カンボジア",
    "Cambodia",
  ),
  "countries.KI": r(
    "キリバス",
    "Kiribati",
  ),
  "countries.KM": r(
    "コモロ",
    "Comoros",
  ),
  "countries.KN": r(
    "セントクリストファー・ネーヴィス",
    "St. Kitts & Nevis",
  ),
  "countries.KP": r(
    "北朝鮮",
    "North Korea",
  ),
  "countries.KR": r(
    "韓国",
    "South Korea",
  ),
  "countries.KW": r(
    "クウェート",
    "Kuwait",
  ),
  "countries.KY": r(
    "ケイマン諸島",
    "Cayman Islands",
  ),
  "countries.KZ": r(
    "カザフスタン",
    "Kazakhstan",
  ),
  "countries.LA": r(
    "ラオス",
    "Laos",
  ),
  "countries.LB": r(
    "レバノン",
    "Lebanon",
  ),
  "countries.LC": r(
    "セントルシア",
    "St. Lucia",
  ),
  "countries.LI": r(
    "リヒテンシュタイン",
    "Liechtenstein",
  ),
  "countries.LK": r(
    "スリランカ",
    "Sri Lanka",
  ),
  "countries.LR": r(
    "リベリア",
    "Liberia",
  ),
  "countries.LS": r(
    "レソト",
    "Lesotho",
  ),
  "countries.LT": r(
    "リトアニア",
    "Lithuania",
  ),
  "countries.LU": r(
    "ルクセンブルク",
    "Luxembourg",
  ),
  "countries.LV": r(
    "ラトビア",
    "Latvia",
  ),
  "countries.LY": r(
    "リビア",
    "Libya",
  ),
  "countries.MA": r(
    "モロッコ",
    "Morocco",
  ),
  "countries.MC": r(
    "モナコ",
    "Monaco",
  ),
  "countries.MD": r(
    "モルドバ",
    "Moldova",
  ),
  "countries.ME": r(
    "モンテネグロ",
    "Montenegro",
  ),
  "countries.MF": r(
    "サン・マルタン",
    "St. Martin",
  ),
  "countries.MG": r(
    "マダガスカル",
    "Madagascar",
  ),
  "countries.MH": r(
    "マーシャル諸島",
    "Marshall Islands",
  ),
  "countries.MK": r(
    "北マケドニア",
    "North Macedonia",
  ),
  "countries.ML": r(
    "マリ",
    "Mali",
  ),
  "countries.MM": r(
    "ミャンマー（ビルマ）",
    "Myanmar (Burma)",
  ),
  "countries.MN": r(
    "モンゴル",
    "Mongolia",
  ),
  "countries.MO": r(
    "マカオ",
    "Macao SAR China",
  ),
  "countries.MP": r(
    "北マリアナ諸島",
    "Northern Mariana Islands",
  ),
  "countries.MQ": r(
    "マルティニーク",
    "Martinique",
  ),
  "countries.MR": r(
    "モーリタニア",
    "Mauritania",
  ),
  "countries.MS": r(
    "モントセラト",
    "Montserrat",
  ),
  "countries.MT": r(
    "マルタ",
    "Malta",
  ),
  "countries.MU": r(
    "モーリシャス",
    "Mauritius",
  ),
  "countries.MV": r(
    "モルディブ",
    "Maldives",
  ),
  "countries.MW": r(
    "マラウイ",
    "Malawi",
  ),
  "countries.MX": r(
    "メキシコ",
    "Mexico",
  ),
  "countries.MY": r(
    "マレーシア",
    "Malaysia",
  ),
  "countries.MZ": r(
    "モザンビーク",
    "Mozambique",
  ),
  "countries.NA": r(
    "ナミビア",
    "Namibia",
  ),
  "countries.NC": r(
    "ニューカレドニア",
    "New Caledonia",
  ),
  "countries.NE": r(
    "ニジェール",
    "Niger",
  ),
  "countries.NF": r(
    "ノーフォーク島",
    "Norfolk Island",
  ),
  "countries.NG": r(
    "ナイジェリア",
    "Nigeria",
  ),
  "countries.NI": r(
    "ニカラグア",
    "Nicaragua",
  ),
  "countries.NL": r(
    "オランダ",
    "Netherlands",
  ),
  "countries.NO": r(
    "ノルウェー",
    "Norway",
  ),
  "countries.NP": r(
    "ネパール",
    "Nepal",
  ),
  "countries.NR": r(
    "ナウル",
    "Nauru",
  ),
  "countries.NU": r(
    "ニウエ",
    "Niue",
  ),
  "countries.NZ": r(
    "ニュージーランド",
    "New Zealand",
  ),
  "countries.OM": r(
    "オマーン",
    "Oman",
  ),
  "countries.PA": r(
    "パナマ",
    "Panama",
  ),
  "countries.PE": r(
    "ペルー",
    "Peru",
  ),
  "countries.PF": r(
    "仏領ポリネシア",
    "French Polynesia",
  ),
  "countries.PG": r(
    "パプアニューギニア",
    "Papua New Guinea",
  ),
  "countries.PH": r(
    "フィリピン",
    "Philippines",
  ),
  "countries.PK": r(
    "パキスタン",
    "Pakistan",
  ),
  "countries.PL": r(
    "ポーランド",
    "Poland",
  ),
  "countries.PM": r(
    "サンピエール島・ミクロン島",
    "St. Pierre & Miquelon",
  ),
  "countries.PN": r(
    "ピトケアン諸島",
    "Pitcairn Islands",
  ),
  "countries.PR": r(
    "プエルトリコ",
    "Puerto Rico",
  ),
  "countries.PS": r(
    "パレスチナ",
    "Palestinian Territories",
  ),
  "countries.PT": r(
    "ポルトガル",
    "Portugal",
  ),
  "countries.PW": r(
    "パラオ",
    "Palau",
  ),
  "countries.PY": r(
    "パラグアイ",
    "Paraguay",
  ),
  "countries.QA": r(
    "カタール",
    "Qatar",
  ),
  "countries.RE": r(
    "レユニオン",
    "Réunion",
  ),
  "countries.RO": r(
    "ルーマニア",
    "Romania",
  ),
  "countries.RS": r(
    "セルビア",
    "Serbia",
  ),
  "countries.RU": r(
    "ロシア",
    "Russia",
  ),
  "countries.RW": r(
    "ルワンダ",
    "Rwanda",
  ),
  "countries.SA": r(
    "サウジアラビア",
    "Saudi Arabia",
  ),
  "countries.SB": r(
    "ソロモン諸島",
    "Solomon Islands",
  ),
  "countries.SC": r(
    "セーシェル",
    "Seychelles",
  ),
  "countries.SD": r(
    "スーダン",
    "Sudan",
  ),
  "countries.SE": r(
    "スウェーデン",
    "Sweden",
  ),
  "countries.SG": r(
    "シンガポール",
    "Singapore",
  ),
  "countries.SH": r(
    "セントヘレナ",
    "St. Helena",
  ),
  "countries.SI": r(
    "スロベニア",
    "Slovenia",
  ),
  "countries.SJ": r(
    "スバールバル諸島・ヤンマイエン島",
    "Svalbard & Jan Mayen",
  ),
  "countries.SK": r(
    "スロバキア",
    "Slovakia",
  ),
  "countries.SL": r(
    "シエラレオネ",
    "Sierra Leone",
  ),
  "countries.SM": r(
    "サンマリノ",
    "San Marino",
  ),
  "countries.SN": r(
    "セネガル",
    "Senegal",
  ),
  "countries.SO": r(
    "ソマリア",
    "Somalia",
  ),
  "countries.SR": r(
    "スリナム",
    "Suriname",
  ),
  "countries.SS": r(
    "南スーダン",
    "South Sudan",
  ),
  "countries.ST": r(
    "サントメ・プリンシペ",
    "São Tomé & Príncipe",
  ),
  "countries.SV": r(
    "エルサルバドル",
    "El Salvador",
  ),
  "countries.SX": r(
    "シント・マールテン",
    "Sint Maarten",
  ),
  "countries.SY": r(
    "シリア",
    "Syria",
  ),
  "countries.SZ": r(
    "エスワティニ",
    "Eswatini",
  ),
  "countries.TC": r(
    "タークス・カイコス諸島",
    "Turks & Caicos Islands",
  ),
  "countries.TD": r(
    "チャド",
    "Chad",
  ),
  "countries.TF": r(
    "仏領極南諸島",
    "French Southern Territories",
  ),
  "countries.TG": r(
    "トーゴ",
    "Togo",
  ),
  "countries.TH": r(
    "タイ",
    "Thailand",
  ),
  "countries.TJ": r(
    "タジキスタン",
    "Tajikistan",
  ),
  "countries.TK": r(
    "トケラウ",
    "Tokelau",
  ),
  "countries.TL": r(
    "東ティモール",
    "Timor-Leste",
  ),
  "countries.TM": r(
    "トルクメニスタン",
    "Turkmenistan",
  ),
  "countries.TN": r(
    "チュニジア",
    "Tunisia",
  ),
  "countries.TO": r(
    "トンガ",
    "Tonga",
  ),
  "countries.TR": r(
    "トルコ",
    "Türkiye",
  ),
  "countries.TT": r(
    "トリニダード・トバゴ",
    "Trinidad & Tobago",
  ),
  "countries.TV": r(
    "ツバル",
    "Tuvalu",
  ),
  "countries.TW": r(
    "台湾",
    "Taiwan",
  ),
  "countries.TZ": r(
    "タンザニア",
    "Tanzania",
  ),
  "countries.UA": r(
    "ウクライナ",
    "Ukraine",
  ),
  "countries.UG": r(
    "ウガンダ",
    "Uganda",
  ),
  "countries.UM": r(
    "合衆国領有小離島",
    "U.S. Outlying Islands",
  ),
  "countries.US": r(
    "アメリカ合衆国",
    "United States",
  ),
  "countries.UY": r(
    "ウルグアイ",
    "Uruguay",
  ),
  "countries.UZ": r(
    "ウズベキスタン",
    "Uzbekistan",
  ),
  "countries.VA": r(
    "バチカン市国",
    "Vatican City",
  ),
  "countries.VC": r(
    "セントビンセント及びグレナディーン諸島",
    "St. Vincent & Grenadines",
  ),
  "countries.VE": r(
    "ベネズエラ",
    "Venezuela",
  ),
  "countries.VG": r(
    "英領ヴァージン諸島",
    "British Virgin Islands",
  ),
  "countries.VI": r(
    "米領ヴァージン諸島",
    "U.S. Virgin Islands",
  ),
  "countries.VN": r(
    "ベトナム",
    "Vietnam",
  ),
  "countries.VU": r(
    "バヌアツ",
    "Vanuatu",
  ),
  "countries.WF": r(
    "ウォリス・フツナ",
    "Wallis & Futuna",
  ),
  "countries.WS": r(
    "サモア",
    "Samoa",
  ),
  "countries.YE": r(
    "イエメン",
    "Yemen",
  ),
  "countries.YT": r(
    "マヨット",
    "Mayotte",
  ),
  "countries.ZA": r(
    "南アフリカ",
    "South Africa",
  ),
  "countries.ZM": r(
    "ザンビア",
    "Zambia",
  ),
  "countries.ZW": r(
    "ジンバブエ",
    "Zimbabwe",
  ),
};
