import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import * as vue from "vue";

const require = createRequire(import.meta.url);
const { parse, compileScript } = require("vue/compiler-sfc");
const root = fileURLToPath(new URL("../", import.meta.url));

function load(file, mocks, globals = {}) {
	const filename = path.resolve(root, file);
	let source = readFileSync(filename, "utf8");
	if (filename.endsWith(".vue")) {
		source = compileScript(parse(source).descriptor, { id: "member-index-test" }).content;
	}
	const output = ts.transpileModule(source, {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
	}).outputText;
	const context = {
		exports: {},
		...globals,
		require(id) {
			if (id in mocks) return mocks[id];
			if (id.endsWith(".vue")) return {};
			if (id.startsWith(".")) return load(path.resolve(path.dirname(filename), id + ".ts"), mocks, globals);
			return require(id);
		},
	};
	vm.runInNewContext(output, context, { filename });
	return context.exports;
}

const vueMock = {
	...vue,
	getCurrentInstance: () => ({ proxy: {} }),
	onUnmounted() {},
};

function indexSetup(vibrate) {
	let measured;
	const query = {
		in() { return this; },
		selectAll() { return this; },
		boundingClientRect(callback) { measured = callback; return this; },
		exec() {},
	};
	const props = vue.reactive({ modelValue: "", counts: { A: 1, L: 2, Z: 3 }, disabled: false });
	const events = [];
	const vibrations = [];
	const component = load("pages/index/components/qm-alphabet-index.vue", { vue: vueMock }, {
		uni: {
			createSelectorQuery: () => query,
			vibrateShort(options) {
				vibrations.push(options.type);
				vibrate?.(options);
			},
		},
	}).default;
	const state = component.setup(props, { expose() {}, emit: (_, letter) => events.push(letter) });
	return { state, props, events, vibrations, measure: () => measured([
		{ top: 100, bottom: 120 }, { top: 120, bottom: 140 }, { top: 140, bottom: 160 },
	]) };
}

test("one touch follows sparse letters in both directions and clamps outside the index", () => {
	const { state, events, vibrations, measure } = indexSetup();
	state.startTouch({ touches: [{ clientY: 110 }] }, "A");
	measure();
	state.moveTouch({ touches: [{ clientY: 130 }] });
	state.moveTouch({ touches: [{ clientY: 135 }] });
	state.moveTouch({ touches: [{ clientY: 200 }] });
	state.moveTouch({ touches: [{ clientY: 130 }] });
	state.moveTouch({ touches: [{ clientY: 50 }] });
	assert.deepEqual(events, ["A", "L", "Z", "L", "A"]);
	assert.deepEqual(vibrations, ["light", "light", "light", "light", "light"]);
	assert.equal(state.pressedLetter.value, "A");
	state.endTouch();
	assert.equal(state.pressedLetter.value, "");
	state.select("A"); // Native tap after touchend must not jump back to the starting letter.
	assert.deepEqual(events, ["A", "L", "Z", "L", "A"]);
	assert.equal(vibrations.length, 5);
});

test("clicks vibrate once; focus, disabled and unavailable letters never vibrate", () => {
	const { state, props, events, vibrations } = indexSetup();
	state.press("A");
	assert.equal(vibrations.length, 0);
	state.select("A");
	assert.deepEqual(vibrations, ["light"]);
	state.select("B");
	props.disabled = true;
	state.select("L");
	state.startTouch({ touches: [{ clientY: 110 }] }, "L");
	assert.deepEqual(vibrations, ["light"]);
	assert.deepEqual(events, ["A"]);
});

test("unsupported or failed vibration does not interrupt index navigation", () => {
	for (const vibrate of [() => { throw new Error("unsupported"); }, (options) => options.fail({ errMsg: "not supported" })]) {
		const { state, events, measure } = indexSetup(vibrate);
		assert.doesNotThrow(() => {
			state.startTouch({ touches: [{ clientY: 110 }] }, "A");
			measure();
			state.moveTouch({ touches: [{ clientY: 150 }] });
			state.endTouch();
		});
		assert.deepEqual(events, ["A", "Z"]);
		assert.equal(state.pressedLetter.value, "");
	}
});

