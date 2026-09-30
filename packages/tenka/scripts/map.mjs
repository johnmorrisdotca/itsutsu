/**
 * Builds Tenka's map of the world: forty-two territories in six continents,
 * drawn from Natural Earth and written into two small static files.
 *
 *   node scripts/map.mjs
 *
 * SOURCE AND LICENCE. Natural Earth's admin-0 countries at 1:110m
 * (naturalearthdata.com), a common source for world maps.
 * Natural Earth is in the public domain: "No permission is needed to use
 * Natural Earth. Crediting the authors is unnecessary." It is fetched here, at
 * build time, from the project's own repository on GitHub and cached in the
 * machine's temporary folder (or read from `TENKA_SOURCE` when that names a
 * copy); the site never fetches anything from anywhere to draw the map.
 *
 * WHAT IT DOES, in order:
 *
 *  1. Every country's polygons are given to a territory (`COUNTRIES` below):
 *     most whole, some by where each polygon lies (France's Guiana is in
 *     South America), and five large mainlands CUT along a meridian — Canada
 *     at 97°W, the United States at 100°W, Russia at 59°E (the Urals) and 100°E, and
 *     Australia at 129°E (its real western border). A cut is only made where
 *     the meridian crosses the mainland exactly twice, so each half is one
 *     clean piece; the script refuses otherwise.
 *  2. Small islands a finger could never find are left off (`LEAST_AREA`),
 *     never a country's largest piece.
 *  3. Everything is projected on Miller's cylindrical projection — the flat
 *     world map of a classroom wall — from 170°W round to 192°E, so the
 *     Bering Strait is the map's seam and Chukotka stays with the rest of Russia.
 *  4. Each territory's countries are MERGED into one outline: an edge two of
 *     its own countries share is dropped, and what is left is joined up into
 *     rings. Two territories are neighbours by land when they share an edge.
 *  5. Written out: `src/tenkaWorld.data.ts` (names,
 *     continents, land neighbours and the sea links — what the rules read) and
 *     `src/tenkaShapes.data.ts` (outlines as SVG paths, label
 *     points, the sea links' dashed lines and the continents' borders — what
 *     only the browser's board draws).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REMOTE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const CACHE = process.env.TENKA_SOURCE ?? join(tmpdir(), "ne_110m_admin_0_countries.geojson");
const WORLD_OUT = "src/tenkaWorld.data.ts";
const SHAPES_OUT = "src/tenkaShapes.data.ts";

/** The map's width in its own units; coordinates are whole units, which is fine enough at four times zoom. */
const WIDTH = 2000;
/** The seam, and how far round the map runs from it. */
const WEST = -170;
const EAST = 192;
/** The rows of the map: Greenland's northern tip to Tierra del Fuego. */
const NORTH = 84;
const SOUTH = -56.5;
/** The least an island's outline may enclose, in square map units, to be drawn: about four pixels square at a whole-world view. */
const LEAST_AREA = 30;

/** The six continents, in the order the rules list them. */
const CONTINENTS = ["northAmerica", "southAmerica", "europe", "africa", "asia", "oceania"];

/**
 * THE FORTY-TWO TERRITORIES, each a modern name for a real stretch of the
 * world, in continent order. `label` places the army counter by hand where
 * the middle of the largest piece would sit badly.
 */
