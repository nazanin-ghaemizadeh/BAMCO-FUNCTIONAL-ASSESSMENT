import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import "./review-contract.js";
const FunctionalReview = (globalThis as any).BAMCO_REVIEW_CONTRACT;

const ALLOWED_ORIGIN = "https://nazanin-ghaemizadeh.github.io";
const MODEL = "gpt-5.6-luna";

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          improvementOpportunity: { type: "string" },
          linkedResultsReasoning: { type: "string" },
          probableCauses: { type: "array", minItems: 1, maxItems: 2, items: { type: "string" } },
          diagnosticTest: { type: "string" },
          correctiveActionIfConfirmed: { type: "string" }
        },
        required: ["improvementOpportunity","linkedResultsReasoning","probableCauses","diagnosticTest","correctiveActionIfConfirmed"],
        additionalProperties: false
      }
    }
  },
  required: ["suggestions"],
  additionalProperties: false
};

const FIXED_PROMPT = `
نقش: مهندس ارشد توسعه محصول خودرو با تمرکز بر NVH، شاسی، قوای محرکه، ترمز و تحلیل ریشه‌ای.
فقط داده‌های پاسخ‌داده‌شده را تحلیل کن و دقیقاً ۵ پیشنهاد فنی اولویت‌دار بده.
امتیاز و وزن را در خروجی ننویس. ضعف‌های مرتبط را خوشه‌بندی کن، نه اینکه هر سؤال را جدا گزارش کنی.
برای هر مورد: ارتباط شواهد، حداکثر ۲ علت محتمل، یک آزمون تشخیصی تفکیک‌کننده و اصلاح مشروط بده.
علت قطعی یا مشخصات فنی ناموجود نساز. خروجی فارسی، کوتاه، تخصصی و فقط مطابق JSON تعیین‌شده باشد.
`.trim();

function isAllowedOrigin(origin: string | null) {
  if (!origin) return true;
  if (origin === ALLOWED_ORIGIN) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}
