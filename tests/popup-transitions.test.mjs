import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const moduleUrl = (source) =>
	"data:text/javascript;base64," + Buffer.from(source).toString("base64");
const vue = moduleUrl(`
export const defineComponent = (component) => component;
export const ref = (value) => ({value});
export const computed = (getter) => ({get value() {return getter()}});
export function watch(getter, callback, options) { if (options?.immediate) callback(getter()); }
`);
const utils = moduleUrl("export const parseRpx = (value) => String(value);");
const cool = moduleUrl("export const router = {info() {return null}};");
const source = await readFile(
	new URL("../uni_modules/cool-ui/components/cl-popup/cl-popup.vue", import.meta.url),
	"utf8",
);
let compiled = ts.transpileModule(source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1], {
	compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
for (const [from, to] of Object.entries({ vue, "/@/cool/utils": utils, "/@/cool": cool }))
	compiled = compiled.replaceAll(JSON.stringify(from), JSON.stringify(to));
globalThis.uni = { getSystemInfoSync: () => ({ statusBarHeight: 0 }) };
const { default: Popup } = await import(moduleUrl(compiled));
function createPopup() {
	const events = [];
	const instance = Popup.setup(
		{ modelValue: false, zIndex: 500 },
		{ emit: (...args) => events.push(args) },
	);
	return { instance, events };
}

test("reopening a closing popup keeps the new confirmation visible", (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const { instance, events } = createPopup();
	instance.open();
	t.mock.timers.tick(50);
	t.mock.timers.tick(350);
	instance.close();
	t.mock.timers.tick(100);
	instance.open();
	t.mock.timers.tick(0);
	t.mock.timers.tick(350);
	assert.equal(instance.visible.value, true);
	assert.equal(instance.status.value, true);
	assert.equal(instance.isOpened.value, true);
	assert.equal(events.filter(([event]) => event === "closed").length, 0);
	instance.close();
	t.mock.timers.tick(300);
	assert.equal(instance.visible.value, false);
	assert.equal(events.filter(([event]) => event === "closed").length, 1);
});

test("closing during the opening delay never reopens the popup", (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });
	const { instance, events } = createPopup();
	instance.open();
	t.mock.timers.tick(10);
	instance.close();
	t.mock.timers.tick(500);
	assert.equal(instance.visible.value, false);
	assert.equal(instance.status.value, false);
	assert.equal(events.filter(([event]) => event === "opened").length, 0);
});
