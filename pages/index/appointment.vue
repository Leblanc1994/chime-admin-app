<template>
	<qm-page title="预约日程">
		<view class="calendar-toolbar">
			<picker mode="date" :value="visible" @change="selectDate($event.detail.value)">
				<view class="calendar-month" role="button" aria-label="选择日期">{{
					monthLabel
				}}</view>
			</picker>
			<view class="calendar-arrows">
				<button aria-label="上一月" @tap="moveMonth(-1)">
					<view class="calendar-chevron calendar-chevron--previous" aria-hidden="true" />
				</button>
				<button aria-label="下一月" @tap="moveMonth(1)">
					<view class="calendar-chevron" aria-hidden="true" />
				</button>
			</view>
			<button class="calendar-add" aria-label="新增预约" @tap="create()">
				<view class="calendar-plus" aria-hidden="true"
					><view class="calendar-plus__bar" /><view
						class="calendar-plus__bar calendar-plus__bar--vertical"
				/></view>
			</button>
		</view>
		<view class="calendar-options">
			<view class="calendar-segment" role="tablist" aria-label="日历视图">
				<button
					v-for="option in views"
					:key="option.value"
					role="tab"
					:aria-selected="view === option.value"
					:class="{ active: view === option.value }"
					@tap="view = option.value"
				>
					{{ option.label }}
				</button>
			</view>
			<view class="calendar-legend"
				><view v-for="p in projects" :key="p.id" class="calendar-legend__item"
					><view class="calendar-dot" :class="'is-' + p.color" /><text>{{
						p.name
					}}</text></view
				></view
			>
		</view>
		<view class="calendar-dates" @touchstart="touchStart" @touchend="touchEnd">
			<view class="calendar-weekdays"
				><text v-for="day in weekdays" :key="day">{{ day }}</text></view
			>
			<view v-if="view === 'day'" class="calendar-grid">
				<button
					v-for="date in dates"
					:key="date"
					class="calendar-date"
					:class="{
						selected: date === activeDate,
						today: date === today,
						muted: date.slice(0, 7) !== visible.slice(0, 7),
					}"
					:aria-label="
						dateLabel(date) +
						(counts[date] ? '，' + counts[date] + '项预约' : '，无预约')
					"
					:aria-pressed="date === activeDate"
					@tap="selectDate(date)"
				>
					<text>{{ Number(date.slice(8)) }}</text
					><view v-if="counts[date]" class="calendar-date__dot" />
				</button>
			</view>
			<view v-else class="calendar-grid calendar-grid--month">
				<view
					v-for="date in dates"
					:key="date"
					class="calendar-month-day"
					:class="{ 'is-outside': date.slice(0, 7) !== visible.slice(0, 7) }"
					@tap="selectDate(date)"
				>
					<button
						class="calendar-date"
						:class="{ selected: date === activeDate, today: date === today }"
						:aria-label="
							dateLabel(date) +
							(counts[date] ? '，' + counts[date] + '项预约' : '，无预约')
						"
						:aria-pressed="date === activeDate"
						@tap.stop="selectDate(date)"
					>
						<text>{{ Number(date.slice(8)) }}</text>
					</button>
					<view class="calendar-month-tags">
						<button
							v-for="row in dateRows[date].slice(0, 2)"
							:key="row.id"
							class="calendar-month-tag"
							:class="'is-' + row.projectColor"
							:aria-label="
								row.customerName +
								'，' +
								row.projectName +
								'，' +
								appointmentTime(row, date)
							"
							@tap.stop="openMonthAppointment(row, date)"
						>
							<text>{{ row.customerName }}</text>
						</button>
					</view>
					<button
						v-if="counts[date] > 2"
						class="calendar-month-more"
						:aria-label="
							dateLabel(date) +
							'，还有' +
							(counts[date] - 2) +
							'项预约，查看当天全部预约'
						"
						@tap.stop="showDayAppointments(date)"
					>
						+{{ counts[date] - 2 }}
					</button>
				</view>
			</view>
		</view>
		<view id="appointment-day-agenda" class="calendar-summary"
			><text
				>{{ activeDate ? dateLabel(activeDate) : "每日预约"
				}}<text v-if="!loading && !error && daily.length">
					· {{ daily.length }}项预约</text
				></text
			><button @tap="selectDate(today)">今天</button></view
		>
		<view v-if="loading" class="calendar-state"
			><view class="qm-skeleton" /><text>正在加载预约…</text></view
		>
		<view v-else-if="error" class="qm-empty"
			><text>预约加载失败</text><text>{{ error }}</text
			><qm-button @click="load">重新加载</qm-button></view
		>
		<view v-else-if="!activeDate" class="calendar-empty"
			><text>点选上方日期查看安排</text></view
		>
		<view v-else-if="view === 'month' && !daily.length" class="calendar-empty"
			><image src="/static/appointment/empty.svg" /><text>这一天还没有预约</text
			><text>为顾客安排一段专属时光</text
			><qm-button @click="create()">新增预约</qm-button></view
		>
		<view v-show="view === 'day' && !loading && !error && activeDate">
			<scroll-view
				scroll-y
				:scroll-into-view="scrollTarget"
				:show-scrollbar="false"
				class="calendar-scroll"
				:style="{ height: timelineHeight + 'px' }"
			>
				<view
					class="calendar-timeline"
					:style="{ height: (layout.endHour - layout.startHour) * 112 + 'rpx' }"
				>
					<view
						v-for="hour in hours"
						:key="hour"
						:id="'calendar-hour-' + hour"
						class="calendar-hour"
						:style="{ top: (hour - layout.startHour) * 112 + 'rpx' }"
						><text>{{ String(hour).padStart(2, "0") }}:00</text><view
					/></view>
					<view
						v-for="hour in halfHours"
						:key="hour"
						class="calendar-half"
						:style="{ top: (hour - layout.startHour + 0.5) * 112 + 'rpx' }"
					/>
					<view class="calendar-blank-slots"
						><button
							v-for="slot in slots"
							:key="slot"
							:style="{ top: ((slot - layout.startHour * 60) / 60) * 112 + 'rpx' }"
							:aria-label="'新增' + minuteText(slot) + '的预约'"
							@tap="create(minuteText(slot))"
					/></view>
					<view class="calendar-events"
						><button
							v-for="item in layout.items"
							:key="item.row.id"
							class="calendar-event"
							:class="[
								'is-' + item.row.projectColor,
								{ compact: item.end - item.start < 60 },
							]"
							:style="eventStyle(item)"
							:aria-label="
								item.row.customerName +
								'，' +
								item.row.projectName +
								'，' +
								appointmentTime(item.row, selected)
							"
							@tap.stop="detail(item.row)"
						>
							<text>{{ item.row.customerName }}</text
							><text>{{ item.row.projectName }}</text
							><text>{{ appointmentTime(item.row, selected) }}</text>
						</button></view
					>
					<view
						v-if="nowMinute !== null"
						class="calendar-now"
						:style="{ top: (nowMinute / 60 - layout.startHour) * 112 + 'rpx' }"
						><text>{{ minuteText(nowMinute) }}</text
						><view
					/></view>
				</view>
			</scroll-view>
			<text class="calendar-hint">全天 00:00–24:00，上下滑动查看；点空白时段新增</text>
		</view>
		<view v-if="!loading && !error && view === 'month' && daily.length" class="calendar-list"
			><button
				v-for="row in daily"
				:key="row.id"
				class="calendar-list__row"
				@tap="detail(row)"
			>
				<view class="calendar-list__time"
					><text>{{ timeLabel(row.startTime, selected) }}</text
					><text>{{ timeLabel(row.endTime, selected) }}</text></view
				><view class="calendar-list__copy"
					><text>{{ row.customerName }}</text
					><text :class="'project-' + row.projectColor">{{ row.projectName }}</text></view
				><view class="calendar-list__badge" :class="'is-' + row.projectColor"
					><view
				/></view></button
		></view>
	</qm-page>
