import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

function usage() {
  console.error(
    "Usage: node scripts/deploy-preview-remote.mjs --deploy-manifest <path> --lifeline-root <path> [--state-root <path>] [--container-name <name>] [--bind-host <host>] [--host-port <port>] [--candidate-port <port>] [--health-timeout-seconds <n>] [--health-interval-ms <n>] [--dry-run]",
  );
}

function parseArgs(argv) {
  const options = {
    bindHost: "127.0.0.1",
    hostPort: 3000,
    candidatePort: 3300,
    healthTimeoutSeconds: 90,
    healthIntervalMs: 2000,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    switch (arg) {
      case "--deploy-manifest":
        options.deployManifestPath = next;
        index += 1;
        break;
      case "--lifeline-root":
        options.lifelineRoot = next;
        index += 1;
        break;
      case "--state-root":
        options.stateRoot = next;
        index += 1;
        break;
      case "--container-name":
        options.containerName = next;
        index += 1;
        break;
      case "--bind-host":
        options.bindHost = next;
        index += 1;
        break;
      case "--host-port":
        options.hostPort = Number(next);
        index += 1;
        break;
      case "--candidate-port":
        options.candidatePort = Number(next);
        index += 1;
        break;
      case "--health-timeout-seconds":
        options.healthTimeoutSeconds = Number(next);
        index += 1;
        break;
      case "--health-interval-ms":
        options.healthIntervalMs = Number(next);
        index += 1;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.deployManifestPath || !options.lifelineRoot) {
    usage();
    throw new Error("Missing required remote deploy arguments.");
  }

  if (!Number.isInteger(options.hostPort) || options.hostPort < 1) {
    throw new Error("Host port must be a positive integer.");
  }

  if (!Number.isInteger(options.candidatePort) || options.candidatePort < 1) {
    throw new Error("Candidate port must be a positive integer.");
  }

  return options;
}

function stripDockerPrefix(artifactRef) {
  return artifactRef.startsWith("docker://")
    ? artifactRef.slice("docker://".length)
    : artifactRef;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

async function ensureDockerLoggedIn(imageRef) {
  const username = process.env.PREVIEW_REGISTRY_USERNAME;
  const token = process.env.PREVIEW_REGISTRY_TOKEN;

  if (!username || !token) {
    return { loggedIn: false };
  }

  const registry = imageRef.split("/")[0];
  const result = await new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      ["login", registry, "--username", username, "--password-stdin"],
      {
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
    child.stdin.end(token);
  });

  if (result.code !== 0) {
    throw new Error(`docker login failed: ${result.stderr || result.stdout}`);
  }

  return { loggedIn: true, registry };
}

async function removeContainer(name) {
  const result = await runCommand("docker", ["rm", "--force", name]);
  if (result.code !== 0) {
    const stderr = result.stderr.trim();
    if (
      stderr.includes("No such container") ||
      stderr.includes("cannot remove container")
    ) {
      return;
    }
    throw new Error(`Failed to remove container '${name}': ${stderr}`);
  }
}

async function runContainer({ name, imageRef, bindHost, hostPort }) {
  const result = await runCommand("docker", [
    "run",
    "--detach",
    "--name",
    name,
    "--restart",
    "unless-stopped",
    "--publish",
    `${bindHost}:${hostPort}:3000`,
    imageRef,
  ]);

  if (result.code !== 0) {
    throw new Error(
      `Failed to start container '${name}': ${result.stderr || result.stdout}`,
    );
  }
}

async function healthcheck(url, timeoutSeconds, intervalMs) {
  const deadline = Date.now() + timeoutSeconds * 1000;
  let lastError = "Timed out waiting for healthcheck.";

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (response.ok) {
        return { ok: true, status: response.status, url };
      }
      lastError = `Healthcheck returned HTTP ${response.status}.`;
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : `Unexpected error: ${String(error)}`;
    }

    await delay(intervalMs);
  }

  return { ok: false, status: 0, url, detail: lastError };
}

