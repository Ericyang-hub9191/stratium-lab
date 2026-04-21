/* ─────────────────────────────────────────────────────────────
   gradePractice — evaluates a user's practice submission.

   Input (POST body):
     {
       lessonContext: string    // the lesson's title + key concept being practiced
       taskPrompt:    string    // the practice block's instruction to the user
       userResponse:  string    // what the user wrote
       rubricType:    "rctf" | "brief"    // controls feedback depth
       attemptNumber: 1 | 2     // frames feedback differently on retries
     }

   Output:
     {
       verdict:    "strong" | "workable" | "needs-work"
       dimensions: [{ name: string, verdict: "✓"|"⚠"|"✗", note: string }]
                   // For rubricType=rctf, this is 4 entries: Role, Context, Task, Format.
                   // For rubricType=brief, this is an empty array — verdict + feedback only.
       feedback:   string       // Prose. PEEL structure for rctf, brief sentence for brief.
       oneChange:  string | null  // The single most valuable revision the user could make.
     }

   Design choices:
   - Claude Opus 4.7 — nuanced rubric judgment benefits from the most capable model.
   - No numeric score. Verdicts are qualitative. False precision from LLMs is harmful.
   - Feedback is non-blocking in the UI. We're giving signal, not gating.
   - We're defensive about input: reject empty/trivial submissions here, even though
     the client has a soft gate. Never pay for an API call on garbage.
   ───────────────────────────────────────────────────────────── */

import Anthropic from "npm:@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

const MODEL              = "claude-opus-4-7";
const MAX_RESPONSE_CHARS = 4000;   // upper bound on what we'll grade
const MIN_USEFUL_CHARS   = 15;     // below this we reject without calling the API

const SYSTEM_PROMPT = `You are a rigorous but kind teaching assistant evaluating prompt-writing practice submissions for Synthetica, a tool that teaches serious AI skills.

Your job: read the user's submitted practice response, evaluate it against the rubric, and return structured feedback in JSON.

How you grade:

For rubricType = "rctf" (R-C-T-F prompt structure):
- Evaluate four dimensions independently: Role, Context, Task, Format.
- For each dimension, decide ✓ (clearly present and strong) / ⚠ (present but weak or ambiguous) / ✗ (missing or wrong).
- "Present" does not require the exact word — an implied Role (e.g., "explain this to a 5-year-old") counts. Judge on effect, not form.
- Write PEEL feedback (Point, Evidence, Explanation, Link). 4-6 sentences total. Begin with your overall verdict stated as a point. Quote or reference specific phrasing from the user's submission as evidence. Explain why that phrasing works or doesn't. Link to a concrete revision.
- Identify the SINGLE most valuable change the user could make in "oneChange". Not a list — the one move that would most improve the prompt.

For rubricType = "brief":
- Skip dimensional breakdown. Return an empty dimensions array.
- One verdict (strong / workable / needs-work).
- 1-2 sentences of feedback. Direct, specific, no preamble.
- Still set "oneChange" to the single most useful revision.

Calibration:
- "strong" = would produce a publishable result on the first model run with only minor touch-ups.
- "workable" = would produce something usable but with a few clear weaknesses the user could address.
- "needs-work" = the submission is missing essential structure or has a fundamental misunderstanding of the task.
- On attemptNumber=2 (the revised attempt), weight effort and improvement. If they meaningfully addressed the prior feedback, lean generous.

Tone:
- Specific, not generic. "Your Context is thin" is useless. "Your Context tells the model *what* to write but not *why* — add who will read this and what decision it supports" is useful.
- Kind but honest. Don't sugarcoat fundamental misses. Don't manufacture praise.
- No emoji. No exclamation points. Plain prose.

Never:
- Never refuse to grade unless the input is empty or hostile.
- Never grade the user's writing *style* — grade whether the prompt is likely to produce a good result.
- Never offer more than one revision. Students who receive 4 suggestions fix none.

Output MUST be valid JSON matching this schema exactly:
{
  "verdict":   "strong" | "workable" | "needs-work",
  "dimensions": [
    { "name": string, "verdict": "✓" | "⚠" | "✗", "note": string }
  ],
  "feedback":  string,
  "oneChange": string | null
}

No preamble, no code fences, no commentary outside the JSON object. Return ONLY the JSON object.`;

// ── Entry point ───────────────────────────────────────────────
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return json({ error: "POST required" }, 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const {
    lessonContext = "",
    taskPrompt    = "",
    userResponse  = "",
    rubricType    = "rctf",
    attemptNumber = 1,
  } = body ?? {};

  // Defensive input validation. Never pay for an API call on garbage.
  if (typeof userResponse !== "string" || userResponse.trim().length < MIN_USEFUL_CHARS) {
    return json({
      error: "submission-too-short",
      message: "The submission is too short to evaluate meaningfully. Add more detail and try again.",
    }, 400);
  }

  if (userResponse.length > MAX_RESPONSE_CHARS) {
    return json({
      error: "submission-too-long",
      message: `Keep practice submissions under ${MAX_RESPONSE_CHARS} characters.`,
    }, 400);
  }

  if (rubricType !== "rctf" && rubricType !== "brief") {
    return json({ error: "Invalid rubricType" }, 400);
  }

  // Build the grading prompt.
  const userMessage = [
    `Lesson context: ${lessonContext || "(not provided)"}`,
    ``,
    `Practice task: ${taskPrompt || "(not provided)"}`,
    ``,
    `Rubric type: ${rubricType}`,
    `Attempt number: ${attemptNumber}`,
    ``,
    `User's submission:`,
    `"""`,
    userResponse,
    `"""`,
    ``,
    `Return ONLY the JSON object. No preamble, no fences, no commentary.`,
  ].join("\n");

  try {
    const resp = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 800,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: userMessage }],
    });

    // Extract the text block from the response.
    const textBlock = resp.content.find((c: any) => c.type === "text");
    if (!textBlock || !("text" in textBlock)) {
      return json({ error: "No text in model response" }, 502);
    }

    // Parse the JSON. Trim any stray whitespace/fences just in case.
    const raw = (textBlock as any).text.trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // If it's malformed, try to salvage the object portion.
      const first = raw.indexOf("{");
      const last  = raw.lastIndexOf("}");
      if (first >= 0 && last > first) {
        parsed = JSON.parse(raw.slice(first, last + 1));
      } else {
        return json({ error: "Model returned malformed JSON", raw }, 502);
      }
    }

    // Validate shape.
    const validVerdicts = ["strong", "workable", "needs-work"];
    if (!validVerdicts.includes(parsed.verdict)) {
      return json({ error: "Invalid verdict from model", parsed }, 502);
    }
    if (typeof parsed.feedback !== "string" || parsed.feedback.trim().length === 0) {
      return json({ error: "Missing feedback from model", parsed }, 502);
    }
    if (!Array.isArray(parsed.dimensions)) parsed.dimensions = [];
    if (typeof parsed.oneChange !== "string" && parsed.oneChange !== null) {
      parsed.oneChange = null;
    }

    return json(parsed, 200);

  } catch (err: any) {
    console.error("gradePractice error:", err);
    return json({
      error:   "grading-failed",
      message: "Couldn't grade this submission right now. Try again in a moment.",
      detail:  String(err?.message ?? err),
    }, 502);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}