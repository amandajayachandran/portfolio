// /api/request-access.js
//
// Issues a one-time password (OTP) to an allowlisted email address.
// Nothing here trusts the browser: the allowlist check, OTP generation,
// hashing, storage, and rate limiting all happen server-side, using
// Upstash Redis (via its REST API) and Resend for delivery.
//
// Required environment variables (set in Vercel -> Project -> Settings ->
// Environment Variables):
//   KV_REST_API_URL
//   KV_REST_API_TOKEN
//   RESEND_API_KEY
//   FROM_EMAIL          e.g. "portfolio@amandajayachandran.com"

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

function generateCode() {
  // Unambiguous alphabet -- no 0/O, 1/I/L -- 8 characters, cryptographically random.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const GENERIC_MESSAGE =
  "If that email is approved for access, a one-time code has been sent.";

export async function POST(request) {
  let email;
  try {
    const body = await request.json();
    email = String(body.email || "").trim().toLowerCase();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "Enter a valid email address." }), { status: 400 });
  }

  // Rate limit: max 5 code requests per email per hour, so this endpoint
  // can't be used to spam a stranger's inbox repeatedly.
  const rlKey = `portfolio:rl:request:${email}`;
  const attempts = await redis("INCR", rlKey);
  if (attempts === 1) {
    await redis("EXPIRE", rlKey, "3600");
  }
  if (attempts > 5) {
    return new Response(
      JSON.stringify({ error: "Too many requests for this email. Try again in an hour." }),
      { status: 429 }
    );
  }

  const isAllowed = await redis("SISMEMBER", "portfolio:allowlist", email);

  if (isAllowed) {
    const code = generateCode();
    const hash = await sha256(code);

    // 15-minute expiry, single key per email (requesting a new code
    // before using the old one simply overwrites it -- only the latest
    // code is ever valid).
    await redis("SET", `portfolio:otp:${email}`, hash, "EX", "900");

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL,
        to: email,
        subject: "Your one-time access code",
        text:
          `Your one-time access code is: ${code}\n\n` +
          `This code expires in 15 minutes and can only be used once. ` +
          `If you didn't request this, you can safely ignore this email.`,
      }),
    });

    await redis(
      "LPUSH",
      "portfolio:accesslog",
      JSON.stringify({ email, event: "code_requested", at: new Date().toISOString() })
    );
    await redis("LTRIM", "portfolio:accesslog", "0", "499");
  }

  // Identical response whether or not the email was on the allowlist --
  // otherwise this endpoint becomes a way to test which emails are approved.
  return new Response(JSON.stringify({ ok: true, message: GENERIC_MESSAGE }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
