import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

function load(source, globals) {
	const output = ts.transpileModule(source, {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
	}).outputText;
	const context = { exports: {}, ...globals };
	vm.runInNewContext(output, context);
	return context.exports;
}

function setup({ supported = true, missingApi = false } = {}) {
	const listeners = { ready: [], failed: [] };
	const modals = [];
	let applied = 0;
	let requested = 0;
	const manager = {
		onUpdateReady(callback) { listeners.ready.push(callback); },
		onUpdateFailed(callback) { listeners.failed.push(callback); },
		applyUpdate() { applied++; },
	};
	const uni = {
		canIUse: () => supported,
		showModal(options) { modals.push(options); },
	};
	if (!missingApi) uni.getUpdateManager = () => { requested++; return manager; };
	const { createMiniProgramUpdate } = load(
		readFileSync(new URL("../cool/utils/mini-program-update.ts", import.meta.url), "utf8"),
		{ uni },
	);
	const updater = createMiniProgramUpdate();
	return {
		updater, modals, listeners,
		applied: () => applied,
		requested: () => requested,
		ready() { for (const callback of listeners.ready) callback(); },
		failed() { for (const callback of listeners.failed) callback(); },
		respond(confirm) {
			modals.at(-1).success({ confirm, cancel: !confirm });
			modals.at(-1).complete();
		},
	};
}

test("unsupported clients continue without registering update listeners or prompting", () => {
	for (const options of [{ supported: false }, { missingApi: true }]) {
		const { updater, modals, requested } = setup(options);
		assert.doesNotThrow(() => { updater.init(); updater.onShow(); updater.onHide(); });
		assert.equal(requested(), 0);
		assert.equal(modals.length, 0);
	}
});

test("listeners register once; entering with no downloaded update never prompts", () => {
	const { updater, modals, listeners, requested } = setup();
	updater.init();
	updater.init();
	updater.onShow();
	updater.onHide();
	updater.onShow();
	assert.equal(requested(), 1);
	assert.equal(listeners.ready.length, 1);
	assert.equal(listeners.failed.length, 1);
	assert.equal(modals.length, 0);
});

test("a downloaded update prompts once and restarts only after confirmation", () => {
	const { updater, ready, modals, applied, respond } = setup();
	updater.init();
	updater.onShow();
	ready();
	ready();
	updater.onShow();
	assert.equal(modals.length, 1);
	assert.equal(modals[0].confirmText, "立即重启");
	assert.equal(applied(), 0);
	respond(true);
	assert.equal(applied(), 1);
	updater.onHide();
	updater.onShow();
	assert.equal(modals.length, 1);
});

test("postponing preserves the downloaded update for the next foreground visit", () => {
	const { updater, ready, modals, applied, respond } = setup();
	updater.init();
	updater.onShow();
	ready();
	respond(false);
	assert.equal(applied(), 0);
	assert.equal(modals.length, 1);
	updater.onHide();
	updater.onShow();
	assert.equal(modals.length, 2);
	respond(true);
	assert.equal(applied(), 1);
});

test("updates downloaded before the first onShow or in the background wait for foreground", () => {
	for (const previouslyShown of [true, false]) {
		const { updater, ready, modals } = setup();
		updater.init();
		if (previouslyShown) { updater.onShow(); updater.onHide(); }
		ready();
		assert.equal(modals.length, 0);
		updater.onShow();
		assert.equal(modals.length, 1);
	}
});

test("download failure waits for foreground and never applies an update", () => {
	const { updater, failed, ready, modals, applied, respond } = setup();
	updater.init();
	failed();
	assert.equal(modals.length, 0);
	updater.onShow();
	assert.equal(modals[0].title, "更新下载失败");
	assert.equal(modals[0].showCancel, false);
	respond(true);
	assert.equal(applied(), 0);
	updater.onHide();
	updater.onShow();
	assert.equal(modals.length, 1);
	ready();
	assert.equal(modals.length, 2);
	assert.equal(modals[1].confirmText, "立即重启");
});

test("a failed modal does not prevent a later foreground prompt", () => {
	const { updater, ready, modals, applied } = setup();
	updater.init();
	updater.onShow();
	ready();
	modals[0].complete();
	updater.onHide();
	updater.onShow();
	assert.equal(modals.length, 2);
	assert.equal(applied(), 0);
});

test("App connects launch, foreground and background to the updater", () => {
	const require = createRequire(import.meta.url);
	const { parse, compileScript } = require("vue/compiler-sfc");
	const source = readFileSync(new URL("../App.vue", import.meta.url), "utf8");
	const calls = [];
	const hooks = {};
	const updater = Object.fromEntries(["init", "onShow", "onHide"].map((name) => [name, () => calls.push(name)]));
	const mocks = {
		"/@/cool": { useStore: () => ({ dict: {}, user: {} }) },
		"/@/cool/utils/mini-program-update": { createMiniProgramUpdate: () => updater },
		"@dcloudio/uni-app": Object.fromEntries(["onLaunch", "onShow", "onHide"].map((name) => [name, (callback) => { hooks[name] = callback; }])),
	};
	const component = load(compileScript(parse(source).descriptor, { id: "update-test" }).content, {
		require: (id) => id in mocks ? mocks[id] : require(id),
		console: { log() {} },
	}).default;
	component.setup({}, { expose() {} });
	hooks.onLaunch();
	hooks.onShow();
	hooks.onHide();
	assert.deepEqual(calls, ["init", "onShow", "onHide"]);
});
