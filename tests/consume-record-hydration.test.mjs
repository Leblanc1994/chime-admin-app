import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const asModule = (source) =>
	"data:text/javascript;base64," + Buffer.from(source).toString("base64");
const backend = asModule(`
export const state = { record: null, member: null, cards: [], fail: false, calls: [] };
export class BaseService {
  constructor(namespace) { this.namespace = namespace; }
  async info(params) { return this.request({url: '/info', params}); }
  async list(data) { return this.request({url: '/list', data}); }
  async request(options) {
    state.calls.push({namespace:this.namespace,...options});
    if (this.namespace === 'admin/member/consumeRecord') return state.record;
    if (this.namespace === 'admin/member/info') {
      if (state.fail) throw Error('客户资料加载失败');
      return state.member;
    }
    if (this.namespace === 'admin/member/cardAccount') return state.cards;
    throw Error('unexpected request');
  }
}`);
async function compile(path, replacements) {
	const source = await readFile(new URL(path, import.meta.url), "utf8");
	let output = ts.transpileModule(source, {
		compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
	}).outputText;
	for (const [from, to] of Object.entries(replacements))
		output = output.replaceAll(JSON.stringify(from), JSON.stringify(to));
	return asModule(output);
}
const member = await compile("../service/member/info.ts", { "/@/cool": backend });
const cards = await compile("../service/member/card-account.ts", { "/@/cool": backend });
const record = await compile("../service/member/consume-record.ts", {
	"/@/cool": backend,
	"./info": member,
	"./card-account": cards,
});
const { state } = await import(backend);
const { default: Records } = await import(record);

test("direct guest detail hydrates customer type and preserves profile remark", async () => {
	Object.assign(state, {
		record: { id: 52, memberId: 5, remark: "本次护理" },
		member: { name: "体验顾客", customerType: "guest", remark: "偏好安静" },
		calls: [],
		fail: false,
	});
	const data = await new Records().info({ id: 52 });
	assert.equal(data.customerType, "guest");
	assert.equal(data.memberName, "体验顾客");
	assert.equal(data.memberRemark, "偏好安静");
	assert.equal(data.remark, "本次护理");
	assert.deepEqual(
		state.calls.map((c) => c.namespace),
		["admin/member/consumeRecord", "admin/member/info"],
	);
});

test("direct card record resolves the original card with string or numeric IDs", async () => {
	Object.assign(state, {
		record: { id: 51, memberId: 1, cardAccountId: 11, consumeTimes: 2 },
		member: { name: "李晓妍", customerType: "member" },
		cards: [{ id: "11", cardName: "水光焕肤次卡" }],
		fail: false,
	});
	const data = await new Records().info({ id: 51 });
	assert.equal(data.cardName, "水光焕肤次卡");
	assert.equal(data.consumeTimes, 2);
});

test("failed customer hydration blocks editing instead of replacing profile data with blanks", async () => {
	Object.assign(state, { record: { id: 52, memberId: 5 }, fail: true });
	await assert.rejects(new Records().info({ id: 52 }), /客户资料加载失败/);
	state.fail = false;
});
