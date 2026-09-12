import { accountContract } from "@/config/account";

export const FITNESS_HANDOFF_RUNTIME_READY = false;
export const FITNESS_HANDOFF_UNAVAILABLE =
  "Account signed in. Fitness connection unavailable.";

export class FitnessHandoffError extends Error {
  constructor() {
    super(FITNESS_HANDOFF_UNAVAILABLE);
    this.name = "FitnessHandoffError";
  }
}

const paths = new Set(["/", "/entry", "/today"]);
const origin = accountContract.productOrigins.fitness;
const timeoutMs = 10_000;
const maxTokenLength = 4 * 1024;
const maxRequestBodyBytes = 8 * 1024;

export function fitnessReturnPath(candidate: string): string {
  try {
    const url = new URL(candidate, origin);
    if (
      url.origin === origin && !url.username && !url.password &&
      !url.search && !url.hash && paths.has(url.pathname) &&
      !candidate.includes("\\") && !candidate.startsWith("//")
    ) return url.pathname;
  } catch { /* Use the fixed safe destination. */ }
  return "/entry";
}

type SessionPair = { accessToken: string; refreshToken: string };
type Dependencies = {
  enabled: boolean;
  readSession: () => Promise<SessionPair | null>;
  request?: typeof fetch;
};

function exactObject(value: unknown, keys: string[]): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)));
}

async function bounded<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new FitnessHandoffError()); }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** One attempt, fixed endpoints, no credentials or challenge IDs outside POST bodies. */
export async function completeFitnessHandoff(candidate: string, dependencies: Dependencies): Promise<string> {
  if (!dependencies.enabled) throw new FitnessHandoffError();
  const request = dependencies.request ?? fetch;
  const post = (path: string, body: object) => bounded(async (signal) => {
    const serialized = JSON.stringify(body);
    if (new TextEncoder().encode(serialized).byteLength > maxRequestBodyBytes) {
      throw new FitnessHandoffError();
    }
    const response = await request(`${origin}${path}`, {
      method: "POST", mode: "cors", credentials: "include", cache: "no-store",
      redirect: "error", referrerPolicy: "no-referrer", signal,
      headers: { "Content-Type": "application/json" }, body: serialized,
    });
    if (!response.ok || response.redirected ||
      response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
      throw new FitnessHandoffError();
    }
    // Never include an error body, URL, or provider detail in the thrown error.
    const reader = response.body?.getReader();
    if (!reader) throw new FitnessHandoffError();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 2048) throw new FitnessHandoffError();
        chunks.push(value);
      }
    } finally {
      void reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  });

  try {
    const returnTo = fitnessReturnPath(candidate);
    const started = await post("/auth/session-handoff", { returnTo });
    if (!exactObject(started, ["ok", "handoffId", "returnTo"]) || started.ok !== true ||
      typeof started.handoffId !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(started.handoffId) ||
      started.returnTo !== returnTo) throw new FitnessHandoffError();

    // Tokens stay inside this invocation; they never enter PortalSession or React state.
    const pair = await bounded(() => dependencies.readSession());
    if (!pair || typeof pair.accessToken !== "string" || typeof pair.refreshToken !== "string" ||
      !pair.accessToken.trim() || !pair.refreshToken.trim() ||
      pair.accessToken.length > maxTokenLength || pair.refreshToken.length > maxTokenLength) throw new FitnessHandoffError();
    const finished = await post("/auth/session-sync", {
      handoffId: started.handoffId, accessToken: pair.accessToken, refreshToken: pair.refreshToken,
    });
    if (!exactObject(finished, ["ok", "returnTo"]) || finished.ok !== true ||
      finished.returnTo !== returnTo) throw new FitnessHandoffError();
    return `${origin}${returnTo}`;
  } catch {
    throw new FitnessHandoffError();
  }
}
