/**
 * Cloudflare Pages Function: /api/subscribe
 *
 * POST  — subscribe { name?, email, county?, role?, source? }
 * GET   — ?action=confirm|unsubscribe&email=<email>&token=<token>
 *
 * Integrated 2026-11-11 (Carolina PFAS Weekly). Design rules:
 * 1. ZERO SILENT LOSS: a signup is only reported as successful after at
 *    least one durable backend confirms storage (Cloudflare D1
 *    `SUBSCRIBERS_D1`, Cloudflare KV `SUBSCRIBERS_KV`, Buttondown API,
 *    or Resend Audiences). If none is wired or all fail, the endpoint
 *    returns HTTP 503 — it never fakes success.
 * 2. DOUBLE OPT-IN: locally stored records start as
 *    "pending_confirmation" with a random per-record token; the GET
 *    confirm action flips them to "confirmed". When Buttondown is the
 *    storing backend, Buttondown runs its own confirmation flow.
 * 3. NO HARDCODED SECRETS: tokens are cryptographically random values
 *    stored server-side and compared on use. There is no fallback
 *    signing secret anywhere in this file.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KVNamespace = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type D1Database = any;

interface Env {
  SUBSCRIBERS_KV?: KVNamespace;
  SUBSCRIBERS_D1?: D1Database;
  BUTTONDOWN_API_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_AUDIENCE_ID?: string;
}

interface SubscribeBody {
  name?: string;
  email?: string;
  county?: string;
  role?: string;
  source?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const NEWSLETTER_NAME = "Carolina PFAS Weekly";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function htmlPage(title: string, message: string): Response {
  const body = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — ${NEWSLETTER_NAME}</title></head>
<body style="font-family:system-ui,sans-serif;background:#0b0f0e;color:#e8ecea;margin:0;padding:48px 20px;">
<main style="max-width:560px;margin:0 auto;background:#121715;border:1px solid #26302b;border-radius:16px;padding:36px;">
<h1 style="font-size:22px;margin:0 0 12px;">${title}</h1>
<p style="line-height:1.6;color:#b9c4bf;">${message}</p>
<p style="margin-top:24px;"><a href="https://tossonanalytics.com/regulatory-watch" style="color:#34d399;">Return to Tosson Environmental Analytics</a></p>
</main></body></html>`;
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface SubscriberRecord {
  email: string;
  name: string | null;
  county: string | null;
  role: string | null;
  source: string;
  status: string;
  created_at: string;
  updated_at: string;
  confirm_token: string;
  unsubscribe_token: string;
}

async function d1Get(env: Env, email: string): Promise<SubscriberRecord | null> {
  if (!env.SUBSCRIBERS_D1) return null;
  const row = await env.SUBSCRIBERS_D1.prepare(
    "SELECT email, name, county, role, source, status, created_at, updated_at, confirm_token, unsubscribe_token FROM subscribers WHERE email = ?1"
  )
    .bind(email)
    .first();
  return (row as SubscriberRecord) ?? null;
}

async function d1Upsert(env: Env, rec: SubscriberRecord): Promise<void> {
  await env.SUBSCRIBERS_D1.prepare(
    `INSERT INTO subscribers (email, name, county, role, source, status, created_at, updated_at, confirm_token, unsubscribe_token)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
     ON CONFLICT(email) DO UPDATE SET
       name = COALESCE(?2, subscribers.name),
       county = COALESCE(?3, subscribers.county),
       role = COALESCE(?4, subscribers.role),
       status = ?6,
       updated_at = ?8,
       confirm_token = ?9,
       unsubscribe_token = ?10`
  )
    .bind(
      rec.email,
      rec.name,
      rec.county,
      rec.role,
      rec.source,
      rec.status,
      rec.created_at,
      rec.updated_at,
      rec.confirm_token,
      rec.unsubscribe_token
    )
    .run();
}

async function kvGet(env: Env, email: string): Promise<SubscriberRecord | null> {
  if (!env.SUBSCRIBERS_KV) return null;
  const raw = await env.SUBSCRIBERS_KV.get(`sub:${email}`);
  return raw ? (JSON.parse(raw) as SubscriberRecord) : null;
}

async function kvPut(env: Env, rec: SubscriberRecord): Promise<void> {
  await env.SUBSCRIBERS_KV.put(`sub:${rec.email}`, JSON.stringify(rec));
}

async function findRecord(env: Env, email: string): Promise<SubscriberRecord | null> {
  return (await d1Get(env, email)) ?? (await kvGet(env, email));
}

async function saveRecord(env: Env, rec: SubscriberRecord): Promise<void> {
  if (env.SUBSCRIBERS_D1) await d1Upsert(env, rec);
  if (env.SUBSCRIBERS_KV) await kvPut(env, rec);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim().slice(0, 120);
  const county = (body.county ?? "").trim().slice(0, 60);
  const role = (body.role ?? "").trim().slice(0, 60);
  const source = (body.source ?? "regulatory-watch").trim().slice(0, 120);

  if (!email || !EMAIL_REGEX.test(email)) {
    return json({ error: "A valid email address is required." }, 422);
  }

  const now = new Date().toISOString();
  const existing = await findRecord(env, email).catch(() => null);
  const record: SubscriberRecord = {
    email,
    name: name || existing?.name || null,
    county: county || existing?.county || null,
    role: role || existing?.role || null,
    source,
    status: existing?.status === "confirmed" ? "confirmed" : "pending_confirmation",
    created_at: existing?.created_at || now,
    updated_at: now,
    confirm_token: existing?.confirm_token || randomToken(),
    unsubscribe_token: existing?.unsubscribe_token || randomToken(),
  };

  const stored: string[] = [];
  const errors: string[] = [];

  if (env.SUBSCRIBERS_D1) {
    try {
      await d1Upsert(env, record);
      stored.push("cloudflare_d1");
    } catch (err) {
      errors.push(`d1: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (env.SUBSCRIBERS_KV) {
    try {
      await kvPut(env, record);
      stored.push("cloudflare_kv");
    } catch (err) {
      errors.push(`kv: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (env.BUTTONDOWN_API_KEY) {
    try {
      const tags = ["tossonanalytics-web"];
      if (county) tags.push(`county:${county.toLowerCase().replace(/\s+/g, "-")}`);
      if (role) tags.push(`role:${role.toLowerCase().replace(/\s+/g, "-")}`);
      const res = await fetch("https://api.buttondown.com/v1/subscribers", {
        method: "POST",
        headers: {
          Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
          "Content-Type": "application/json",
          "User-Agent": "TossonAnalytics-Subscribe/1.1 (+https://tossonanalytics.com)",
        },
        body: JSON.stringify({
          email_address: email,
          notes: name ? `Name: ${name} | Source: ${source}` : `Source: ${source}`,
          tags,
          metadata: {
            name: name || "",
            nc_county: county || "",
            stakeholder_role: role || "",
            signup_source: source,
          },
        }),
      });
      if (res.ok) {
        stored.push("buttondown");
      } else {
        const text = await res.text();
        if (res.status === 400 && /already/i.test(text)) {
          stored.push("buttondown_existing");
        } else {
          errors.push(`buttondown (${res.status}): ${text.slice(0, 160)}`);
        }
      }
    } catch (err) {
      errors.push(`buttondown: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (env.RESEND_API_KEY && env.RESEND_AUDIENCE_ID) {
    try {
      const [firstName, ...rest] = (name || "").split(" ");
      const res = await fetch(
        `https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            first_name: firstName || undefined,
            last_name: rest.join(" ") || undefined,
            unsubscribed: false,
          }),
        }
      );
      if (res.ok) stored.push("resend");
      else errors.push(`resend (${res.status})`);
    } catch (err) {
      errors.push(`resend: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // CRITICAL GUARDRAIL: never report success for a signup nothing stored.
  if (stored.length === 0) {
    console.error("[subscribe] no backend stored signup", { errors });
    return json(
      {
        error:
          "Subscriptions are temporarily unavailable. Please try again later, or email temitope.soneye@tossonllc.com to be added directly.",
      },
      503
    );
  }

  return json(
    {
      success: true,
      status: record.status,
      message:
        record.status === "confirmed"
          ? "You are already subscribed — thank you."
          : `Thank you — please check your inbox to confirm your subscription to ${NEWSLETTER_NAME}.`,
      stored_in: stored,
    },
    201
  );
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "";
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
  const token = url.searchParams.get("token") ?? "";

  if (action !== "confirm" && action !== "unsubscribe") {
    return json({ error: "Unsupported action." }, 400);
  }
  if (!email || !token) {
    return htmlPage("Link incomplete", "This link is missing its email or token. Please use the link exactly as it appears in your email.");
  }

  const hasLocalStore = Boolean(env.SUBSCRIBERS_D1 || env.SUBSCRIBERS_KV);
  if (!hasLocalStore) {
    return htmlPage(
      "Managed by email",
      "Your subscription is managed through our email provider — please use the confirmation or unsubscribe link in the most recent email from " +
        NEWSLETTER_NAME +
        "."
    );
  }

  const record = await findRecord(env, email).catch(() => null);
  if (!record) {
    return htmlPage("Not found", "We could not find a subscription for that email address.");
  }

  const expected = action === "confirm" ? record.confirm_token : record.unsubscribe_token;
  if (token !== expected) {
    return htmlPage("Invalid link", "This link does not match our records. It may have already been used or replaced by a newer one.");
  }

  record.status = action === "confirm" ? "confirmed" : "unsubscribed";
  record.updated_at = new Date().toISOString();
  await saveRecord(env, record);

  return action === "confirm"
    ? htmlPage("Subscription confirmed", `Welcome aboard — your subscription to ${NEWSLETTER_NAME} is confirmed. The next issue arrives Monday at 7:30 AM ET.`)
    : htmlPage("Unsubscribed", `You have been unsubscribed from ${NEWSLETTER_NAME}. No further issues will be sent to this address.`);
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};