const TERRITORIES = [
  { key: "alaska", name: "Alaska", continent: "northAmerica" },
  { key: "westernCanada", name: "Western Canada", continent: "northAmerica", label: [-115, 58] },
  { key: "easternCanada", name: "Eastern Canada", continent: "northAmerica", label: [-78, 51] },
  { key: "arcticIslands", name: "Arctic Islands", continent: "northAmerica", label: [-103, 73] },
  { key: "greenland", name: "Greenland", continent: "northAmerica" },
  { key: "usWest", name: "Western United States", continent: "northAmerica", label: [-113, 41] },
  { key: "usEast", name: "Eastern United States", continent: "northAmerica", label: [-87, 37] },
  { key: "mexico", name: "Mexico and Central America", continent: "northAmerica", label: [-102, 23] },

  { key: "colombia", name: "Colombia and Venezuela", continent: "southAmerica", label: [-68, 5] },
  { key: "andes", name: "The Andes", continent: "southAmerica", label: [-72, -11] },
  { key: "brazil", name: "Brazil", continent: "southAmerica" },
  { key: "southernCone", name: "Southern Cone", continent: "southAmerica", label: [-65, -34] },

  { key: "britain", name: "Britain and Ireland", continent: "europe", label: [-1.8, 52.6] },
  { key: "nordic", name: "The Nordic Countries", continent: "europe", label: [16, 63] },
  { key: "westernEurope", name: "Western Europe", continent: "europe", label: [1.5, 46] },
  { key: "centralEurope", name: "Central Europe", continent: "europe", label: [15, 50.5] },
  { key: "southernEurope", name: "Southern Europe", continent: "europe", label: [21, 42.5] },
  { key: "easternEurope", name: "Eastern Europe", continent: "europe", label: [29, 50] },
  { key: "westernRussia", name: "Western Russia", continent: "europe", label: [44, 59] },

  { key: "northAfrica", name: "North Africa", continent: "africa", label: [5, 28] },
  { key: "egypt", name: "Egypt and Sudan", continent: "africa", label: [30, 21] },
  { key: "westAfrica", name: "West Africa", continent: "africa", label: [-3, 15] },
  { key: "centralAfrica", name: "Central Africa", continent: "africa", label: [21, 2] },
  { key: "eastAfrica", name: "East Africa", continent: "africa", label: [38, 3] },
  { key: "southernAfrica", name: "Southern Africa", continent: "africa", label: [25, -20] },
  { key: "madagascar", name: "Madagascar", continent: "africa" },

  { key: "middleEast", name: "The Middle East", continent: "asia", label: [48, 33] },
  { key: "arabia", name: "Arabia", continent: "asia", label: [46, 22] },
  { key: "centralAsia", name: "Central Asia", continent: "asia", label: [66, 45] },
  { key: "southAsia", name: "South Asia", continent: "asia", label: [78, 21] },
  { key: "siberia", name: "Siberia", continent: "asia", label: [85, 62] },
  { key: "farEast", name: "The Russian Far East", continent: "asia", label: [130, 64] },
  { key: "mongolia", name: "Mongolia", continent: "asia" },
  { key: "china", name: "China", continent: "asia", label: [104, 32] },
  { key: "korea", name: "Korea", continent: "asia", label: [127.3, 38.5] },
  { key: "japan", name: "Japan", continent: "asia", label: [139, 36.5] },
  { key: "southeastAsia", name: "Southeast Asia", continent: "asia", label: [102, 16] },

  { key: "indonesia", name: "Indonesia", continent: "oceania", label: [114, -1] },
  { key: "melanesia", name: "Melanesia", continent: "oceania", label: [145, -6] },
  { key: "westernAustralia", name: "Western Australia", continent: "oceania", label: [122, -25] },
  { key: "easternAustralia", name: "Eastern Australia", continent: "oceania", label: [140, -26] },
  { key: "newZealand", name: "New Zealand", continent: "oceania", label: [172.5, -41] },
];

/*
 * Every country's territory, by its ISO code (Natural Earth's ADM0_A3 where
 * the ISO code is missing). A string gives the whole country; a function is
 * asked of each of its polygons by the polygon's centre (`lon`, `lat`) and
 * whether it is the country's largest (`main`), and answers a territory, a
 * CUT (`{ at: [meridians], into: [territories west to east] }`), or null to
 * leave that piece off the map.
 */
