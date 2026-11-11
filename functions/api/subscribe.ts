/**
 * Cloudflare Pages Function: POST /api/subscribe
 *
 * Accepts { name, email } and appends the subscriber to
 * ~/knowledge/subscribers.json on the server filesystem.
 *
 * NOTE: On Cloudflare Pages the runtime is edge/Workers and has no
 * direct filesystem access. This function stores subscribers in a
 * Cloudflare KV namespace (SUBSCRIBERS_KV). If no storage backend is
 * wired, it returns 503 — it must never report success for a signup
 * it did not durably store (fixed 2026-11-11; previously it returned
 * success regardless, silently losing signups).
 *
 * Local dev: the function runs via `wrangler pages dev` and will
 * attempt to write to the local JSON file if the KV binding is absent.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KVNamespace = any;

interface Env {
  SUBSCRIBERS_KV?: KVNamespace;
}

interface SubscribeBody {
  name?: string;
  email?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  let body: SubscribeBody;
  try {
    body = await request.json() as SubscribeBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: corsHeaders }
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const name  = (body.name  ?? "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(
      JSON.stringify({ error: "A valid email address is required." }),
      { status: 400, headers: corsHeaders }
    );
  }

  const subscriber = {
    name,
    email,
    subscribed_at: new Date().toISOString(),
    source: "regulatory-watch",
  };

  // Zero silent loss: if no durable storage backend is wired, fail
  // honestly instead of reporting a success that stored nothing.
  if (!env.SUBSCRIBERS_KV) {
    return new Response(
      JSON.stringify({
        error:
          "Subscriptions are temporarily unavailable. Please try again later.",
      }),
      { status: 503, headers: corsHeaders }
    );
  }

  const key = `subscriber:${email}`;
  const existing = await env.SUBSCRIBERS_KV.get(key);
  if (existing) {
    // Already subscribed — still return success
    return new Response(
      JSON.stringify({ success: true, already_subscribed: true }),
      { status: 200, headers: corsHeaders }
    );
  }
  await env.SUBSCRIBERS_KV.put(key, JSON.stringify(subscriber));

  return new Response(
    JSON.stringify({ success: true }),
    { status: 201, headers: corsHeaders }
  );
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
