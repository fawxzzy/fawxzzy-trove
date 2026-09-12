import { expect, test } from "@playwright/test";
import { completeFitnessHandoff, FITNESS_HANDOFF_UNAVAILABLE } from "../../src/lib/auth/fitness-handoff";

// This suite joins the unchanged producer to Fitness's real handlers and durable
// local store. It never enables the production feature or sends real credentials.
const configuredOrigin = process.env.FITNESS_HANDOFF_INTEGRATION_ORIGIN;
const portalOrigin = "https://account.fawxzzy.com";
const fitnessOrigin = "https://fitness.fawxzzy.com";
const pair = {
  accessToken: "portal-integration-synthetic-access",
  refreshToken: "portal-integration-synthetic-refresh",
};
const bindingName = "__Host-fitness-handoff";

function localOrigin(raw: string): string {
  const url = new URL(raw);
  if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || !url.port ||
      url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Integration fixture must be an explicit loopback HTTP origin.");
  }
  return url.origin;
}

type CapturedCall = { path: string; body: string; binding: string; responseCookies: string[] };

function transport(base: string, withBinding = true) {
  let binding = "";
  const calls: CapturedCall[] = [];
  const request: typeof fetch = async (input, init) => {
    const target = new URL(String(input));
    if (target.origin !== fitnessOrigin || target.search || target.hash ||
        !["/auth/session-handoff", "/auth/session-sync"].includes(target.pathname) ||
        init?.method !== "POST" || typeof init.body !== "string") {
      throw new Error("Unexpected integration request.");
    }
    const headers = new Headers(init.headers);
    headers.set("Origin", portalOrigin);
    headers.delete("Cookie");
    if (withBinding && binding) headers.set("Cookie", binding);
    const call = { path: target.pathname, body: init.body, binding, responseCookies: [] as string[] };
    calls.push(call);
    const response = await fetch(`${base}${target.pathname}`, {
      ...init, headers, redirect: "error",
    });
    call.responseCookies = response.headers.getSetCookie();
    for (const value of call.responseCookies) {
      if (value.startsWith(`${bindingName}=`)) binding = value.split(";", 1)[0];
    }
    return response;
  };
  return { calls, request };
}

test("integration transport rejects non-loopback and ambiguous fixture targets", () => {
  for (const value of ["https://fitness.fawxzzy.com", "http://localhost:3211",
    "http://127.0.0.1", "http://127.0.0.1:3211/path", "http://u:p@127.0.0.1:3211",
    "http://127.0.0.1:3211/?x=1", "http://127.0.0.1:3211/#x"]) {
    expect(() => localOrigin(value)).toThrow();
  }
  expect(localOrigin("http://127.0.0.1:3211")).toBe("http://127.0.0.1:3211");
});

test.describe("producer joined to the real Fitness durable-store fixture", () => {
  test.skip(!configuredOrigin, "Requires the Fitness-owned synthetic durable-store fixture; not live acceptance.");
  let base: string;

  test.beforeAll(async () => {
    base = localOrigin(configuredOrigin!);
    const response = await fetch(`${base}/__handoff-test/health`, {
      redirect: "error", signal: AbortSignal.timeout(5_000),
    });
    expect(response.ok).toBe(true);
    expect(await response.json()).toEqual({
      ok: true, contract: "fitness-handoff-local-integration-v1", synthetic: true, durable: true,
    });
  });

  test("real begin and consume complete the producer's fixed return sequence", async () => {
    const wire = transport(base);
    let persisted: typeof pair | null = null;
    await expect(completeFitnessHandoff("/today", {
      enabled: true, request: wire.request,
      persistSession: async (session) => { persisted = session; },
      readSession: async () => { expect(wire.calls).toHaveLength(1); return pair; },
    })).resolves.toBe(`${fitnessOrigin}/today`);
    expect(persisted).toEqual(pair);
    expect(wire.calls.map(({ path }) => path)).toEqual(["/auth/session-handoff", "/auth/session-sync"]);
    expect(wire.calls[1].binding).toMatch(/^__Host-fitness-handoff=[A-Za-z0-9_-]{43}$/);
    for (const name of ["sb-access-token", "sb-refresh-token"]) {
      const cookie = wire.calls[1].responseCookies.find((value) => value.startsWith(`${name}=`));
      expect(cookie, `Successful consume must set ${name}`).toBeDefined();
      expect(cookie!.split(";", 1)[0].slice(name.length + 1)).not.toBe("");
      expect(cookie).toMatch(/;\s*HttpOnly(?:;|$)/i);
      expect(cookie).toMatch(/;\s*Secure(?:;|$)/i);
    }
  });

  test("missing browser binding fails without navigation or an automatic retry", async () => {
    const wire = transport(base, false);
    await expect(completeFitnessHandoff("/today", {
      enabled: true, persistSession: async () => undefined,
      request: wire.request, readSession: async () => pair,
    })).rejects.toThrow(FITNESS_HANDOFF_UNAVAILABLE);
    expect(wire.calls).toHaveLength(2);
    expect(wire.calls[1].responseCookies.some((value) => /^sb-(access|refresh)-token=/.test(value))).toBe(false);
  });

  test("a successfully consumed challenge cannot be used again", async () => {
    const wire = transport(base);
    await completeFitnessHandoff("/entry", {
      enabled: true, persistSession: async () => undefined,
      request: wire.request, readSession: async () => pair,
    });
    const consumed = wire.calls[1];
    const replay = await fetch(`${base}/auth/session-sync`, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(5_000),
      headers: { "Content-Type": "application/json", Origin: portalOrigin, Cookie: consumed.binding },
      body: consumed.body,
    });
    expect(replay.status).toBe(401);
    expect(replay.headers.getSetCookie().some((cookie) => !cookie.startsWith(`${bindingName}=`))).toBe(false);
    const failure = await replay.text();
    expect(failure).not.toContain(pair.accessToken);
    expect(failure).not.toContain(pair.refreshToken);
  });
});