const COUNTRIES = {
  // North America
  // St Lawrence Island lies west of the seam, so it lands at the map's far east edge: left off, like Hawaii, rather
  // than given to a territory on the other side of the world (it once stretched Eastern United States across the map).
  US: ({ lon, lat, main }) => (main ? { at: [-100], into: ["usWest", "usEast"] } : lon > 180 ? null : lon < -130 && lat > 50 ? "alaska" : lat < 25 ? null : lon < -100 ? "usWest" : "usEast"),
  CA: ({ lon, lat, main }) => (main ? { at: [-97], into: ["westernCanada", "easternCanada"] } : lat >= 60 ? "arcticIslands" : lon < -97 ? "westernCanada" : "easternCanada"),
  GL: "greenland",
  MX: "mexico", GT: "mexico", BZ: "mexico", HN: "mexico", SV: "mexico", NI: "mexico", CR: "mexico", PA: "mexico",
  CU: "mexico", JM: "mexico", HT: "mexico", DO: "mexico", PR: "mexico", BS: "mexico", TT: "mexico",
  // South America
  CO: "colombia", VE: "colombia", GY: "colombia", SR: "colombia",
  EC: "andes", PE: "andes", BO: "andes",
  BR: "brazil",
  AR: "southernCone", CL: "southernCone", UY: "southernCone", PY: "southernCone", FK: "southernCone",
  // Europe
  GB: "britain", IE: "britain",
  NO: "nordic", SE: "nordic", FI: "nordic", DK: "nordic", IS: "nordic",
  FR: ({ lon }) => (lon < -20 ? "colombia" : "westernEurope"),
  ES: "westernEurope", PT: "westernEurope", BE: "westernEurope", NL: "westernEurope", LU: "westernEurope",
  DE: "centralEurope", PL: "centralEurope", CZ: "centralEurope", SK: "centralEurope", AT: "centralEurope", CH: "centralEurope", HU: "centralEurope",
  IT: "southernEurope", SI: "southernEurope", HR: "southernEurope", BA: "southernEurope", RS: "southernEurope", ME: "southernEurope",
  XK: "southernEurope", AL: "southernEurope", MK: "southernEurope", GR: "southernEurope", BG: "southernEurope",
  UA: "easternEurope", BY: "easternEurope", MD: "easternEurope", RO: "easternEurope", LT: "easternEurope", LV: "easternEurope", EE: "easternEurope",
  RU: ({ lon, main }) => (main ? { at: [59, 100], into: ["westernRussia", "siberia", "farEast"] } : lon < 59 && lon > 0 ? "westernRussia" : lon >= 59 && lon < 100 ? "siberia" : "farEast"),
  // Africa
  MA: "northAfrica", EH: "northAfrica", DZ: "northAfrica", TN: "northAfrica", LY: "northAfrica",
  EG: "egypt", SD: "egypt",
  MR: "westAfrica", SN: "westAfrica", GM: "westAfrica", GW: "westAfrica", GN: "westAfrica", SL: "westAfrica", LR: "westAfrica",
  CI: "westAfrica", ML: "westAfrica", BF: "westAfrica", GH: "westAfrica", TG: "westAfrica", BJ: "westAfrica", NE: "westAfrica", NG: "westAfrica",
  TD: "centralAfrica", CM: "centralAfrica", CF: "centralAfrica", GQ: "centralAfrica", GA: "centralAfrica", CG: "centralAfrica", CD: "centralAfrica",
  ET: "eastAfrica", ER: "eastAfrica", DJ: "eastAfrica", SO: "eastAfrica", SOL: "eastAfrica", KE: "eastAfrica", UG: "eastAfrica",
  RW: "eastAfrica", BI: "eastAfrica", TZ: "eastAfrica", SS: "eastAfrica",
  AO: "southernAfrica", ZM: "southernAfrica", MW: "southernAfrica", MZ: "southernAfrica", ZW: "southernAfrica", NA: "southernAfrica",
  BW: "southernAfrica", ZA: "southernAfrica", LS: "southernAfrica", SZ: "southernAfrica",
  MG: "madagascar",
  // Asia
  TR: "middleEast", CY: "middleEast", CYN: "middleEast", SY: "middleEast", LB: "middleEast", IL: "middleEast", PS: "middleEast",
  JO: "middleEast", IQ: "middleEast", GE: "middleEast", AM: "middleEast", AZ: "middleEast", IR: "middleEast",
  SA: "arabia", YE: "arabia", OM: "arabia", AE: "arabia", QA: "arabia", KW: "arabia",
  KZ: "centralAsia", UZ: "centralAsia", TM: "centralAsia", KG: "centralAsia", TJ: "centralAsia", AF: "centralAsia",
  IN: "southAsia", PK: "southAsia", NP: "southAsia", BT: "southAsia", BD: "southAsia", LK: "southAsia",
  MN: "mongolia",
  CN: "china", TW: "china",
  KP: "korea", KR: "korea",
  JP: "japan",
  MM: "southeastAsia", TH: "southeastAsia", LA: "southeastAsia", KH: "southeastAsia", VN: "southeastAsia", MY: "southeastAsia",
  PH: "southeastAsia", BN: "southeastAsia",
  // Oceania
  ID: "indonesia", TL: "indonesia",
  PG: "melanesia", SB: "melanesia", VU: "melanesia", NC: "melanesia", FJ: "melanesia",
  AU: ({ main }) => (main ? { at: [129], into: ["westernAustralia", "easternAustralia"] } : "easternAustralia"),
  NZ: "newZealand",
  // Left off: a continent of ice, and the islands of the far south.
  AQ: null, TF: null,
};

