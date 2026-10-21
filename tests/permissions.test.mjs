import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function loadModule(path, imports = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const testModule = { exports: {} };
  new Function("require", "module", "exports", outputText)(name => {
    if (name === "server-only") return {};
    if (!(name in imports)) throw new Error(`Unexpected dependency: ${name}`);
    return imports[name];
  }, testModule, testModule.exports);
  return testModule.exports;
}

function authFixture({ user = { id: "owner", identities: [{ provider: "google" }] }, authError = null, profile = { id: "owner", is_superadmin: true }, profileError = null, ready = true, setupError = null } = {}) {
  let profileReads = 0, readinessChecks = 0;
  const supabase = {
    auth: { getUser: async () => ({ data: { user }, error: authError }) },
    from(table) {
      assert.equal(table, "profiles"); profileReads++;
      return { select: () => ({ eq: (column, id) => {
        assert.equal(column, "id"); assert.equal(id, user.id);
        return { maybeSingle: async () => ({ data: profile, error: profileError }) };
      } }) };
    },
    rpc: async name => { assert.equal(name, "week6_admin_ready"); readinessChecks++; return { data: ready, error: setupError }; },
  };
  const auth = loadModule("../lib/auth.ts", { "next/navigation": { redirect: path => { throw new Error(`REDIRECT:${path}`); } }, "./supabase/server": { createClient: async () => supabase } });
  return { ...auth, reads: () => ({ profileReads, readinessChecks }) };
}

test("anonymous visitors never reach profile or content reads", async () => {
  const fixture = authFixture({ user: null });
  await assert.rejects(fixture.authorizeAdmin(), error => error.status === 401);
  assert.deepEqual(fixture.reads(), { profileReads: 0, readinessChecks: 0 });
  await assert.rejects(fixture.requireAdmin(), /REDIRECT:\/login/);
});
test("invalid sessions and accounts without Google are rejected", async () => {
  await assert.rejects(authFixture({ authError: new Error("expired") }).authorizeAdmin(), error => error.status === 401);
  await assert.rejects(authFixture({ user: { id: "email-user", identities: [{ provider: "email" }] } }).authorizeAdmin(), error => error.status === 403);
});
test("ordinary, missing, or string-valued administrator flags cannot grant access", async () => {
  for (const profile of [null, { is_superadmin: false }, { is_superadmin: "true" }]) {
    const fixture = authFixture({ profile });
    await assert.rejects(fixture.authorizeAdmin(), error => error.status === 403);
    assert.equal(fixture.reads().readinessChecks, 0);
  }
});
test("database errors or unapplied security migration fail closed", async () => {
  for (const config of [{ profileError: new Error("missing column") }, { ready: false }, { ready: null }, { setupError: new Error("missing function") }]) {
    await assert.rejects(authFixture(config).authorizeAdmin(), error => error.status === 503);
  }
});
test("verified Google admins receive access only after database checks", async () => {
  const fixture = authFixture();
  const result = await fixture.authorizeAdmin();
  assert.equal(result.user.id, "owner");
  assert.deepEqual(fixture.reads(), { profileReads: 1, readinessChecks: 1 });
});
test("revoking the database role takes effect on the next request", async () => {
  const profile = { id: "owner", is_superadmin: true };
  const fixture = authFixture({ profile });
  await fixture.authorizeAdmin();
  profile.is_superadmin = false;
  await assert.rejects(fixture.authorizeAdmin(), error => error.status === 403);
});

const { validateMedia, decodeContent, encodeContent } = loadModule("../lib/content.ts");
test("editor preserves legacy content and structured food-pick fields", () => {
  const fields = { area: "Chinatown", food: "Dumplings", recommendation: "A quick lunch after class.", cuisine: "Chinese" };
  assert.deepEqual(decodeContent(encodeContent(fields)), fields);
  assert.equal(decodeContent("Old **Markdown** content"), null);
  assert.equal(decodeContent("null"), null);
});
test("content updates whitelist fields so role and ownership cannot be injected", () => {
  assert.deepEqual(validateMedia({ title: " A pick ", prompt: "Lunch", content: "Dumplings", user_id: "someone-else", is_superadmin: true }), { title: "A pick", prompt: "Lunch", content: "Dumplings" });
  for (const input of [null, {}, { title: " ", prompt: "Lunch", content: "Food" }, { title: "x".repeat(91), prompt: "Lunch", content: "Food" }]) assert.throws(() => validateMedia(input));
});

test("every media mutation rejects unauthenticated requests before touching data", async () => {
  const fixture = authFixture({ user: null });
  const imports = {
    "next/server": { NextResponse: { json: (value, init) => Response.json(value, init) } },
    "@/lib/auth": fixture,
    "@/lib/content": loadModule("../lib/content.ts"),
    "@/lib/api": { sameOrigin: () => {}, parseMedia: () => { throw new Error("Must not parse before authorization"); }, apiError: error => Response.json({ error: error.message }, { status: error.status || 500 }) },
  };
  const create = loadModule("../app/api/media/route.ts", imports);
  const mutate = loadModule("../app/api/media/[id]/route.ts", imports);
  for (const handler of [create.POST, mutate.PATCH, mutate.DELETE]) {
    const response = await handler(new Request("http://localhost/api/media", { method: "POST" }), { params: Promise.resolve({ id: "invalid" }) });
    assert.equal(response.status, 401);
  }
  assert.deepEqual(fixture.reads(), { profileReads: 0, readinessChecks: 0 });
});
