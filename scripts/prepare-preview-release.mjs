import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

function usage() {
  console.error(
    "Usage: node scripts/prepare-preview-release.mjs --artifact-ref <ref> --output-dir <dir> --lifeline-root <path> [--manifest <path>] [--environment <preview|pr-N>] [--created-at <iso>]",
  );
}

function parseArgs(argv) {
  const options = {
    environment: "preview",
    manifestPath: path.join(".lifeline", "wave1-deploy.manifest.json"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case "--artifact-ref":
        options.artifactRef = next;
        index += 1;
        break;
      case "--output-dir":
        options.outputDir = next;
        index += 1;
        break;
      case "--lifeline-root":
        options.lifelineRoot = next;
        index += 1;
        break;
      case "--manifest":
        options.manifestPath = next;
        index += 1;
        break;
      case "--environment":
        options.environment = next;
        index += 1;
        break;
      case "--created-at":
        options.createdAt = next;
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.artifactRef || !options.outputDir || !options.lifelineRoot) {
    usage();
    throw new Error("Missing required preview release arguments.");
  }

  if (
    options.environment !== "preview" &&
    !/^pr-[1-9][0-9]*$/u.test(options.environment)
  ) {
    throw new Error(
      `Unsupported environment '${options.environment}'. Use 'preview' or 'pr-<number>'.`,
    );
  }

  return options;
}

function deriveZone(appName, domain) {
  const prefix = `${appName}.`;
  if (!domain.startsWith(prefix)) {
    throw new Error(
      `Route domain '${domain}' must begin with '${prefix}' to derive the preview zone.`,
    );
  }

  return domain.slice(prefix.length);
}

function derivePreviewDomain(appName, prodDomain, environment) {
  const zone = deriveZone(appName, prodDomain);
  if (environment === "preview") {
    return `preview-${appName}.${zone}`;
  }

  return `${environment}.${appName}.${zone}`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifestPath = path.resolve(options.manifestPath);
  const outputDir = path.resolve(options.outputDir);
  const lifelineRoot = path.resolve(options.lifelineRoot);
  const createdAt = options.createdAt ?? new Date().toISOString();

  const rawManifest = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(rawManifest);
  const previewDomain = derivePreviewDomain(
    manifest.appName,
    manifest.route?.domain,
    options.environment,
  );

  const previewManifest = {
    ...manifest,
    artifactRef: options.artifactRef,
    route: {
      ...manifest.route,
      domain: previewDomain,
    },
  };

  const contractModule = await import(
    pathToFileURL(
      path.join(lifelineRoot, "control-plane", "wave1-deploy-contract.mjs"),
    ).href,
  );

  const dryRunPlan = contractModule.buildWave1DryRunPlan(previewManifest, {
    createdAt,
  });
  const releasePlan = contractModule.buildWave1ReleasePlan(previewManifest, {
    createdAt,
  });

  if (!releasePlan.releaseMetadata) {
    throw new Error(
      `Unable to derive release metadata: ${JSON.stringify(
        releasePlan.validation?.issues ?? [],
      )}`,
    );
  }

  await mkdir(outputDir, { recursive: true });

  const files = {
    deployManifestPath: path.join(outputDir, "deploy-manifest.preview.json"),
    dryRunPlanPath: path.join(outputDir, "release-dry-run.preview.json"),
    releasePlanPath: path.join(outputDir, "release-plan.preview.json"),
    releaseMetadataPath: path.join(outputDir, "release-metadata.preview.json"),
    summaryPath: path.join(outputDir, "preview-summary.json"),
  };

  const summary = {
    appName: releasePlan.appName,
    environment: options.environment,
    previewDomain,
    previewUrl: `https://${previewDomain}${previewManifest.route?.path ?? "/"}`,
    artifactRef: releasePlan.releaseMetadata.artifactRef,
    releaseId: releasePlan.releaseId,
    releaseTarget: releasePlan.releaseMetadata.releaseTarget,
    sourceAdapter: releasePlan.releaseMetadata.sourceAdapter ?? null,
    createdAt,
    files: {
      deployManifest: files.deployManifestPath,
      dryRunPlan: files.dryRunPlanPath,
      releasePlan: files.releasePlanPath,
      releaseMetadata: files.releaseMetadataPath,
    },
  };

  await Promise.all([
    writeFile(
      files.deployManifestPath,
      `${JSON.stringify(previewManifest, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      files.dryRunPlanPath,
      `${JSON.stringify(dryRunPlan, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      files.releasePlanPath,
      `${JSON.stringify(releasePlan, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      files.releaseMetadataPath,
      `${contractModule.serializeWave1ReleaseMetadata(
        releasePlan.releaseMetadata,
      )}\n`,
      "utf8",
    ),
    writeFile(files.summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8"),
  ]);

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : `Unexpected error: ${String(error)}`,
  );
  process.exitCode = 1;
});