/**
 * THE SEA LINKS: the straits and short crossings an army may cross, drawn as
 * dashed lines. Every one is named here, so none is an accident of how two
 * coastlines were drawn; `wrap` goes off one edge of the map and on at the
 * other, across the Bering Strait, and the board tags both ends with the
 * territory waiting on the other side. `from` and `to` pin a line's ends in
 * longitude and latitude where the nearest two coasts would draw it badly.
 *
 * Every link between continents of the classic game is here, by the name of
 * the territory that holds that place on this map (tenkaLinks.test.ts pins
 * them): Alaska–Kamchatka is alaska–farEast, Greenland–Iceland is
 * greenland–nordic, Southern Europe–Egypt is southernEurope–egypt.
 */
const SEA_LINKS = [
  ["alaska", "farEast", { wrap: true }],
  ["arcticIslands", "greenland"],
  ["arcticIslands", "westernCanada"],
  ["arcticIslands", "easternCanada"],
  ["greenland", "easternCanada"],
  ["greenland", "nordic"],
  ["britain", "nordic", { from: [-3, 58], to: [6, 60] }],
  ["britain", "westernEurope"],
  ["britain", "centralEurope"],
  ["westernEurope", "northAfrica"],
  ["southernEurope", "northAfrica"],
  ["southernEurope", "egypt"],
  ["brazil", "westAfrica"],
  ["eastAfrica", "arabia"],
  ["madagascar", "southernAfrica"],
  ["madagascar", "eastAfrica"],
  ["japan", "korea"],
  ["japan", "farEast"],
  ["indonesia", "westernAustralia"],
  ["melanesia", "easternAustralia"],
  ["easternAustralia", "newZealand"],
  ["melanesia", "newZealand"],
];

// ——— Geometry ———

const RAD = Math.PI / 180;
const miller = (lat) => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * lat * RAD));
const SCALE = WIDTH / ((EAST - WEST) * RAD);
const TOP = miller(NORTH);
const HEIGHT = Math.round((TOP - miller(SOUTH)) * SCALE);
const project = ([lon, lat]) => [Math.round((lon - WEST) * RAD * SCALE), Math.round((TOP - miller(Math.max(SOUTH, Math.min(NORTH, lat)))) * SCALE)];

/** A ring's signed area by the shoelace formula (in whatever units its points are). */
function ringArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

function centreOf(ring) {
  let x = 0;
  let y = 0;
  for (const [px, py] of ring) {
    x += px;
    y += py;
  }
  return { lon: x / ring.length, lat: y / ring.length };
}

/** A ring without its closing point, which GeoJSON repeats. */
const open = (ring) => (ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? ring.slice(0, -1) : ring);

/**
 * The point where a meridian crosses an edge, worked out the same way
 * whichever end the edge is walked from, so the two halves of a cut country
 * meet at exactly the same point and share their edge.
 */
function crossing(a, b, at) {
  const [p, q] = a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? [a, b] : [b, a];
  const t = (at - p[0]) / (q[0] - p[0]);
  return [at, p[1] + t * (q[1] - p[1])];
}

/** Every meridian some mainland is cut along. */
const CUT_MERIDIANS = [-100, -97, 59, 100, 129];

/**
 * A ring with a point added wherever it crosses a cut meridian. Done to EVERY
 * ring, not only the ones cut, so that where a cut mainland meets a
 * neighbour — Canada west of 97°W meeting the United States east of 100°W
 * along the 49th parallel — both have the same point there, and their shared
 * border is the same edges on either side.
 */
function withCutPoints(ring) {
  const out = [];
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    out.push(a);
    const between = CUT_MERIDIANS.filter((at) => (a[0] < at && b[0] > at) || (a[0] > at && b[0] < at)).sort((x, y) => (a[0] < b[0] ? x - y : y - x));
    for (const at of between) out.push(crossing(a, b, at));
  }
  return out;
}

