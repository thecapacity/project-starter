/**
 * Gatekeeper Pattern (W3C SVR2 / SVR3)
 *
 * Protects resources under /protected/ from direct access.
 * A visitor is considered "authorized" if they have either:
 *   1. A same-site Referer header (they navigated here from your site), OR
 *   2. A gk_visited cookie (set when they visited the index page)
 *
 * Direct access without either shows a gatekeeper confirmation page.
 * Confirming sets the cookie and redirects to the requested file.
 *
 * Protected file storage (choose one — see serveProtectedFile below):
 *   A) R2 bucket  — bind an R2 bucket as env.FILES in wrangler.jsonc
 *   B) External proxy — set env.EXTERNAL_FILES_ORIGIN to your upstream host
 *   C) Static assets — drop files in site/protected/ (dev/demo only)
 */

const COOKIE_NAME = 'gk_visited';
const COOKIE_MAX_AGE = 3600; // 1 hour
const PROTECTED_PREFIX = '/protected/';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── Gatekeeper confirmation endpoint ─────────────────────────────────────
    // User clicked "Yes, take me there" on the gatekeeper page.
    // Set the access cookie and redirect to the original target.
    if (path === '/gk-confirm') {
      const next = url.searchParams.get('next') || '/';

      // Safety: only allow same-origin redirects
      let target;
      try {
        target = new URL(next, url.origin);
      } catch {
        return new Response('Bad redirect target', { status: 400 });
      }
      if (target.origin !== url.origin) {
        return new Response('Redirect target must be same origin', { status: 400 });
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: target.pathname + target.search,
          'Set-Cookie': buildCookie(COOKIE_NAME, '1', COOKIE_MAX_AGE),
        },
      });
    }

    // ── Protected paths ───────────────────────────────────────────────────────
    if (path.startsWith(PROTECTED_PREFIX)) {
      const authorized = isAuthorized(request, url);

      if (!authorized) {
        return gatekeeperResponse(path);
      }

      return serveProtectedFile(request, env, path);
    }

    // ── Public paths ──────────────────────────────────────────────────────────
    // Serve static assets normally.
    // On the index page, also set the gk_visited cookie so that subsequent
    // navigation to protected paths is recognized as same-site intent (SVR2).
    const assetResponse = await env.ASSETS.fetch(request);

    if (path === '/' || path === '/index.html') {
      const res = new Response(assetResponse.body, assetResponse);
      res.headers.append('Set-Cookie', buildCookie(COOKIE_NAME, '1', COOKIE_MAX_AGE));
      return res;
    }

    return assetResponse;
  },
};

// ── Authorization check ───────────────────────────────────────────────────────

function isAuthorized(request, url) {
  // Check 1: cookie set from a prior index-page visit (SVR2)
  const cookies = request.headers.get('Cookie') ?? '';
  const hasCookie = cookies.split(';').some(c => c.trim().startsWith(`${COOKIE_NAME}=`));
  if (hasCookie) return true;

  // Check 2: Referer is from the same origin (SVR3)
  const referer = request.headers.get('Referer') ?? '';
  try {
    return new URL(referer).origin === url.origin;
  } catch {
    return false;
  }
}

// ── Serve protected file ──────────────────────────────────────────────────────

async function serveProtectedFile(request, env, path) {
  // Option A: R2 bucket
  // Bind an R2 bucket named FILES in wrangler.jsonc.
  // The R2 key is the path with the /protected/ prefix removed.
  if (env.FILES) {
    const key = path.slice(PROTECTED_PREFIX.length);
    const object = await env.FILES.get(key);
    if (!object) return new Response('Not found', { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    // Prevent downstream caches from storing gated content
    headers.set('Cache-Control', 'private, no-store');
    return new Response(object.body, { headers });
  }

  // Option B: Proxy to an external origin
  // Set EXTERNAL_FILES_ORIGIN = "https://files.example.com" in wrangler.jsonc vars.
  // The path under /protected/ is forwarded as-is to the upstream host.
  if (env.EXTERNAL_FILES_ORIGIN) {
    const upstreamUrl = env.EXTERNAL_FILES_ORIGIN + path.slice(PROTECTED_PREFIX.length - 1);
    const upstream = await fetch(upstreamUrl, {
      headers: { 'User-Agent': 'CF-Gatekeeper/1.0' },
    });
    // Strip any upstream Set-Cookie headers so our cookie is the authority
    const res = new Response(upstream.body, upstream);
    res.headers.delete('Set-Cookie');
    res.headers.set('Cache-Control', 'private, no-store');
    return res;
  }

  // Option C: Static assets in _site/protected/ (dev / demo fallback)
  return env.ASSETS.fetch(request);
}

// ── Gatekeeper HTML response ──────────────────────────────────────────────────

function gatekeeperResponse(targetPath) {
  const confirmUrl = `/gk-confirm?next=${encodeURIComponent(targetPath)}`;
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Access</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: system-ui, sans-serif;
      background: #f8f9fa;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 10px;
      padding: 2rem 2.5rem;
      max-width: 480px;
      width: 100%;
    }
    h1 { font-size: 1.25rem; margin: 0 0 0.75rem; }
    .path {
      font-family: monospace;
      font-size: 0.9em;
      background: #f1f3f5;
      padding: 0.2em 0.5em;
      border-radius: 4px;
      word-break: break-all;
    }
    p { margin: 0.5rem 0; color: #495057; line-height: 1.5; }
    .actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; flex-wrap: wrap; }
    .btn {
      display: inline-block;
      padding: 0.5rem 1.25rem;
      border-radius: 6px;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
    }
    .btn-primary { background: #0070f3; color: #fff; }
    .btn-primary:hover { background: #0051bb; }
    .btn-secondary { background: #e9ecef; color: #343a40; }
    .btn-secondary:hover { background: #dee2e6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Confirm direct access</h1>
    <p>You are attempting to open <span class="path">${escapeHtml(targetPath)}</span> directly.</p>
    <p>
      This resource is normally reached by navigating from the main site.
      If you arrived here via a bookmark or an external link, you can still
      proceed — or return to the homepage to start from there.
    </p>
    <div class="actions">
      <a href="${escapeHtml(confirmUrl)}" class="btn btn-primary">Yes, take me there</a>
      <a href="/" class="btn btn-secondary">Go to homepage</a>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildCookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; SameSite=Strict; HttpOnly; Max-Age=${maxAge}`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
