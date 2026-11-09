
import {
  chromium,
  type BrowserContext,
  type Page
} from "playwright";

import type {
  WebsiteTestReport
} from "./schemas";

type TestResult =
  WebsiteTestReport["tests"][number];

const TEST_TIMEOUT = 2500;
const MAX_NAVIGATION_STEPS = 20;
const MAX_COMPONENTS = 20;

const FLIP_SELECTOR = '[data-testid="flip-card"]';
const QUIZ_SUBMIT = '[data-testid="quiz-submit"]';
const QUIZ_OPTION = '[data-testid="quiz-option"]';
const QUIZ_FEEDBACK = '[data-testid="quiz-feedback"]';
const TAB_SELECTOR = '[data-testid="tab"]';
const NEXT_SELECTOR = '[data-testid="nav-next"]';

function addTest(
  tests: TestResult[],
  name: string,
  passed: boolean,
  details: string
) {
  tests.push({ name, passed, details });
}

function shortError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  // Avoid passing huge Playwright call logs
  // back to Arus during repair.
  return message
    .split("\n")[0]
    .replace(/\x1b\[[0-9;]*m/g, "")
    .slice(0, 220);
}

async function visibleCount(
  page: Page,
  selector: string
): Promise<number> {
  return page.locator(`${selector}:visible`).count();
}

async function testVisibleFlipCards(
  page: Page,
  tested: Set<number>,
  failures: string[]
) {
  const cards = page.locator(FLIP_SELECTOR);
  const count = Math.min(
    await cards.count(),
    MAX_COMPONENTS
  );

  for (let i = 0; i < count; i++) {
    if (tested.has(i)) continue;

    const card = cards.nth(i);

    if (!(await card.isVisible())) continue;

    try {
      const initial =
        await card.getAttribute("aria-pressed");

      if (initial !== "false") {
        throw new Error(
          "Initial aria-pressed is not false"
        );
      }

      await card.click({
        timeout: TEST_TIMEOUT
      });

      const flipped =
        await card.getAttribute("aria-pressed");

      if (flipped !== "true") {
        throw new Error(
          "Click did not activate flipped state"
        );
      }

      await card.click({
        timeout: TEST_TIMEOUT
      });

      const restored =
        await card.getAttribute("aria-pressed");

      if (restored !== "false") {
        throw new Error(
          "Second click did not restore front state"
        );
      }

      tested.add(i);

    } catch (error) {
      tested.add(i);
      failures.push(
        `Flip card ${i + 1}: ${shortError(error)}`
      );
    }
  }
}

async function testVisibleQuizzes(
  page: Page,
  tested: Set<number>,
  failures: string[]
) {
  const submits = page.locator(QUIZ_SUBMIT);
  const count = Math.min(
    await submits.count(),
    MAX_COMPONENTS
  );

  for (let i = 0; i < count; i++) {
    if (tested.has(i)) continue;

    const submit = submits.nth(i);

    if (!(await submit.isVisible())) continue;

    try {
      // Prefer the closest enclosing quiz container.
      const container = submit.locator(
        'xpath=ancestor::*[contains(@class,"quiz") or self::form][1]'
      );

      const scope =
        (await container.count()) > 0
          ? container
          : page.locator("body");

      let options = scope.locator(
        `${QUIZ_OPTION}:visible`
      );

      // Fallback for unusual generated markup.
      if ((await options.count()) === 0) {
        options = page.locator(
          `${QUIZ_OPTION}:visible`
        );
      }

      if ((await options.count()) === 0) {
        throw new Error(
          "No visible answer options"
        );
      }

      const option = options.first();

      const tag = await option.evaluate(
        element =>
          element.tagName.toLowerCase()
      );

      if (
        tag === "input" &&
        (await option.getAttribute("type")) === "radio"
      ) {
        await option.check({
          timeout: TEST_TIMEOUT
        });
      } else {
        await option.click({
          timeout: TEST_TIMEOUT
        });
      }

      const before = await page.locator(
        QUIZ_FEEDBACK
      ).allTextContents();

      await submit.click({
        timeout: TEST_TIMEOUT
      });

      const feedback = page.locator(
        `${QUIZ_FEEDBACK}:visible`
      );

      if ((await feedback.count()) === 0) {
        throw new Error(
          "No visible feedback after submission"
        );
      }

      const after =
        await feedback.first().innerText();

      if (!after.trim()) {
        throw new Error(
          "Submission produced empty feedback"
        );
      }

      tested.add(i);

    } catch (error) {
      tested.add(i);
      failures.push(
        `Quiz ${i + 1}: ${shortError(error)}`
      );
    }
  }
}

async function discoverAndTestInteractions(
  page: Page
) {
  const testedCards = new Set<number>();
  const testedQuizzes = new Set<number>();

  const flipFailures: string[] = [];
  const quizFailures: string[] = [];

  const visited = new Set<string>();

  async function inspectCurrentSection() {
    await testVisibleFlipCards(
      page,
      testedCards,
      flipFailures
    );

    await testVisibleQuizzes(
      page,
      testedQuizzes,
      quizFailures
    );
  }

  // Test initially visible components.
  await inspectCurrentSection();

  // Explore tab-controlled sections.
  const tabs = page.locator(TAB_SELECTOR);
  const tabCount = Math.min(
    await tabs.count(),
    MAX_NAVIGATION_STEPS
  );

  for (let i = 0; i < tabCount; i++) {
    const tab = tabs.nth(i);

    if (!(await tab.isVisible())) continue;

    try {
      await tab.click({
        timeout: TEST_TIMEOUT
      });

      await inspectCurrentSection();
    } catch {
      // Navigation may be unavailable in this state.
      // Continue exploring other controls.
    }
  }

  // Explore sequential Next navigation.
  for (
    let step = 0;
    step < MAX_NAVIGATION_STEPS;
    step++
  ) {
    await inspectCurrentSection();

    const signature = await page.evaluate(() => {
      const activeTabs = Array.from(
        document.querySelectorAll(
          '[data-testid="tab"][aria-selected="true"]'
        )
      ).map(element => element.textContent?.trim());

      const visibleText =
        document.body.innerText.slice(0, 1000);

      return JSON.stringify({
        activeTabs,
        visibleText
      });
    });

    if (visited.has(signature)) break;
    visited.add(signature);

    const next = page.locator(
      `${NEXT_SELECTOR}:visible`
    );

    if ((await next.count()) === 0) break;

    const button = next.first();

    if (!(await button.isEnabled())) break;

    try {
      await button.click({
        timeout: TEST_TIMEOUT
      });
    } catch {
      break;
    }
  }

  await inspectCurrentSection();

  return {
    testedCards,
    testedQuizzes,
    flipFailures,
    quizFailures
  };
}

