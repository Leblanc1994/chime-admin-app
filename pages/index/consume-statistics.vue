<template>
	<cl-page status-bar-background="transparent" :background-color="pageBackground">
		<view class="page-statistics">
			<view class="search-panel">
				<view class="keyword-box">
					<cl-icon name="search" :size="30" color="#969ca7" />
					<input
						v-model.trim="filters.memberKeyword"
						class="keyword-box__input"
						placeholder="搜索姓名、昵称、手机号"
						placeholder-class="keyword-box__placeholder"
						confirm-type="search"
						@confirm="reload"
					/>
				</view>
			</view>

			<view class="statistics-summary" @tap="openDateFilter">
				<view>
					<text class="statistics-summary__label">消费日期</text>
					<text class="statistics-summary__value">{{ filters.consumeStartDate }} 至 {{ filters.consumeEndDate }}</text>
				</view>
				<view class="statistics-summary__side">
					<view class="statistics-summary__total">
						<text>{{ pagination.total }}</text>
						<text>条</text>
					</view>
					<cl-icon name="arrow-right" :size="30" color="#6f7c98" />
				</view>
			</view>

			<view class="record-list" v-if="list.length">
				<view class="record-card" v-for="row in list" :key="row.id || `${row.consumeTime}-${row.memberPhone}`">
					<view class="record-card__header">
						<view>
							<text class="record-card__name">{{ getMemberName(row) }}</text>
							<text class="record-card__phone">{{ row.memberPhone || "未绑定手机号" }}</text>
						</view>
						<text class="record-card__type" :class="getConsumeTypeTone(row.consumeType)">
							{{ row.consumeType || "未分类" }}
						</text>
					</view>

					<view class="record-card__body">
						<view class="record-meta">
							<text class="record-meta__label">消费时间</text>
							<text class="record-meta__value">{{ formatDateTime(row.consumeTime) }}</text>
						</view>
						<view class="record-meta">
							<text class="record-meta__label">次卡</text>
							<text class="record-meta__value">{{ row.cardName || "-" }}</text>
						</view>
						<view class="record-meta">
							<text class="record-meta__label">扣减次数</text>
							<text class="record-meta__value">{{ isCardRecord(row) ? row.consumeTimes || 1 : "-" }}</text>
						</view>
						<view class="record-meta">
							<text class="record-meta__label">剩余次数</text>
							<text class="record-meta__value">{{ isCardRecord(row) ? row.remainTimesAfter ?? "-" : "-" }}</text>
						</view>
					</view>

					<text class="record-card__remark" v-if="row.remark">{{ row.remark }}</text>
				</view>
			</view>

			<view class="empty-state" v-else-if="loaded && !loading">没有匹配的消费记录</view>

			<view class="loading-wrap" v-if="loading">
				<cl-loading :size="34" />
				<text>正在加载消费统计</text>
			</view>

			<view class="bottom-tip" v-else-if="list.length">
				{{ finished ? "没有更多记录了" : "上拉加载更多" }}
			</view>
		</view>

		<cl-popup
			v-model="filterPopupVisible"
			title="筛选消费日期"
			direction="bottom"
			border-radius="32rpx 32rpx 0 0"
			:padding="0"
		>
			<view class="filter-popup">
				<view class="quick-range-list">
					<view
						v-for="item in quickRanges"
						:key="item.value"
						class="quick-range"
						:class="{ 'is-active': activeQuickRange === item.value }"
						@tap="applyQuickRange(item.value)"
					>
						{{ item.label }}
					</view>
				</view>

				<view class="calendar-card">
					<view class="calendar-header">
						<view class="calendar-nav" @tap="changeCalendarMonth(-1)">
							<cl-icon name="arrow-left" :size="28" color="currentColor" />
						</view>
						<view class="calendar-title">
							<text>{{ calendarMonthTitle }}</text>
							<text>{{ draftFilters.consumeStartDate }} 至 {{ draftFilters.consumeEndDate }}</text>
						</view>
						<view class="calendar-nav" @tap="changeCalendarMonth(1)">
							<cl-icon name="arrow-right" :size="28" color="currentColor" />
						</view>
					</view>

					<view class="calendar-weekdays">
						<text v-for="item in weekdayLabels" :key="item">{{ item }}</text>
					</view>

					<view class="calendar-grid">
						<view
							v-for="item in calendarDays"
							:key="item.date"
							class="calendar-day"
							:class="{
								'is-muted': !item.isCurrentMonth,
								'is-today': item.isToday,
								'is-start': item.isStart,
								'is-end': item.isEnd,
								'is-in-range': item.isInRange,
							}"
							@tap="selectCalendarDate(item.date)"
						>
							<text>{{ item.day }}</text>
						</view>
					</view>
				</view>

				<view class="filter-actions">
					<view class="filter-actions__secondary" @tap="resetPopupFilters">重置</view>
					<view class="filter-actions__primary" @tap="applyPopupFilters">确定</view>
				</view>
			</view>
		</cl-popup>
	</cl-page>