</template>
<script setup lang="ts">
import { computed, ref, onUnmounted, nextTick, watch } from "vue";
import { onLoad, onShow, onHide } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import AppointmentService from "../../service/appointment/schedule";
import type { Appointment, AppointmentProject } from "../../service/appointment/schedule";
import {
	todayKey,
	wallTime,
	addDays,
	browseMonth,
	weekDates,
	monthDates,
	calendarRange,
	dateLabel,
	weekdays,
	appointmentsOn,
	appointmentTime,
	timeLabel,
	timelineLayout,
} from "./utils/appointment";
import { useMiniNavigation } from "./utils/use-mini-navigation";
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
const { router } = useCool(),
	service = new AppointmentService();
const navigation = useMiniNavigation();
const selected = ref(todayKey()),
	visible = ref(selected.value),
	today = ref(todayKey()),
	view = ref<"day" | "month">("day");
const views = [
	{ value: "day" as const, label: "日" },
	{ value: "month" as const, label: "月" },
];
const rows = ref<Appointment[]>([]),
	projects = ref<AppointmentProject[]>([]),
	loading = ref(true),
	error = ref("");
const scrollTarget = ref(""),
	clock = ref(Date.now());
let loadedRange = "",
	sequence = 0,
	touchX = 0,
	touchY = 0,
	timer: ReturnType<typeof setInterval> | undefined;
