// /api/verify-access.js
//
// Validates a one-time password. On success it burns the code (single
// use, enforced atomically via Redis GETDEL) and issues a short-lived
// signed session cookie, used only to fetch the video URL from
// /api/video-url. Nothing about the video itself lives here.
//
// Required environment variables:
//   KV_REST_API_URL
//   KV_REST_API_TOKEN
//   SESSION_SECRET      any long random string you generate once

async function redis(...args) {
  const res = await fetch(process.env.KV_REST_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64url(str) {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function POST(request) {
  let email, code;
  try {
    const body = await request.json();
    email = String(body.email || "").trim().toLowerCase();
    code = String(body.code || "").trim().toUpperCase();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  if (!email || !code) {
    return new Response(JSON.stringify({ error: "Email and code are required." }), { status: 400 });
  }

  // Rate limit verification attempts separately from requests, to slow
  // down brute-forcing a valid code for a known email.
  const rlKey = `portfolio:rl:verify:${email}`;
  const attempts = await redis("INCR", rlKey);
  if (attempts === 1) {
    await redis("EXPIRE", rlKey, "900");
  }
  if (attempts > 8) {
    return new Response(JSON.stringify({ error: "Too many attempts. Request a new code." }), { status: 429 });
  }

  // GETDEL: fetch and delete in one atomic step, so two near-simultaneous
  // requests can never both succeed against the same code.
  const storedHash = await redis("GETDEL", `portfolio:otp:${email}`);

  if (!storedHash) {
    await redis(
      "LPUSH",
      "portfolio:accesslog",
      JSON.stringify({ email, event: "verify_failed_expired", at: new Date().toISOString() })
    );
    return new Response(JSON.stringify({ error: "That code has expired or was already used. Request a new one." }), { status: 401 });
  }

  const providedHash = await sha256(code);

  if (providedHash !== storedHash) {
    await redis(
      "LPUSH",
      "portfolio:accesslog",
      JSON.stringify({ email, event: "verify_failed_wrong_code", at: new Date().toISOString() })
    );
    return new Response(JSON.stringify({ error: "Incorrect code." }), { status: 401 });
  }

  // Success -- issue a short-lived signed session (10 minutes), just
  // long enough to load the portfolio and start the video once.
  const exp = Date.now() + 10 * 60 * 1000;
  const payload = `${email}|${exp}`;
  const signature = await hmac(payload);
  const token = `${base64url(payload)}.${signature}`;

  await redis(
    "LPUSH",
    "portfolio:accesslog",
    JSON.stringify({ email, event: "verified", at: new Date().toISOString() })
  );

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `portfolio_session=${token}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Strict`,
    },
  });
}
