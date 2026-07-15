import { describe, expect, it } from "vitest";

import { decideHistoryLoad } from "../history-cache-policy";

describe("decideHistoryLoad", () => {
  it("serves fresh database cache", () => {
    expect(decideHistoryLoad("fresh")).toBe("serve-cache");
  });

  it.each([["stale"], ["miss"], [null]] as const)(
    "refreshes upstream for %s state",
    (state) => {
      expect(decideHistoryLoad(state)).toBe("refresh-upstream");
    },
  );
});
