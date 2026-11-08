// @vitest-environment node
import { describe, expect, it } from "vitest";
import config from "../../next.config";
describe("microphone policy", () => {
  it("enables only the two dictation surfaces while keeping the global policy restrictive", async () => {
    const rules = await config.headers!();
    const policies = rules.flatMap((rule) => rule.headers.filter((header) => header.key === "Permissions-Policy").map((header) => ({ source: rule.source, value: header.value })));
    expect(policies[0]).toEqual({ source: "/(.*)", value: "camera=(self), microphone=(), geolocation=()" });
    expect(policies.filter((rule) => rule.value.includes("microphone=(self)")).map((rule) => rule.source)).toEqual(["/dashboard/games", "/dashboard/sessions/new"]);
  });
});
