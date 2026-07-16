import { describe, expect, it, vi } from "vitest";

import { startOperationTimer } from "../timing";

describe("startOperationTimer", () => {
  it("returns elapsed milliseconds", () => {
    const now = vi
      .spyOn(performance, "now")
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(245.4);

    const finish = startOperationTimer();

    expect(finish()).toBe(145);

    now.mockRestore();
  });
});
