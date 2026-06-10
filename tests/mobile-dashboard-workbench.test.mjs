import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/tuanzi/Documents/chime/chime-admin-app";

function read(file) {
	return fs.readFileSync(path.join(root, file), "utf8");
}

function readJson(file) {
	return JSON.parse(read(file));
}

test("tabbar exposes home workbench and my while member moves behind workbench", () => {
	const pages = readJson("pages.json");
	const tabItems = pages.tabBar.list;

	assert.deepEqual(
		tabItems.map((item) => item.pagePath),
		["pages/index/home", "pages/index/workbench", "pages/index/my"],
	);
	assert.deepEqual(
		tabItems.map((item) => item.text),
		["%首页%", "%工作台%", "%我的%"],
	);
	assert.ok(pages.pages.some((item) => item.path === "pages/index/member"));
	assert.ok(pages.pages.some((item) => item.path === "pages/index/consume-statistics"));
});

test("workbench links to member list and consume statistics pages", () => {
	const source = read("pages/index/workbench.vue");

	assert.match(source, /会员列表/);
	assert.match(source, /消费统计/);
	assert.match(source, /\/pages\/index\/member/);
	assert.match(source, /\/pages\/index\/consume-statistics/);
	assert.match(source, /<tabbar\s*\/>/);
});

test("workbench menu cards render concrete member domain icons", () => {
	const source = read("pages/index/workbench.vue");

	assert.match(source, /class="menu-card__glyph"\s+:class="`is-\$\{item\.glyph\}`"/);
	assert.match(source, /glyph:\s*"member"/);
	assert.match(source, /glyph:\s*"consume"/);
	assert.match(source, /menu-card__glyph\.is-member[\s\S]*01-member-card\.svg/);
	assert.match(source, /menu-card__glyph\.is-consume[\s\S]*03-consume-check\.svg/);
	assert.doesNotMatch(source, /<cl-icon\s+:name="item\.icon"/);
});

test("home page uses the admin dashboard summary service", () => {
	const home = read("pages/index/home.vue");
	const service = read("service/member/dashboard.ts");

	assert.match(home, /MemberDashboardService/);
	assert.match(home, /dashboardService\.summary\(\)/);
	assert.match(home, /todayTypeCounts/);
	assert.match(home, /monthlyConsumeRecordCounts/);
	assert.match(home, /<tabbar\s*\/>/);
	assert.match(service, /admin\/member\/dashboard/);
	assert.match(service, /url:\s*"\/summary"/);
});

test("home page follows the soft card dashboard design structure", () => {
	const home = read("pages/index/home.vue");

	assert.match(home, /class="hero-greeting"/);
	assert.match(home, /您好，管理员/);
	assert.match(home, /class="notification-button"/);
	assert.match(home, /<cl-icon\s+class="notification-button__icon"\s+name="notification"/);
	assert.doesNotMatch(home, /notification-button__bell/);
	assert.match(home, /class="metric-grid"/);
	assert.match(home, /class="metric-card__orb"/);
	assert.match(home, /class="year-pill"/);
	assert.match(home, /class="chart-grid"/);
	assert.match(home, /class="empty-illustration"/);
	assert.match(home, /今日暂无消费记录/);
	assert.match(home, /formatWeekday/);
	assert.match(home, /formatDisplayDate/);
});

test("consume statistics page mirrors pc readonly filters and list contract", () => {
	const source = read("pages/index/consume-statistics.vue");

	assert.match(source, /MemberConsumeRecordService/);
	assert.match(source, /consumeStartTime/);
	assert.match(source, /consumeEndTime/);
	assert.match(source, /memberKeyword/);
	assert.match(source, /openDateFilter/);
	assert.match(source, /calendarDays/);
	assert.match(source, /quickRanges/);
	assert.match(source, /昨日/);
	assert.match(source, /上个月/);
	assert.match(source, /去年/);
	assert.match(source, /consumeRecordService\.page/);
	assert.match(source, /会员次卡/);
	assert.match(source, /抖音新客福利/);
	assert.match(source, /美团团购/);
	assert.match(source, /纹绣/);
	assert.match(source, /linear-gradient\(156deg, #fbfdff 0%, #edf7ff 32%, #f7fbff 58%, #f4f8fc 100%\)/);
	assert.doesNotMatch(source, /statistics-hero/);
	assert.doesNotMatch(source, /type-chip/);
	assert.doesNotMatch(source, /consumeTypeFilterOptions/);
	assert.doesNotMatch(source, /filters\.consumeType/);
	assert.doesNotMatch(source, /consumeType:\s*filters\.consumeType/);
	assert.doesNotMatch(source, /<cl-select-date/);
	assert.doesNotMatch(source, /consumeRecordService\.delete\(/);
	assert.doesNotMatch(source, /consumeRecordService\.update\(/);
	assert.doesNotMatch(source, /consumeRecordService\.add\(/);
});

test("consume statistics page defaults filters to the current month range", () => {
	const source = read("pages/index/consume-statistics.vue");

	assert.match(source, /const\s+currentMonthRange\s*=\s*getCurrentMonthRange\(\)/);
	assert.match(source, /function\s+getCurrentMonthRange\(\)/);
	assert.match(source, /dayjs\(\)\.startOf\("month"\)\.format\("YYYY-MM-DD"\)/);
	assert.match(source, /dayjs\(\)\.endOf\("month"\)\.format\("YYYY-MM-DD"\)/);
	assert.match(source, /consumeStartDate:\s*currentMonthRange\.start/);
	assert.match(source, /consumeEndDate:\s*currentMonthRange\.end/);
	assert.doesNotMatch(source, /consumeStartDate:\s*today/);
	assert.doesNotMatch(source, /consumeEndDate:\s*today/);
});

test("consume statistics page uses an exclusive next-day end time like pc", () => {
	const source = read("pages/index/consume-statistics.vue");

	assert.match(
		source,
		/consumeEndTime:\s*dayjs\(endDate\)\.add\(1,\s*"day"\)\.startOf\("day"\)\.format\("YYYY-MM-DD HH:mm:ss"\)/,
	);
	assert.doesNotMatch(source, /consumeEndTime:\s*dayjs\(endDate\)\.endOf\("day"\)/);
});