const monthLabel = computed(
	() => `${visible.value.slice(0, 4)}年${Number(visible.value.slice(5, 7))}月`,
);
const dates = computed(() =>
	view.value === "day" ? weekDates(visible.value) : monthDates(visible.value),
);
const activeDate = computed(() =>
	selected.value.slice(0, 7) === visible.value.slice(0, 7) ? selected.value : "",
);
const daily = computed(() => (activeDate.value ? appointmentsOn(rows.value, activeDate.value) : []));
const dateRows = computed(() =>
	Object.fromEntries(
		dates.value.map((date) => [
			date,
			loading.value || error.value ? [] : appointmentsOn(rows.value, date),
		]),
	),
);
const counts = computed(() =>
	Object.fromEntries(dates.value.map((date) => [date, dateRows.value[date].length])),
);
const layout = computed(() => timelineLayout(rows.value, activeDate.value || visible.value));
const hours = computed(() =>
	Array.from(
		{ length: layout.value.endHour - layout.value.startHour + 1 },
		(_, i) => layout.value.startHour + i,
	),
);
const halfHours = computed(() => hours.value.slice(0, -1));
const slots = computed(() =>
	Array.from(
		{ length: (layout.value.endHour - layout.value.startHour) * 2 },
		(_, i) => layout.value.startHour * 60 + i * 30,
	),
);
const timelineHeight = computed(() =>
	Math.max(
		280,
		uni.getSystemInfoSync().windowHeight -
			(navigation.enabled ? navigation.navigationBottom : 76) -
			uni.upx2px(428),
	),
);
const nowMinute = computed(() => {
	if (activeDate.value !== todayKey(clock.value)) return null;
	const d = new Date(clock.value + 8 * 3600000),
		minute = d.getUTCHours() * 60 + d.getUTCMinutes();
	return minute >= layout.value.startHour * 60 && minute <= layout.value.endHour * 60
		? minute
		: null;
});
function minuteText(minute: number) {
	return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
function eventStyle(item: ReturnType<typeof timelineLayout>["items"][number]) {
	return {
		top: (item.start / 60 - layout.value.startHour) * 112 + "rpx",
		height: Math.max(36, ((item.end - item.start) / 60) * 112 - 6) + "rpx",
		left: `calc(${(item.column / item.columns) * 100}% + 8rpx)`,
		width: `calc(${100 / item.columns}% - 12rpx)`,
	};
}
async function load() {
	const current = ++sequence,
		range = calendarRange(visible.value),
		key = JSON.stringify(range);
	loading.value = true;
	error.value = "";
	try {
		const [list, projectList] = await Promise.all([service.list(range), service.projects()]);
		if (current !== sequence) return;
		rows.value = list as Appointment[];
		projects.value = projectList;
		loadedRange = key;
	} catch (e: any) {
		if (current === sequence) error.value = e?.message || "请检查网络后重试";
	} finally {
		if (current === sequence) loading.value = false;
	}
}
// Apply the initial position after the native scroll-view is mounted. Resetting the
// anchor also restores the right hour after switching dates or month/day views.
watch(
	[activeDate, view, loading],
	async () => {
		if (view.value !== "day" || !activeDate.value || loading.value || error.value) return;
		scrollTarget.value = "";
		await nextTick();
		const minute = daily.value.length
			? (wallTime(daily.value[0].startTime) - wallTime(selected.value)) / 60000 - 30
			: 8 * 60;
		const hour = Math.max(0, Math.min(23, Math.floor(minute / 60)));
		scrollTarget.value = "calendar-hour-" + hour;
	},
	{ flush: "post" },
);
function selectDate(date: string) {
	if (!Number.isFinite(wallTime(date))) return;
	selected.value = date;
	visible.value = date;
	if (JSON.stringify(calendarRange(date)) !== loadedRange || error.value) load();
}
function moveMonth(offset: number) {
	visible.value = browseMonth(visible.value, selected.value, offset);
	if (JSON.stringify(calendarRange(visible.value)) !== loadedRange || error.value) load();
}
function create(start?: string) {
	if (!activeDate.value) {
		uni.showToast({ title: "请先选择预约日期", icon: "none" });
		return;
	}
	router.push({
		path: "/pages/index/appointment-form",
		query: { date: activeDate.value, ...(start ? { start } : {}) },
	});
}
function detail(row: Appointment) {
	router.push({ path: "/pages/index/appointment-detail", query: { id: row.id } });
}
function openMonthAppointment(row: Appointment, date: string) {
	selectDate(date);
	detail(row);
}
async function showDayAppointments(date: string) {
	selectDate(date);
	await nextTick();
	const query = uni.createSelectorQuery();
	query.select("#appointment-day-agenda").boundingClientRect();
	query.selectViewport().scrollOffset();
	query.exec((result) => {
		const bounds = result[0],
			viewport = result[1];
		if (!bounds || !viewport) return;
		uni.pageScrollTo({
			scrollTop: Math.max(
				0,
				bounds.top +
					viewport.scrollTop -
					(navigation.enabled ? navigation.navigationBottom : uni.upx2px(92)) -
					12,
			),
			duration: 180,
		});
	});
}
function appointmentsChanged(change?: { date?: string }) {
	if (change?.date && Number.isFinite(wallTime(change.date))) {
		selected.value = change.date;
		visible.value = change.date;
	}
	loadedRange = "";
}
uni.$on("chime:appointments-changed", appointmentsChanged);
function touchStart(e: any) {
	touchX = e.changedTouches[0].clientX;
	touchY = e.changedTouches[0].clientY;
}
function touchEnd(e: any) {
	const dx = e.changedTouches[0].clientX - touchX,
		dy = e.changedTouches[0].clientY - touchY;
	if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
		const direction = dx > 0 ? -1 : 1;
		if (view.value === "day") selectDate(addDays(activeDate.value || visible.value, direction * 7));
		else moveMonth(direction);
	}
}
onLoad((q) => {
	if (q?.date && Number.isFinite(wallTime(q.date))) {
		selected.value = q.date;
		visible.value = q.date;
	}
});
onShow(() => {
	today.value = todayKey();
	clock.value = Date.now();
	load();
	timer = setInterval(() => {
		clock.value = Date.now();
		today.value = todayKey();
	}, 30000);
});
onHide(() => {
	if (timer) clearInterval(timer);
	timer = undefined;
});
onUnmounted(() => {
	sequence++;
	if (timer) clearInterval(timer);
	uni.$off("chime:appointments-changed", appointmentsChanged);
});
</script>
<style scoped lang="scss">
.calendar-toolbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
	margin-top: -12rpx;
}
.calendar-month {
	font-size: 48rpx;
	font-weight: 700;
	color: var(--qm-deep);
	white-space: nowrap;
}
.calendar-arrows {
	display: flex;
	button {
		width: 84rpx;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}
.calendar-chevron {
	width: 16rpx;
	height: 16rpx;
	border-top: 3rpx solid var(--qm-brand);
	border-right: 3rpx solid var(--qm-brand);
	transform: rotate(45deg);
	&--previous {
		transform: rotate(225deg);
	}
}
.calendar-add {
	width: 88rpx;
	height: 88rpx;
	flex-shrink: 0;
	border-radius: 50%;
	background: var(--qm-brand);
	display: flex;
	align-items: center;
	justify-content: center;
}
.calendar-plus {
	position: relative;
	width: 48rpx;
	height: 48rpx;
}
.calendar-plus__bar {
	position: absolute;
	left: 9rpx;
	top: 22rpx;
	width: 30rpx;
	height: 4rpx;
	border-radius: 4rpx;
	background: var(--qm-on-brand);
	&--vertical {
		transform: rotate(90deg);
	}
}
.calendar-options {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	margin: 14rpx 0 24rpx;
}
.calendar-segment {
	display: flex;
	flex-shrink: 0;
	padding: 6rpx;
	border-radius: 20rpx;
	background: var(--qm-cream);
	button {
		width: 108rpx;
		height: 54rpx;
		line-height: 54rpx;
		font-size: 25rpx;
		color: var(--qm-muted);
		border-radius: 16rpx;
	}
	.active {
		background: var(--qm-surface);
		color: var(--qm-brand);
		font-weight: 600;
	}
}
.calendar-legend {
	display: flex;
	gap: 18rpx;
	flex-wrap: wrap;
	justify-content: flex-end;
}
.calendar-legend__item {
	display: flex;
	align-items: center;
	gap: 6rpx;
	font-size: 21rpx;
	color: var(--qm-muted);
}
.calendar-dot {
	width: 9rpx;
	height: 9rpx;
	border-radius: 50%;
	&.is-purple {
		background: var(--qm-brand);
	}
	&.is-gold {
		background: var(--qm-warning);
	}
	&.is-green {
		background: var(--qm-success);
	}
}
.calendar-weekdays {
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	text {
		text-align: center;
		font-size: 21rpx;
		line-height: 36rpx;
		color: var(--qm-muted);
	}
}
.calendar-grid {
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
}
.calendar-date {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-width: 0;
	height: 92rpx;
	padding: 4rpx 0;
	gap: 5rpx;
	text {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 62rpx;
		height: 62rpx;
		border-radius: 50%;
		font-size: 30rpx;
		line-height: 62rpx;
	}
	&.muted {
		color: #bdb7c1;
	}
	&.today text {
		box-shadow: inset 0 0 0 1px var(--qm-brand);
		color: var(--qm-brand);
	}
	&.selected text {
		color: #fff;
		background: var(--qm-brand);
		box-shadow: none;
		font-weight: 600;
	}
}
.calendar-date__dot {
	width: 7rpx;
	height: 7rpx;
	border-radius: 50%;
	background: var(--qm-warning);
}
.calendar-date.selected .calendar-date__dot {
	background: var(--qm-brand);
}
.calendar-grid--month {
	padding-top: 8rpx;
	column-gap: 6rpx;
}
.calendar-month-day {
	min-width: 0;
	height: 200rpx;
	box-sizing: border-box;
	border-top: 1px solid var(--qm-line);
	padding: 6rpx 0 10rpx;
	.calendar-date {
		width: 100%;
		height: 58rpx;
		padding: 0;
		text {
			width: 52rpx;
			height: 52rpx;
			line-height: 52rpx;
			font-size: 26rpx;
		}
	}
	&.is-outside .calendar-date {
		color: #bdb7c1;
	}
}
.calendar-month-tags {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
	margin-top: 6rpx;
}
.calendar-month-tag {
	display: flex;
	align-items: center;
	width: 100%;
	min-width: 0;
	height: 42rpx;
	padding: 0 6rpx;
	box-sizing: border-box;
	border-radius: 8rpx;
	text-align: left;
	text {
		display: block;
		width: 100%;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 22rpx;
		line-height: 42rpx;
	}
}
.calendar-month-more {
	width: 100%;
	height: 32rpx;
	margin-top: 2rpx;
	text-align: left;
	padding: 0 6rpx;
	font-size: 21rpx;
	line-height: 32rpx;
	color: var(--qm-muted);
}
.calendar-summary {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
	margin: 16rpx 0 26rpx;
	min-height: 66rpx;
	> text {
		font-size: 27rpx;
		font-weight: 600;
	}
	button {
		flex-shrink: 0;
		width: 114rpx;
		height: 66rpx;
		line-height: 66rpx;
		border-radius: 40rpx;
		font-size: 25rpx;
		color: var(--qm-brand);
		background: var(--qm-surface);
	}
}
.calendar-scroll {
	width: calc(100% + 76rpx);
	margin-left: -38rpx;
}
.calendar-timeline {
	position: relative;
	margin: 20rpx 0 30rpx;
}
.calendar-hour {
	position: absolute;
	width: 100%;
	display: flex;
	align-items: center;
	padding-right: 38rpx;
	box-sizing: border-box;
	> text {
		position: absolute;
		left: 10rpx;
		width: 96rpx;
		text-align: center;
		transform: translateY(-50%);
		color: var(--qm-muted);
		font-size: 21rpx;
	}
	> view {
		margin-left: 112rpx;
		width: 100%;
		border-top: 1px solid var(--qm-line);
		opacity: 0.65;
	}
}
.calendar-half {
	position: absolute;
	left: 112rpx;
	right: 38rpx;
	border-top: 1px solid var(--qm-line);
	opacity: 0.3;
}
.calendar-blank-slots {
	position: absolute;
	left: 112rpx;
	right: 38rpx;
	top: 0;
	height: 100%;
	button {
		position: absolute;
		width: 100%;
		height: 56rpx;
	}
}
.calendar-events {
	position: absolute;
	left: 112rpx;
	right: 38rpx;
	top: 0;
	height: 100%;
	pointer-events: none;
}
.calendar-event {
	position: absolute;
	pointer-events: auto;
	box-sizing: border-box;
	text-align: left;
	padding: 20rpx;
	border-radius: 24rpx;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 6rpx;
	text {
		width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.4;
		font-size: 25rpx;
	}
	text:first-child {
		font-size: 29rpx;
		font-weight: 700;
	}
	text:last-child {
		font-size: 21rpx;
	}
	&.compact {
		padding: 3rpx 10rpx;
		gap: 0;
		text {
			font-size: 21rpx;
		}
		text:last-child {
			display: none;
		}
	}
}
.calendar-event.is-purple,
.calendar-list__badge.is-purple,
.calendar-month-tag.is-purple {
	background: var(--qm-lilac);
	color: var(--qm-deep);
}
.calendar-event.is-gold,
.calendar-list__badge.is-gold,
.calendar-month-tag.is-gold {
	background: var(--qm-cream);
	color: var(--qm-warning);
}
.calendar-event.is-green,
.calendar-list__badge.is-green,
.calendar-month-tag.is-green {
	background: #e6efe8;
	color: var(--qm-success);
}
.calendar-now {
	pointer-events: none;
	position: absolute;
	left: 0;
	right: 38rpx;
	display: flex;
	align-items: center;
	transform: translateY(-50%);
	> text {
		width: 112rpx;
		text-align: center;
		color: var(--qm-danger);
		background: var(--qm-paper);
		font-size: 21rpx;
	}
	> view {
		position: relative;
		flex: 1;
		height: 1px;
		background: var(--qm-danger);
		&::before {
			content: "";
			position: absolute;
			left: -4rpx;
			top: -4rpx;
			width: 9rpx;
			height: 9rpx;
			border-radius: 50%;
			background: var(--qm-danger);
		}
	}
}
.calendar-hint {
	display: block;
	text-align: center;
	font-size: 21rpx;
	color: var(--qm-muted);
	margin-top: 20rpx;
}
.calendar-state {
	text-align: center;
	color: var(--qm-muted);
	font-size: 24rpx;
}
.calendar-empty {
	padding: 64rpx 30rpx;
	display: flex;
	align-items: center;
	flex-direction: column;
	gap: 20rpx;
	image {
		width: 100rpx;
		height: 100rpx;
	}
	> text {
		font-size: 32rpx;
		color: var(--qm-deep);
		font-weight: 600;
	}
	> text + text {
		font-size: 25rpx;
		color: var(--qm-muted);
		font-weight: 400;
	}
	:deep(.qm-button) {
		width: 280rpx;
		margin-top: 20rpx;
	}
}
.calendar-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}
.calendar-list__row {
	display: flex;
	align-items: center;
	text-align: left;
	width: 100%;
	min-height: 120rpx;
	border-radius: 24rpx;
	background: var(--qm-surface);
	padding: 22rpx 24rpx;
	gap: 28rpx;
}
.calendar-list__time {
	flex-shrink: 0;
	width: 144rpx;
	text {
		display: block;
		font-size: 25rpx;
		line-height: 1.5;
	}
	text + text {
		font-size: 21rpx;
		color: var(--qm-muted);
		margin-top: 4rpx;
	}
}
.calendar-list__copy {
	min-width: 0;
	flex: 1;
	text {
		display: block;
		font-size: 27rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	text + text {
		margin-top: 6rpx;
		font-size: 23rpx;
	}
}
.project-purple {
	color: var(--qm-brand);
}
.project-gold {
	color: var(--qm-warning);
}
.project-green {
	color: var(--qm-success);
}
.calendar-list__badge {
	width: 58rpx;
	height: 58rpx;
	flex-shrink: 0;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	> view {
		width: 10rpx;
		height: 10rpx;
		border-radius: 50%;
		background: currentColor;
	}
}
</style>
