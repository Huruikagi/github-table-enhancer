import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect, type Page, test } from "@playwright/test";
import { fixtureUrl } from "./extension-fixture";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensionPath = path.join(repositoryRoot, "dist");
const videoDirectory = path.join(repositoryRoot, "docs", "store-assets", "videos");
const videoPath = path.join(videoDirectory, "github-table-enhancer-demo.webm");

const demoFixture = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Table Enhancer for GitHub</title>
    <style>
      * { box-sizing: border-box; }
      body { color: #1f2328; font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; }
      header { align-items: center; border-bottom: 1px solid #d0d7de; display: flex; height: 64px; padding: 0 48px; }
      header strong { font-size: 18px; }
      .repository-content { margin: 0 auto; max-width: 1180px; padding: 28px 48px 80px; }
      h1 { font-size: 28px; margin: 0 0 8px; }
      .lead { color: #656d76; font-size: 16px; margin: 0 0 24px; }
      .markdown-body table { border-collapse: collapse; display: block; margin-bottom: 16px; max-width: 100%; overflow: auto; }
      .markdown-body th, .markdown-body td { border: 1px solid #d0d7de; padding: 9px 13px; text-align: left; white-space: nowrap; }
      .markdown-body th { background: #f6f8fa; font-weight: 600; }
      #demo-caption { background: rgba(31, 35, 40, .92); border-radius: 8px; bottom: 28px; color: white; font-size: 22px; font-weight: 600; left: 50%; opacity: 0; padding: 12px 22px; pointer-events: none; position: fixed; transform: translate(-50%, 12px); transition: opacity .25s, transform .25s; z-index: 2147483647; }
      #demo-caption[data-visible="true"] { opacity: 1; transform: translate(-50%, 0); }
    </style>
  </head>
  <body>
    <header><strong>octo-org / release-dashboard</strong></header>
    <main class="repository-content markdown-body">
      <h1>Release compatibility matrix</h1>
      <p class="lead">A wide GitHub Markdown table, made easier to explore.</p>
      <h2>Supported environments</h2>
      <table>
        <thead><tr><th>Product</th><th>Status</th><th>Runtime</th><th>Package manager</th><th>Platform</th><th>Release notes</th></tr></thead>
        <tbody>
          <tr><td>Web application</td><td>Ready</td><td>Node.js 26</td><td>pnpm 11</td><td>Windows / macOS / Linux</td><td>Validated for the July stable release.</td></tr>
          <tr><td>Documentation</td><td>Ready</td><td>Static</td><td>pnpm 11</td><td>GitHub Pages</td><td>Search and navigation updates are included.</td></tr>
          <tr><td>Browser extension</td><td>In review</td><td>Chrome Stable</td><td>Chrome Web Store</td><td>Windows / macOS / Linux</td><td>Store review is currently in progress.</td></tr>
          <tr><td>Developer preview</td><td>Testing</td><td>Node.js 27</td><td>pnpm 11</td><td>Linux</td><td>Experimental runtime compatibility checks.</td></tr>
          <tr><td>Legacy integration</td><td>Archived</td><td>Node.js 20</td><td>npm 10</td><td>Windows</td><td>Maintained for critical fixes only.</td></tr>
          <tr><td>Automation runner</td><td>Ready</td><td>Node.js 26</td><td>pnpm 11</td><td>GitHub Actions</td><td>Build, test, and packaging workflows passed.</td></tr>
        </tbody>
      </table>
    </main>
    <div id="demo-caption" aria-hidden="true"></div>
  </body>
</html>`;

async function pause(page: Page, milliseconds = 900): Promise<void> {
  await page.waitForTimeout(milliseconds);
}

async function caption(page: Page, text: string): Promise<void> {
  await page.locator("#demo-caption").evaluate((element, value) => {
    element.textContent = value;
    element.dataset.visible = "true";
  }, text);
  await pause(page, 1_300);
  await page.locator("#demo-caption").evaluate((element) => {
    element.dataset.visible = "false";
  });
  await pause(page, 350);
}

async function click(page: Page, locator: ReturnType<Page["locator"]>): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
    await pause(page, 250);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  } else {
    await locator.click();
  }
  await pause(page);
}

test("records the store demo", async () => {
  const testInfo = test.info();
  await fs.mkdir(videoDirectory, { recursive: true });
  await fs.rm(videoPath, { force: true });

  const context = await chromium.launchPersistentContext(testInfo.outputPath("profile"), {
    channel: "chromium",
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: testInfo.outputPath("recording"), size: { width: 1280, height: 720 } },
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  const page = context.pages()[0] ?? (await context.newPage());
  const video = page.video();

  try {
    await page.route(fixtureUrl, (route) =>
      route.fulfill({ body: demoFixture, contentType: "text/html" }),
    );
    await page.goto(fixtureUrl);
    const wrapper = page.locator(".github-table-enhancer-scroll");
    await expect(wrapper).toBeVisible();
    await pause(page, 1_500);

    console.log("Demo step: Freeze");
    await caption(page, "Freeze headers and columns");
    await click(page, wrapper.getByRole("button", { name: "Freeze" }));
    await wrapper.getByLabel("Frozen rows").fill("1");
    await pause(page, 600);
    await wrapper.getByLabel("Frozen columns").fill("1");
    await pause(page, 1_000);
    await page.keyboard.press("Escape");

    console.log("Demo step: Filter");
    await caption(page, "Filter rows instantly");
    await click(page, wrapper.getByRole("button", { name: "Filter" }));
    await wrapper.getByLabel("Filter rows").pressSequentially("ready", { delay: 120 });
    await pause(page, 1_300);
    await click(page, wrapper.getByRole("button", { name: "Clear filter" }));
    await page.keyboard.press("Escape");

    console.log("Demo step: Fit and Wrap");
    await caption(page, "Fit and wrap wide content");
    await click(page, wrapper.getByRole("button", { name: "Fit" }));
    await click(page, wrapper.getByRole("button", { name: "Wrap" }));

    console.log("Demo step: Focus mode");
    await caption(page, "Focus on the table");
    await click(page, wrapper.getByRole("button", { name: "Expand" }));
    await pause(page, 1_400);
    await click(page, wrapper.getByRole("button", { name: "Close" }));

    console.log("Demo step: Reset");
    await caption(page, "Reset the view anytime");
    await click(page, wrapper.getByRole("button", { name: "Reset table view" }));
    await pause(page, 1_500);

    await page.close();
    console.log("Demo step: Save video");

    if (!video) {
      throw new Error("Playwright did not create a video recording.");
    }
    await video.saveAs(videoPath);
    console.log(`Demo video: ${videoPath}`);
  } finally {
    await context.close();
  }
});