export async function runEmbun(
  html: string
): Promise<WebsiteTestReport> {
  console.log(
    "🧪 Embun: Starting functional browser tests..."
  );

  const tests: TestResult[] = [];
  const errors: string[] = [];

  const browser = await chromium.launch({
    headless: true
  });

  let context: BrowserContext | undefined;

  try {
    context = await browser.newContext({
      viewport: {
        width: 1280,
        height: 800
      },
      javaScriptEnabled: true,
      serviceWorkers: "block",
      acceptDownloads: false
    });

    await context.route("**/*", route =>
      route.abort()
    );

    const page = await context.newPage();

    page.setDefaultTimeout(TEST_TIMEOUT);

    page.on("pageerror", error => {
      errors.push(error.message);
    });

    page.on("console", message => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    });

    await page.setContent(html, {
      waitUntil: "load",
      timeout: 15000
    });

    // ====================================
    // Basic rendering
    // ====================================

    const bodyText =
      await page.locator("body").innerText();

    addTest(
      tests,
      "Page loads successfully",
      bodyText.trim().length > 0,
      bodyText.trim().length > 0
        ? "Generated HTML rendered."
        : "Page has no visible content."
    );

    const headings =
      await page.locator("h1,h2,h3").count();

    addTest(
      tests,
      "Page contains headings",
      headings > 0,
      `Found ${headings} headings.`
    );

    const controls =
      await page.locator(
        "button,input,select,textarea,a[href]"
      ).count();

    addTest(
      tests,
      "Interactive elements exist",
      controls > 0,
      `Found ${controls} interactive controls.`
    );

    // ====================================
    // Discover interactive sections
    // ====================================

    const totalCards =
      await page.locator(FLIP_SELECTOR).count();

    const totalQuizzes =
      await page.locator(QUIZ_SUBMIT).count();

    const interactionResults =
      await discoverAndTestInteractions(page);

    // ====================================
    // Flip card results
    // ====================================

    if (totalCards > 0) {
      const tested =
        interactionResults.testedCards.size;

      const failures =
        interactionResults.flipFailures;

      const unreachable =
        totalCards - tested;

      addTest(
        tests,
        "Flip card functionality",
        failures.length === 0 &&
          unreachable === 0,
        failures.length > 0
          ? failures.join("; ")
          : unreachable > 0
          ? `${unreachable} flip cards were not reachable during navigation.`
          : `${tested} flip cards toggled correctly.`
      );
    }

    // ====================================
    // Quiz results
    // ====================================

    if (totalQuizzes > 0) {
      const tested =
        interactionResults.testedQuizzes.size;

      const failures =
        interactionResults.quizFailures;

      const unreachable =
        totalQuizzes - tested;

      addTest(
        tests,
        "Quiz functionality",
        failures.length === 0 &&
          unreachable === 0,
        failures.length > 0
          ? failures.join("; ")
          : unreachable > 0
          ? `${unreachable} quizzes were not reachable during navigation.`
          : `${tested} quizzes produced feedback.`
      );
    }

    // ====================================
    // Accessibility
    // ====================================

    const unnamedButtons =
      await page.locator("button").evaluateAll(
        buttons =>
          buttons.filter(button => {
            const label =
              button.getAttribute("aria-label") ||
              button.textContent?.trim() ||
              button.getAttribute("title");

            return !label;
          }).length
      );

    addTest(
      tests,
      "Button accessibility",
      unnamedButtons === 0,
      unnamedButtons === 0
        ? "All buttons have labels."
        : `${unnamedButtons} buttons lack labels.`
    );

    // ====================================
    // Mobile layout
    // ====================================

    await page.setViewportSize({
      width: 390,
      height: 844
    });

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth >
      window.innerWidth + 5
    );

    addTest(
      tests,
      "Mobile layout has no horizontal overflow",
      !overflow,
      overflow
        ? "Horizontal overflow detected."
        : "No horizontal overflow detected."
    );

    // ====================================
    // JavaScript errors
    // ====================================

    addTest(
      tests,
      "No JavaScript runtime errors",
      errors.length === 0,
      errors.length === 0
        ? "No runtime errors detected."
        : errors.slice(0, 5).join("; ")
    );

    // ====================================
    // Final report
    // ====================================

    const passedCount =
      tests.filter(test => test.passed).length;

    const score = Math.round(
      (passedCount / tests.length) * 100
    );

    const report: WebsiteTestReport = {
      passed:
        passedCount === tests.length,
      score,
      summary:
        `${passedCount}/${tests.length} browser checks passed.`,
      tests,
      errors
    };

    console.log(
      `🧪 Embun: Testing completed — ${score}%`
    );

    return report;

  } finally {
    await context?.close();
    await browser.close();
  }
}
