import { expect, test } from "@playwright/test";
import {
  persistVerifiedFitnessSession,
  resolvePortalAuthAdapter,
} from "../../src/lib/auth/browser-adapter";
import {
  completeFitnessHandoff, fitnessReturnPath, FITNESS_HANDOFF_RUNTIME_READY,
  FITNESS_HANDOFF_UNAVAILABLE,
} from "../../src/lib/auth/fitness-handoff";

const id = "a".repeat(43);
const origin = "https://fitness.fawxzzy.com";
const pair = { accessToken: "synthetic-access", refreshToken: "synthetic-refresh" };
const rotatedPair = { accessToken: "rotated-access", refreshToken: "rotated-refresh" };
const begin = { ok: true, handoffId: id, returnTo: "/today" };
const end = { ok: true, returnTo: "/today", session: rotatedPair };
const persistSession = async () => undefined;
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { "Content-Type": "application/json" },
});

function fixture(responses: Response[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const request = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init! });
    const response = responses.shift();
    if (!response) throw new Error("Fixture must not make another request");
    return response;
  }) as typeof fetch;
  return { calls, request };
}

test("Fitness handoff is disabled for production preparation without any credential read or request", async () => {
  expect(FITNESS_HANDOFF_RUNTIME_READY).toBe(false);
  let reads = 0;
  const f = fixture([]);
  await expect(completeFitnessHandoff("/today", {
    enabled: false, persistSession, request: f.request,
    readSession: async () => { reads++; return pair; },
  })).rejects.toThrow(FITNESS_HANDOFF_UNAVAILABLE);
  expect(reads).toBe(0);
  expect(f.calls).toHaveLength(0);
});