test("moves before geometry arrives use the latest finger position; cancellation invalidates geometry", () => {
	const { state, events, measure } = indexSetup();
	state.startTouch({ touches: [{ clientY: 110 }] }, "A");
	state.moveTouch({ touches: [{ clientY: 150 }] });
	measure();
	assert.deepEqual(events, ["A", "Z"]);
	state.endTouch();
	measure();
	state.moveTouch({ touches: [{ clientY: 130 }] });
	assert.deepEqual(events, ["A", "Z"]);
	assert.equal(state.pressedLetter.value, "");
});

test("clicking a selected letter navigates again instead of clearing it; unavailable letters stay hidden", async () => {
	const { state, props, events } = indexSetup();
	props.modelValue = "L";
	state.select("L");
	state.select("L");
	assert.deepEqual(events, ["L", "L"]);
	props.counts = { C: 1, Z: 0 };
	await vue.nextTick();
	assert.deepEqual([...state.visibleLetters.value], ["C"]);
	props.disabled = true;
	state.startTouch({ touches: [{ clientY: 110 }] }, "C");
	assert.deepEqual(events, ["L", "L"]);
});

function groupMeasurements() {
	const callbacks = [];
	return {
		callbacks,
		query() {
			return {
				in() { return this; }, select() { return this; }, selectAll() { return this; },
				boundingClientRect() { return this; }, exec(callback) { callbacks.push(callback); },
			};
		},
		result(letters) {
			return [
				{ top: 200, height: 500 }, { top: -300, bottom: 900 },
				letters.map((initial, index) => ({ top: -300 + index * 200, dataset: { initial } })),
				{ height: 30 },
			];
		},
	};
}

function directorySetup(measurements, members = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, name: i < 20 ? "阿芳" : "张敏" })), onPage) {
	let pageCalls = 0;
	const pageRequests = [];
	const cardCalls = [];
	const observers = [];
	const mocks = {
		vue: vueMock,
		"js-pinyin": { default: require("js-pinyin") },
		"@dcloudio/uni-app": { onShow() {}, onHide() {} },
		"/@/cool": { useCool: () => ({ router: {} }) },
		"./utils/use-mini-navigation": { useMiniNavigation: () => ({ enabled: false }) },
		"./utils/member-quick-action": { pendingMemberQuickAction: vue.ref(), pendingMemberFilter: vue.ref() },
		"../../service/member/info": { default: class { async page(params) { pageCalls++; pageRequests.push(params); await onPage?.(pageCalls); return { list: members.slice((params.page - 1) * params.size, params.page * params.size), total: members.length }; } } },
		"../../service/member/card-account": { default: class { async list({ memberId }) { cardCalls.push(memberId); return []; } } },
	};
	const uni = {
		$on() {}, $off() {},
		createSelectorQuery() {
			if (measurements) return measurements.query();
			return { in() { return this; }, select() { return this; }, selectAll() { return this; }, boundingClientRect() { return this; }, exec() {} };
		},
		createIntersectionObserver() {
			const observer = {
				relativeTo() { return this; },
				observe(_, callback) { this.notify = callback; },
				disconnect() {},
			};
			observers.push(observer);
			return observer;
		},
	};
	const component = load("pages/index/member.vue", mocks, { uni }).default;
	const state = component.setup({}, { expose() {} });
	return { state, cardCalls, observers, pageRequests, pageCalls: () => pageCalls };
}

