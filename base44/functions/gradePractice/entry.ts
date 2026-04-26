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
       rubricType?:   "rctf" | "brief" | "reflection"    // OPTIONAL — if omitted, inferred from taskPrompt
       attemptNumber: 1 | 2     // frames feedback on retries
     }

   Rubric resolution (HYBRID model):
     - If rubricType is provided explicitly, use it (author override).
     - If omitted, infer from the taskPrompt's wording. See inferRubricType().
     - Default for non-prompt-construction practices is "reflection" (no grading).

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

/**
 * inferRubricType — when the author didn't specify rubricType, decide from the task prompt.
 *
 * Heuristic, in priority order:
 *   1. If the task uses prompt-construction language ("write a prompt", "your prompt", "construct a prompt") → rctf
 *   2. If the task asks for a short, specific judgment ("diagnose", "identify", "name the…", "what's the issue") → brief
 *   3. Everything else (reflection, observation, opinion, "what did you notice", "share your experience") → reflection
 *
 * Reflection is the default. Rubric grading is the special case.
 */
function inferRubricType(taskPrompt) {
  const t = (taskPrompt || "").toLowerCase();

  const promptSignals = [
    "write a prompt",
    "write the prompt",
    "your prompt",
    "construct a prompt",
    "draft a prompt",
    "compose a prompt",
    "rewrite the prompt",
    "the prompt should",
    "covers all four",
    "role, context, task, format",
    "rctf",
  ];
  if (promptSignals.some(sig => t.includes(sig))) return "rctf";

  const briefSignals = [
    "diagnose",
    "identify which",
    "identify the",
    "name the",
    "name which",
    "pick the",
    "which dimension",
    "which one",
    "which technique",
    "what's wrong",
    "what's missing",
    "what's the issue",
  ];
  if (briefSignals.some(sig => t.includes(sig))) return "brief";

  return "reflection";
}

const SYSTEM_INSTRUCTIONS = `You are a rigorous but kind teaching assistant for Stratium Lab, a tool that teaches serious AI skills. Your job depends on the rubricType — sometimes you grade prompts, sometimes you respond to reflections. Read the rubric type carefully before responding.

Process the user's submission according to the rubric type below and return structured output. The rubric type tells you whether to grade or to respond conversationally.

How you respond:

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

For rubricType = "reflection":
- The user is sharing an OBSERVATION, REFLECTION, or NOTICING — not writing something to be graded. There is no rubric. There is no "right answer." Don't evaluate the quality of their writing or whether it's "complete."
- Always set verdict to "strong" (this is a sentinel value; the frontend hides the verdict pill in reflection mode). Always return an empty dimensions array. Always set oneChange to null.
- The feedback field carries your entire response. Write 2-3 sentences that:
  (1) Genuinely acknowledge the SPECIFIC thing the user noticed — refer to a detail from their submission, not generic praise.
  (2) Add ONE useful frame, observation, or piece of context that helps them think about what they noticed more deeply.
- Don't ask follow-up questions (no question marks at the end). Don't suggest revisions. Don't grade, score, or rank.
- If the user's reflection is empty of substance ("I tried it, it was fine"), gently invite a more specific noticing without being preachy. Example: "It sounds like nothing surprised you this round — sometimes the technique only stands out on tasks where the model would otherwise have stumbled. Worth trying again on a question with a specific factual answer."
- Tone: warm, intelligent, conversational. Like a sharp friend who's been through the same exercise. NOT a teacher grading homework.

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

  const rubricType = (() => {
    if (explicitRubricType === "rctf" || explicitRubricType === "brief" || explicitRubricType === "reflection") {
      return explicitRubricType;
    }
    return inferRubricType(taskPrompt);
  })();

  if (rubricType !== "rctf" && rubricType !== "brief" && rubricType !== "reflection") {
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
        description: "For rubricType=rctf: exactly 4 entries (Role, Context, Task, Format). For rubricType=brief or reflection: empty array.",
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
        description: "PEEL-structured prose for rctf (4-6 sentences); 1-2 direct sentences for brief; 2-3 conversational sentences for reflection.",
      },
      oneChange: {
        type: ["string", "null"],
        description: "The single most valuable revision for rctf/brief modes. Always null for reflection mode.",
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