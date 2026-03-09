function base64urlDecode(str) { // Helper to decode Base64Url (standard for JWTs) into a string
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - str.length % 4) % 4, '=');
  // Decode base64 and safely handle unicode characters
  return decodeURIComponent(atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
} // end base64urlDecode()

function base64urlToUint8Array(str) { // Helper to decode Base64Url directly into a Uint8Array (needed for crypto signature checking)
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - str.length % 4) % 4, '=');
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
} // end base64urlToUint8Array()

async function verifyCloudflareJWT(jwt, env) { // Cryptographically verifies a Cloudflare Access JWT using native Web Crypto
  try {
    const parts = jwt?.split('.');
    if (!parts || parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    let header, payload;
    try { // Safely attempt to parse the JWT payload. If it's garbage/malformed return null
      header = JSON.parse(base64urlDecode(headerB64));
      payload = JSON.parse(base64urlDecode(payloadB64));
    } catch (parseError) {
      console.warn("[WORKER] Malformed JWT JSON payload ignored.");
      return null;
    }

    // Standard Claims Checks (Expiration and Audience)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn("[WORKER] JWT Expired");
      return null;
    }

    // If you have a specific Audience policy configured, ensure env.CLOUDFLARE_POLICY_AUD is set
    if (env.CLOUDFLARE_POLICY_AUD && payload.aud !== env.CLOUDFLARE_POLICY_AUD && !payload.aud.includes(env.CLOUDFLARE_POLICY_AUD)) {
      console.warn("[WORKER] JWT Audience Mismatch");
      console.warn(`[Worker] \t CLOUDFLARE_POLIC_AUD Configured: ${env.CLOUDFLARE_POLICY_AUD}`);
      console.warn(`[Worker] \t payload.aud sent: ${payload.aud}`);
      return null;
    }

    // Fetch Public Keys (JWKS) from Cloudflare
    // env.CLOUDFLARE_TEAM_DOMAIN should look like: "https://<your-team>.cloudflareaccess.com"
    const certsUrl = `${env.CLOUDFLARE_TEAM_DOMAIN}/cdn-cgi/access/certs`;
    const jwksRes = await fetch(certsUrl);
    if (!jwksRes.ok) {
      const errorText = await jwksRes.text();
      console.warn(`[WORKER] Failed to fetch JWKS keys from ${certsUrl}. Status: ${jwksRes.status}. Response: ${errorText.substring(0, 100)}`);
      return null;
    }
    const jwks = await jwksRes.json();

    // Find the exact key used to sign this token via the 'kid' (Key ID) header
    const jwk = jwks.keys.find(k => k.kid === header.kid);
    if (!jwk) {
      console.warn("[WORKER] JWT Key ID not found in JWKS");
      return null;
    }

    // Import the key into the Web Crypto API
    const key = await crypto.subtle.importKey( 'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'] );

    // Verify the Cryptographic Signature
    const encoder = new TextEncoder();
    const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = base64urlToUint8Array(signatureB64);

    const isValid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, dataToVerify);
    return isValid ? payload : null;

  } catch (error) {
    console.error("[WORKER] JWT Verification Exception:", error);
    return null;
  }
} // end verifyCloudflareJWT()

async function getAuthContext(req, env) { // JWT Authentication Helper: Parses the Cloudflare Access JWT header to extract user context
  let auth = { isAuthenticated: false, email: null, roles: [] };
  try {
    const jwtHeader = req.headers.get('Cf-Access-Jwt-Assertion');

    // Note: The 'localhost' or '127.0.0.1' didn't really work in my testing when I had a custom domain name because the headers reflect that (even if your browser doesn't)
    // Thankfully, Miniflare (wrangler dev) injects 'mf-*' headers. We can use this to detect local dev reliably.
    const isLocalDev = req.headers.has('mf-original-hostname') || req.url.hostname === 'localhost' || req.url.hostname === '127.0.0.1';

    // Another prod option might be: req.headers.get('cf-connecting-ip') || req.headers.get("x-forwarded-for") || '';
    const ip = req.headers.get('cf-connecting-ip') || ''; // Note this is only set when running in Cloudflare
    if (is LocalDev || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '127.0.0.1' || ip === '::1') {
      console.warn("[WORKER] ⚠️ Local IP detected, bypassing JWT auth for dev.");
      console.warn(`[WORKER] ⚠️ Bypassing JWT auth ${jwtHeader}`);
      return { isAuthenticated: true, email: 'testing@example.com', roles: ['admin'] };
    }

    // console.log(`[WORKER] getAuthContext . Checking for jwtHeader: ${jwtHeader ? jwtHeader.substring(0, 10) + '...' : 'No JWT Header'}`);
    // console.log(`[WORKER] getAuthContext called: ${env.CLOUDFLARE_POLICY_AUD}, ${env.CLOUDFLARE_TEAM_DOMAIN}`);
    // console.log(`[WORKER] Headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);
    // console.log(`[WORKER] Request.remote_addr: ${req.headers.get('cf-connecting-ip')}`);
    // console.log(`[WORKER] Request.CF_Authorization: ${req.headers.get('CF_Authorization')}`);

    if (!jwtHeader || !env.CLOUDFLARE_TEAM_DOMAIN) return auth;

    const payload = await verifyCloudflareJWT(jwtHeader, env); // Cryptographically verify and decode the token

    if (payload && payload.email) {
      auth.email = payload.email.toLowerCase();

      if (auth.email.endsWith('@example.com')) { // Validate based on email domain or specific user
        auth.isAuthenticated = true;
        auth.roles.push('admin'); // this is just a 'placeholder' value
      }
    }
  } catch (e) {
    console.error("[WORKER] Error parsing Cloudflare Access JWT:", e);
  }
  return auth;
} // end getAuthContext()
