import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/tuanzi/Documents/chime/chime-admin-app";

function read(file) {
	return fs.readFileSync(path.join(root, file), "utf8");
}

test("member list includes memberTab support for member/non-member filtering", () => {
	const source = read("pages/index/member.vue");

	assert.match(source, /memberTab/);
	assert.match(source, /全部/);
	assert.match(source, /非会员/);
	assert.match(source, /buildParams\(\)[\s\S]*memberTab/);
});

test("member list uses the designed hero background without duplicate title text", () => {
	const source = read("pages/index/member.vue");

	assert.match(source, /src="\/static\/member-bg\.png"/);
	assert.doesNotMatch(source, /class="member-hero__title"/);
});

test("member detail keeps sms logs but hides sms notice prompt panel", () => {
	const source = read("pages/index/member-detail.vue");

	assert.match(source, /consume-notice-sms/);
	assert.match(source, /短信日志/);
	assert.match(source, /sendSmsNotice/);
	assert.match(source, /fetchSmsLogList/);
	assert.match(source, /showConsumeSmsNoticeSwitch/);
	assert.match(source, /notice-card__title/);
	assert.doesNotMatch(source, /notice-panel/);
	assert.doesNotMatch(source, /扣次后可自动发送短信通知/);
});

test("member detail consume types stay aligned with pc additions", () => {
	const source = read("pages/index/member-detail.vue");

	assert.match(source, /纹绣/);
	assert.match(source, /眼线/);
});

test("member detail uses designed member-card icons for records and dock actions", () => {
	const source = read("pages/index/member-detail.vue");

	assert.match(source, /member-icon member-icon--record/);
	assert.match(source, /member-icon member-icon--open/);
	assert.match(source, /member-icon member-icon--consume/);
	assert.match(source, /member-icon member-icon--add/);
	assert.match(source, /01-member-card\.svg/);
	assert.match(source, /02-open-card\.svg/);
	assert.match(source, /03-consume-check\.svg/);
	assert.match(source, /04-add-consume\.svg/);
	assert.ok(fs.existsSync(path.join(root, "static/member-icons/01-member-card.svg")));
	assert.ok(fs.existsSync(path.join(root, "static/member-icons/02-open-card.svg")));
	assert.ok(fs.existsSync(path.join(root, "static/member-icons/03-consume-check.svg")));
	assert.ok(fs.existsSync(path.join(root, "static/member-icons/04-add-consume.svg")));
});

test("member detail record actions align with the record text column", () => {
	const source = read("pages/index/member-detail.vue");

	assert.match(
		source,
		/<view class="record-card__content">[\s\S]*<view class="card-inline-actions card-inline-actions--record">[\s\S]*editConsumeRecord\(row\)[\s\S]*deleteConsumeRecord\(row\)[\s\S]*<\/view>[\s\S]*<\/view>[\s\S]*<\/view>/,
	);
	assert.match(source, /\.card-inline-actions--record\s*\{/);
});

test("mobile member services include consume notice sms service", () => {
	const source = read("service/member/consume-notice-sms.ts");

	assert.match(source, /class MemberConsumeNoticeSmsService/);
	assert.match(source, /summary/);
});
