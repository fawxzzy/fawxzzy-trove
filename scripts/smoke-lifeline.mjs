import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const serveEntrypoint = path.join(
  repoRoot,
  "node_modules",
  "serve",
  "build",
  "main.js",
);
const port = 3210;
const baseUrl = `http://127.0.0.1:${port}`;

function startServer() {
  return spawn(
    process.execPath,
    [serveEntrypoint, "out", "--listen", `tcp://127.0.0.1:${port}`],
    {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

async function waitFor(url) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
    } catch {
      await delay(250);
      continue;
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function stopServer(server) {
  if (server.exitCode !== null) {
    return;
  }

  server.kill("SIGINT");
  await Promise.race([
    new Promise((resolve) => {
      server.once("exit", resolve);
    }),
    delay(5_000),
  ]);

  if (server.exitCode === null) {
    server.kill("SIGKILL");
    await new Promise((resolve) => {
      server.once("exit", resolve);
    });
  }
}

async function main() {
  const server = startServer();
  let stderr = "";

  server.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    const homeResponse = await waitFor(`${baseUrl}/`);
    const homeHtml = await homeResponse.text();

    if (!homeHtml.includes("Fawxzzy Trove")) {
      throw new Error("Home page smoke check did not render the Trove shell.");
    }

    const healthResponse = await waitFor(`${baseUrl}/healthz.json`);
    const health = await healthResponse.json();

    if (health.status !== "ok" || health.app !== "trove") {
      throw new Error("Health payload did not match the expected Trove contract.");
    }

    const manifestResponse = await waitFor(`${baseUrl}/manifest.webmanifest`);
    if (!manifestResponse.ok) {
      throw new Error("Manifest route did not respond successfully.");
    }
  } finally {
    await stopServer(server);
  }

  if (
    server.exitCode !== null &&
    server.exitCode !== 0 &&
    server.exitCode !== 130
  ) {
    throw new Error(stderr || `serve exited with code ${server.exitCode}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
