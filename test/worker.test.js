import { SELF } from "cloudflare:test";
import { expect, it } from "vitest";

it("responds with Hello World", async () => {
  const res = await SELF.fetch("http://example.com/api");
  expect(res.status).toBe(200);
  expect(await res.text()).toBe("Hello World!");
});