/** How many times a meridian crosses a ring. */
function crossings(ring, at) {
  let count = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    if (a[0] < at !== b[0] < at) count += 1;
  }
  return count;
}

/** The part of a ring west (`side` -1) or east (+1) of a meridian: Sutherland and Hodgman against one line. */
function clipRing(ring, at, side) {
  const inside = (p) => (side < 0 ? p[0] < at : p[0] >= at);
  const out = [];
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    if (inside(a)) {
      out.push(a);
      if (!inside(b)) out.push(crossing(a, b, at));
    } else if (inside(b)) {
      out.push(crossing(a, b, at));
    }
  }
  return out;
}

/** A ring cut along several meridians, west to east: one piece for each territory in `into`. */
function cutRing(ring, meridians, into) {
  for (const at of meridians) {
    const count = crossings(ring, at);
    if (count !== 2) throw new Error(`The meridian ${at} crosses a mainland ${count} times; choose one that crosses it twice.`);
  }
  const pieces = [];
  let rest = ring;
  meridians.forEach((at, index) => {
    pieces.push({ territory: into[index], ring: clipRing(rest, at, -1) });
    rest = clipRing(rest, at, 1);
  });
  pieces.push({ territory: into.at(-1), ring: rest });
  return pieces.filter((piece) => piece.ring.length >= 3);
}

// ——— Reading the source ———

async function source() {
  if (existsSync(CACHE)) return JSON.parse(readFileSync(CACHE, "utf8"));
  const response = await fetch(REMOTE);
  if (!response.ok) throw new Error(`Could not fetch ${REMOTE}: ${response.status}`);
  const text = await response.text();
  writeFileSync(CACHE, text);
  return JSON.parse(text);
}

const codeOf = (properties) => (properties.ISO_A2_EH && properties.ISO_A2_EH !== "-99" ? properties.ISO_A2_EH : properties.ADM0_A3);

/** Every country's polygons given to their territories: rings in longitude and latitude, the outer ring first. */
function assign(features) {
  const byTerritory = new Map(TERRITORIES.map((territory) => [territory.key, []]));
  for (const feature of features) {
    const code = codeOf(feature.properties);
    if (!(code in COUNTRIES)) throw new Error(`${code} (${feature.properties.NAME}) is given to no territory; add it to COUNTRIES, or null to leave it off.`);
    const rule = COUNTRIES[code];
    if (rule === null) continue;
    const polygons = (feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates).map((polygon) =>
      polygon.map((ring) => {
        const kept = open(ring);
        // East of the seam: Chukotka's tip and Fiji's eastern islands, which Natural Earth writes west of 180°.
        return withCutPoints(kept.every(([lon]) => lon < -168) ? kept.map(([lon, lat]) => [lon + 360, lat]) : kept);
      }),
    );
    const largest = Math.max(...polygons.map((polygon) => Math.abs(ringArea(polygon[0]))));
    for (const polygon of polygons) {
      const main = Math.abs(ringArea(polygon[0])) === largest;
      const answer = typeof rule === "string" ? rule : rule({ ...centreOf(polygon[0]), main });
      if (answer === null) continue;
      if (typeof answer === "string") {
        byTerritory.get(answer).push({ code, main, rings: polygon });
        continue;
      }
      if (polygon.length > 1) throw new Error(`${code}: a mainland with a hole cannot be cut here.`);
      for (const piece of cutRing(polygon[0], answer.at, answer.into)) byTerritory.get(piece.territory).push({ code, main: true, rings: [piece.ring] });
    }
  }
  return byTerritory;
}

// ——— Merging a territory's countries into one outline ———

const keyOf = ([x, y]) => `${x},${y}`;

/** A ring in map units: projected, rounded, with repeated points and there-and-back spikes taken out. */
function projectRing(ring) {
  const points = [];
  for (const point of ring.map(project)) {
    const last = points.at(-1);
    if (last !== undefined && last[0] === point[0] && last[1] === point[1]) continue;
    points.push(point);
  }
  while (points.length > 1 && keyOf(points[0]) === keyOf(points.at(-1))) points.pop();
  let changed = true;
  while (changed && points.length >= 3) {
    changed = false;
    for (let i = 0; i < points.length; i += 1) {
      const before = points[(i - 1 + points.length) % points.length];
      const after = points[(i + 1) % points.length];
      if (keyOf(before) === keyOf(after)) {
        points.splice(i, 1);
        points.splice(i % points.length, 1);
        changed = true;
        break;
      }
    }
  }
  return points;
}

