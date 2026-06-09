import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { resolveProjectDependency } from "../build/vite/resolve-project-dependency.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("resolves Pinia and vue-demi from the project dependency tree", () => {
	const pinia = resolveProjectDependency("pinia/dist/pinia.mjs");
	const vueDemi = resolveProjectDependency("vue-demi/lib/index.mjs");

	assert.ok(pinia.startsWith(projectRoot), pinia);
	assert.ok(vueDemi.startsWith(projectRoot), vueDemi);
	assert.ok(!pinia.includes("/Applications/HBuilderX.app/"), pinia);
	assert.ok(!vueDemi.includes("/Applications/HBuilderX.app/"), vueDemi);

	const piniaSource = fs.readFileSync(pinia, "utf8");
	assert.ok(!piniaSource.includes("hasInjectionContext"), "project Pinia must stay Vue 3.2 compatible");
});
