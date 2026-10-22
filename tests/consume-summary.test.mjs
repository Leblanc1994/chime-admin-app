import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(
	new URL("../pages/index/utils/consume-summary.ts", import.meta.url),
	"utf8",
);
const { outputText } = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { collectConsumeSummary } = await import(
	`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("filtered consumption totals span all pages and only count valid card deductions", async () => {
	const records = Array.from({ length: 103 }, (_, index) =>
		index < 100
			? { consumeType: "美团团购", consumeTimes: 50 }
			: { cardAccountId: 11, consumeTimes: index - 99 },
	);
	const calls = [];
	const filters = {
		consumeStartTime: "2026-10-01 00:00:00",
		consumeEndTime: "2026-11-01 00:00:00",
		memberKeyword: "李",
	};
	const totals = await collectConsumeSummary(async (params) => {
		calls.push(params);
		return {
			list: records.slice((params.page - 1) * params.size, params.page * params.size),
			total: records.length,
		};
	}, filters);
	assert.deepEqual(totals, { count: 103, times: 6 });
	assert.deepEqual(
		calls.map(({ page, size, ...params }) => ({ page, size, params })),
		[1, 2].map((page) => ({ page, size: 100, params: filters })),
	);
});

test("summary handles empty data and excludes malformed counts", async () => {
	assert.deepEqual(await collectConsumeSummary(async () => ({ list: [] }), {}), {
		count: 0,
		times: 0,
	});
	const list = [0, -1, 1.5, "", undefined, "2", 3].map((consumeTimes) => ({
		cardAccountId: 11,
		consumeTimes,
	}));
	assert.deepEqual(
		await collectConsumeSummary(async () => ({ list, pagination: { total: list.length } }), {}),
		{ count: 7, times: 5 },
	);
	await assert.rejects(
		collectConsumeSummary(async () => ({ total: 0 }), {}),
		/消费统计暂不可用/,
	);
});
