
import { runSuria } from "./suria";
import { runSaujana } from "./saujana";
import { runArus, repairArus } from "./arus";
import { runEmbun } from "./embun";

import {
  buildWebsite,
  saveWebsite
} from "../services/websiteBuilder";

import type {
  AgentReporter,
  AgentName
} from "./agentEvents";

import type {
  WebsiteTestReport
} from "./schemas";

const MAX_REPAIR_ATTEMPTS = 2;

// ========================================
// Helpers
// ========================================

function getFailureSummary(
  testReport: WebsiteTestReport
): string {
  const failedTests = testReport.tests.filter(
    test => !test.passed
  );

  if (failedTests.length === 0) {
    return testReport.errors.length > 0
      ? testReport.errors.slice(0, 2).join("; ")
      : "No failed checks reported";
  }

  return failedTests
    .slice(0, 3)
    .map(test => test.name)
    .join(", ");
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : String(error);
}

// ========================================
// Izzy Orchestrator
// ========================================

export async function runIzzy(
  documentText: string,
  mode: "auto" | "custom",
  instructions: string,
  report: AgentReporter = () => {}
) {
  let currentAgent: AgentName = "Izzy";

  report(
    "Izzy",
    "thinking",
    "Starting learning website generation"
  );

  try {
    // ====================================
    // Stage 1 — Content analysis
    // ====================================

    currentAgent = "Suria";

    report(
      "Suria",
      "working",
      "Analyzing teaching materials"
    );

    const analysis = await runSuria(
      documentText
    );

    report(
      "Suria",
      "completed",
      "Content analysis completed"
    );

    // ====================================
    // Stage 2 — Experience design
    // ====================================

    currentAgent = "Saujana";

    report(
      "Saujana",
      "working",
      "Designing interactive learning experience"
    );

    const blueprint = await runSaujana(
      analysis,
      mode,
      instructions
    );

    report(
      "Saujana",
      "completed",
      "Learning experience blueprint completed"
    );

    // ====================================
    // Stage 3 — Website generation
    // ====================================

    currentAgent = "Arus";

    report(
      "Arus",
      "working",
      "Developing interactive learning website"
    );

    let website = await runArus(
      analysis,
      blueprint
    );

    report(
      "Arus",
      "completed",
      "Initial website generated"
    );

    // ====================================
    // Stage 4 — Functional QA
    // ====================================

    currentAgent = "Embun";

    report(
      "Embun",
      "reviewing",
      "Testing website functionality in Chromium"
    );

    let testReport = await runEmbun(
      buildWebsite(website)
    );

    let repairAttempts = 0;

    // ====================================
    // Stage 5 — Automatic repair
    // ====================================

    while (
      !testReport.passed &&
      repairAttempts < MAX_REPAIR_ATTEMPTS
    ) {
      const failureSummary =
        getFailureSummary(testReport);

      report(
        "Embun",
        "completed",
        `QA score ${testReport.score}%. Issues: ${failureSummary}`
      );

      repairAttempts++;

      currentAgent = "Izzy";

      report(
        "Izzy",
        "thinking",
        `Requesting repair ${repairAttempts}/${MAX_REPAIR_ATTEMPTS}: ${failureSummary}`
      );

      currentAgent = "Arus";

      report(
        "Arus",
        "working",
        `Repairing failed interactions (attempt ${repairAttempts})`
      );

      website = await repairArus(
        website,
        testReport,
        analysis,
        blueprint
      );

      report(
        "Arus",
        "completed",
        `Repair attempt ${repairAttempts} completed`
      );

      // Retest the complete website.
      currentAgent = "Embun";

      report(
        "Embun",
        "reviewing",
        `Retesting website after repair ${repairAttempts}`
      );

      testReport = await runEmbun(
        buildWebsite(website)
      );
    }

    // ====================================
    // Stage 6 — Final QA decision
    // ====================================

    const qualityStatus:
      "passed" | "needs_review" =
      testReport.passed
        ? "passed"
        : "needs_review";

    if (testReport.passed) {
      report(
        "Embun",
        "completed",
        `All executed QA checks passed (${testReport.score}%)`
      );
    } else {
      report(
        "Embun",
        "failed",
        `QA needs review (${testReport.score}%): ${getFailureSummary(testReport)}`
      );
    }

    // ====================================
    // Stage 7 — Save generated website
    // ====================================

    currentAgent = "Izzy";

    report(
      "Izzy",
      "working",
      testReport.passed
        ? "Saving QA-approved website"
        : "Saving draft with QA warnings"
    );

    const saved = await saveWebsite(
      website
    );

    report(
      "Izzy",
      "completed",
      testReport.passed
        ? "Website ready for lecturer review"
        : "Draft saved with unresolved QA issues"
    );

    // ====================================
    // Return results
    // ====================================

    return {
      analysis,
      blueprint,

      website: {
        id: saved.websiteId,
        title: website.title,
        html: saved.html,
        implementationNotes:
          website.implementationNotes
      },

      testReport,
      repairAttempts,
      qualityStatus
    };

  } catch (error) {
    const message = getErrorMessage(error);

    console.error(
      `❌ Izzy workflow failed during ${currentAgent}:`,
      message
    );

    // Mark the agent that encountered the error.
    if (currentAgent !== "Izzy") {
      report(
        currentAgent,
        "failed",
        message
      );
    }

    report(
      "Izzy",
      "failed",
      `Workflow failed during ${currentAgent}: ${message}`
    );

    throw error;
  }
}