async function loadCurrentReleaseMetadata({
  wave1ReleaseEngine,
  contractModule,
  stateRoot,
  appName,
}) {
  const state = await wave1ReleaseEngine.readWave1ReleaseState(stateRoot, appName);
  if (!state.current?.releaseId) {
    return { state, currentMetadata: null };
  }

  const layout = wave1ReleaseEngine.getWave1ReleaseLayout(
    stateRoot,
    appName,
    state.current.releaseId,
  );
  const parsed = contractModule.parseWave1ReleaseMetadata(
    await readFile(layout.releaseMetadataPath, "utf8"),
  );

  if (parsed.issues.length > 0 || !parsed.metadata) {
    throw new Error(
      `Current release metadata is invalid: ${JSON.stringify(parsed.issues)}`,
    );
  }

  return {
    state,
    currentMetadata: parsed.metadata,
  };
}

async function restorePreviousContainer({
  currentMetadata,
  containerName,
  bindHost,
  hostPort,
  timeoutSeconds,
  intervalMs,
}) {
  if (!currentMetadata) {
    return { restored: false, reason: "no-current-release" };
  }

  const currentImageRef = stripDockerPrefix(currentMetadata.artifactRef);
  await runCommand("docker", ["pull", currentImageRef]);
  await removeContainer(containerName).catch(() => undefined);
  await runContainer({
    name: containerName,
    imageRef: currentImageRef,
    bindHost,
    hostPort,
  });

  const restoredHealth = await healthcheck(
    `http://${bindHost}:${hostPort}${currentMetadata.healthcheckPath}`,
    timeoutSeconds,
    intervalMs,
  );

  return {
    restored: restoredHealth.ok,
    health: restoredHealth,
    artifactRef: currentMetadata.artifactRef,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const deployManifestPath = path.resolve(options.deployManifestPath);
  const lifelineRoot = path.resolve(options.lifelineRoot);
  const stateRoot = path.resolve(
    options.stateRoot ??
      path.join(process.env.HOME ?? process.cwd(), "lifeline-preview"),
  );

  const contractModule = await import(
    pathToFileURL(
      path.join(lifelineRoot, "control-plane", "wave1-deploy-contract.mjs"),
    ).href,
  );
  const wave1ReleaseEngine = await import(
    pathToFileURL(
      path.join(lifelineRoot, "control-plane", "wave1-release-engine.mjs"),
    ).href,
  );

  const manifest = JSON.parse(await readFile(deployManifestPath, "utf8"));
  const releasePlan = wave1ReleaseEngine.planWave1Release(manifest, {
    rootDir: stateRoot,
  });

  if (!releasePlan.releaseMetadata) {
    throw new Error(
      `Invalid release plan: ${JSON.stringify(
        releasePlan.validation?.issues ?? [],
      )}`,
    );
  }

  const containerName = options.containerName ?? `${releasePlan.appName}-preview`;
  const candidateName = `${containerName}-candidate`;
  const imageRef = stripDockerPrefix(releasePlan.releaseMetadata.artifactRef);
  const createdAt = releasePlan.releaseMetadata.createdAt;

  if (options.dryRun) {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: "dry-run",
          stateRoot,
          containerName,
          candidateName,
          bindHost: options.bindHost,
          hostPort: options.hostPort,
          candidatePort: options.candidatePort,
          releaseId: releasePlan.releaseId,
          artifactRef: releasePlan.releaseMetadata.artifactRef,
          previewUrl: `https://${releasePlan.releaseMetadata.route.domain}${
            releasePlan.releaseMetadata.route.path ?? "/"
          }`,
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  await mkdir(stateRoot, { recursive: true });
  const { currentMetadata } = await loadCurrentReleaseMetadata({
    wave1ReleaseEngine,
    contractModule,
    stateRoot,
    appName: releasePlan.appName,
  });

  await ensureDockerLoggedIn(imageRef);
  const pullResult = await runCommand("docker", ["pull", imageRef]);
  if (pullResult.code !== 0) {
    throw new Error(`docker pull failed: ${pullResult.stderr || pullResult.stdout}`);
  }

  await removeContainer(candidateName).catch(() => undefined);
  await runContainer({
    name: candidateName,
    imageRef,
    bindHost: options.bindHost,
    hostPort: options.candidatePort,
  });

  const candidateHealth = await healthcheck(
    `http://${options.bindHost}:${options.candidatePort}${releasePlan.releaseMetadata.healthcheckPath}`,
    options.healthTimeoutSeconds,
    options.healthIntervalMs,
  );

  if (!candidateHealth.ok) {
    await removeContainer(candidateName).catch(() => undefined);
    throw new Error(candidateHealth.detail ?? "Candidate container failed healthcheck.");
  }

  const persistedRelease = await wave1ReleaseEngine.persistWave1Release(manifest, {
    rootDir: stateRoot,
    createdAt,
    receiptAt: createdAt,
  });

  await removeContainer(containerName).catch(() => undefined);
  try {
    await runContainer({
      name: containerName,
      imageRef,
      bindHost: options.bindHost,
      hostPort: options.hostPort,
    });
  } catch (error) {
    await removeContainer(candidateName).catch(() => undefined);
    const failedActivation = await wave1ReleaseEngine.activateWave1Release(
      stateRoot,
      releasePlan.appName,
      releasePlan.releaseId,
      {
        receiptAt: createdAt,
        checkHealth: async () => ({
          ok: false,
          status: 0,
          detail:
            error instanceof Error ? error.message : `Unexpected error: ${String(error)}`,
        }),
      },
    );
    const restored = await restorePreviousContainer({
      currentMetadata,
      containerName,
      bindHost: options.bindHost,
      hostPort: options.hostPort,
      timeoutSeconds: options.healthTimeoutSeconds,
      intervalMs: options.healthIntervalMs,
    });
    throw new Error(
      JSON.stringify(
        {
          releaseId: releasePlan.releaseId,
          activation: failedActivation,
          restored,
        },
        null,
        2,
      ),
    );
  }

  const finalHealth = await healthcheck(
    `http://${options.bindHost}:${options.hostPort}${releasePlan.releaseMetadata.healthcheckPath}`,
    options.healthTimeoutSeconds,
    options.healthIntervalMs,
  );

  if (!finalHealth.ok) {
    await removeContainer(containerName).catch(() => undefined);
    await removeContainer(candidateName).catch(() => undefined);
    const failedActivation = await wave1ReleaseEngine.activateWave1Release(
      stateRoot,
      releasePlan.appName,
      releasePlan.releaseId,
      {
        receiptAt: createdAt,
        checkHealth: async () => finalHealth,
      },
    );
    const restored = await restorePreviousContainer({
      currentMetadata,
      containerName,
      bindHost: options.bindHost,
      hostPort: options.hostPort,
      timeoutSeconds: options.healthTimeoutSeconds,
      intervalMs: options.healthIntervalMs,
    });
    throw new Error(
      JSON.stringify(
        {
          releaseId: releasePlan.releaseId,
          activation: failedActivation,
          restored,
        },
        null,
        2,
      ),
    );
  }

  await removeContainer(candidateName).catch(() => undefined);

  const activation = await wave1ReleaseEngine.activateWave1Release(
    stateRoot,
    releasePlan.appName,
    releasePlan.releaseId,
    {
      receiptAt: createdAt,
      checkHealth: async () => finalHealth,
    },
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        appName: releasePlan.appName,
        releaseId: releasePlan.releaseId,
        artifactRef: releasePlan.releaseMetadata.artifactRef,
        previewUrl: `https://${releasePlan.releaseMetadata.route.domain}${
          releasePlan.releaseMetadata.route.path ?? "/"
        }`,
        stateRoot,
        containerName,
        candidateHealth,
        finalHealth,
        releaseMetadataPath: persistedRelease.layout?.releaseMetadataPath,
        receipt: activation.receipt,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : `Unexpected error: ${String(error)}`,
  );
  process.exitCode = 1;
});