test("every filter order keeps the full directory in A–Z order with working letter navigation", async () => {
	const members = Array.from({ length: 120 }, (_, i) => ({ id: i + 1, name: i < 110 ? "张敏" : "阿芳" }));
	for (const order of ["createTime", "lastConsumeTime", "remainTimes", "validCardCount"]) {
		const measurements = groupMeasurements();
		const { state, pageRequests, cardCalls } = directorySetup(measurements, members);
		state.draft.order = order;
		state.applyFilter();
		await new Promise((resolve) => setImmediate(resolve));
		assert.equal(state.error.value, "");
		assert.equal(state.list.value.length, 120);
		assert.equal(state.list.value[0].name, "阿芳");
		assert.equal(state.list.value[10].name, "张敏");
		assert.equal(state.finished.value, true);
		assert.equal(state.showAlphabetIndex.value, true);
		assert.deepEqual(Object.keys(state.initialCounts.value), ["A", "Z"]);
		assert.equal(pageRequests.length, 2);
		assert.ok(pageRequests.every((params) => params.order === order));
		assert.equal(cardCalls.length, 15);
		measurements.callbacks.at(-1)(measurements.result(["A", "Z"]));
		state.onListScroll({ detail: { scrollTop: 200 } });
		assert.equal(state.initial.value, "Z");
		await state.setInitial("A");
		assert.equal(state.scrollTarget.value, "member-group-A");
	}
});

test("directory navigation reaches groups beyond the first page without filtering or refetching", async () => {
	const { state, cardCalls, pageCalls } = directorySetup();
	await state.reload();
	assert.equal(state.error.value, "");
	assert.equal(state.list.value.length, 40);
	assert.equal(state.pagination.total, 40);
	assert.equal(state.finished.value, true);
	assert.equal(cardCalls.length, 15);
	await state.setInitial("Z");
	assert.equal(state.scrollTarget.value, "member-group-Z");
	assert.equal(state.list.value.length, 40);
	assert.equal(state.loading.value, false);
	assert.equal(pageCalls(), 1);
	assert.equal(cardCalls.length, 15);
	await state.setInitial("Z");
	assert.equal(state.scrollTarget.value, "member-group-Z");
	await Promise.all([state.setInitial("A"), state.setInitial("Z")]);
	assert.equal(state.scrollTarget.value, "member-group-Z");
	assert.equal(state.groupAnchor("#"), "member-group-other");
});

test("offscreen cards load only on entry and stale callbacks cannot update a refreshed directory", async () => {
	const { state, observers, cardCalls } = directorySetup();
	await state.reload();
	await vue.nextTick();
	const observer = observers.at(-1);
	observer.notify({ intersectionRatio: 0, dataset: { memberId: 40 } });
	assert.equal(cardCalls.length, 15);
	observer.notify({ intersectionRatio: 1, dataset: { memberId: 40 } });
	observer.notify({ intersectionRatio: 1, dataset: { memberId: 40 } });
	await new Promise((resolve) => setImmediate(resolve));
	assert.equal(cardCalls.filter((id) => id === 40).length, 1);
	assert.deepEqual([...state.list.value[39].cards], []);
	await state.reload();
	const count = cardCalls.length;
	observer.notify({ intersectionRatio: 1, dataset: { memberId: 39 } });
	assert.equal(cardCalls.length, count);
});

test("scrolling the directory updates the selected letter in both directions and ignores stale layout", async () => {
	const measurements = groupMeasurements();
	const { state, pageCalls, cardCalls } = directorySetup(measurements);
	await state.reload();
	await vue.nextTick();
	const measure = measurements.callbacks.at(-1);
	measure(measurements.result(["A", "Z"]));
	assert.equal(state.initial.value, "A");
	state.onListScroll({ detail: { scrollTop: 200 } });
	assert.equal(state.initial.value, "Z");
	state.onListScroll({ detail: { scrollTop: 800 } });
	assert.equal(state.initial.value, "Z");
	state.onListScroll({ detail: { scrollTop: 60 } });
	assert.equal(state.initial.value, "A");
	await state.setInitial("Z");
	state.onListScroll({ detail: { scrollTop: 199.5 } });
	assert.equal(state.initial.value, "Z");
	assert.equal(pageCalls(), 1);
	assert.equal(cardCalls.length, 15);
	await state.reload();
	measure(measurements.result(["L"]));
	assert.equal(state.initial.value, "");
	state.onListScroll({ detail: { scrollTop: 200 } });
	assert.equal(state.initial.value, "");
});

