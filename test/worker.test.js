import { SELF, env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";

// Seed the in-memory D1 database before tests run
beforeAll(async () => {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS links (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      url         TEXT    NOT NULL,
      title       TEXT,
      description TEXT,
      image_url   TEXT,
      status      TEXT    NOT NULL DEFAULT 'unread',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )`
  ).run();

  await env.DB.prepare(
    `INSERT INTO links (url, title, status) VALUES
      ('https://example.com', 'Example', 'unread')`
  ).run();
  await env.DB.prepare(
    `INSERT INTO links (url, title, status) VALUES
      ('https://web.dev', 'Web Dev', 'unread')`
  ).run();
  await env.DB.prepare(
    `INSERT INTO links (url, title, status) VALUES
      ('https://saved.example', 'Saved', 'saved')`
  ).run();
});

describe("GET /api/links", () => {
  it("returns 200 with JSON array of unread links by default", async () => {
    const res = await SELF.fetch("http://example.com/api/links");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    const links = await res.json();
    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBe(2); // only unread
    expect(links[0].status).toBe("unread");
  });

  it("filters by status query param", async () => {
    const res = await SELF.fetch("http://example.com/api/links?status=saved");
    expect(res.status).toBe(200);
    const links = await res.json();
    expect(links.length).toBe(1);
    expect(links[0].title).toBe("Saved");
  });
});

describe("PATCH /api/links/:id", () => {
  it("updates a link status to saved", async () => {
    const res = await SELF.fetch("http://example.com/api/links/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "saved" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("saved");
  });

  it("returns 400 for invalid status", async () => {
    const res = await SELF.fetch("http://example.com/api/links/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "bogus" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent link", async () => {
    const res = await SELF.fetch("http://example.com/api/links/99999", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "deleted" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("GET /proxy", () => {
  it("returns 400 when url param is missing", async () => {
    const res = await SELF.fetch("http://example.com/proxy");
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-http protocols", async () => {
    const res = await SELF.fetch(
      "http://example.com/proxy?url=" + encodeURIComponent("javascript:alert(1)")
    );
    expect(res.status).toBe(400);
  });
});

describe("OPTIONS (CORS preflight)", () => {
  it("returns 204 with CORS headers", async () => {
    const res = await SELF.fetch("http://example.com/api/links", {
      method: "OPTIONS",
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
