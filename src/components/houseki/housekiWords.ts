import type { Speaker } from "@/lib/i18n/i18n";
import { CAMPAIGN_KEYS } from "@/lib/houseki/housekiKeys";
import type { HousekiCampaign, HousekiRequest } from "@/lib/houseki/houseki.types";

/** A campaign's name in the reader's language: "Classic", "Shizen", "Arashi". */
export function campaignName(say: Speaker, campaign: HousekiCampaign): string {
  return say.say(CAMPAIGN_KEYS[campaign]);
}

/** What a request is, in a few words, for a card, a line and a title: "Level 7", "Shizen level 3", "Lesson 2", "Daily", "Free game". */
export function requestWords(say: Speaker, request: HousekiRequest): string {
  if (request.kind === "daily") return say.say("houseki.what.daily");
  if (request.kind === "lesson") return say.say("houseki.what.lesson", { number: say.number(request.number) });
  if (request.kind === "free") return say.say("houseki.what.free");
  return request.campaign === "classic"
    ? say.say("puzzle.level.number", { number: say.number(request.number) })
    : say.say("houseki.what.campaignLevel", { campaign: campaignName(say, request.campaign), number: say.number(request.number) });
}
