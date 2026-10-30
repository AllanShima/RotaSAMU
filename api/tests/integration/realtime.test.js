import { describe, expect, it } from "vitest";

import { useTestApp } from "../helpers.js";

describe("página de teste do tempo real", () => {
  const ctx = useTestApp();

  it("serve o HTML em /realtime-test", async () => {
    const response = await ctx.app.inject({
      method: "GET",
      url: "/realtime-test",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/text\/html/);
    expect(response.body).toContain("/socket.io/socket.io.js");
  });
});
