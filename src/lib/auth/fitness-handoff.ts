import { accountContract, accountExperienceContexts } from "@/config/account";

export type FitnessHandoffActivation = Readonly<{
  fitnessConsumerMerge: string;
  fitnessConsumerReceiptSha256: string;
  r101TerminalSha256: string;
  state: "active" | "inactive";
  w10ExecutionSha256: string;
  w10SettlementSha256: string;
}>;

const requiredActivation = {
  fitnessConsumerMerge: "1d6c5ad54d61ea0d1b3d5a51eb4b939ccb2ed2a3",
  fitnessConsumerReceiptSha256: "be616b7f9c75a705e9e0c2a73f84ede64799ed3373360892b2dc9b1625838007",
  r101TerminalSha256: "d967e2beebd40bd59f7237024ff3064f232a899b1c1cef555c20542dda239f47",
  state: "active",
  w10ExecutionSha256: "ea5bcf7a1322827923036f06de50f6ca6834bcc778129a047a10f339cbbf1f39",
  w10SettlementSha256: "0043d87c72573185b859b3b767efe7e4b5b8353a33135f2219ecb23022c2392a",
} as const satisfies FitnessHandoffActivation;

/**
 * Production activation is source-bound to the reviewed Fitness consumer and
 * accepted master data/store postimages. It remains closed on preview, local,
 * foreign, malformed, or evidence-drifted runtimes.
 */
export const FITNESS_HANDOFF_ACTIVATION = Object.freeze({ ...requiredActivation });

export function fitnessHandoffRuntimeReady(
  runtimeOrigin: string,
  activation: FitnessHandoffActivation = FITNESS_HANDOFF_ACTIVATION,
): boolean {
  try {
    const candidate = new URL(runtimeOrigin);
    return candidate.origin === accountContract.canonicalOrigin
      && !candidate.username && !candidate.password
      && accountExperienceContexts.fitness.consumerIntegration === "active"
      && activation.state === requiredActivation.state
      && activation.fitnessConsumerMerge === requiredActivation.fitnessConsumerMerge
      && activation.fitnessConsumerReceiptSha256 === requiredActivation.fitnessConsumerReceiptSha256
      && activation.r101TerminalSha256 === requiredActivation.r101TerminalSha256
      && activation.w10ExecutionSha256 === requiredActivation.w10ExecutionSha256
      && activation.w10SettlementSha256 === requiredActivation.w10SettlementSha256;
  } catch {
    return false;
  }
}

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
const maxResponseBodyBytes = 16 * 1024;

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
  isAttemptCurrent?: () => boolean | Promise<boolean>;
  persistSession: (session: SessionPair) => Promise<void>;
  readSession: () => Promise<SessionPair | null>;
  request?: typeof fetch;
};

function exactObject(value: unknown, keys: string[]): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)));
}

function validSessionPair(value: unknown): value is SessionPair {
  return exactObject(value, ["accessToken", "refreshToken"]) &&
    typeof value.accessToken === "string" && typeof value.refreshToken === "string" &&
    Boolean(value.accessToken.trim()) && Boolean(value.refreshToken.trim()) &&
    value.accessToken.length <= maxTokenLength && value.refreshToken.length <= maxTokenLength;
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
        if (length > maxResponseBodyBytes) throw new FitnessHandoffError();
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
    const assertCurrent = async () => {
      if (dependencies.isAttemptCurrent && !await dependencies.isAttemptCurrent()) {
        throw new FitnessHandoffError();
      }
    };
    const returnTo = fitnessReturnPath(candidate);
    const started = await post("/auth/session-handoff", { returnTo });
    if (!exactObject(started, ["ok", "handoffId", "returnTo"]) || started.ok !== true ||
      typeof started.handoffId !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(started.handoffId) ||
      started.returnTo !== returnTo) throw new FitnessHandoffError();
    await assertCurrent();

    // Tokens stay inside this invocation; they never enter PortalSession or React state.
    const pair = await bounded(() => dependencies.readSession());
    if (!validSessionPair(pair)) throw new FitnessHandoffError();
    await assertCurrent();
    const finished = await post("/auth/session-sync", {
      handoffId: started.handoffId, accessToken: pair.accessToken, refreshToken: pair.refreshToken,
    });
    if (!exactObject(finished, ["ok", "returnTo", "session"])) throw new FitnessHandoffError();
    const rotatedSession = finished.session;
    if (finished.ok !== true || finished.returnTo !== returnTo ||
      !validSessionPair(rotatedSession)) throw new FitnessHandoffError();
    await assertCurrent();
    // Local persistence is awaited to completion rather than deadline-raced. A timed-out
    // promise must never continue later and overwrite a sign-out or newer login.
    await dependencies.persistSession(rotatedSession);
    await assertCurrent();
    return `${origin}${returnTo}`;
  } catch {
    throw new FitnessHandoffError();
  }
}
