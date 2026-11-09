
import { z } from "zod";

export const LessonAnalysisSchema = z.object({
  title: z.string(),
  subject: z.string(),
  targetAudience: z.string(),
  summary: z.string(),
  learningObjectives: z.array(z.string()),
  keyConcepts: z.array(z.object({
    name: z.string(),
    explanation: z.string()
  })),
  suggestedActivities: z.array(z.string())
});

export type LessonAnalysis = z.infer<
  typeof LessonAnalysisSchema
>;

export const WebsiteBlueprintSchema = z.object({
  title: z.string(),
  tagline: z.string(),
  experienceType: z.string(),
  theme: z.object({
    style: z.string(),
    primaryColor: z.string(),
    backgroundColor: z.string()
  }),
  pages: z.array(z.object({
    title: z.string(),
    purpose: z.string()
  })),
  activities: z.array(z.object({
    id: z.string(),
    title: z.string(),
    type: z.string(),
    instructions: z.string(),
    learningObjective: z.string(),
    mechanics: z.string()
  }))
});

export type WebsiteBlueprint = z.infer<
  typeof WebsiteBlueprintSchema
>;


export const GeneratedWebsiteSchema = z.object({
  title: z.string(),
  html: z.string(),
  css: z.string(),
  javascript: z.string(),
  implementationNotes: z.array(z.string())
});

export type GeneratedWebsite = z.infer<
  typeof GeneratedWebsiteSchema
>;


export const WebsiteTestReportSchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  summary: z.string(),
  tests: z.array(
    z.object({
      name: z.string(),
      passed: z.boolean(),
      details: z.string()
    })
  ),
  errors: z.array(z.string())
});

export type WebsiteTestReport = z.infer<
  typeof WebsiteTestReportSchema
>;