</template>

<script lang="ts" setup>
import { onPullDownRefresh, onReachBottom, onShow } from "@dcloudio/uni-app";
import dayjs, { type Dayjs } from "dayjs";
import { computed, reactive, ref } from "vue";
import { useUi } from "/$/cool-ui";
import MemberConsumeRecordService from "../../service/member/consume-record";

type ConsumeRecordRow = {
	id?: number;
	memberName?: string;
	memberNickName?: string;
	memberPhone?: string;
	cardAccountId?: number;
	cardName?: string;
	consumeType?: string;
	consumeTime?: string;
	consumeTimes?: number;
	remainTimesAfter?: number;
	remark?: string;
	createTime?: string;
};

const MEMBER_CARD_TYPE = "会员次卡";
const consumeRecordService = new MemberConsumeRecordService();
const ui = useUi();
const today = dayjs().format("YYYY-MM-DD");
const currentMonthRange = getCurrentMonthRange();
const pageBackground =
	"linear-gradient(156deg, #fbfdff 0%, #edf7ff 32%, #f7fbff 58%, #f4f8fc 100%)";
const weekdayLabels = ["一", "二", "三", "四", "五", "六", "日"];
const quickRanges = [
	{ label: "昨日", value: "yesterday" },
	{ label: "上个月", value: "lastMonth" },
	{ label: "去年", value: "lastYear" },
] as const;
type QuickRangeValue = (typeof quickRanges)[number]["value"];

const loading = ref(false);
const loaded = ref(false);
const finished = ref(false);
const filterPopupVisible = ref(false);
const calendarMonth = ref(dayjs().startOf("month"));
const calendarSelectStep = ref<"start" | "end">("start");
const list = ref<ConsumeRecordRow[]>([]);

const pagination = reactive({
	page: 1,
	size: 10,
	total: 0,
});

const filters = reactive({
	consumeStartDate: currentMonthRange.start,
	consumeEndDate: currentMonthRange.end,
	memberKeyword: "",
});

const draftFilters = reactive({
	consumeStartDate: currentMonthRange.start,
	consumeEndDate: currentMonthRange.end,
});

const calendarMonthTitle = computed(() => calendarMonth.value.format("YYYY年MM月"));

const activeQuickRange = computed(() => {
	const ranges: Record<QuickRangeValue, { start: string; end: string }> = {
		yesterday: getQuickRange("yesterday"),
		lastMonth: getQuickRange("lastMonth"),
		lastYear: getQuickRange("lastYear"),
	};

	const match = quickRanges.find((item) => {
		const range = ranges[item.value];
		return (
			range.start === draftFilters.consumeStartDate && range.end === draftFilters.consumeEndDate
		);
	});

	return match?.value || "";
});

const calendarDays = computed(() => {
	const monthStart = calendarMonth.value.startOf("month");
	const offset = (monthStart.day() + 6) % 7;
	const firstCell = monthStart.subtract(offset, "day");
	const start = dayjs(draftFilters.consumeStartDate);
	const end = dayjs(draftFilters.consumeEndDate);
	const normalizedStart = start.isValid() ? start.startOf("day") : dayjs(today);
	const normalizedEnd = end.isValid() ? end.startOf("day") : normalizedStart;

	return Array.from({ length: 42 }, (_, index) => {
		const date = firstCell.add(index, "day");
		const value = date.format("YYYY-MM-DD");
		const currentDay = date.startOf("day");

		return {
			date: value,
			day: date.date(),
			isCurrentMonth: date.month() === monthStart.month(),
			isToday: value === today,
			isStart: value === normalizedStart.format("YYYY-MM-DD"),
			isEnd: value === normalizedEnd.format("YYYY-MM-DD"),
			isInRange: currentDay.isAfter(normalizedStart) && currentDay.isBefore(normalizedEnd),
		};
	});
});