function corsHeaders(origin: string | null) {
  const allowed = origin && isAllowedOrigin(origin) ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Vary": "Origin"
  };
}
function jsonResponse(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
function cleanText(value: unknown, max: number) {
  return (typeof value === "string" ? value.trim() : "").slice(0, max);
}

function normalizePayload(raw: any) {
  if (raw?.version === 4) return FunctionalReview.normalizePayload(raw);
  const isV3 = raw?.version === 3 && raw?.source === "BAMCO_EVALUATOR_PANEL_ANSWERED";
  const isV2 = raw?.version === 2 && raw?.source === "BAMCO_EVALUATOR_PANEL_LIVE";
  if ((!isV2 && !isV3) || !Array.isArray(raw.criteria) || !raw.criteria.length || raw.criteria.length > 30) {
    throw new Error("invalid_payload");
  }

  let answered = 0;
  const criteria: any[] = [];
  for (const main of raw.criteria) {
    const subgroups: any[] = [];
    for (const sub of Array.isArray(main.subgroups) ? main.subgroups : []) {
      const items: any[] = [];
      for (const item of Array.isArray(sub.items) ? sub.items : []) {
        if (item.score === null || item.score === "" || item.score === undefined) continue;
        const score = Number(item.score);
        if (!Number.isInteger(score) || score < 1 || score > 10) continue;
        answered++;
        items.push({
          id: cleanText(item.id, 60),
          title: cleanText(item.title, 500),
          instructions: cleanText(item.instructions, 900),
          score,
          evaluatorNote: cleanText(item.evaluatorNote, 1800)
        });
      }
      if (items.length) subgroups.push({
        id: cleanText(sub.id, 40),
        title: cleanText(sub.title, 350),
        items
      });
    }
    if (subgroups.length) criteria.push({
      id: cleanText(main.id, 40),
      title: cleanText(main.title, 300),
      subgroups
    });
  }
  if (!answered) throw new Error("empty_assessment");

  return {
    vehicle: {
      brand: cleanText(raw.vehicle?.brand, 120),
      model: cleanText(raw.vehicle?.model, 120),
      odometer: cleanText(raw.vehicle?.odometer, 80)
    },
    evaluatorFinalComment: cleanText(raw.evaluatorFinalComment, 3500),
    criteria,
    answeredItems: answered
  };
}

function extractOutputText(data: any) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  for (const item of data?.output || []) {
    if (item?.type !== "message") continue;
    for (const part of item?.content || []) {
      if ((part?.type === "output_text" || part?.type === "text") && typeof part?.text === "string") return part.text.trim();
    }
  }
  return "";
}
function validateReport(report: any) {
  if (!report || !Array.isArray(report.suggestions) || report.suggestions.length !== 5) throw new Error("invalid_model_response");
  for (const item of report.suggestions) {
    for (const key of ["improvementOpportunity","linkedResultsReasoning","diagnosticTest","correctiveActionIfConfirmed"]) {
      if (typeof item?.[key] !== "string" || !item[key].trim()) throw new Error("invalid_model_response");
    }
    if (!Array.isArray(item.probableCauses) || item.probableCauses.length < 1 || item.probableCauses.length > 2) throw new Error("invalid_model_response");
  }
  return report;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) return jsonResponse({ error: "origin_not_allowed" }, 403, origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });

  const apiKey = Deno.env.get("OPENAI_API_KEY") || "";
  if (req.method === "GET") return jsonResponse({ ok: true, configured: Boolean(apiKey), model: MODEL, version: 8, functional: { promptId: FunctionalReview.promptId, prompt: FunctionalReview.prompt("fa") } }, 200, origin);
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405, origin);
  if (!apiKey) return jsonResponse({ error: "openai_key_missing" }, 503, origin);

  const length = Number(req.headers.get("content-length") || 0);
  if (length > 220000) return jsonResponse({ error: "payload_too_large" }, 413, origin);

  let payload: ReturnType<typeof normalizePayload>;
  try { const body = await req.text(); if (new TextEncoder().encode(body).length > 220000) return jsonResponse({error:"payload_too_large"},413,origin); payload = normalizePayload(JSON.parse(body)); }
  catch (error) {
    const code = error instanceof Error ? error.message : "invalid_payload";
    return jsonResponse({ error: code === "empty_assessment" ? code : "invalid_payload" }, 400, origin);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        store: false,
        reasoning: { effort: "low" },
        input: [
          { role: "system", content: payload.promptId ? FunctionalReview.prompt(payload.language) : FIXED_PROMPT },
          { role: "user", content: JSON.stringify(payload) }
        ],
        text: { format: { type: "json_schema", name: "bamco_vehicle_technical_review", strict: true, schema: OUTPUT_SCHEMA } },
        max_output_tokens: payload.promptId ? 3800 : 2200
      })
    });

    const data = await response.json();
    if (!response.ok) {
      const openaiCode = data?.error?.code || "";
      const openaiType = data?.error?.type || "";
      console.error("OpenAI API error", response.status, openaiType, openaiCode);
      return jsonResponse({ error: "openai_request_failed", status: response.status, openaiCode, openaiType }, response.status === 429 ? 429 : 502, origin);
    }

    const text = extractOutputText(data);
    if (!text) return jsonResponse({ error: "empty_model_response" }, 502, origin);
    try {
      const report = validateReport(JSON.parse(text));
      return jsonResponse({ ok: true, report, model: MODEL, answeredItems: payload.answeredItems, ...(payload.promptId ? {promptId:payload.promptId,language:payload.language} : {}) }, 200, origin);
    } catch (error) {
      console.error("Invalid structured model response", error);
      return jsonResponse({ error: "invalid_model_response" }, 502, origin);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return jsonResponse({ error: "openai_timeout" }, 504, origin);
    console.error("Technical review failure", error);
    return jsonResponse({ error: "technical_review_failed" }, 500, origin);
  } finally { clearTimeout(timer); }
});

