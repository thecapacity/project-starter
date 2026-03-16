/**
 * Link Surfer Worker
 *
 * API routes:
 *   GET  /api/links           — list links (default: status=unread)
 *   PATCH /api/links/:id      — update link status
 *   GET  /proxy?url=<encoded> — proxy a URL, stripping iframe-blocking headers
 *
 * Everything else falls through to CF Assets (the Vite-built static site).
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

// --- API: GET /api/links ---
async function handleGetLinks(request, env) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "unread";

  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM links WHERE status = ? ORDER BY id ASC"
    )
      .bind(status)
      .all();
    return json(results);
  } catch (e) {
    // Table may not exist yet (e.g. before first migration)
    return json([]);
  }
}

// --- API: PATCH /api/links/:id ---
async function handlePatchLink(request, env, id) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const allowed = ["unread", "saved", "deleted"];
  if (!body.status || !allowed.includes(body.status)) {
    return json({ error: `status must be one of: ${allowed.join(", ")}` }, 400);
  }

  try {
    const result = await env.DB.prepare(
      "UPDATE links SET status = ?, updated_at = datetime('now') WHERE id = ?"
    )
      .bind(body.status, id)
      .run();

    if (result.meta.changes === 0) {
      return json({ error: "Link not found" }, 404);
    }
    return json({ ok: true, id, status: body.status });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// --- Proxy: GET /proxy?url=<encoded> ---
// Fetches the target URL and strips X-Frame-Options / CSP headers so the
// page can be embedded in an iframe. Injects <base href> to fix relative URLs.
async function handleProxy(request) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return new Response("Invalid url parameter", { status: 400 });
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return new Response("Only http/https URLs are supported", { status: 400 });
  }

  let upstream;
  try {
    upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LinkSurfer/1.0; +https://github.com/thecapacity/project-starter)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });
  } catch (e) {
    return new Response(`Failed to fetch upstream: ${e.message}`, {
      status: 502,
    });
  }

  // Build response headers, stripping anything that blocks iframe embedding
  const headers = new Headers();
  for (const [k, v] of upstream.headers.entries()) {
    const lower = k.toLowerCase();
    if (
      lower === "x-frame-options" ||
      lower === "content-security-policy" ||
      lower === "content-security-policy-report-only"
    ) {
      continue; // drop these
    }
    headers.set(k, v);
  }

  const contentType = upstream.headers.get("Content-Type") || "";

  if (contentType.includes("text/html")) {
    let html = await upstream.text();

    // Inject <base href> so relative URLs resolve against the original origin
    const base = `${parsed.protocol}//${parsed.host}`;
    const baseTag = `<base href="${base}/">`;

    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>${baseTag}`);
    } else if (html.includes("<HEAD>")) {
      html = html.replace("<HEAD>", `<HEAD>${baseTag}`);
    } else {
      html = baseTag + html;
    }

    headers.set("Content-Type", "text/html; charset=utf-8");
    return new Response(html, { status: upstream.status, headers });
  }

  // Non-HTML: stream through as-is
  return new Response(upstream.body, { status: upstream.status, headers });
}

// --- Router ---
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Proxy endpoint
    if (pathname === "/proxy" && method === "GET") {
      return handleProxy(request);
    }

    // API: list links
    if (pathname === "/api/links" && method === "GET") {
      return handleGetLinks(request, env);
    }

    // API: update link status — PATCH /api/links/:id
    const patchMatch = pathname.match(/^\/api\/links\/(\d+)$/);
    if (patchMatch && method === "PATCH") {
      return handlePatchLink(request, env, parseInt(patchMatch[1], 10));
    }

    // Serve static assets (Vite build output in _site/)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
};