function normalizeDate(value: string) {
	const date = dayjs(value);
	return date.isValid() ? date.format("YYYY-MM-DD") : today;
}

function getCurrentMonthRange() {
	return {
		start: dayjs().startOf("month").format("YYYY-MM-DD"),
		end: dayjs().endOf("month").format("YYYY-MM-DD"),
	};
}

function getQuickRange(type: QuickRangeValue) {
	if (type === "yesterday") {
		const date = dayjs().subtract(1, "day").format("YYYY-MM-DD");
		return {
			start: date,
			end: date,
		};
	}

	if (type === "lastMonth") {
		const date = dayjs().subtract(1, "month");
		return {
			start: date.startOf("month").format("YYYY-MM-DD"),
			end: date.endOf("month").format("YYYY-MM-DD"),
		};
	}

	const date = dayjs().subtract(1, "year");
	return {
		start: date.startOf("year").format("YYYY-MM-DD"),
		end: date.endOf("year").format("YYYY-MM-DD"),
	};
}

function buildSearchParams() {
	const startDate = normalizeDate(filters.consumeStartDate);
	const endDate = normalizeDate(filters.consumeEndDate);

	return {
		page: pagination.page,
		size: pagination.size,
		order: "consumeTime",
		sort: "desc",
		consumeStartTime: dayjs(startDate).startOf("day").format("YYYY-MM-DD HH:mm:ss"),
		consumeEndTime: dayjs(endDate).add(1, "day").startOf("day").format("YYYY-MM-DD HH:mm:ss"),
		memberKeyword: filters.memberKeyword || undefined,
	};
}

function formatDateTime(value?: string) {
	if (!value) {
		return "-";
	}

	const time = dayjs(value);
	return time.isValid() ? time.format("YYYY-MM-DD HH:mm") : value;
}

function isCardRecord(row: ConsumeRecordRow) {
	return Boolean(
		row.cardAccountId ||
			(row.consumeType && (row.consumeType === MEMBER_CARD_TYPE || row.consumeType.endsWith("次卡"))),
	);
}

function getMemberName(row: ConsumeRecordRow) {
	return row.memberName || row.memberNickName || "未命名客户";
}

function getConsumeTypeTone(type?: string) {
	if (type === "会员次卡") {
		return "is-green";
	}

	if (type === "抖音新客福利") {
		return "is-rose";
	}

	if (type === "美团团购") {
		return "is-amber";
	}

	if (type === "纹绣") {
		return "is-blue";
	}

	return "is-gray";
}

async function fetchList(options?: { append?: boolean; silent?: boolean }) {
	const { append = false, silent = false } = options || {};

	if (loading.value) {
		return;
	}

	if (!silent) {
		loading.value = true;
	}

	try {
		const res: any = await consumeRecordService.page(buildSearchParams());
		const rows = res?.list || [];
		const total = res?.pagination?.total || 0;

		pagination.total = total;
		list.value = append ? [...list.value, ...rows] : rows;
		finished.value = list.value.length >= total || rows.length < pagination.size;
		loaded.value = true;
	} catch (err: any) {
		if (append && pagination.page > 1) {
			pagination.page -= 1;
		}

		ui.showTips(err?.message || "消费统计加载失败");
	} finally {
		loading.value = false;
	}
}

async function reload() {
	pagination.page = 1;
	finished.value = false;
	await fetchList();
}

function resetPopupFilters() {
	const range = getCurrentMonthRange();

	draftFilters.consumeStartDate = range.start;
	draftFilters.consumeEndDate = range.end;
	calendarMonth.value = dayjs(range.start).startOf("month");
	calendarSelectStep.value = "start";
}

function openDateFilter() {
	draftFilters.consumeStartDate = normalizeDate(filters.consumeStartDate);
	draftFilters.consumeEndDate = normalizeDate(filters.consumeEndDate);
	calendarMonth.value = dayjs(draftFilters.consumeStartDate).startOf("month");
	calendarSelectStep.value = "start";
	filterPopupVisible.value = true;
}

