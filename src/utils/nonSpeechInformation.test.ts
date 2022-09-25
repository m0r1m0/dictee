import "jest";
import { isNSI, removeNSI } from "./nonSpeechInformation";

describe("isNSI()", () => {
  test("MusicはNSI", () => {
    const subs = [
      "[♪♪♪]",
      "(SOUS LE CIEL DE PARIS PLAYING ON GRAMOPHONE)",
      "[vivacious, sparkling melody continues]",
      "♪ Searchin’ for light in the darkness ♪",
    ];
    subs.forEach((sub) => {
      const result = isNSI(sub);
      expect(result).toBe(true);
    });
  });
});

describe("removeNSI()", () => {
  test("全文NSIのとき空文字になること", () => {
    const sub = "[♪♪♪]";
    const result = removeNSI(sub);
    expect(result).toBe("");
  });
  test("Speaker Identifierは除外されること", () => {
    const subs = [
      ["[as Fuzzy] I'M NOT SURE", "I'M NOT SURE"],
      ["BOND: Have you got him?", "Have you got him?"],
      ["(all) OHHH!", "OHHH!"],
    ];

    subs.forEach(([text, expected]) => {
      const result = removeNSI(text);
      expect(result).toBe(expected);
    });
  });
  test("Paralanguageは除外されること", () => {
    const subs = [
      ["NEW CAPTAIN ALERT. [laughs]", "NEW CAPTAIN ALERT."]
    ];
    subs.forEach(([text, expected]) => {
      const result = removeNSI(text);
      expect(result).toBe(expected);
    });
  })
});
