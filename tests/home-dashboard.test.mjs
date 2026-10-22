import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(
	new URL("../pages/index/utils/home-dashboard.ts", import.meta.url),
	"utf8",
);
const { outputText } = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { businessDate, consumeComparison, consumeTrend, trendGeometry, validateDashboardSummary } =
	await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

function summary(extra = {}) {
	return {
		statisticsDate: "2026-01-02",
		totalMemberCount: 72,
		todayNewMemberCount: 0,
		todayConsumeRecordCount: 0,
		yesterdayConsumeRecordCount: 3,
		weekConsumeRecordCount: 7,
		monthConsumeRecordCount: 13,
		lowBalanceCardCount: 29,
		expiringCardCount: 0,
		inactiveMemberCount: 36,
		monthlyConsumeRecordCounts: Array.from({ length: 12 }, (_, index) => ({
			month: index + 1,
			recordCount: index + 1,
		})),
		...extra,
	};
}

test("business dates roll over at midnight in Shanghai regardless of device timezone", () => {
	assert.equal(businessDate(new Date("2026-12-31T15:59:59Z")), "2026-12-31");
	assert.equal(businessDate(new Date("2026-12-31T16:00:00Z")), "2027-01-01");
});

test("daily comparison handles zero baselines without invented percentages", () => {
	assert.equal(consumeComparison(0, 0), "较昨日持平");
	assert.equal(consumeComparison(5, 0), "较昨日 +5 笔");
	assert.equal(consumeComparison(0, 3), "较昨日 -3 笔");
});

test("week and month use the server date and preserve recorded zero days across years", () => {
	const daily = [
		"2025-12-27",
		"2025-12-28",
		"2025-12-29",
		"2025-12-30",
		"2025-12-31",
		"2026-01-01",
		"2026-01-02",
	].map((date, index) => ({ date, recordCount: index }));
	const week = consumeTrend(summary({ dailyConsumeRecordCounts: daily }), "week");
	assert.equal(week.daily, true);
	assert.deepEqual(
		week.points.map((p) => p.count),
		[0, 1, 2, 3, 4, 5, 6],
	);
	const month = consumeTrend(summary({ dailyConsumeRecordCounts: daily }), "month");
	assert.deepEqual(month.points, [
		{ label: "01.01", count: 5 },
		{ label: "01.02", count: 6 },
	]);
});

test("missing or incomplete daily data falls back to actual monthly totals through the current month", () => {
	for (const daily of [undefined, [], [{ date: "2026-01-02", recordCount: 9 }]]) {
		const trend = consumeTrend(summary({ dailyConsumeRecordCounts: daily }), "week");
		assert.equal(trend.daily, false);
		assert.deepEqual(trend.points, [{ label: "1月", count: 1 }]);
	}
});

test("invalid data is rejected rather than displayed as business zeros", () => {
	assert.doesNotThrow(() => validateDashboardSummary(summary()));
	for (const value of [undefined, null, -1, NaN, Infinity, "7"]) {
		assert.throws(() => validateDashboardSummary(summary({ todayConsumeRecordCount: value })));
	}
	assert.throws(() =>
		validateDashboardSummary(
			summary({ monthlyConsumeRecordCounts: [{ month: 13, recordCount: 1 }] }),
		),
	);
	assert.equal(
		consumeTrend(
			summary({ statisticsDate: "2026-02-30", dailyConsumeRecordCounts: [] }),
			"week",
		).daily,
		false,
	);
});

test("zero and single-point charts have finite coordinates and no artificial upward trend", () => {
	const zero = trendGeometry([0, 0, 0]);
	assert.match(zero.path, /^M 4 116 L 163 116 L 322 116$/);
	assert.deepEqual(trendGeometry([2]).end, [163, 16]);
	assert.equal(trendGeometry([]).path, "");
});
