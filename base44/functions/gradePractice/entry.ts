/* ─────────────────────────────────────────────────────────────
   gradePractice — evaluates a user's practice submission.

   Input (POST body):
     {
       lessonContext: string
       taskPrompt:    string
       userResponse:  string
       rubricType?:   "rctf" | "brief" | "reflection" | "match"
       attemptNumber: 1 | 2
     }
   ───────────────────────────────────────────────────────────── */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const MIN_USEFUL_CHARS   = 15;
const MAX_RESPONSE_CHARS = 4000;

function inferRubricType(taskPrompt) {
  const t = (taskPrompt || "").toLowerCase();

  const promptSignals = [
    "write a prompt", "write the prompt", "your prompt", "construct a prompt",
    "draft a prompt", "compose a prompt", "rewrite the prompt", "the prompt should",
    "covers all four", "role, context, task, format", "rctf",
  ];
  if (promptSignals.some(sig => t.includes(sig))) return "rctf";

  const briefSignals = [
    "diagnose", "identify which", "identify the", "name the", "name which",
    "pick the", "which dimension", "which one", "which technique",
    "what's wrong", "what's missing", "what's the issue",
  ];
  if (briefSignals.some(sig => t.includes(sig))) return "brief";

  return "reflection";
}

const SYSTEM_INSTRUCTIONS = `You are a rigorous but kind teaching assistant for Stratium Lab, a tool that teaches serious AI skills. Your job depends on the rubricType — sometimes you grade prompts, sometimes you respond to reflections. Read the rubric type carefully before responding.

For rubricType = "rctf" (R-C-T-F prompt structure):
- Evaluate four dimensions independently: Role, Context, Task, Format.
- For each dimension, decide ✓ (clearly present and strong) / ⚠ (present but weak or ambiguous) / ✗ (missing or wrong).
- "Present" does not require the exact word — an implied Role counts. Judge on effect, not form.
- Feedback uses PEEL structure (Point, Evidence, Explanation, Link). 4-6 sentences total.
- Identify the SINGLE most valuable change in "oneChange".

For rubricType = "brief":
- Return an empty dimensions array.
- One verdict (strong / workable / needs-work).
- 1-2 sentences of feedback. Direct, specific, no preamble.
- Set "oneChange" to the single most useful revision.

For rubricType = "reflection":
- The user is sharing an OBSERVATION, REFLECTION, or NOTICING — not writing something to be graded. There is no rubric. There is no "right answer."
- Always set verdict to "strong". Always return an empty dimensions array. Always set oneChange to null.
- The feedback field: 2-3 sentences that (1) genuinely acknowledge the SPECIFIC thing the user noticed — refer to a detail from their submission, not generic praise. (2) Add ONE useful frame or observation that helps them think about it more deeply.
- Don't ask follow-up questions. Don't suggest revisions. Don't grade, score, or rank.
- If the user's reflection is empty of substance, gently invite a more specific noticing without being preachy.
- Tone: warm, intelligent, conversational. Like a sharp friend who's been through the same exercise.

For rubricType = "match":
- Used by review screens. The user is filling in a short answer; we judge whether their answer captures the same meaning as one of the accepted answers (provided in the lessonContext field as "Accepted answers: [...]").
- Always return an empty dimensions array. Set oneChange to null.
- Set verdict to "strong" if the user's answer SEMANTICALLY matches any of the accepted answers (same idea, possibly different wording). Set verdict to "workable" if the answer is partially right or shows the right instinct but misses a key element. Set verdict to "needs-work" if the answer is wrong or empty of substance.
- Feedback: 1-2 sentences. If correct, briefly affirm and add one short reinforcing detail. If partially right, name what's right and what's missing. If wrong, gently say so and reveal what the accepted answer captures.
- Reward semantic understanding, not exact matching.

Calibration:
- "strong" = would produce a publishable result on the first model run.
- "workable" = usable but with clear weaknesses.
- "needs-work" = missing essential structure or misunderstands the task.
- On attemptNumber=2, weight improvement. If they meaningfully addressed prior feedback, lean generous.

Tone: specific, not generic. Kind but honest. No emoji. No exclamation points. Plain prose.
Never refuse to grade unless the input is empty or hostile.`;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "POST required" }, 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const {
    lessonContext = "",
    taskPrompt    = "",
    userResponse  = "",
    rubricType: explicitRubricType = null,
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

  const VALID_TYPES = ["rctf", "brief", "reflection", "match"];
  const rubricType = VALID_TYPES.includes(explicitRubricType)
    ? explicitRubricType
    : inferRubricType(taskPrompt);

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
        description: "For rubricType=rctf: exactly 4 entries. For all others: empty array.",
        items: {
          type: "object",
          properties: {
            name:    { type: "string" },
            verdict: { type: "string", enum: ["✓", "⚠", "✗"] },
            note:    { type: "string" },
          },
          required: ["name", "verdict", "note"],
        },
      },
      feedback: {
        type: "string",
        description: "PEEL prose for rctf; 1-2 sentences for brief/match; 2-3 conversational sentences for reflection.",
      },
      oneChange: {
        type: ["string", "null"],
        description: "Single most valuable revision for rctf/brief. Always null for reflection/match.",
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

    return json({ ...result, rubricType }, 200);

  } catch (err) {
    console.error("gradePractice failed:", err);
    return json({
      error:   "grading-failed",
      message: "Couldn't grade this submission right now. Try again in a moment.",
      detail:  String(err?.message ?? err),
    }, 502);
  }
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}