function updateDraftRange(start: Dayjs, end: Dayjs) {
	draftFilters.consumeStartDate = start.format("YYYY-MM-DD");
	draftFilters.consumeEndDate = end.format("YYYY-MM-DD");
}

function applyQuickRange(type: QuickRangeValue) {
	const range = getQuickRange(type);
	draftFilters.consumeStartDate = range.start;
	draftFilters.consumeEndDate = range.end;
	calendarMonth.value = dayjs(range.start).startOf("month");
	calendarSelectStep.value = "start";
}

function changeCalendarMonth(offset: number) {
	calendarMonth.value = calendarMonth.value.add(offset, "month");
}

function selectCalendarDate(value: string) {
	const selectedDate = dayjs(value).startOf("day");
	const startDate = dayjs(draftFilters.consumeStartDate).startOf("day");

	if (!selectedDate.isSame(calendarMonth.value, "month")) {
		calendarMonth.value = selectedDate.startOf("month");
	}

	if (calendarSelectStep.value === "start") {
		updateDraftRange(selectedDate, selectedDate);
		calendarSelectStep.value = "end";
		return;
	}

	if (selectedDate.isBefore(startDate)) {
		updateDraftRange(selectedDate, startDate);
	} else {
		updateDraftRange(startDate, selectedDate);
	}

	calendarSelectStep.value = "start";
}

function applyPopupFilters() {
	const start = normalizeDate(draftFilters.consumeStartDate);
	const end = normalizeDate(draftFilters.consumeEndDate);

	if (dayjs(start).isAfter(dayjs(end))) {
		ui.showTips("开始日期不能晚于结束日期");
		return;
	}

	filters.consumeStartDate = start;
	filters.consumeEndDate = end;
	filterPopupVisible.value = false;
	reload();
}

onShow(() => {
	if (!loaded.value) {
		reload();
	}
});

onPullDownRefresh(async () => {
	await reload();
	uni.stopPullDownRefresh();
});

onReachBottom(async () => {
	if (loading.value || finished.value) {
		return;
	}

	pagination.page += 1;
	await fetchList({
		append: true,
	});
});
</script>

<style lang="scss" scoped>
.page-statistics {
	--statistics-ink: #071653;
	--statistics-muted: #7885a0;
	--statistics-soft: #edf5ff;
	--statistics-blue: #1677ff;
	--statistics-cyan: #24d2c4;
	--statistics-green: #07947f;
	--statistics-orange: #ff8a05;
	--statistics-purple: #5f46e8;
	position: relative;
	min-height: 100%;
	padding: 34rpx 28rpx 48rpx;
	box-sizing: border-box;
	overflow: hidden;
}

.page-statistics::before,
.page-statistics::after {
	content: "";
	position: absolute;
	pointer-events: none;
}

.page-statistics::before {
	top: -132rpx;
	right: -156rpx;
	width: 560rpx;
	height: 360rpx;
	transform: rotate(-38deg);
	border-radius: 48rpx;
	background: linear-gradient(90deg, rgba(184, 220, 255, 0.42), rgba(231, 245, 255, 0));
}

.page-statistics::after {
	top: 208rpx;
	left: -120rpx;
	width: 300rpx;
	height: 480rpx;
	border-radius: 50%;
	background: rgba(210, 232, 255, 0.32);
	filter: blur(36rpx);
}

.search-panel,
.statistics-summary,
.record-card,
.loading-wrap,
.bottom-tip,
.empty-state {
	position: relative;
	z-index: 1;
}

.search-panel,
.statistics-summary,
.record-card {
	background: linear-gradient(145deg, rgba(254, 255, 255, 0.96), rgba(248, 252, 255, 0.94));
	border: 1rpx solid rgba(255, 255, 255, 0.92);
	border-radius: 28rpx;
	box-shadow: 0 18rpx 44rpx rgba(38, 73, 116, 0.09);
	box-sizing: border-box;
}

.search-panel {
	padding: 20rpx;
	margin-bottom: 18rpx;
}

.keyword-box {
	display: flex;
	align-items: center;
	height: 78rpx;
	padding: 0 24rpx;
	border-radius: 999rpx;
	background: rgba(235, 240, 247, 0.72);
}

.keyword-box__input {
	flex: 1;
	min-width: 0;
	margin-left: 14rpx;
	font-size: 27rpx;
	color: var(--statistics-ink);
}