/** Every directed edge of a territory's rings, the outer rings anticlockwise on screen and holes the other way. */
function edgesOf(rings) {
  const edges = [];
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i += 1) edges.push([ring[i], ring[(i + 1) % ring.length]]);
  }
  return edges;
}

/** Rings orientated alike: an outer ring one way, a hole the other, so that a shared edge is walked in opposite directions. */
function orientated(polygonRings) {
  return polygonRings.map((ring, index) => {
    const positive = ringArea(ring) > 0;
    const wantPositive = index === 0;
    return positive === wantPositive ? ring : [...ring].reverse();
  });
}

/** A territory's outline: its edges with every edge its own pieces share dropped, joined back into rings. */
function mergeOutline(pieces) {
  const all = [];
  for (const piece of pieces) {
    const rings = orientated(piece.rings.map(projectRing).filter((ring) => ring.length >= 3));
    if (rings.length === 0) continue;
    if (!piece.main && Math.abs(ringArea(rings[0])) < LEAST_AREA) continue;
    all.push(...edgesOf(rings));
  }
  const counts = new Map();
  for (const [a, b] of all) counts.set(`${keyOf(a)}>${keyOf(b)}`, (counts.get(`${keyOf(a)}>${keyOf(b)}`) ?? 0) + 1);
  const kept = all.filter(([a, b]) => !counts.has(`${keyOf(b)}>${keyOf(a)}`));
  // Join the edges left into rings, following each edge on from the point it ends at.
  const from = new Map();
  for (const edge of kept) {
    const key = keyOf(edge[0]);
    if (!from.has(key)) from.set(key, []);
    from.get(key).push(edge);
  }
  const used = new Set();
  const rings = [];
  for (const edge of kept) {
    if (used.has(edge)) continue;
    const ring = [];
    let at = edge;
    while (at !== undefined && !used.has(at)) {
      used.add(at);
      ring.push(at[0]);
      at = (from.get(keyOf(at[1])) ?? []).find((next) => !used.has(next));
    }
    if (ring.length >= 3) rings.push(ring);
  }
  return { rings, edges: kept };
}

/** A ring as a compact SVG path: the first point absolute, every other relative, whole units. */
function pathOf(rings) {
  return rings
    .map((ring) => {
      let d = `M${ring[0][0]} ${ring[0][1]}l`;
      let parts = [];
      for (let i = 1; i < ring.length; i += 1) parts.push(`${ring[i][0] - ring[i - 1][0]} ${ring[i][1] - ring[i - 1][1]}`);
      d += parts.join(" ").replace(/ -/g, "-");
      return `${d}z`;
    })
    .join("");
}

function inside([x, y], ring) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function distanceToEdges(point, rings) {
  let least = Infinity;
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i += 1) {
      const [ax, ay] = ring[i];
      const [bx, by] = ring[(i + 1) % ring.length];
      const dx = bx - ax;
      const dy = by - ay;
      const t = dx === 0 && dy === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - ax) * dx + (point[1] - ay) * dy) / (dx * dx + dy * dy)));
      least = Math.min(least, Math.hypot(point[0] - (ax + t * dx), point[1] - (ay + t * dy)));
    }
  }
  return least;
}

/** Where a territory's army counter stands: the point of its largest piece furthest from any edge, found on a fine grid. */
function labelOf(rings) {
  const largest = rings.reduce((best, ring) => (Math.abs(ringArea(ring)) > Math.abs(ringArea(best)) ? ring : best));
  const xs = largest.map(([x]) => x);
  const ys = largest.map(([, y]) => y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const step = Math.max(1, Math.min(x1 - x0, y1 - y0) / 40);
  let best = [Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2)];
  let bestDistance = -1;
  for (let x = x0; x <= x1; x += step) {
    for (let y = y0; y <= y1; y += step) {
      if (!inside([x, y], largest)) continue;
      const distance = distanceToEdges([x, y], [largest]);
      if (distance > bestDistance) {
        bestDistance = distance;
        best = [Math.round(x), Math.round(y)];
      }
    }
  }
  return best;
}

