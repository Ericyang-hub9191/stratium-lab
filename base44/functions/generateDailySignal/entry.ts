import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date().toISOString().split("T")[0];

    // Check if signal already exists for today
    const existing = await base44.asServiceRole.entities.Signal.filter({ date: today });
    if (existing.length > 0) {
      console.log("Signal already exists for today — skipping");
      return Response.json({ message: "Signal already exists for today — skipping" });
    }

    // Generate signal via Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: "You are an AI news editor for Synthetica, a professional AI mastery app. Your job is to write one daily Signal — a concise, high-quality briefing about a significant real development in AI. Write for busy professionals who want to stay ahead. Be specific, factual, and insightful. Never be vague or generic.",
      messages: [
        {
          role: "user",
          content: `Write today's Signal for ${today}. Return ONLY a valid JSON object with exactly these fields: { "title": string (max 80 chars, compelling headline), "shortTeaser": string (max 150 chars, one punchy sentence summary), "fullText": string (3-4 paragraphs, ~250 words, specific and insightful), "source": string (credible source name and date), "relatedCategory": string (must be exactly one of: prompting, writing, research, automation, python, data, productivity, rag, business, biology, safety, psychology, mlops) }`,
        },
      ],
    });

    const rawText = message.content[0].text.trim();

    // Strip markdown code fences if present
    const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(jsonText);

    await base44.asServiceRole.entities.Signal.create({
      id: "signal-" + today,
      date: today,
      ...parsed,
    });

    console.log(`Generated and saved signal for today: ${parsed.title}`);
    return Response.json({ success: true, title: parsed.title });

  } catch (error) {
    console.error("generateDailySignal failed:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});