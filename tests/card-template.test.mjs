import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
	new URL("../pages/index/utils/card-template.ts", import.meta.url),
	"utf8",
);
const { outputText } = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const {
	newCardTemplate,
	cardTemplateErrors,
	cardTemplatePayload,
	cardColors,
	cardPalette,
	cardPrice,
} = await import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));
const valid = () => ({
	...newCardTemplate(),
	name: " 水光焕肤次卡 ",
	totalTimes: "6",
	price: "1280.10",
});
test("new card requires name, count and price and defaults to enabled purple", () => {
	const form = newCardTemplate();
	assert.deepEqual(Object.keys(cardTemplateErrors(form)), ["name", "totalTimes", "price"]);
	assert.equal(form.status, 1);
	assert.equal(form.color, "purple");
	assert.deepEqual(cardTemplateErrors(valid()), {});
});
test("card count is an integer within backend range and price preserves decimal precision", () => {
	for (const totalTimes of ["", "0", "-1", "1.5", "1e3", "2147483648"])
		assert.ok(cardTemplateErrors({ ...valid(), totalTimes }).totalTimes, totalTimes);
	for (const price of ["", "-1", "1.001", "1e3", "10000000000", "Infinity"])
		assert.ok(cardTemplateErrors({ ...valid(), price }).price, price);
	assert.deepEqual(cardTemplateErrors({ ...valid(), price: "0", totalTimes: "2147483647" }), {});
	assert.equal(cardTemplatePayload(valid()).price, "1280.10");
	assert.equal(cardTemplatePayload(valid()).name, "水光焕肤次卡");
	assert.equal(cardTemplatePayload(valid()).totalTimes, 6);
});
test("card colors remain distinct from enable state and unknown colors fall back safely", () => {
	assert.equal(cardColors.length, 6);
	for (const color of cardColors) {
		assert.equal(cardPalette(color.value).accent, color.accent);
		assert.deepEqual(cardTemplateErrors({ ...valid(), color: color.value, status: 0 }), {});
	}
	assert.equal(cardPalette("unknown").value, "purple");
	assert.equal(cardPrice("1280.10"), "1,280.10");
	assert.equal(cardPrice("0"), "0");
	assert.ok(cardTemplateErrors({ ...valid(), name: "名".repeat(51) }).name);
	assert.ok(cardTemplateErrors({ ...valid(), remark: "注".repeat(501) }).remark);
});
