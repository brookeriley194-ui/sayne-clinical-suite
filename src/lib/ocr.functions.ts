import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  image: z
    .string()
    .startsWith("data:image/", "Only image uploads are supported")
    .max(8_000_000, "Image too large (max ~6MB)"),
});

const SYSTEM_PROMPT = `You transcribe screenshots and photos of peptide protocols (AI chat transcripts, notes, spreadsheets, labels).
Return the protocol text EXACTLY as written — never summarize, reword, or invent anything.
Keep compounds, doses, units, frequencies, routes and durations verbatim, one compound per line where possible.
Drop UI chrome (timestamps, avatars, buttons, "Copy code", model names) and text unrelated to the protocol.
If the image has no readable protocol text, return an empty string.`;

export const extractProtocolText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe the protocol text from this image." },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_text",
              description: "Return the verbatim protocol text read from the image.",
              parameters: {
                type: "object",
                properties: {
                  text: { type: "string", description: "Verbatim protocol text with line breaks." },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                },
                required: ["text", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_text" } },
      }),
    });

    if (res.status === 429) return { text: "", confidence: "low", error: "Too many requests — try again in a moment." };
    if (res.status === 402) return { text: "", confidence: "low", error: "AI credits exhausted. Add credits to continue." };
    if (!res.ok) {
      console.error("AI gateway error", res.status, await res.text());
      return { text: "", confidence: "low", error: "Couldn't read that image. Try a clearer screenshot." };
    }

    const json = (await res.json()) as any;
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return { text: "", confidence: "low", error: "No text found in that image." };

    let parsed: { text?: string; confidence?: string };
    try {
      parsed = JSON.parse(args);
    } catch {
      return { text: "", confidence: "low", error: "Couldn't read that image. Try a clearer screenshot." };
    }

    return {
      text: String(parsed.text ?? "").trim(),
      confidence: (parsed.confidence ?? "medium") as "high" | "medium" | "low",
      error: null as string | null,
    };
  });
