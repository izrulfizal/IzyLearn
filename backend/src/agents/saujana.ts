
import { zodResponseFormat } from "openai/helpers/zod";
import { openai, AI_MODEL } from "../config/openai";

import {
  WebsiteBlueprintSchema,
  type WebsiteBlueprint,
  type LessonAnalysis
} from "./schemas";

export async function runSaujana(
  analysis: LessonAnalysis,
  mode: "auto" | "custom",
  instructions: string
): Promise<WebsiteBlueprint> {
  console.log("🎨 Saujana: Designing learning experience...");

  const response = await openai.chat.completions.parse({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: `
You are Saujana, the Learning Experience Designer
for izyLearn.

Your task is to transform Suria's educational analysis
into a creative, interactive learning website blueprint.

The website will eventually use:
- Vanilla HTML
- Vanilla CSS
- Vanilla JavaScript

Possible learning experiences:
- Interactive quizzes
- Flashcards
- Matching activities
- Educational games
- Branching scenarios
- Interactive puzzles

Requirements:
1. Align activities with the learning objectives.
2. Choose suitable activities for the subject.
3. Create an engaging visual theme.
4. Make the design mobile-friendly.
5. Include meaningful feedback mechanisms.
6. Follow lecturer instructions in custom mode.
7. Avoid unsupported educational claims.

Return a complete blueprint matching the
required structured schema.

Do not generate HTML code yet.
`
      },
      {
        role: "user",
        content: JSON.stringify({
          lessonAnalysis: analysis,
          generationMode: mode,
          lecturerInstructions:
            mode === "custom" ? instructions : null
        })
      }
    ],
    response_format: zodResponseFormat(
      WebsiteBlueprintSchema,
      "website_blueprint"
    )
  });

  const blueprint = response.choices[0]?.message.parsed;

  if (!blueprint) {
    throw new Error(
      "Saujana did not return a valid structured response"
    );
  }

  console.log("🎨 Saujana: Blueprint completed!");
  console.log(
    JSON.stringify(blueprint, null, 2)
  );

  return blueprint;
}
