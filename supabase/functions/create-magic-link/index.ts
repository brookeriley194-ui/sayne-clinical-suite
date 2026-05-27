// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function toHex(bytes: Uint8Array) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const { protocol_id, patient_name, patient_email, expiry } = body as {
      protocol_id?: string; patient_name?: string; patient_email?: string;
      expiry?: "7d" | "30d" | "never";
    };

    if (!protocol_id || !patient_name || patient_name.trim().length === 0) {
      return json({ error: "protocol_id and patient_name are required" }, 400);
    }
    if (patient_name.length > 200) return json({ error: "patient_name too long" }, 400);
    if (patient_email && patient_email.length > 320) return json({ error: "patient_email too long" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // verify protocol belongs to doctor
    const { data: proto, error: pErr } = await admin
      .from("protocols").select("id, doctor_id").eq("id", protocol_id).maybeSingle();
    if (pErr || !proto) return json({ error: "Protocol not found" }, 404);
    if (proto.doctor_id !== userId) return json({ error: "Forbidden" }, 403);

    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = toHex(tokenBytes);

    let expires_at: string | null = null;
    if (expiry === "7d") expires_at = new Date(Date.now() + 7 * 864e5).toISOString();
    else if (expiry === "30d") expires_at = new Date(Date.now() + 30 * 864e5).toISOString();

    const { error: insErr } = await admin.from("patient_links").insert({
      protocol_id, doctor_id: userId,
      patient_name: patient_name.trim(),
      patient_email: patient_email?.trim() || null,
      token, expires_at,
    });
    if (insErr) return json({ error: insErr.message }, 500);

    const origin = req.headers.get("origin") ?? "https://sayne.io";
    const url = `${origin.replace(/\/$/, "")}/p/${token}`;

    return json({ token, url, expires_at });
  } catch (e: any) {
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
