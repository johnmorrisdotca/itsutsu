import { describe, expect, it } from "vitest";

import { installPlatform } from "./installPlatform";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD_AS_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const PIXEL =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";
const DESKTOP =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

describe("installPlatform", () => {
  it("offers Share, then Add to Home Screen, on an iPhone", () => {
    expect(installPlatform({ userAgent: IPHONE, maxTouchPoints: 5, standalone: false })).toBe("ios");
  });

  it("knows an iPad that calls itself a Mac by its touch screen", () => {
    expect(installPlatform({ userAgent: IPAD_AS_MAC, maxTouchPoints: 5, standalone: false })).toBe("ios");
    expect(installPlatform({ userAgent: IPAD_AS_MAC, maxTouchPoints: 0, standalone: false })).toBeNull();
  });

  it("offers the install prompt on Android", () => {
    expect(installPlatform({ userAgent: PIXEL, maxTouchPoints: 5, standalone: false })).toBe("android");
  });

  it("offers nothing on a desk", () => {
    expect(installPlatform({ userAgent: DESKTOP, maxTouchPoints: 0, standalone: false })).toBeNull();
  });

  it("offers nothing once opened from the home screen", () => {
    expect(installPlatform({ userAgent: IPHONE, maxTouchPoints: 5, standalone: true })).toBeNull();
    expect(installPlatform({ userAgent: PIXEL, maxTouchPoints: 5, standalone: true })).toBeNull();
  });
});