test("begin binding precedes pair retrieval and consume precedes returned navigation", async () => {
  const f = fixture([json(begin), json(end)]);
  let persisted: typeof rotatedPair | null = null;
  const destination = await completeFitnessHandoff(`${origin}/today`, {
    enabled: true, request: f.request,
    persistSession: async (session) => {
      expect(f.calls).toHaveLength(2);
      persisted = session;
    },
    readSession: async () => { expect(f.calls).toHaveLength(1); return pair; },
  });
  expect(destination).toBe(`${origin}/today`);
  expect(persisted).toEqual(rotatedPair);
  expect(f.calls.map((call) => call.url)).toEqual([
    `${origin}/auth/session-handoff`, `${origin}/auth/session-sync`,
  ]);
  expect(JSON.parse(f.calls[0].init.body as string)).toEqual({ returnTo: "/today" });
  expect(JSON.parse(f.calls[1].init.body as string)).toEqual({ handoffId: id, ...pair });
  for (const { url, init } of f.calls) {
    expect(init).toMatchObject({
      method: "POST", credentials: "include", mode: "cors", cache: "no-store",
      redirect: "error", referrerPolicy: "no-referrer",
      headers: { "Content-Type": "application/json" },
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(url).not.toMatch(/synthetic|handoffId|[?#]/);
  }
});

for (const target of ["//evil.test", "https://evil.test/", "/login", "/auth/session-recovery",
  "/today?access_token=secret", "/today#fragment", "/today?returnTo=https://evil.test",
  "https://user:pass@fitness.fawxzzy.com/", "/\\evil.test", "/session/abc"]) {
  test(`closed Fitness return path: ${target}`, () => {
    expect(fitnessReturnPath(target)).toBe("/entry");
  });
}

for (const response of [
  null, [], { ...begin, ok: false }, { ...begin, handoffId: "short" },
  { ...begin, handoffId: "/".repeat(43) }, { ...begin, returnTo: "https://evil.test" },
  { ...begin, returnTo: "/entry" }, { ...begin, accessToken: "must-not-echo" },
]) {
  test(`malformed begin is terminal ${JSON.stringify(response)}`, async () => {
    const f = fixture([json(response)]);
    let reads = 0;
    await expect(completeFitnessHandoff("/today", {
      enabled: true, persistSession, request: f.request,
      readSession: async () => { reads++; return pair; },
    })).rejects.toThrow(FITNESS_HANDOFF_UNAVAILABLE);
    expect(f.calls).toHaveLength(1);
    expect(reads).toBe(0);
  });
}

for (const status of [401, 403, 409, 410, 429, 500, 503]) {
  test(`consume ${status} does not retry or echo provider response`, async () => {
    const f = fixture([json(begin), json({ error: "synthetic-access private detail" }, status)]);
    await expect(completeFitnessHandoff("/today", {
      enabled: true, persistSession, request: f.request, readSession: async () => pair,
    })).rejects.toThrow(FITNESS_HANDOFF_UNAVAILABLE);
    expect(f.calls).toHaveLength(2);
  });
}

for (const response of [null, { ok: false, returnTo: "/today" }, { ok: true, returnTo: "/entry" },
  { ok: true, returnTo: "//evil.test" }, { ...end, session: null },
  { ...end, session: { accessToken: "", refreshToken: "rotated-refresh" } },
  { ...end, session: { ...rotatedPair, extra: "must-not-accept" } },
  { ...end, refreshToken: "must-not-echo" }]) {
  test(`malformed consume cannot supply navigation ${JSON.stringify(response)}`, async () => {
    const f = fixture([json(begin), json(response)]);
    await expect(completeFitnessHandoff("/today", {
      enabled: true, persistSession, request: f.request, readSession: async () => pair,
    })).rejects.toThrow(FITNESS_HANDOFF_UNAVAILABLE);
    expect(f.calls).toHaveLength(2);
  });
}

test("rotated session persistence must succeed before navigation", async () => {
  const f = fixture([json(begin), json(end)]);
  let persistenceAttempts = 0;
  await expect(completeFitnessHandoff("/today", {
    enabled: true,
    persistSession: async (session) => {
      persistenceAttempts += 1;
      expect(session).toEqual(rotatedPair);
      throw new Error("private persistence detail");
    },
    readSession: async () => pair,
    request: f.request,
  })).rejects.toThrow(FITNESS_HANDOFF_UNAVAILABLE);
  expect(persistenceAttempts).toBe(1);
  expect(f.calls).toHaveLength(2);
});

test("a rotated session for another user is rejected before storage or subscriber mutation", async () => {
  let storageWrites = 0;
  let subscriberEvents = 0;
  const auth = {
    async getUser() {
      return { data: { user: { id: "wrong-user" } }, error: null };
    },
    async setSession() {
      storageWrites += 1;
      subscriberEvents += 1;
      throw new Error("setSession must not run for a mismatched user");
    },
  };
  await expect(persistVerifiedFitnessSession(auth, rotatedPair, "expected-user"))
    .rejects.toThrow(FITNESS_HANDOFF_UNAVAILABLE);
  expect(storageWrites).toBe(0);
  expect(subscriberEvents).toBe(0);
});

test("failed or missing current session never sends consume", async () => {
  for (const readSession of [async () => null, async () => { throw new Error("private detail"); },
    async () => ({ accessToken: "", refreshToken: "synthetic" })]) {
    const f = fixture([json(begin)]);
    await expect(completeFitnessHandoff("/today", {
      enabled: true, persistSession, request: f.request, readSession,
    })).rejects.toThrow(FITNESS_HANDOFF_UNAVAILABLE);
    expect(f.calls).toHaveLength(1);
  }
});

test("producer matches the consumer token and UTF-8 request-body bounds", async () => {
  for (const oversized of [
    { accessToken: "a".repeat(4097), refreshToken: "r" },
    { accessToken: "a", refreshToken: "r".repeat(4097) },
    { accessToken: "a".repeat(4096), refreshToken: "r".repeat(4096) },
    { accessToken: "\u00e9".repeat(4096), refreshToken: "r" },
  ]) {
    const f = fixture([json(begin)]);
    await expect(completeFitnessHandoff("/today", {
      enabled: true, persistSession, request: f.request, readSession: async () => oversized,
    })).rejects.toThrow(FITNESS_HANDOFF_UNAVAILABLE);
    expect(f.calls).toHaveLength(1);
  }
  const boundaryPair = { accessToken: "a".repeat(4096), refreshToken: "r" };
  const f = fixture([json(begin), json(end)]);
  await expect(completeFitnessHandoff("/today", {
    enabled: true, persistSession, request: f.request, readSession: async () => boundaryPair,
  })).resolves.toBe(`${origin}/today`);
  expect(JSON.parse(f.calls[1].init.body as string)).toEqual({ handoffId: id, ...boundaryPair });
  expect(new TextEncoder().encode(f.calls[1].init.body as string).byteLength).toBeLessThanOrEqual(8192);
});

test("a contract-valid maximum rotated pair fits the bounded response before persistence", async () => {
  const maximumRotatedPair = {
    accessToken: "a".repeat(4096),
    refreshToken: "r".repeat(4096),
  };
  const f = fixture([json(begin), json({ ...end, session: maximumRotatedPair })]);
  let persisted: typeof maximumRotatedPair | null = null;
  await expect(completeFitnessHandoff("/today", {
    enabled: true,
    persistSession: async (session) => { persisted = session; },
    readSession: async () => pair,
    request: f.request,
  })).resolves.toBe(`${origin}/today`);
  expect(persisted).toEqual(maximumRotatedPair);
});

test("non-JSON, oversized, redirect and network responses fail closed", async () => {
  const redirected = json(begin);
  Object.defineProperty(redirected, "redirected", { value: true });
  for (const response of [new Response("private error"), json("x".repeat(16 * 1024)), redirected]) {
    const f = fixture([response]);
    await expect(completeFitnessHandoff("/today", {
      enabled: true, persistSession, request: f.request, readSession: async () => pair,
    })).rejects.toThrow(FITNESS_HANDOFF_UNAVAILABLE);
    expect(f.calls).toHaveLength(1);
  }
  let attempts = 0;
  await expect(completeFitnessHandoff("/today", {
    enabled: true, persistSession, readSession: async () => pair,
    request: async () => { attempts++; throw new TypeError("private network detail"); },
  })).rejects.toThrow(FITNESS_HANDOFF_UNAVAILABLE);
  expect(attempts).toBe(1);
});

test("a stalled response hits the deadline with no retry", async () => {
  let signal: AbortSignal | undefined;
  await expect(completeFitnessHandoff("/today", {
    enabled: true, persistSession, readSession: async () => pair,
    request: async (_url, init) => { signal = init!.signal as AbortSignal; return new Promise(() => undefined); },
  })).rejects.toThrow(FITNESS_HANDOFF_UNAVAILABLE);
  expect(signal!.aborted).toBe(true);
});

test("failed local handoff preserves the authenticated adapter session", async () => {
  const resolution = resolvePortalAuthAdapter({
    origin: "http://127.0.0.1:3210", search: "?auth_test=fitness-handoff-error",
  });
  expect(resolution.status).toBe("ready");
  if (resolution.status !== "ready") throw new Error("Fixture unavailable");
  const signedIn = await resolution.adapter.signIn("fixture.user", "fixture-password");
  await expect(resolution.adapter.handoffToFitness("/today", signedIn!.userId))
    .rejects.toThrow(FITNESS_HANDOFF_UNAVAILABLE);
  expect(await resolution.adapter.getSession()).toEqual(signedIn);
});

test("portal handoff failure stays on login without external traffic", async ({ page }) => {
  const outgoing: string[] = [];
  await page.route("https://fitness.fawxzzy.com/**", async (route) => {
    outgoing.push(route.request().url());
    await route.abort();
  });
  await page.goto("/login?app=fitness&auth_test=fitness-handoff-error");
  await page.getByLabel("Email or username").fill("fixture.user");
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.locator(".account-auth-dock").getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator('.account-auth-live-notice[role="alert"]')).toHaveText(FITNESS_HANDOFF_UNAVAILABLE);
  await expect(page.getByRole("button", { name: FITNESS_HANDOFF_UNAVAILABLE, exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.locator("html")).not.toHaveAttribute("data-post-auth-destination");
  expect(outgoing).toEqual([]);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("fawxzzy.account.remembered-identity.v1")))
    .toContain("fixture.user");
});
