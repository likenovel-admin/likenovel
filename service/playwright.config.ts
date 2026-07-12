import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: "line",
  outputDir: "/tmp/likenovel-playwright-results",
  use: {
    baseURL: "http://127.0.0.1:3100",
    channel: "chrome",
    headless: true,
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command:
      "TZ=UTC NEXT_PUBLIC_API_SERVER_URI=http://127.0.0.1:9 corepack yarn dev --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
