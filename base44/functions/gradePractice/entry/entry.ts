/* ─────────────────────────────────────────────────────────────
   gradePractice — evaluates a user's practice submission.

   Uses Base44's managed InvokeLLM integration (no API key needed).
   Returns structured JSON via response_json_schema, so we can't get
   malformed output from the model.

   Input (POST body):
     {
       lessonContext: string    // the lesson's title + key concept being practiced
       taskPrompt:    string    // the practice block's instruction to the user
       userResponse:  string    // what the user wrote
       rubricType:    "rctf" | "brief"    // controls feedback depth
       attemptNumber: 1 | 2     // frames feedback on retries
     }

   Output:
     {
       verdict:    "strong" | "workable" | "needs-work"
       dimensions: [{ name: string, verdict: "✓"|"⚠"|"✗", note: string }]
       feedback:   string
       oneChange:  string | null
     }

   Design choices:
   - claude_opus_4_7 — rubric judgment needs the most capable model.
   - No numeric score. Verdicts are qualitative. LLM scores are false precision.
   - Feedback is non-blocking in the UI. We're giving signal, not gating.
   - We reject empty/trivial submissions before calling the LLM to avoid
     wasting integration credits.
   ───────────────────────────────────────────────────────────── */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const MIN_USEFUL_CHARS   = 15;
const MAX_RESPONSE_CHARS = 4000;

const SYSTEM_INSTRUCTIONS = `You are a rigorous but kind teaching assistant evaluating prompt-writing practice submissions for Stratium Lab, a tool that teaches serious AI skills.

Evaluate the user's submitted practice response against the rubric and return structured feedback.

How you grade:

For rubricType = "rctf" (R-C-T-F prompt structure):
- Evaluate four dimensions independently: Role, Context, Task, Format.
- For each dimension, decide ✓ (clearly present and strong) / ⚠ (present but weak or ambiguous) / ✗ (missing or wrong).
- "Present" does not require the exact word — an implied Role (e.g., "explain this to a 5-year-old") counts. Judge on effect, not form.
- Feedback uses PEEL structure (Point, Evidence, Explanation, Link). 4-6 sentences total. Start with your overall verdict as a point. Quote or reference specific phrasing from the user's submission as evidence. Explain why that phrasing works or doesn't. End with a concrete revision direction.
- Identify the SINGLE most valuable change the user could make in "oneChange". Not a list — the one move that would most improve the prompt.

For rubricType = "brief":
- Return an empty dimensions array.
- One verdict (strong / workable / needs-work).
- 1-2 sentences of feedback. Direct, specific, no preamble.
- Set "oneChange" to the single most useful revision.

Calibration:
- "strong" = would produce a publishable result on the first model run with only minor touch-ups.
- "workable" = would produce something usable but with clear weaknesses the user could address.
- "needs-work" = the submission is missing essential structure or misunderstands the task.
- On attemptNumber=2 (the revised attempt), weight effort and improvement. If they meaningfully addressed the prior feedback, lean generous.

Tone:
- Specific, not generic. "Your Context is thin" is useless. "Your Context tells the model what to write but not why — add who will read this and what decision it supports" is useful.
- Kind but honest. Don't sugarcoat fundamental misses. Don't manufacture praise.
- No emoji. No exclamation points. Plain prose.

Never:
- Never refuse to grade unless the input is empty or hostile.
- Never grade the user's writing style — grade whether the prompt is likely to produce a good result.
- Never offer more than one revision. Students who receive 4 suggestions fix none.`;

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

  const base44 = createClientFromRequest(req);

  const prompt = [
    SYSTEM_INSTRUCTIONS,
    ``,
    `---`,
    ``,
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
  ].join("\n");

  const schema = {
    type: "object",
    properties: {
      verdict: {
        type: "string",
        enum: ["strong", "workable", "needs-work"],
        description: "Overall verdict on the submission.",
      },
      dimensions: {
        type: "array",
        description: "For rubricType=rctf: exactly 4 entries (Role, Context, Task, Format). For rubricType=brief: empty array.",
        items: {
          type: "object",
          properties: {
            name:    { type: "string",  description: "Dimension name (Role / Context / Task / Format)" },
            verdict: { type: "string", enum: ["✓", "⚠", "✗"] },
            note:    { type: "string", description: "1-2 sentences specific to this dimension." },
          },
          required: ["name", "verdict", "note"],
        },
      },
      feedback: {
        type: "string",
        description: "PEEL-structured prose for rctf (4-6 sentences), or 1-2 direct sentences for brief.",
      },
      oneChange: {
        type: ["string", "null"],
        description: "The single most valuable revision the user could make. Null only if the submission is already excellent.",
      },
    },
    required: ["verdict", "dimensions", "feedback", "oneChange"],
  };

  try {
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
      model: "claude_opus_4_7",
    });

    return json(result, 200);

  } catch (err: any) {
    console.error("gradePractice failed:", err);
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