test("the last letter stays selected when its heading cannot reach the top", async () => {
	const measurements = groupMeasurements();
	const { state } = directorySetup(measurements);
	await state.reload();
	await vue.nextTick();
	const geometry = measurements.result(["A", "Z"]);
	geometry[2][1].top = 300; // Z begins 600px into a 900px list, below the 400px maximum scroll offset.
	measurements.callbacks.at(-1)(geometry);
	state.onListScroll({ detail: { scrollTop: 350, scrollHeight: 900 } });
	assert.equal(state.initial.value, "A");
	state.onListScroll({ detail: { scrollTop: 400, scrollHeight: 900 } });
	assert.equal(state.initial.value, "Z");
	state.onListScroll({ detail: { scrollTop: 350, scrollHeight: 900 } });
	assert.equal(state.initial.value, "A");
});

test("manual scrolling does not feed positions back into the scroll control", async () => {
	const { state } = directorySetup();
	await state.reload();
	await state.setInitial("Z");
	assert.equal(state.scrollTarget.value, "member-group-Z");
	state.onListTouchStart();
	assert.equal(state.scrollTarget.value, "");
	state.onListScroll({ detail: { scrollTop: 350, scrollHeight: 900 } });
	state.onListScroll({ detail: { scrollTop: 430, scrollHeight: 900 } });
	assert.equal(state.requestedScrollTop.value, 0);
});

test("pull refresh keeps the list mounted until new rows are ready", async () => {
	let releaseRefresh;
	const pendingPage = new Promise((resolve) => { releaseRefresh = resolve; });
	const { state } = directorySetup(undefined, undefined, (call) => call === 2 ? pendingPage : undefined);
	await state.reload();
	const previousList = state.list.value;
	state.onListScroll({ detail: { scrollTop: -70, scrollHeight: 900 } });
	const pendingRefresh = state.refresh();
	await new Promise((resolve) => setImmediate(resolve));
	assert.equal(state.refreshing.value, true);
	assert.equal(state.loading.value, true);
	assert.equal(state.loaded.value, true);
	assert.equal(state.list.value, previousList);
	assert.equal(state.requestedScrollTop.value, 0);
	releaseRefresh();
	await pendingRefresh;
	assert.equal(state.refreshing.value, false);
	assert.equal(state.loading.value, false);
	assert.equal(state.list.value.length, 40);
});

async function selectorSetup(purpose = "appointment", measurements) {
	let onLoad;
	let pageCalls = 0;
	const events = [];
	const navigation = [];
	const members = [
		{ id: 100, name: "张敏", phone: "13800000004" },
		...Array.from({ length: 101 }, (_, i) => ({ id: i + 200, name: "李晓妍", nickName: "晓妍", phone: "13800000001" })),
		{ id: 1, name: "陈晨", phone: "13800000003" },
		{ id: 2, name: "", nickName: "王琳" },
		{ id: 3, name: "123顾客" },
	];
	const mocks = {
		vue: vueMock,
		"js-pinyin": { default: require("js-pinyin") },
		"@dcloudio/uni-app": { onLoad(callback) { onLoad = callback; }, onShow() {}, onUnload() {} },
		"/@/cool": { useCool: () => ({ router: { back() { navigation.push("back"); }, push(value) { navigation.push(value); } } }) },
		"../../service/member/info": { default: class { async page({ page, size }) { pageCalls++; return { list: members.slice((page - 1) * size, page * size), total: members.length }; } } },
		"../../service/member/card-account": { default: class { async list({ memberId }) { return memberId === 1 ? [{ id: 1, status: 1, remainTimes: 2, expireTime: "2099-01-01 00:00:00" }] : []; } } },
	};
	const uni = {
		$emit(name, member) { events.push({ name, member }); },
		createSelectorQuery() {
			if (measurements) return measurements.query();
			return { in() { return this; }, select() { return this; }, selectAll() { return this; }, boundingClientRect() { return this; }, exec() {} };
		},
	};
	const component = load("pages/index/member-select.vue", mocks, { uni }).default;
	const state = component.setup({}, { expose() {} });
	onLoad({ purpose, selectionToken: "appointment-123" });
	await new Promise((resolve) => setImmediate(resolve));
	assert.equal(state.error.value, "");
	assert.equal(state.loading.value, false);
	return { state, events, navigation, pageCalls: () => pageCalls };
}

