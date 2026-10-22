import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const asModule = (source) =>
	"data:text/javascript;base64," + Buffer.from(source).toString("base64");
async function compile(path, imports = {}) {
	const source = await readFile(new URL(path, import.meta.url), "utf8");
	let output = ts.transpileModule(source, {
		compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
	}).outputText;
	for (const [from, to] of Object.entries(imports))
		output = output.replaceAll(JSON.stringify(from), JSON.stringify(to));
	return asModule(output);
}
const policy = await compile("../pages/index/utils/card-policy.ts");
const {
	collectMemberPages,
	hydrateMemberCards,
	matchesMemberFilter,
	memberCardCaption,
	memberStatus,
} = await import(
	await compile("../pages/index/utils/member-directory.ts", { "./card-policy": policy })
);
const now = Date.parse("2026-10-21T10:00:00");
const usable = (extra = {}) => ({
	id: 1,
	status: 1,
	remainTimes: 5,
	expireTime: "2099-01-01 00:00:00",
	...extra,
});

test("card categories include members beyond the first server page and preserve query filters", async () => {
	const members = Array.from({ length: 103 }, (_, i) => ({ id: i + 1 }));
	const calls = [];
	const all = await collectMemberPages(
		async (params) => {
			calls.push(params);
			return {
				list: members.slice((params.page - 1) * params.size, params.page * params.size),
				pagination: { total: members.length },
			};
		},
		{ keyWord: "晓", gender: 2 },
	);
	const hydrated = await hydrateMemberCards(all, async (id) =>
		id === 103 ? [usable({ remainTimes: 1 })] : [],
	);
	assert.deepEqual(
		hydrated.filter((member) => matchesMemberFilter(member, "low")).map((m) => m.id),
		[103],
	);
	assert.deepEqual(
		calls.map((c) => [c.page, c.size, c.keyWord, c.gender]),
		[
			[1, 100, "晓", 2],
			[2, 100, "晓", 2],
		],
	);
});

test("card hydration bounds concurrency, keeps order and only totals usable cards", async () => {
	let active = 0,
		peak = 0;
	const members = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, remainTimes: 999 }));
	const result = await hydrateMemberCards(members, async () => {
		active++;
		peak = Math.max(peak, active);
		await new Promise((resolve) => setTimeout(resolve, 1));
		active--;
		return [
			usable({ remainTimes: 4 }),
			usable({ id: 2, remainTimes: 2 }),
			usable({ id: 3, status: 0, remainTimes: 9 }),
			usable({ id: 4, status: 4, remainTimes: 8 }),
			usable({ id: 5, remainTimes: 0 }),
			usable({ id: 6, expireTime: "2020-01-01 00:00:00" }),
		];
	});
	assert.equal(peak, 6);
	assert.deepEqual(
		result.map((m) => m.id),
		members.map((m) => m.id),
	);
	assert.ok(result.every((m) => m.validCardCount === 2 && m.remainTimes === 6));
	assert.equal(members[0].remainTimes, 999);
});

test("attention filters exclude stopped and used-up cards and honor expiry boundaries", () => {
	assert.equal(
		matchesMemberFilter({ id: 1, cards: [usable({ status: 0, remainTimes: 1 })] }, "low", now),
		false,
	);
	assert.equal(
		matchesMemberFilter({ id: 1, cards: [usable({ remainTimes: 0 })] }, "low", now),
		false,
	);
	assert.equal(
		matchesMemberFilter(
			{ id: 1, cards: [usable({ remainTimes: 1, expireTime: "2026-10-21 10:00:00" })] },
			"low",
			now,
		),
		false,
	);
	assert.equal(
		matchesMemberFilter(
			{ id: 1, cards: [usable({ expireTime: "2026-10-28 10:00:00" })] },
			"expiring",
			now,
		),
		true,
	);
	assert.equal(
		matchesMemberFilter(
			{ id: 1, cards: [usable({ expireTime: "2026-10-28 10:00:01" })] },
			"expiring",
			now,
		),
		false,
	);
	assert.equal(
		matchesMemberFilter(
			{ id: 1, cards: [usable({ expireTime: "2026-10-21 10:00:00" })] },
			"expired",
			now,
		),
		true,
	);
	assert.equal(matchesMemberFilter({ id: 1, cards: [] }, "uncarded", now), true);
	assert.equal(
		matchesMemberFilter({ id: 1, cards: [usable({ status: 4 })] }, "carded", now),
		true,
	);
});

test("missing or failed card data cannot silently become an uncarded or eligible member", async () => {
	assert.equal(memberCardCaption({ id: 1 }), "次卡资料暂未同步");
	assert.equal(memberStatus({ id: 1 }), "");
	assert.equal(memberStatus({ id: 1, cards: [] }), "未开卡");
	assert.equal(memberStatus({ id: 1, cards: [usable({ status: 0 })] }), "暂不可扣次");
	await assert.rejects(
		hydrateMemberCards([{ id: 1 }], async () => null),
		/次卡信息加载失败/,
	);
	await assert.rejects(
		collectMemberPages(async () => ({})),
		/会员列表数据格式异常/,
	);
});
