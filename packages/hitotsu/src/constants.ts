import type { HitotsuColour, HitotsuOptions } from "./types.ts";

/**
 * HOW LONG A GAME OF HITOTSU LASTS, its "size": to 200 or 500 points, or a
 * single hand (1), the party table's game. 500 is the published game's total.
 */
export const HITOTSU_ONE_HAND = 1;
export const HITOTSU_SIZES = [HITOTSU_ONE_HAND, 200, 500] as const;
export const HITOTSU_DEFAULT_SIZE = 500;

/** The four colours in the order a hand sorts them and a picker offers them. */
export const HITOTSU_COLOURS: readonly HitotsuColour[] = ["R", "Y", "G", "B"];

/**
 * The published rules: no stacking, no jumping in, sevens and zeros as plain
 * numbers, one card drawn, a Wild Draw Four that may be challenged, seven
 * cards dealt.
 */
export const HITOTSU_CLASSIC: HitotsuOptions = { stacking: "off", jumpIn: false, sevenZero: false, drawToMatch: false, wildFour: "challenge", deal: 7 };

/**
 * PARTY MODE: the house rules a big table plays by, and a short game — five
 * cards each, one hand, draw cards stacking on any draw card, jumping in, and
 * sevens and zeros moving hands round. Each can still be changed at the set-up.
 */
export const HITOTSU_PARTY: HitotsuOptions = { stacking: "any", jumpIn: true, sevenZero: true, drawToMatch: false, wildFour: "challenge", deal: 5 };

/** What a card left in a hand is worth to the player who went out: its number, twenty an action card, fifty a wild. */
export const HITOTSU_POINTS = { action: 20, wild: 50 } as const;

/** Cards taken for going down to one without calling it, and for a Wild Draw Four challenged and found honest. */
export const HITOTSU_CAUGHT = 2;
export const HITOTSU_CHALLENGE_LOST = 6;

/** The cards in the deck: 25 in each colour and eight wilds. */
export const HITOTSU_DECK_SIZE = 108;
