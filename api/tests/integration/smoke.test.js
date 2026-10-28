import { describe, expect, it } from "vitest";

import { createDriver, useTestApp } from "../helpers.js";

describe("test setup", () => {
  const ctx = useTestApp();

  const listDrivers = () => ctx.app.inject({ method: "GET", url: "/drivers" });

  it("starts with an empty database", async () => {
    const response = await listDrivers();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it("sees records created by the factories", async () => {
    await createDriver();

    const response = await listDrivers();

    expect(response.json()).toHaveLength(1);
  });

  it("cleans the database between tests", async () => {
    const response = await listDrivers();

    expect(response.json()).toEqual([]);
  });
});
