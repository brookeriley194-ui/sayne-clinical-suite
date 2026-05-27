// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    let token: string | null = null;
    if (req.method === "GET") {
      token = new URL(req.url).searchParams.get("token");
    } else {
      const body = await req.json().catch(() => ({}));
      token = (body as any)?.token ?? null;
    }
    if (!token || !/^[a-f0-9]{8,128}$/i.test(token)) {
      return json({ error: "Invalid token" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: link, error } = await admin
      .from("patient_links")
      .select("id, protocol_id, patient_name, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (error || !link) return json({ error: "Link not found" }, 404);
    if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
      return json({ error: "Link expired" }, 410);
    }

    const { data: proto, error: pErr } = await admin
      .from("protocols")
      .select("id, name, compound, dose, dose_unit, frequency, route, duration_days, ongoing, notes")
      .eq("id", link.protocol_id)
      .maybeSingle();
    if (pErr || !proto) return json({ error: "Protocol not found" }, 404);

    return json({
      patient_name: link.patient_name,
      protocol: proto,
    });
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
