import type { Appointment, AppointmentProject } from "../../../service/appointment/schedule";

const DAY = 86400000;
export const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
// Appointment timestamps are Shanghai wall times. UTC arithmetic avoids device timezone/DST drift.
export function todayKey(now = Date.now()) {
	return new Date(now + 8 * 3600000).toISOString().slice(0, 10);
}
export function wallTime(value: string) {
	if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(value)) return NaN;
	const text =
		value.length === 10 ? value + " 00:00:00" : value.length === 16 ? value + ":00" : value;
	const ms = Date.parse(text.replace(" ", "T") + "Z");
	return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 19).replace("T", " ") === text
		? ms
		: NaN;
}
export function addDays(date: string, days: number) {
	return new Date(wallTime(date) + days * DAY).toISOString().slice(0, 10);
}
export function addMinutes(date: string, time: string, minutes = 120) {
	const result = new Date(wallTime(date + " " + time) + minutes * 60000).toISOString();
	return { date: result.slice(0, 10), time: result.slice(11, 16) };
}
export function shiftMonth(date: string, offset: number) {
	const d = new Date(wallTime(date));
	const day = d.getUTCDate();
	d.setUTCDate(1);
	d.setUTCMonth(d.getUTCMonth() + offset);
	const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
	d.setUTCDate(Math.min(day, last));
	return d.toISOString().slice(0, 10);
}
export function weekDates(date: string) {
	const weekday = (new Date(wallTime(date)).getUTCDay() + 6) % 7;
	const first = addDays(date, -weekday);
	return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}
export function monthDates(date: string) {
	const monthStart = date.slice(0, 7) + "-01";
	const first = weekDates(monthStart)[0];
	const nextMonth = shiftMonth(monthStart, 1);
	const days = Math.ceil((wallTime(nextMonth) - wallTime(first)) / DAY / 7) * 7;
	return Array.from({ length: days }, (_, i) => addDays(first, i));
}
export function calendarRange(date: string) {
	const grid = monthDates(date);
	return { startDate: grid[0], endDate: addDays(grid[grid.length - 1], 1) };
}
export function dateLabel(date: string, withYear = false) {
	const d = new Date(wallTime(date));
	return `${withYear ? d.getUTCFullYear() + "年" : ""}${d.getUTCMonth() + 1}月${d.getUTCDate()}日 周${weekdays[(d.getUTCDay() + 6) % 7]}`;
}
export function appointmentsOn(rows: Appointment[], date: string) {
	const start = wallTime(date),
		end = start + DAY;
	return rows
		.filter((r) => r.status === 1 && wallTime(r.startTime) < end && wallTime(r.endTime) > start)
		.sort((a, b) => a.startTime.localeCompare(b.startTime) || a.id - b.id);
}
export function timeLabel(value: string, relativeDate: string) {
	const day = value.slice(0, 10);
	const prefix =
		day === relativeDate
			? ""
			: day === addDays(relativeDate, 1)
				? "次日 "
				: day === addDays(relativeDate, -1)
					? "前日 "
					: `${day} `;
	return prefix + value.slice(11, 16);
}
export function appointmentTime(row: Appointment, date = row.startTime.slice(0, 10)) {
	return `${timeLabel(row.startTime, date)}–${timeLabel(row.endTime, date)}`;
}
export function durationLabel(start: string, end: string) {
	const minutes = Math.round((wallTime(end) - wallTime(start)) / 60000);
	if (!Number.isFinite(minutes) || minutes <= 0) return "请核对时间";
	const h = Math.floor(minutes / 60),
		m = minutes % 60;
	return `共 ${h ? h + " 小时" : ""}${m ? (h ? " " : "") + m + " 分钟" : ""}`;
}
export interface AppointmentForm {
	customerName: string;
	memberId: number | null;
	memberPhone: string;
	projectId: number;
	date: string;
	start: string;
	endDate: string;
	end: string;
	remark: string;
}
export function newAppointmentForm(date = todayKey(), start = "13:00"): AppointmentForm {
	const end = addMinutes(date, start);
	return {
		customerName: "",
		memberId: null,
		memberPhone: "",
		projectId: 0,
		date,
		start,
		endDate: end.date,
		end: end.time,
		remark: "",
	};
}
export function appointmentFormError(form: AppointmentForm, projects: AppointmentProject[]) {
	if (!form.customerName.trim()) return "请填写顾客姓名";
	if (form.customerName.trim().length > 50) return "顾客姓名不能超过50字";
	if (!projects.some((p) => p.id === form.projectId)) return "请选择预约项目";
	const start = wallTime(`${form.date} ${form.start}`),
		end = wallTime(`${form.endDate} ${form.end}`);
	if (!Number.isFinite(start) || !Number.isFinite(end)) return "请选择有效的预约时间";
	if (end <= start) return "结束时间必须晚于开始时间";
	if (form.remark.trim().length > 500) return "备注不能超过500字";
	return "";
}
export function appointmentPayload(form: AppointmentForm) {
	return {
		customerName: form.customerName.trim(),
		memberId: form.memberId,
		projectId: form.projectId,
		startTime: `${form.date} ${form.start}:00`,
		endTime: `${form.endDate} ${form.end}:00`,
		remark: form.remark.trim(),
	};
}
export function selectAppointmentMember(
	form: AppointmentForm,
	member: { id: number; name?: string; nickName?: string; phone?: string },
) {
	if (!Number.isSafeInteger(member.id) || member.id <= 0) return;
	form.memberId = member.id;
	form.customerName = member.name?.trim() || member.nickName?.trim() || "未命名会员";
	form.memberPhone = member.phone || "";
}
export function clearAppointmentMember(form: AppointmentForm) {
	form.memberId = null;
	form.memberPhone = "";
}
export function requestKey() {
	return `appt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/** Interval partitioning: connected overlap groups share a column count; touching endpoints don't overlap. */
export function timelineLayout(rows: Appointment[], date: string) {
	const base = wallTime(date);
	const items = appointmentsOn(rows, date).map((row) => ({
		row,
		start: Math.max(0, (wallTime(row.startTime) - base) / 60000),
		end: Math.min(1440, (wallTime(row.endTime) - base) / 60000),
		column: 0,
		columns: 1,
	}));
	let group: typeof items = [],
		lanes: number[] = [],
		groupEnd = -1;
	function finish() {
		for (const item of group) item.columns = lanes.length;
		group = [];
		lanes = [];
	}
	for (const item of items) {
		if (item.start >= groupEnd) finish();
		let column = lanes.findIndex((end) => end <= item.start);
		if (column < 0) column = lanes.length;
		item.column = column;
		// A 20-minute minimum visual height keeps very short appointments tappable and separate.
		lanes[column] = Math.max(item.end, item.start + 20);
		groupEnd = Math.max(...lanes);
		group.push(item);
	}
	finish();
	// Keep every half-hour available, including empty days and late-night bookings.
	return { items, startHour: 0, endHour: 24 };
}
