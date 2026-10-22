import type { MemberDashboardSummary } from "../../../service/member/dashboard";

export type ConsumeTrend = {
	title: string;
	daily: boolean;
	points: { label: string; count: number }[];
};

export function businessDate(now = new Date()) {
	return new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function consumeComparison(today: number, yesterday: number) {
	const delta = today - yesterday;
	return delta === 0 ? "较昨日持平" : `较昨日 ${delta > 0 ? "+" : ""}${delta} 笔`;
}

export function validateDashboardSummary(data: MemberDashboardSummary) {
	const counters = [
		"totalMemberCount",
		"todayNewMemberCount",
		"todayConsumeRecordCount",
		"yesterdayConsumeRecordCount",
		"weekConsumeRecordCount",
		"monthConsumeRecordCount",
		"lowBalanceCardCount",
		"expiringCardCount",
		"inactiveMemberCount",
	] as const;
	if (
		!data ||
		counters.some((key) => !Number.isSafeInteger(data[key]) || data[key] < 0) ||
		!Array.isArray(data.monthlyConsumeRecordCounts) ||
		data.monthlyConsumeRecordCounts.some(
			(item) =>
				!Number.isInteger(item.month) ||
				item.month < 1 ||
				item.month > 12 ||
				!Number.isSafeInteger(item.recordCount) ||
				item.recordCount < 0,
		)
	) {
		throw new Error("首页统计返回数据不完整");
	}
}

function shiftDate(date: string, days: number) {
	const value = new Date(`${date}T00:00:00Z`);
	value.setUTCDate(value.getUTCDate() + days);
	return value.toISOString().slice(0, 10);
}

export function consumeTrend(
	summary: MemberDashboardSummary,
	range: "week" | "month",
): ConsumeTrend {
	const date = summary.statisticsDate || "";
	const validDate =
		date &&
		/^\d{4}-\d{2}-\d{2}$/.test(date) &&
		!Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
		new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
	if (validDate && summary.dailyConsumeRecordCounts) {
		const start = range === "week" ? shiftDate(date, -6) : `${date.slice(0, 7)}-01`;
		const counts = new Map(
			summary.dailyConsumeRecordCounts.map((item) => [item.date, item.recordCount]),
		);
		const dates: string[] = [];
		for (let current = start; current <= date; current = shiftDate(current, 1))
			dates.push(current);
		if (
			dates.every((value) => Number.isInteger(counts.get(value)) && counts.get(value)! >= 0)
		) {
			return {
				title: range === "week" ? "近7天消费趋势" : "本月消费趋势",
				daily: true,
				points: dates.map((value) => ({
					label: value.slice(5).replace("-", "."),
					count: counts.get(value)!,
				})),
			};
		}
	}
	// 兼容尚未更新的后端：展示接口已有的月度统计，不把缺失日数据当作零。
	return {
		title: "今年消费趋势",
		daily: false,
		points: summary.monthlyConsumeRecordCounts
			.filter((item) => item.month <= Number((date || businessDate()).slice(5, 7)))
			.map((item) => ({
				label: `${item.month}月`,
				count: item.recordCount,
			})),
	};
}

export function trendGeometry(counts: number[]) {
	const peak = Math.max(1, ...counts);
	const points = counts.map((count, index) => [
		counts.length === 1 ? 163 : 4 + (index * 318) / (counts.length - 1),
		116 - (count / peak) * 100,
	]);
	const path = points.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
	return {
		path,
		area: points.length
			? `${path} L ${points[points.length - 1][0]} 126 L ${points[0][0]} 126 Z`
			: "",
		end: points[points.length - 1] || [0, 116],
	};
}
