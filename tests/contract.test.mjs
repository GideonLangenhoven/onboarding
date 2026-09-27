import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function callWizardWith(invoke) {
  const source = readFileSync(new URL("../app/lib/api.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(code, {
    exports,
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: "https://fixture.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture" } },
    require: (name) => {
      assert.equal(name, "@supabase/supabase-js");
      return { createClient: () => ({ functions: { invoke } }) };
    },
  });
  return exports.callWizard;
}

test("wizard requests keep the selected action and token", async () => {
  let request;
  const callWizard = callWizardWith(async (name, options) => {
    request = { name, options };
    return { data: { success: true, saved: ["business_name"] }, error: null };
  });
  const result = await callWizard("save-step", "signed-token", { action: "forged", token: "forged", data: { business_name: "Tour Co" } });
  assert.equal(result.success, true);
  assert.deepEqual(JSON.parse(JSON.stringify(request)), {
    name: "onboarding-wizard",
    options: { body: { action: "save-step", token: "signed-token", data: { business_name: "Tour Co" } } },
  });
});

test("wizard surfaces server errors from rejected requests", async () => {
  const callWizard = callWizardWith(async () => ({
    data: null,
    error: { message: "Transport error", context: { json: async () => ({ error: "Invitation expired" }) } },
  }));
  await assert.rejects(callWizard("validate", "expired"), /Invitation expired/);
});

test("wizard rejects unsuccessful 200 responses", async () => {
  const callWizard = callWizardWith(async () => ({ data: { success: false, error: "Cannot save" }, error: null }));
  await assert.rejects(callWizard("save-step", "signed-token"), /Cannot save/);
});
