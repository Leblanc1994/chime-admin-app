import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(
	new URL("../pages/index/utils/mini-navigation.ts", import.meta.url),
	"utf8",
);
const { outputText } = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { miniNavigationLayout } = await import(
	`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

function capsule(left, top, width = 87, height = 32) {
	return { left, top, width, height, right: left + width, bottom: top + height };
}

test("iPhone layout reserves status bar once and a complete capsule row in px", () => {
	const layout = miniNavigationLayout(
		{ windowWidth: 390, statusBarHeight: 47 },
		capsule(296, 51),
	);
	assert.deepEqual(layout, {
		statusBarHeight: 47,
		barHeight: 44,
		navigationBottom: 91,
		sideInset: 106,
	});
});

test("Android capsule gaps determine navigation height independently of rpx scaling", () => {
	for (const width of [320, 375, 430]) {
		const menu = capsule(width - 94, 32);
		const layout = miniNavigationLayout({ windowWidth: width, statusBarHeight: 24 }, menu);
		assert.equal(layout.barHeight, 48);
		assert.equal(layout.navigationBottom, 72);
		assert.ok(layout.navigationBottom - menu.bottom >= menu.top - 24);
		assert.ok(width - layout.sideInset <= menu.left - 12);
		assert.ok(width - 2 * layout.sideInset >= 80);
	}
});

test("missing and invalid capsule measurements use a usable fallback", () => {
	for (const menu of [
		undefined,
		null,
		capsule(0, 0, 0, 0),
		capsule(290, -1),
		capsule(290, 200),
		capsule(380, 28),
		{ ...capsule(290, 28), height: NaN },
		{ ...capsule(290, 28), bottom: 29 },
	]) {
		const layout = miniNavigationLayout({ windowWidth: 390, statusBarHeight: 24 }, menu);
		assert.equal(layout.navigationBottom, 68);
		assert.equal(layout.sideInset, 108);
	}
	assert.equal(miniNavigationLayout({}).navigationBottom, 64);
	assert.equal(
		miniNavigationLayout({ statusBarHeight: NaN, safeArea: { top: 44 } }).navigationBottom,
		88,
	);
	assert.deepEqual(miniNavigationLayout({ windowWidth: Infinity }), miniNavigationLayout({}));
});

test("fractional API coordinates retain the measured capsule exclusion zone", () => {
	const menu = { ...capsule(280.25, 27.5, 87.5, 32.25), bottom: 59.749999 };
	const layout = miniNavigationLayout({ windowWidth: 375, statusBarHeight: 24 }, menu);
	assert.equal(layout.sideInset, 106.75);
	assert.equal(layout.navigationBottom, 68);
});
