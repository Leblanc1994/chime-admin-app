import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
	new URL("../pages/index/utils/appointment.ts", import.meta.url),
	"utf8",
);
const { outputText } = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const a = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const projects = [{ id: 1, name: "美睫", color: "purple", durationMinutes: 120 }];
function row(id, start, end, status = 1) {
	return { id, startTime: start, endTime: end, status };
}
test("Shanghai today, strict date validation, month ends and Monday calendar grid", () => {
	assert.equal(a.todayKey(Date.parse("2026-10-27T17:00:00Z")), "2026-10-28");
	assert.ok(Number.isNaN(a.wallTime("2026-02-30")));
	assert.ok(Number.isNaN(a.wallTime("2026-10-27 24:01")));
	assert.equal(a.shiftMonth("2026-01-31", 1), "2026-02-28");
	assert.equal(a.shiftMonth("2024-01-31", 1), "2024-02-29");
	assert.equal(a.shiftMonth("2026-12-31", 1), "2027-01-31");
	assert.deepEqual(a.weekDates("2026-10-27"), [
		"2026-10-26",
		"2026-10-27",
		"2026-10-28",
		"2026-10-29",
		"2026-10-30",
		"2026-10-31",
		"2026-11-01",
	]);
	assert.equal(a.monthDates("2026-11-01").length, 42);
	assert.equal(a.monthDates("2026-10-01").length, 35);
	assert.equal(a.monthDates("2021-02-01").length, 28);
	assert.deepEqual(a.calendarRange("2026-10-27"), {
		startDate: "2026-09-28",
		endDate: "2026-11-02",
	});
	assert.deepEqual(a.calendarRange("2026-11-01"), {
		startDate: "2026-10-26",
		endDate: "2026-12-07",
	});
});
test("default duration crosses midnight and month/year without changing appointment date", () => {
	const form = a.newAppointmentForm("2026-12-31", "23:30");
	assert.equal(form.date, "2026-12-31");
	assert.equal(form.endDate, "2027-01-01");
	assert.equal(form.end, "01:30");
	assert.equal(a.durationLabel("2026-12-31 23:30", "2027-01-01 01:30"), "共 2 小时");
	assert.deepEqual(a.addMinutes("2026-10-27", "13:00"), { date: "2026-10-27", time: "15:00" });
});
test("form validates real projects and ordered times; payload trims free text", () => {
	const form = {
		...a.newAppointmentForm("2026-10-27"),
		customerName: " 张女士 ",
		projectId: 1,
		remark: " 自然款 ",
	};
	assert.equal(a.appointmentFormError(form, projects), "");
	assert.equal(
		a.appointmentFormError({ ...form, customerName: " " }, projects),
		"请填写顾客姓名",
	);
	assert.equal(a.appointmentFormError({ ...form, projectId: 9 }, projects), "请选择预约项目");
	assert.equal(
		a.appointmentFormError({ ...form, end: "12:59" }, projects),
		"结束时间必须晚于开始时间",
	);
	assert.equal(
		a.appointmentFormError({ ...form, end: "13:00" }, projects),
		"结束时间必须晚于开始时间",
	);
	assert.equal(a.appointmentPayload(form).customerName, "张女士");
	assert.equal(a.appointmentPayload(form).remark, "自然款");
	assert.equal(a.appointmentPayload(form).startTime, "2026-10-27 13:00:00");
});
test("cross-day calendar membership excludes cancelled and midnight endpoint", () => {
	const rows = [
		row(1, "2026-10-27 23:00", "2026-10-28 01:00"),
		row(2, "2026-10-27 22:00", "2026-10-28 00:00"),
		row(3, "2026-10-28 09:00", "2026-10-28 11:00", 0),
	];
	assert.deepEqual(
		a.appointmentsOn(rows, "2026-10-28").map((r) => r.id),
		[1],
	);
	assert.equal(a.appointmentTime(rows[0], "2026-10-28"), "前日 23:00–01:00");
	assert.equal(
		a.appointmentTime(row(4, "2026-10-25 23:00", "2026-10-30 01:00"), "2026-10-28"),
		"2026-10-25 23:00–2026-10-30 01:00",
	);
	const l = a.timelineLayout(rows, "2026-10-28");
	assert.equal(l.items[0].start, 0);
	assert.equal(l.items[0].end, 60);
});
test("overlapping clusters use parallel columns and reuse lanes after endpoints", () => {
	const rows = [
		row(1, "2026-10-27 13:00", "2026-10-27 15:00"),
		row(2, "2026-10-27 14:30", "2026-10-27 16:30"),
		row(3, "2026-10-27 16:30", "2026-10-27 18:30"),
		row(4, "2026-10-27 14:45", "2026-10-27 15:30"),
	];
	const items = a.timelineLayout(rows, "2026-10-27").items;
	assert.deepEqual(
		items.map((i) => [i.row.id, i.column, i.columns]),
		[
			[1, 0, 3],
			[2, 1, 3],
			[4, 2, 3],
			[3, 0, 1],
		],
	);
	const short = a.timelineLayout(
		[
			row(1, "2026-10-27 13:00", "2026-10-27 13:05"),
			row(2, "2026-10-27 13:10", "2026-10-27 13:15"),
		],
		"2026-10-27",
	);
	assert.deepEqual(
		short.items.map((i) => i.columns),
		[2, 2],
	);
});

test("day timeline always includes midnight through 24:00, including empty and overnight days", () => {
	const date = "2026-10-28";
	const rows = [
		row(1, "2026-10-27 23:30", "2026-10-28 01:30"),
		row(2, "2026-10-28 22:30", "2026-10-29 00:30"),
	];
	for (const appointments of [[], [rows[0]], [rows[1]], rows]) {
		const layout = a.timelineLayout(appointments, date);
		assert.equal(layout.startHour, 0);
		assert.equal(layout.endHour, 24);
	}
	assert.deepEqual(
		a.timelineLayout(rows, date).items.map(({ start, end }) => [start, end]),
		[
			[0, 90],
			[1350, 1440],
		],
	);
});

test("member selection keeps schedule fields; switching to manual clears association", () => {
	const form = { ...a.newAppointmentForm("2026-10-27", "14:30"), projectId: 1, remark: "自然款" };
	a.selectAppointmentMember(form, { id: 4, name: " 李女士 ", phone: "13800000000" });
	assert.equal(form.customerName, "李女士");
	assert.equal(form.memberPhone, "13800000000");
	assert.equal(a.appointmentPayload(form).memberId, 4);
	assert.equal(form.start, "14:30");
	assert.equal(form.end, "16:30");
	assert.equal(form.projectId, 1);
	assert.equal(form.remark, "自然款");
	assert.equal(a.appointmentFormError(form, projects), "");
	a.clearAppointmentMember(form);
	assert.equal(form.customerName, "李女士");
	assert.equal(form.memberPhone, "");
	assert.equal(a.appointmentPayload(form).memberId, null);
	a.selectAppointmentMember(form, { id: 5, nickName: "小林" });
	assert.equal(form.customerName, "小林");
	assert.equal(form.memberPhone, "");
	a.selectAppointmentMember(form, { id: 0, name: "无效" });
	assert.equal(form.memberId, 5);
});