.keyword-box__placeholder {
	color: #969ca7;
}

.statistics-summary {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24rpx;
	padding: 22rpx 26rpx;
	margin-bottom: 18rpx;
}

.statistics-summary__label {
	display: block;
	font-size: 22rpx;
	color: var(--statistics-muted);
}

.statistics-summary__value {
	display: block;
	margin-top: 8rpx;
	font-size: 26rpx;
	font-weight: 750;
	color: var(--statistics-ink);
	word-break: break-all;
}

.statistics-summary__side {
	display: flex;
	align-items: center;
	flex-shrink: 0;
	gap: 10rpx;
}

.statistics-summary__total {
	display: flex;
	align-items: baseline;
	color: var(--statistics-orange);

	text:first-child {
		font-size: 42rpx;
		font-weight: 850;
	}

	text:last-child {
		margin-left: 6rpx;
		font-size: 22rpx;
		font-weight: 700;
	}
}

.record-list {
	display: grid;
	gap: 18rpx;
}

.record-card {
	padding: 26rpx;
}

.record-card__header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 18rpx;
}

.record-card__name {
	display: block;
	font-size: 31rpx;
	font-weight: 850;
	color: var(--statistics-ink);
	line-height: 1.2;
}

.record-card__phone {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #7f8aa2;
}

.record-card__type {
	flex-shrink: 0;
	padding: 8rpx 16rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	font-weight: 800;
}

.record-card__type.is-green {
	background: rgba(20, 173, 139, 0.13);
	color: var(--statistics-green);
}

.record-card__type.is-rose {
	background: rgba(231, 84, 128, 0.13);
	color: #d84b77;
}

.record-card__type.is-amber {
	background: rgba(255, 138, 5, 0.14);
	color: var(--statistics-orange);
}

.record-card__type.is-blue {
	background: rgba(22, 119, 255, 0.13);
	color: var(--statistics-blue);
}

.record-card__type.is-gray {
	background: rgba(120, 133, 160, 0.13);
	color: #64718a;
}

.record-card__body {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
	margin-top: 24rpx;
}

.record-meta {
	min-width: 0;
}

.record-meta__label {
	display: block;
	font-size: 21rpx;
	color: var(--statistics-muted);
}

.record-meta__value {
	display: block;
	margin-top: 8rpx;
	font-size: 25rpx;
	font-weight: 750;
	color: #283757;
	word-break: break-all;
}

.record-card__remark {
	display: block;
	margin-top: 22rpx;
	padding-top: 18rpx;
	border-top: 1rpx solid rgba(120, 133, 160, 0.14);
	font-size: 24rpx;
	line-height: 1.5;
	color: #6f7c98;
}

.loading-wrap,
.bottom-tip,
.empty-state {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 88rpx;
	color: var(--statistics-muted);
	font-size: 24rpx;
}

.empty-state {
	min-height: 220rpx;
}

.loading-wrap text {
	margin-left: 12rpx;
}

.filter-popup {
	position: relative;
	padding: 18rpx 28rpx calc(30rpx + env(safe-area-inset-bottom));
	background:
		linear-gradient(180deg, rgba(251, 253, 255, 0.98), rgba(243, 248, 253, 0.98));
}

.filter-popup::before {
	content: "";
	display: block;
	width: 74rpx;
	height: 8rpx;
	margin: 0 auto 24rpx;
	border-radius: 999rpx;
	background: rgba(120, 133, 160, 0.28);
}

.quick-range-list {
	display: flex;
	gap: 14rpx;
	margin-bottom: 18rpx;
}

.quick-range {
	align-items: center;
	justify-content: center;
	flex: 1;
	height: 58rpx;
	border: 1rpx solid rgba(184, 205, 233, 0.62);
	border-radius: 999rpx;
	background: rgba(237, 245, 255, 0.78);
	color: #596a8a;
	font-size: 24rpx;
	font-weight: 800;
	box-sizing: border-box;
}

.quick-range,
.calendar-nav,
.calendar-day,
.filter-actions__secondary,
.filter-actions__primary {
	display: flex;
}

.quick-range.is-active {
	border-color: rgba(7, 148, 127, 0.2);
	background: rgba(36, 210, 196, 0.14);
	color: var(--statistics-green);
}

