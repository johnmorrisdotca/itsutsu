/*
 * WRITTEN BY scripts/map.mjs, NEVER BY HAND: run it again to change the map.
 * From Natural Earth's admin-0 countries at 1:110m, which is in the public domain
 * (naturalearthdata.com; https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson).
 */
import type { TenkaTerritoryData } from "./tenka.types.ts";

/** Tenka's forty-two territories in continent order: each one's key, name, continent, and neighbours by land and by sea (indices into this list). */
export const TENKA_TERRITORY_DATA: readonly TenkaTerritoryData[] = [
  { key: "alaska", name: "Alaska", continent: "northAmerica", land: [1], sea: [31] },
  { key: "westernCanada", name: "Western Canada", continent: "northAmerica", land: [0, 2, 5, 6], sea: [3] },
  { key: "easternCanada", name: "Eastern Canada", continent: "northAmerica", land: [1, 6], sea: [3, 4] },
  { key: "arcticIslands", name: "Arctic Islands", continent: "northAmerica", land: [], sea: [1, 2, 4] },
  { key: "greenland", name: "Greenland", continent: "northAmerica", land: [], sea: [2, 3, 13] },
  { key: "usWest", name: "Western United States", continent: "northAmerica", land: [1, 6, 7], sea: [] },
  { key: "usEast", name: "Eastern United States", continent: "northAmerica", land: [1, 2, 5, 7], sea: [] },
  { key: "mexico", name: "Mexico and Central America", continent: "northAmerica", land: [5, 6, 8], sea: [] },
  { key: "colombia", name: "Colombia and Venezuela", continent: "southAmerica", land: [7, 9, 10], sea: [] },
  { key: "andes", name: "The Andes", continent: "southAmerica", land: [8, 10, 11], sea: [] },
  { key: "brazil", name: "Brazil", continent: "southAmerica", land: [8, 9, 11], sea: [21] },
  { key: "southernCone", name: "Southern Cone", continent: "southAmerica", land: [9, 10], sea: [] },
  { key: "britain", name: "Britain and Ireland", continent: "europe", land: [], sea: [13, 14] },
  { key: "nordic", name: "The Nordic Countries", continent: "europe", land: [15, 18], sea: [4, 12] },
  { key: "westernEurope", name: "Western Europe", continent: "europe", land: [15, 16], sea: [12, 19] },
  { key: "centralEurope", name: "Central Europe", continent: "europe", land: [13, 14, 16, 17, 18], sea: [] },
  { key: "southernEurope", name: "Southern Europe", continent: "europe", land: [14, 15, 17, 26], sea: [19] },
  { key: "easternEurope", name: "Eastern Europe", continent: "europe", land: [15, 16, 18], sea: [] },
  { key: "westernRussia", name: "Western Russia", continent: "europe", land: [13, 15, 17, 26, 28, 30], sea: [] },
  { key: "northAfrica", name: "North Africa", continent: "africa", land: [20, 21, 22], sea: [14, 16] },
  { key: "egypt", name: "Egypt and Sudan", continent: "africa", land: [19, 22, 23, 26], sea: [] },
  { key: "westAfrica", name: "West Africa", continent: "africa", land: [19, 22], sea: [10] },
  { key: "centralAfrica", name: "Central Africa", continent: "africa", land: [19, 20, 21, 23, 24], sea: [] },
  { key: "eastAfrica", name: "East Africa", continent: "africa", land: [20, 22, 24], sea: [25, 27] },
  { key: "southernAfrica", name: "Southern Africa", continent: "africa", land: [22, 23], sea: [25] },
  { key: "madagascar", name: "Madagascar", continent: "africa", land: [], sea: [23, 24] },
  { key: "middleEast", name: "The Middle East", continent: "asia", land: [16, 18, 20, 27, 28, 29], sea: [] },
  { key: "arabia", name: "Arabia", continent: "asia", land: [26], sea: [23] },
  { key: "centralAsia", name: "Central Asia", continent: "asia", land: [18, 26, 29, 30, 33], sea: [] },
  { key: "southAsia", name: "South Asia", continent: "asia", land: [26, 28, 33, 36], sea: [] },
  { key: "siberia", name: "Siberia", continent: "asia", land: [18, 28, 31, 32, 33], sea: [] },
  { key: "farEast", name: "The Russian Far East", continent: "asia", land: [30, 32, 33, 34], sea: [0, 35] },
  { key: "mongolia", name: "Mongolia", continent: "asia", land: [30, 31, 33], sea: [] },
  { key: "china", name: "China", continent: "asia", land: [28, 29, 30, 31, 32, 34, 36], sea: [] },
  { key: "korea", name: "Korea", continent: "asia", land: [31, 33], sea: [35] },
  { key: "japan", name: "Japan", continent: "asia", land: [], sea: [31, 34] },
  { key: "southeastAsia", name: "Southeast Asia", continent: "asia", land: [29, 33, 37], sea: [] },
  { key: "indonesia", name: "Indonesia", continent: "oceania", land: [36, 38], sea: [39] },
  { key: "melanesia", name: "Melanesia", continent: "oceania", land: [37], sea: [40, 41] },
  { key: "westernAustralia", name: "Western Australia", continent: "oceania", land: [40], sea: [37] },
  { key: "easternAustralia", name: "Eastern Australia", continent: "oceania", land: [39], sea: [38, 41] },
  { key: "newZealand", name: "New Zealand", continent: "oceania", land: [], sea: [38, 40] },
];