/** The two nearest points of two outlines, for a sea link's dashed line across the strait; `shift` moves the second across the seam. */
function nearest(a, b, shift = 0) {
  let best = null;
  for (const ring of a) {
    for (const p of ring) {
      for (const other of b) {
        for (const q0 of other) {
          const q = [q0[0] + shift, q0[1]];
          const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
          if (best === null || d < best.d) best = { d, p, q };
        }
      }
    }
  }
  return best;
}

/** The least a sea link's dashed line is drawn, in map units: long enough to read as a crossing at a whole-world view, not a dash. */
const LEAST_CROSSING = 64;

/**
 * Islands wholly north of this latitude are drawn but left out of what a view
 * frames: they carry no counter and no link, and counting them made Asia's
 * view as tall as Svalbard to Malaysia, too tall to fill a desk's width.
 */
const FRAME_NORTH = 75;

/** A crossing drawn across the strait, lengthened about its middle to at least `LEAST_CROSSING`, toward `towards` where its two ends touch. */
function crossingLine(p, q, towards) {
  let [dx, dy] = [q[0] - p[0], q[1] - p[1]];
  let length = Math.hypot(dx, dy);
  if (length === 0) {
    [dx, dy] = [towards[0] - p[0], towards[1] - p[1]];
    length = Math.hypot(dx, dy) || 1;
  }
  const half = Math.max(length, LEAST_CROSSING) / 2;
  const [mx, my] = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const [ux, uy] = [dx / length, dy / length];
  return [mx - ux * half, my - uy * half, mx + ux * half, my + uy * half].map(Math.round);
}

// ——— Build ———

const features = (await source()).features;
const assigned = assign(features);
const outlines = TERRITORIES.map((territory) => {
  if (!CONTINENTS.includes(territory.continent)) throw new Error(`${territory.key} is in no continent the rules know.`);
  const pieces = assigned.get(territory.key);
  if (pieces.length === 0) throw new Error(`${territory.key} has no land.`);
  return mergeOutline(pieces);
});

const index = new Map(TERRITORIES.map((territory, at) => [territory.key, at]));
const edgeOwner = new Map();
outlines.forEach((outline, at) => {
  for (const [a, b] of outline.edges) edgeOwner.set(`${keyOf(a)}>${keyOf(b)}`, at);
});
const land = TERRITORIES.map(() => new Set());
const continentBorders = [];
outlines.forEach((outline, at) => {
  for (const [a, b] of outline.edges) {
    const other = edgeOwner.get(`${keyOf(b)}>${keyOf(a)}`);
    if (other === undefined || other === at) continue;
    land[at].add(other);
    // Each border between two continents once, from the side listed first.
    if (TERRITORIES[at].continent !== TERRITORIES[other].continent && at < other) continentBorders.push([a, b]);
  }
});
for (const [at, set] of land.entries()) {
  for (const other of set) if (!land[other].has(at)) throw new Error(`${TERRITORIES[at].key} borders ${TERRITORIES[other].key} but not the other way round.`);
}

const labelFor = (at) => (TERRITORIES[at].label ? project(TERRITORIES[at].label) : labelOf(outlines[at].rings));
const sea = TERRITORIES.map(() => new Set());
const seaLines = [];
const wraps = [];
for (const [a, b, options = {}] of SEA_LINKS) {
  const [i, j] = [index.get(a), index.get(b)];
  if (i === undefined || j === undefined) throw new Error(`Sea link ${a}–${b} names no territory.`);
  if (land[i].has(j)) throw new Error(`${a} and ${b} share a land border already; the sea link is not needed.`);
  sea[i].add(j);
  sea[j].add(i);
  if (options.wrap) {
    // Off the map's west edge from the first, and on at its east edge to the second.
    const across = nearest(outlines[i].rings, outlines[j].rings, -WIDTH);
    seaLines.push([across.p[0], across.p[1], 0, Math.round((across.p[1] + across.q[1]) / 2)]);
    seaLines.push([WIDTH, Math.round((across.p[1] + across.q[1]) / 2), across.q[0] + WIDTH, across.q[1]]);
    wraps.push([i, j, Math.round((across.p[1] + across.q[1]) / 2)]);
  } else if (options.from) {
    const [p, q] = [project(options.from), project(options.to)];
    seaLines.push(crossingLine(p, q, q));
  } else {
    const across = nearest(outlines[i].rings, outlines[j].rings);
    seaLines.push(crossingLine(across.p, across.q, labelFor(j)));
  }
}

