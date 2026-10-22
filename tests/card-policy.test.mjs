import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
	new URL("../pages/index/utils/card-policy.ts", import.meta.url),
	"utf8",
);
const { outputText } = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const {
	canConsume,
	canAdjust,
	isExpired,
	cardStatus,
	positiveTimes,
	nonnegativeTimes,
	deductionLimit,
} = await import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));
const now = Date.parse("2026-10-20T12:00:00");
const card = { id: 11, status: 1, remainTimes: 4, expireTime: "2027-01-19 23:59:00" };
test("stopped, discarded, expired and empty cards cannot be consumed", () => {
	assert.equal(canConsume(card, now), true);
	for (const status of [0, 2, 3, 4, 99])
		assert.equal(canConsume({ ...card, status }, now), false);
	assert.equal(canConsume({ ...card, remainTimes: 0 }, now), false);
	assert.equal(cardStatus({ ...card, status: 3, expireTime: null }, now), "已过期");
	assert.equal(canConsume({ ...card, expireTime: "invalid" }, now), false);
});
test("expiry boundary and adjustments follow current card state", () => {
	assert.equal(isExpired({ ...card, expireTime: "2026-10-20 12:00:00" }, now), true);
	assert.equal(canAdjust({ ...card, status: 0 }, now), true);
	assert.equal(canAdjust({ ...card, status: 4 }, now), false);
	assert.equal(canAdjust({ ...card, status: 3 }, now), false);
});
test("count input rejects blank, negative, fractions and unsafe integers", () => {
	for (const value of [
		"",
		null,
		undefined,
		" ",
		0,
		"0",
		-1,
		1.5,
		"2.2",
		Infinity,
		Number.MAX_SAFE_INTEGER + 1,
	])
		assert.equal(positiveTimes(value), false);
	assert.equal(positiveTimes("2"), true);
	assert.equal(nonnegativeTimes("0"), true);
	assert.equal(nonnegativeTimes(""), false);
	assert.equal(nonnegativeTimes(-1), false);
});
test("editing returns original usage only to the original card", () => {
	const original = { cardAccountId: 11, consumeTimes: 2 };
	assert.equal(deductionLimit(card, original), 6);
	assert.equal(deductionLimit({ ...card, id: 12 }, original), 4);
	assert.equal(deductionLimit(card), 4);
});
