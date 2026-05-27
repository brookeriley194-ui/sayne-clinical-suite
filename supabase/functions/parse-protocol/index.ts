import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const COMPOUNDS = [
  "BPC-157", "TB-500", "MOTS-C", "Ipamorelin", "CJC-1295", "Selank", "Semax",
  "Semaglutide", "Tirzepatide", "Retatrutide", "NAD+", "PT-141", "Epithalon",
  "GHK-Cu", "Thymosin Alpha-1", "DSIP", "Kisspeptin", "Tesamorelin",
  "Hexarelin", "GHRP-2", "GHRP-6", "AOD-9604", "5-Amino-1MQ", "SS-31", "Other",
];
const FREQUENCIES = ["Once Daily", "Twice Daily", "Every Other Day", "Weekly", "Custom"];
const ROUTES = ["Subcutaneous", "Intranasal", "Oral", "Topical"];
const UNITS = ["mcg", "mg", "IU", "units"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 5) {
      return new Response(JSON.stringify({ error: "Empty or too-short protocol text" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > 8000) {
      return new Response(JSON.stringify({ error: "Protocol text too long (max 8000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You parse peptide research stacks from free text. The text may describe MULTIPLE compounds stacked together — extract EACH compound as a separate entry in the protocols array. Match values to provided enums when possible. If a field cannot be confidently determined, return null. Never invent values.`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Parse this stack into one entry per compound. Allowed compounds: ${COMPOUNDS.join(", ")}. If a compound is named but not in the list, use "Other" and put the actual name in notes. Allowed frequencies: ${FREQUENCIES.join(", ")}. Allowed routes: ${ROUTES.join(", ")}. Allowed dose units: ${UNITS.join(", ")}.\n\nProtocol text:\n"""${text}"""`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_protocols",
            description: "Return one parsed entry per compound found in the text.",
            parameters: {
              type: "object",
              properties: {
                protocols: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      compound: { type: ["string", "null"], enum: [...COMPOUNDS, null] },
                      dose: { type: ["number", "null"] },
                      dose_unit: { type: ["string", "null"], enum: [...UNITS, null] },
                      frequency: { type: ["string", "null"], enum: [...FREQUENCIES, null] },
                      route: { type: ["string", "null"], enum: [...ROUTES, null] },
                      duration_days: { type: ["integer", "null"] },
                      ongoing: { type: "boolean" },
                      notes: { type: ["string", "null"] },
                    },
                    required: ["compound", "dose", "dose_unit", "frequency", "route", "duration_days", "ongoing", "notes"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["protocols"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_protocols" } },
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
    const protocols = Array.isArray(args.protocols) ? args.protocols : [];
    return new Response(JSON.stringify({ protocols }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-protocol error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