const labels = TERRITORIES.map((_, at) => labelFor(at));
const shapes = outlines.map((outline) => pathOf(outline.rings));
/* Each territory's extent, for a view to frame it or its continent: the far northern islands left out (`FRAME_NORTH`). */
const northEdge = project([0, FRAME_NORTH])[1];
const boxes = outlines.map(({ rings }) => {
  const framed = rings.filter((ring) => ring.some(([, y]) => y > northEdge));
  const points = (framed.length > 0 ? framed : rings).flat();
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
});
/* No territory may run more than half the map across: one that does has a piece on the wrong side of the seam. */
boxes.forEach(([left, , right], at) => {
  if (right - left > WIDTH / 2) throw new Error(`${TERRITORIES[at].key} runs from ${left} to ${right}, across half the map; a piece of it is on the wrong side of the seam.`);
});
const bordersPath = continentBorders.map(([a, b]) => `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`).join("");

// No date in the header: the same source makes the same files, so a rebuild that changes nothing shows nothing.
const header = [
  `/*`,
  ` * WRITTEN BY scripts/map.mjs, NEVER BY HAND: run it again to change the map.`,
  ` * From Natural Earth's admin-0 countries at 1:110m, which is in the public domain`,
  ` * (naturalearthdata.com; ${REMOTE}).`,
  ` */`,
];

writeFileSync(
  WORLD_OUT,
  [
    ...header,
    `import type { TenkaTerritoryData } from "./tenka.types.ts";`,
    ``,
    `/** Tenka's forty-two territories in continent order: each one's key, name, continent, and neighbours by land and by sea (indices into this list). */`,
    `export const TENKA_TERRITORY_DATA: readonly TenkaTerritoryData[] = [`,
    ...TERRITORIES.map(
      (territory, at) =>
        `  { key: ${JSON.stringify(territory.key)}, name: ${JSON.stringify(territory.name)}, continent: ${JSON.stringify(territory.continent)}, land: [${[...land[at]].sort((x, y) => x - y).join(", ")}], sea: [${[...sea[at]].sort((x, y) => x - y).join(", ")}] },`,
    ),
    `];`,
    ``,
  ].join("\n"),
);

writeFileSync(
  SHAPES_OUT,
  [
    ...header,
    `import type { TenkaShapes } from "./tenka.types.ts";`,
    ``,
    `/**`,
    ` * How Tenka's world is drawn: Miller's projection from ${-WEST}°W round to ${EAST}°E, ${WIDTH} by ${HEIGHT} units.`,
    ` * One outline per territory, in the order of \`TENKA_TERRITORY_DATA\`; where its army counter stands; its extent; the`,
    ` * sea links' dashed lines; the links that go off one edge and on at the other; and the borders between continents, drawn heavier. Read only by the board in`,
    ` * the browser, so none of it is carried by a page the server renders for the rules.`,
    ` */`,
    `export const TENKA_SHAPES: TenkaShapes = {`,
    `  width: ${WIDTH},`,
    `  height: ${HEIGHT},`,
    `  labels: ${JSON.stringify(labels)},`,
    `  boxes: ${JSON.stringify(boxes)},`,
    `  seaLines: ${JSON.stringify(seaLines)},`,
    `  wraps: ${JSON.stringify(wraps)},`,
    `  continentBorders: ${JSON.stringify(bordersPath)},`,
    `  outlines: [`,
    ...shapes.map((d) => `    ${JSON.stringify(d)},`),
    `  ],`,
    `};`,
    ``,
  ].join("\n"),
);

const size = (path) => readFileSync(path).length;
console.log(`${TERRITORIES.length} territories, ${WIDTH}x${HEIGHT}; ${WORLD_OUT} ${size(WORLD_OUT)} bytes, ${SHAPES_OUT} ${size(SHAPES_OUT)} bytes.`);
for (const [at, territory] of TERRITORIES.entries()) {
  console.log(`${territory.key.padEnd(18)} land ${[...land[at]].map((other) => TERRITORIES[other].key).join(", ")}${sea[at].size ? ` | sea ${[...sea[at]].map((other) => TERRITORIES[other].key).join(", ")}` : ""}`);
}
