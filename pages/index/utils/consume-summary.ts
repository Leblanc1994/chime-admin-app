// The current API has no sum for an arbitrary date/type filter. Aggregate the
// actual matching records rather than mistaking the visible page for the total.
export async function collectConsumeSummary(
	request: (params: Record<string, unknown>) => Promise<any>,
	params: Record<string, unknown>,
) {
	let page = 1,
		count = 0,
		times = 0;
	while (true) {
		const result = await request({ ...params, page, size: 100 });
		if (!Array.isArray(result?.list)) throw new Error("消费统计暂不可用");
		count += result.list.length;
		for (const row of result.list) {
			if (
				row.cardAccountId &&
				Number.isSafeInteger(Number(row.consumeTimes)) &&
				Number(row.consumeTimes) > 0
			)
				times += Number(row.consumeTimes);
		}
		const total = result.pagination?.total ?? result.total;
		if (!result.list.length || (total != null ? count >= total : result.list.length < 100))
			break;
		page++;
	}
	return { count, times };
}
