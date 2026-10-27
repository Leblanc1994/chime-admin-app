import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
	new URL("../pages/index/utils/member-form.ts", import.meta.url),
	"utf8",
);
const { outputText } = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { newMemberForm, memberFormError, memberPayload, createdMemberId } = await import(
	`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
test("member creation requires nickname, WeChat ID and a known source", () => {
	const form = newMemberForm();
	assert.equal(memberFormError(form), "请填写微信昵称");
	form.nickName = " 晓妍 ";
	assert.equal(memberFormError(form), "请填写微信号");
	form.wechatNo = " xiaoyan ";
	for (const invalid of [undefined, 0, 4, "1"]) {
		form.source = invalid;
		assert.equal(memberFormError(form), "请选择客户来源");
	}
	for (const source of [1, 2, 3]) {
		form.source = source;
		assert.equal(memberFormError(form), "");
	}
	const payload = memberPayload({
		...form,
		name: " 李晓妍 ",
		phone: " 13800000001 ",
		remark: " 护理偏好 ",
	});
	assert.equal(payload.nickName, "晓妍");
	assert.equal(payload.wechatNo, "xiaoyan");
	assert.equal(payload.name, "李晓妍");
	assert.equal(payload.phone, "13800000001");
	assert.equal(payload.remark, "护理偏好");
	assert.equal(payload.gender, 2);
});
test("continue opening a card uses the exact server-created ID and rejects ambiguous responses", () => {
	for (const value of [100, "100", { id: 100 }, { id: "100" }])
		assert.equal(createdMemberId(value), 100);
	for (const value of [
		null,
		undefined,
		true,
		{ id: true },
		{},
		[],
		0,
		-1,
		1.5,
		"NaN",
		{ id: 0 },
		Number.MAX_SAFE_INTEGER + 1,
	])
		assert.equal(createdMemberId(value), 0);
});
