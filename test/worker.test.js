import { SELF } from "cloudflare:test";
import { expect, it, describe } from "vitest";

describe("gatekeeper", () => {
  it("redirects /gk-confirm to target and sets cookie", async () => {
    const res = await SELF.fetch("http://example.com/gk-confirm?next=%2Fprotected%2Fsample.html", {
      redirect: "manual",
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/protected/sample.html");
    expect(res.headers.get("Set-Cookie")).toContain("gk_visited=1");
  });

  it("rejects /gk-confirm with an external redirect target", async () => {
    const res = await SELF.fetch("http://example.com/gk-confirm?next=https%3A%2F%2Fevil.com%2F");
    expect(res.status).toBe(400);
  });

  it("shows gatekeeper page on direct access to /protected/ (no cookie, no referer)", async () => {
    const res = await SELF.fetch("http://example.com/protected/sample.html");
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Confirm direct access");
    expect(body).toContain("/protected/sample.html");
    expect(body).toContain("/gk-confirm");
  });

  it("allows access to /protected/ when gk_visited cookie is present", async () => {
    const res = await SELF.fetch("http://example.com/protected/sample.html", {
      headers: { Cookie: "gk_visited=1" },
    });
    // Worker passes through to ASSETS — in the test environment this will be
    // a 404 (no _site/ built), but the gatekeeper page must NOT be returned.
    const body = await res.text();
    expect(body).not.toContain("Confirm direct access");
  });

  it("allows access to /protected/ with a same-origin Referer", async () => {
    const res = await SELF.fetch("http://example.com/protected/sample.html", {
      headers: { Referer: "http://example.com/" },
    });
    const body = await res.text();
    expect(body).not.toContain("Confirm direct access");
  });

  it("blocks access to /protected/ with a cross-origin Referer", async () => {
    const res = await SELF.fetch("http://example.com/protected/sample.html", {
      headers: { Referer: "https://other-site.com/" },
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Confirm direct access");
  });
});