test("appointment selector sorts every server page by name and reaches letters beyond the first 30 rows", async () => {
	const { state, pageCalls } = await selectorSetup();
	assert.equal(state.available.value.length, 105);
	assert.equal(state.available.value[0].name, "陈晨");
	assert.equal(state.available.value.at(-1).name, "123顾客");
	assert.deepEqual(Object.keys(state.initialCounts.value), ["C", "L", "W", "Z", "#"]);
	assert.equal(pageCalls(), 2);
	await state.setInitial("Z");
	assert.equal(state.scrollTarget.value, "selector-group-Z");
	assert.equal(state.available.value.length, 105);
	await Promise.all([state.setInitial("C"), state.setInitial("#")]);
	assert.equal(state.scrollTarget.value, "selector-group-other");
	assert.equal(pageCalls(), 2);
});

test("appointment selector search resets navigation, updates available letters and preserves selected member payload", async () => {
	const { state, events, navigation } = await selectorSetup();
	await state.setInitial("Z");
	state.keyword.value = "xiaoyan";
	await vue.nextTick();
	assert.equal(state.available.value.length, 0);
	assert.deepEqual(Object.keys(state.initialCounts.value), []);
	assert.equal(state.scrollTarget.value, "");
	state.keyword.value = "晓妍";
	await vue.nextTick();
	assert.equal(state.available.value.length, 101);
	assert.deepEqual(Object.keys(state.initialCounts.value), ["L"]);
	state.select(state.available.value[0]);
	assert.equal(events.length, 1);
	assert.equal(events[0].name, "chime:appointment-member:appointment-123");
	assert.equal(events[0].member.name, "李晓妍");
	assert.equal(events[0].member.phone, "13800000001");
	assert.deepEqual(navigation, ["back"]);
});

test("deduction selection retains eligibility rules and the existing action route", async () => {
	const { state, events, navigation } = await selectorSetup("deduct");
	assert.equal(state.available.value.length, 1);
	assert.equal(state.unavailable.value.length, 104);
	state.select(state.unavailable.value[0]);
	assert.equal(navigation.length, 0);
	state.select(state.available.value[0]);
	assert.equal(navigation[0].path, "/pages/index/member-action");
	assert.equal(navigation[0].query.memberId, 1);
	assert.equal(events.length, 0);
});

test("appointment list scrolling follows groups and search discards old offsets", async () => {
	const measurements = groupMeasurements();
	const { state, events, pageCalls } = await selectorSetup("appointment", measurements);
	const measure = measurements.callbacks.at(-1);
	measure(measurements.result(["C", "L", "W", "Z", "#"]));
	assert.equal(state.initial.value, "C");
	state.onListScroll({ detail: { scrollTop: 600 } });
	assert.equal(state.initial.value, "Z");
	state.onListScroll({ detail: { scrollTop: 850 } });
	assert.equal(state.initial.value, "#");
	state.onListScroll({ detail: { scrollTop: 250 } });
	assert.equal(state.initial.value, "L");
	state.onListScroll({ detail: { scrollTop: -40 } });
	assert.equal(state.initial.value, "C");
	assert.equal(pageCalls(), 2);
	assert.equal(events.length, 0);
	state.keyword.value = "晓妍";
	await vue.nextTick();
	measure(measurements.result(["C", "L", "W", "Z", "#"]));
	assert.equal(state.initial.value, "");
	measurements.callbacks.at(-1)(measurements.result(["L"]));
	assert.equal(state.initial.value, "L");
	state.onListScroll({ detail: { scrollTop: 1000 } });
	assert.equal(state.initial.value, "L");
});
