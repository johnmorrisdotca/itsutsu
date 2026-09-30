/**
 * Tenka drawn and played in the browser, in plain DOM: a whole table against
 * the computer (`mountTenka`), and the map on its own (`tenkaMapSvg`, drawn
 * from `tenkaMapModel`). Its own entry, so the rules never carry the map.
 */
export { mountTenka, type TenkaTableHandle, type TenkaTableOptions } from "./ui/mount.ts";
export { NO_MARKS, continentView, nearestLand, tenkaMapModel, type TenkaLand, type TenkaMapModel, type TenkaRing, type TenkaView } from "./ui/mapModel.ts";
export { TENKA_NEUTRAL_COLOUR, TENKA_SEAT_COLOURS, ownerColour } from "./ui/colours.ts";
export { tenkaMapSvg } from "./ui/svg.ts";
export { TENKA_STYLE } from "./ui/style.ts";
