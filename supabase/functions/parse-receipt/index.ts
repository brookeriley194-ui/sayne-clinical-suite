import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string" || !image.startsWith("data:")) {
      return new Response(JSON.stringify({ error: "Missing image data URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (image.length > 8_000_000) {
      return new Response(JSON.stringify({ error: "Image too large (max ~6MB)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You extract peptide vial line items from a research-supply order receipt or invoice image. Return one entry per distinct vial product. Use the printed strength on the vial (e.g. "5mg", "10mg") for vial_size_mg. Ignore shipping, tax, discounts, and non-peptide items (syringes, BAC water, swabs). Never invent values — return null for unknown fields.`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract every peptide vial line item from this receipt." },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_vials",
            description: "Return one entry per peptide vial line item.",
            parameters: {
              type: "object",
              properties: {
                vials: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      compound: { type: "string", description: "Peptide name as printed (e.g. Semaglutide, BPC-157)" },
                      vial_size_mg: { type: ["number", "null"], description: "Strength in mg per vial" },
                      quantity: { type: ["integer", "null"], description: "Number of vials of this product" },
                      lot_number: { type: ["string", "null"] },
                      notes: { type: ["string", "null"], description: "Any extra detail worth keeping (vendor, batch, etc.)" },
                    },
                    required: ["compound", "vial_size_mg", "quantity", "lot_number", "notes"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["vials"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_vials" } },
    };

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds to continue." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!r.ok) {
      const t = await r.text();
      console.error("AI gateway error", r.status, t);
      return new Response(JSON.stringify({ error: "AI parsing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await r.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI returned no structured output" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(call.function.arguments);
    const vials = Array.isArray(args.vials) ? args.vials : [];
    return new Response(JSON.stringify({ vials }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-receipt error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