.calendar-card {
	padding: 22rpx;
	margin-bottom: 18rpx;
	border: 1rpx solid rgba(184, 205, 233, 0.66);
	border-radius: 26rpx;
	background:
		linear-gradient(145deg, rgba(254, 255, 255, 0.98), rgba(246, 250, 255, 0.96));
	box-shadow: 0 14rpx 30rpx rgba(38, 73, 116, 0.07);
	box-sizing: border-box;
}

.calendar-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	margin-bottom: 22rpx;
}

.calendar-nav {
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	width: 58rpx;
	height: 58rpx;
	border-radius: 50%;
	background: rgba(237, 245, 255, 0.88);
	color: #6f7c98;
}

.calendar-title {
	min-width: 0;
	text-align: center;
}

.calendar-title text:first-child {
	display: block;
	font-size: 31rpx;
	font-weight: 900;
	line-height: 1;
	color: var(--statistics-ink);
}

.calendar-title text:last-child {
	display: block;
	margin-top: 12rpx;
	font-size: 22rpx;
	font-weight: 700;
	line-height: 1;
	color: var(--statistics-muted);
}

.calendar-weekdays,
.calendar-grid {
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
}

.calendar-weekdays {
	margin-bottom: 8rpx;
}

.calendar-weekdays text {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 46rpx;
	color: #7f8aa2;
	font-size: 22rpx;
	font-weight: 800;
}

.calendar-grid {
	row-gap: 8rpx;
}

.calendar-day {
	position: relative;
	align-items: center;
	justify-content: center;
	height: 58rpx;
	color: var(--statistics-ink);
	font-size: 25rpx;
	font-weight: 800;
}

.calendar-day::before {
	content: "";
	position: absolute;
	inset: 6rpx 0;
	background: transparent;
}

.calendar-day text {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
}

.calendar-day.is-muted {
	color: rgba(120, 133, 160, 0.46);
}

.calendar-day.is-in-range::before {
	background: rgba(36, 210, 196, 0.11);
}

.calendar-day.is-start::before {
	left: 50%;
	background: rgba(36, 210, 196, 0.11);
}

.calendar-day.is-end::before {
	right: 50%;
	background: rgba(36, 210, 196, 0.11);
}

.calendar-day.is-start.is-end::before {
	display: none;
}

.calendar-day.is-start text,
.calendar-day.is-end text {
	background: linear-gradient(145deg, #24d7b3, #07947f);
	color: #fbfdff;
	box-shadow: 0 10rpx 20rpx rgba(7, 148, 127, 0.2);
}

.calendar-day.is-today:not(.is-start):not(.is-end) text {
	color: var(--statistics-blue);
	background: rgba(22, 119, 255, 0.1);
}

.filter-actions {
	display: flex;
	gap: 18rpx;
	margin-top: 28rpx;
}

.filter-actions__secondary,
.filter-actions__primary {
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 1;
	height: 88rpx;
	border-radius: 999rpx;
	font-size: 28rpx;
	font-weight: 800;
	box-sizing: border-box;
}

.filter-actions__secondary {
	border: 1rpx solid rgba(184, 205, 233, 0.72);
	background: rgba(237, 245, 255, 0.92);
	color: #596a8a;
}

.filter-actions__primary {
	background: linear-gradient(145deg, #24d7b3, #07947f);
	color: #fbfdff;
	box-shadow: 0 14rpx 28rpx rgba(7, 148, 127, 0.18);
}

:deep(.cl-popup__modal) {
	background: rgba(7, 22, 83, 0.42) !important;
}

:deep(.cl-popup__wrapper--bottom .cl-popup) {
	background: #fbfdff !important;
	box-shadow: 0 -18rpx 46rpx rgba(18, 44, 84, 0.12);
}

:deep(.cl-popup__header) {
	position: relative;
	height: auto;
	padding: 38rpx 32rpx 24rpx;
	background: #fbfdff;
	color: var(--statistics-ink);
	font-size: 31rpx;
	font-weight: 900;
	line-height: 1.2;
	box-sizing: border-box;
}

:deep(.cl-popup__header::after) {
	content: "";
	position: absolute;
	left: 32rpx;
	right: 32rpx;
	bottom: 0;
	height: 1rpx;
	background: linear-gradient(90deg, rgba(211, 228, 251, 0), rgba(178, 210, 249, 0.56), rgba(211, 228, 251, 0));
}
</style>
