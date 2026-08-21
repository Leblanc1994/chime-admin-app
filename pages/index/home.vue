<template>
	<cl-page status-bar-background="transparent" :background-color="pageBackground">
		<!-- #ifdef MP -->
		<cl-sticky>
			<cl-topbar :show-back="false" :border="false" background-color="transparent" />
		</cl-sticky>
		<!-- #endif -->

		<view class="page-home">
			<view class="hero-greeting">
				<view>
					<view class="hero-greeting__title">
						<text>您好，管理员</text>
						<text class="hero-greeting__wave">👋</text>
					</view>
					<view class="hero-greeting__date">
						<text>{{ formatDisplayDate(today) }}</text>
						<text>{{ formatWeekday(today) }}</text>
					</view>
				</view>

				<view class="notification-button" @tap="fetchSummary(true)">
					<cl-icon class="notification-button__icon" name="notification" :size="45" color="currentColor" />
					<text class="notification-button__dot"></text>
				</view>
			</view>

			<view class="metric-grid">
				<view class="metric-card" v-for="item in metricCards" :key="item.key" :class="`is-${item.tone}`">
					<view class="metric-card__content">
						<view class="metric-card__orb">
							<view class="metric-card__symbol" :class="`is-${item.symbol}`">
								<text v-if="item.symbol === 'members'" class="symbol-member symbol-member--main"></text>
								<text v-if="item.symbol === 'members'" class="symbol-member symbol-member--side"></text>
								<text v-if="item.symbol === 'memberAdd'" class="symbol-member symbol-member--main"></text>
								<text v-if="item.symbol === 'memberAdd'" class="symbol-plus">+</text>
								<text v-if="item.symbol === 'receipt'" class="symbol-receipt">
									<text></text>
									<text></text>
									<text></text>
								</text>
								<text v-if="item.symbol === 'calendar'" class="symbol-calendar">
									<text></text>
									<text></text>
									<text></text>
								</text>
							</view>
						</view>

						<view class="metric-card__main">
							<text class="metric-card__label">{{ item.label }}</text>
							<view class="metric-card__value">
								<text>{{ item.value }}</text>
								<text class="metric-card__unit">{{ item.unit }}</text>
							</view>
						</view>
					</view>

					<view class="metric-card__footer">
						<text>{{ item.footerLabel }}</text>
						<view class="metric-card__footer-value" :class="{ 'is-link': item.footerLink }">
							<text>{{ item.footerValue }}</text>
							<cl-icon v-if="item.footerLink" name="arrow-right" :size="28" color="currentColor" />
						</view>
					</view>
				</view>
			</view>

			<view class="dashboard-panel trend-panel">
				<view class="panel-header">
					<view class="panel-title-row">
						<text class="panel-title">消费记录月度趋势</text>
						<view class="year-pill">
							<text>{{ currentYear }}年</text>
							<cl-icon name="caret-bottom" :size="24" color="#6f7c98" />
						</view>
					</view>
					<view class="sync-state">
						<text class="sync-state__dot"></text>
						<text>{{ loading ? "同步中" : "实时同步" }}</text>
					</view>
				</view>

				<view class="chart-grid">
					<view class="chart-axis">
						<text v-for="label in chartAxisLabels" :key="label">{{ label }}</text>
					</view>
					<view class="monthly-chart">
						<view class="chart-lines">
							<text></text>
							<text></text>
							<text></text>
							<text></text>
						</view>
						<view class="monthly-bar" v-for="item in monthlyBars" :key="item.month">
							<view class="monthly-bar__track">
								<view class="monthly-bar__fill" :style="{ height: item.height }"></view>
							</view>
							<text class="monthly-bar__label" :class="{ 'is-long': item.month >= 10 }">
								{{ item.month }}月
							</text>
						</view>
					</view>
				</view>
			</view>

			<view class="dashboard-panel type-panel">
				<view class="panel-header">
					<text class="panel-title">今日消费类型明细</text>
					<view class="type-total">
						<text>{{ todayTypeTotal }} 条</text>
						<cl-icon name="arrow-right" :size="30" color="currentColor" />
					</view>
				</view>

				<view class="type-list" v-if="summary.todayTypeCounts.length">
					<view class="type-row" v-for="item in summary.todayTypeCounts" :key="item.consumeType || 'none'">
						<view class="type-row__main">
							<text class="type-row__dot"></text>
							<text class="type-row__name">{{ item.consumeType || "未分类" }}</text>
						</view>
						<text class="type-row__count">{{ formatNumber(item.recordCount) }} 条</text>
					</view>
				</view>

				<view class="empty-state" v-else>
					<view class="empty-illustration">
						<view class="empty-illustration__paper"></view>
						<view class="empty-illustration__box">
							<text></text>
							<text></text>
						</view>
						<view class="empty-illustration__petal is-one"></view>
						<view class="empty-illustration__petal is-two"></view>
						<view class="empty-illustration__petal is-three"></view>
					</view>
					<text>今日暂无消费记录</text>
				</view>
			</view>

			<view class="dashboard-panel attention-panel">
				<view class="panel-header">
					<view class="panel-title-row">
						<text class="panel-title">经营关注</text>
						<text class="attention-panel__hint">今天优先处理</text>
					</view>
					<view class="type-total" @tap="toMemberList">
						<text>查看会员</text>
						<cl-icon name="arrow-right" :size="30" color="currentColor" />
					</view>
				</view>

				<view class="attention-list" v-if="attentionItems.length">
					<view
						v-for="item in attentionItems"
						:key="item.key"
						class="attention-row"
						:class="`is-${item.tone}`"
						@tap="toMemberList"
					>
						<view class="attention-row__signal">
							<text>{{ item.count }}</text>
						</view>
						<view class="attention-row__copy">
							<text class="attention-row__title">{{ item.title }}</text>
							<text class="attention-row__desc">{{ item.desc }}</text>
						</view>
						<cl-icon name="arrow-right" :size="30" color="#8a939c" />
					</view>
				</view>

				<view class="attention-empty" v-else>
					<view class="attention-empty__check">✓</view>
					<text>当前没有需要优先跟进的会员</text>
				</view>
			</view>
		</view>

		<tabbar />
	</cl-page>
</template>

<script lang="ts" setup>
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import dayjs, { type Dayjs } from "dayjs";
import { computed, reactive, ref } from "vue";
import { useCool } from "/@/cool";
import { useUi } from "/$/cool-ui";
import MemberDashboardService, { type MemberDashboardSummary } from "../../service/member/dashboard";
import Tabbar from "./components/tabbar.vue";

const ui = useUi();
const { router } = useCool();
const dashboardService = new MemberDashboardService();
const loading = ref(false);
const loaded = ref(false);
const today = dayjs();
const currentYear = today.year();
const weekdayLabels = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

const pageBackground =
	"linear-gradient(156deg, #fbfdff 0%, #edf7ff 32%, #f7fbff 58%, #f4f8fc 100%)";

function emptySummary(): MemberDashboardSummary {
	return {
		totalMemberCount: 0,
		todayNewMemberCount: 0,
		todayConsumeRecordCount: 0,
		yesterdayConsumeRecordCount: 0,
		weekConsumeRecordCount: 0,
		monthConsumeRecordCount: 0,
		lowBalanceCardCount: 0,
		expiringCardCount: 0,
		inactiveMemberCount: 0,
		todayTypeCounts: [],
		monthlyConsumeRecordCounts: Array.from({ length: 12 }, (_, index) => ({
			month: index + 1,
			recordCount: 0,
		})),
	};
}

const summary = reactive<MemberDashboardSummary>(emptySummary());

const metricCards = computed(() => [
	{
		key: "totalMember",
		label: "会员总数",
		value: formatNumber(summary.totalMemberCount),
		unit: "人",
		footerLabel: "今日新增",
		footerValue: `${formatNumber(summary.todayNewMemberCount)} 人`,
		symbol: "members",
		tone: "blue",
		footerLink: false,
	},
	{
		key: "newMember",
		label: "新增会员",
		value: formatNumber(summary.todayNewMemberCount),
		unit: "人",
		footerLabel: "统计口径",
		footerValue: "首次开卡",
		symbol: "memberAdd",
		tone: "green",
		footerLink: true,
	},
	{
		key: "todayConsume",
		label: "今日消费记录",
		value: formatNumber(summary.todayConsumeRecordCount),
		unit: "条",
		footerLabel: "昨日消费记录",
		footerValue: `${formatNumber(summary.yesterdayConsumeRecordCount)} 条`,
		symbol: "receipt",
		tone: "orange",
		footerLink: false,
	},
	{
		key: "monthConsume",
		label: "本月消费记录",
		value: formatNumber(summary.monthConsumeRecordCount),
		unit: "条",
		footerLabel: "本周消费记录",
		footerValue: `${formatNumber(summary.weekConsumeRecordCount)} 条`,
		symbol: "calendar",
		tone: "purple",
		footerLink: false,
	},
]);

const todayTypeTotal = computed(() => {
	return formatNumber(summary.todayTypeCounts.reduce((total, item) => total + (item.recordCount || 0), 0));
});

const attentionItems = computed(() => {
	const items = [
		{
			key: "low-balance",
			count: summary.lowBalanceCardCount || 0,
			title: "次卡余额偏低",
			desc: "剩余 1 至 2 次，适合提醒续卡",
			tone: "amber",
		},
		{
			key: "expiring",
			count: summary.expiringCardCount || 0,
			title: "次卡即将到期",
			desc: "未来 7 天内到期，建议主动回访",
			tone: "coral",
		},
		{
			key: "inactive",
			count: summary.inactiveMemberCount || 0,
			title: "沉睡会员待唤醒",
			desc: "30 天未消费，但仍有可用次卡",
			tone: "blue",
		},
	];

	return items.filter((item) => item.count > 0);
});

const chartTop = computed(() => {
	const max = Math.max(...summary.monthlyConsumeRecordCounts.map((item) => item.recordCount || 0), 1);

	return Math.max(15, Math.ceil(max / 5) * 5);
});

const chartAxisLabels = computed(() => {
	const top = chartTop.value;

	return [top, Math.round((top / 3) * 2), Math.round(top / 3), 0];
});

const monthlyBars = computed(() => {
	return summary.monthlyConsumeRecordCounts.map((item) => ({
		month: item.month,
		height: `${Math.max(9, Math.round(((item.recordCount || 0) / chartTop.value) * 100))}%`,
	}));
});

function formatNumber(value?: number) {
	return Number(value || 0).toLocaleString("zh-CN");
}

function toMemberList() {
	router.push("/pages/index/member");
}

function formatDisplayDate(date: Dayjs) {
	return date.format("YYYY年M月D日");
}

function formatWeekday(date: Dayjs) {
	return weekdayLabels[date.day()];
}

function applySummary(data?: Partial<MemberDashboardSummary>) {
	const next = {
		...emptySummary(),
		...(data || {}),
	};

	Object.assign(summary, {
		...next,
		todayTypeCounts: next.todayTypeCounts || [],
		monthlyConsumeRecordCounts:
			next.monthlyConsumeRecordCounts?.length === 12
				? next.monthlyConsumeRecordCounts
				: emptySummary().monthlyConsumeRecordCounts,
	});
}

async function fetchSummary(showMessage = false) {
	if (loading.value) {
		return;
	}

	loading.value = true;

	try {
		applySummary(await dashboardService.summary());
		loaded.value = true;

		if (showMessage) {
			ui.showTips("首页统计已刷新");
		}
	} catch (err: any) {
		applySummary();

		if (showMessage) {
			ui.showTips(err?.message || "首页统计加载失败");
		}
	} finally {
		loading.value = false;
	}
}

onShow(() => {
	if (!loaded.value) {
		fetchSummary();
	}
});

onPullDownRefresh(async () => {
	await fetchSummary(true);
	uni.stopPullDownRefresh();
});
</script>

<style lang="scss" scoped>
.page-home {
	--home-ink: #071653;
	--home-muted: #7885a0;
	--home-soft: #edf5ff;
	--home-surface: #fbfdff;
	--home-blue: #1677ff;
	--home-cyan: #24d2c4;
	--home-green: #07947f;
	--home-orange: #ff8a05;
	--home-purple: #5f46e8;
	position: relative;
	min-height: 100%;
	padding: 76rpx 34rpx 176rpx;
	box-sizing: border-box;
	overflow: hidden;
}

.page-home::before,
.page-home::after {
	content: "";
	position: absolute;
	pointer-events: none;
}

.page-home::before {
	top: -132rpx;
	right: -156rpx;
	width: 560rpx;
	height: 360rpx;
	transform: rotate(-38deg);
	border-radius: 48rpx;
	background: linear-gradient(90deg, rgba(184, 220, 255, 0.42), rgba(231, 245, 255, 0));
}

.page-home::after {
	top: 236rpx;
	left: -120rpx;
	width: 300rpx;
	height: 480rpx;
	border-radius: 50%;
	background: rgba(210, 232, 255, 0.32);
	filter: blur(36rpx);
}

.hero-greeting,
.metric-grid,
.dashboard-panel {
	position: relative;
	z-index: 1;
}

.hero-greeting {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 0 6rpx 42rpx;
}

.hero-greeting__title {
	display: flex;
	align-items: center;
	min-width: 0;
	font-size: 46rpx;
	font-weight: 900;
	line-height: 1.16;
	color: var(--home-ink);
}

.hero-greeting__wave {
	margin-left: 18rpx;
	font-size: 42rpx;
	line-height: 1;
}

.hero-greeting__date {
	display: flex;
	align-items: center;
	gap: 22rpx;
	margin-top: 24rpx;
	font-size: 28rpx;
	font-weight: 500;
	line-height: 1;
	color: #697897;
}

.notification-button {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	width: 86rpx;
	height: 86rpx;
	border-radius: 50%;
	background: rgba(253, 254, 255, 0.94);
	box-shadow: 0 16rpx 36rpx rgba(24, 71, 124, 0.1);
	box-sizing: border-box;
	color: var(--home-ink);
}

.notification-button__icon {
	display: block;
	line-height: 1;
}

.notification-button__dot {
	position: absolute;
	top: 18rpx;
	right: 16rpx;
	width: 17rpx;
	height: 17rpx;
	border: 4rpx solid #fbfdff;
	border-radius: 50%;
	background: #ff3434;
	box-sizing: border-box;
}

.metric-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 22rpx;
	margin-bottom: 28rpx;
}

.metric-card,
.dashboard-panel {
	background: linear-gradient(145deg, rgba(254, 255, 255, 0.96), rgba(248, 252, 255, 0.94));
	border: 1rpx solid rgba(255, 255, 255, 0.92);
	box-shadow: 0 18rpx 44rpx rgba(38, 73, 116, 0.09);
	box-sizing: border-box;
}

.metric-card {
	min-height: 206rpx;
	padding: 30rpx 26rpx 26rpx;
	border-radius: 24rpx;
}

.metric-card__content,
.metric-card__footer,
.metric-card__footer-value,
.panel-header,
.panel-title-row,
.sync-state,
.type-total,
.type-row,
.type-row__main {
	display: flex;
	align-items: center;
}

.metric-card__content {
	gap: 24rpx;
}

.metric-card__orb {
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	width: 84rpx;
	height: 84rpx;
	border-radius: 50%;
}

.metric-card__symbol {
	position: relative;
	width: 58rpx;
	height: 58rpx;
}

.metric-card__main {
	min-width: 0;
}

.metric-card__label {
	display: block;
	font-size: 26rpx;
	font-weight: 700;
	line-height: 1.1;
	color: #73819c;
	white-space: nowrap;
}

.metric-card__value {
	display: flex;
	align-items: baseline;
	margin-top: 14rpx;
	color: var(--home-ink);

	text:first-child {
		font-size: 52rpx;
		font-weight: 900;
		line-height: 0.95;
	}
}

.metric-card__unit {
	margin-left: 8rpx;
	font-size: 25rpx;
	font-weight: 500;
	color: var(--home-ink);
}

.metric-card__footer {
	justify-content: space-between;
	margin-top: 28rpx;
	font-size: 26rpx;
	font-weight: 500;
	line-height: 1;
	color: #73819c;
}

.metric-card__footer-value {
	gap: 4rpx;
	font-weight: 700;
	color: var(--home-blue);
}

.metric-card__footer-value.is-link {
	color: var(--home-green);
}

.metric-card.is-blue .metric-card__orb {
	background: linear-gradient(145deg, rgba(50, 132, 255, 0.13), rgba(44, 209, 255, 0.08));
}

.metric-card.is-green .metric-card__orb {
	background: linear-gradient(145deg, rgba(20, 173, 139, 0.15), rgba(120, 225, 194, 0.12));
}

.metric-card.is-orange .metric-card__orb {
	background: linear-gradient(145deg, rgba(255, 169, 44, 0.15), rgba(255, 242, 220, 0.82));
}

.metric-card.is-purple .metric-card__orb {
	background: linear-gradient(145deg, rgba(109, 78, 238, 0.14), rgba(230, 225, 255, 0.75));
}

.symbol-member {
	position: absolute;
	display: block;
	border-radius: 999rpx;
	background: linear-gradient(145deg, #3bd0ff, #216bff);
	box-shadow: inset 6rpx 7rpx 10rpx rgba(255, 255, 255, 0.58);
}

.symbol-member::before {
	content: "";
	position: absolute;
	left: 50%;
	top: -19rpx;
	width: 25rpx;
	height: 25rpx;
	transform: translateX(-50%);
	border-radius: 50%;
	background: inherit;
	box-shadow: inherit;
}

.symbol-member--main {
	left: 15rpx;
	bottom: 7rpx;
	width: 34rpx;
	height: 24rpx;
}

.symbol-member--side {
	right: 0;
	bottom: 4rpx;
	width: 24rpx;
	height: 19rpx;
	opacity: 0.72;
}

.symbol-member--side::before {
	width: 18rpx;
	height: 18rpx;
	top: -14rpx;
}

.is-memberAdd .symbol-member {
	background: linear-gradient(145deg, #24d7b3, #07947f);
}

.symbol-plus {
	position: absolute;
	right: -1rpx;
	bottom: 7rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28rpx;
	height: 28rpx;
	border: 5rpx solid #e9faf6;
	border-radius: 50%;
	background: #109d8a;
	color: #fbfdff;
	font-size: 24rpx;
	font-weight: 900;
	line-height: 1;
	box-sizing: border-box;
}

.symbol-receipt,
.symbol-calendar {
	position: absolute;
	left: 12rpx;
	top: 8rpx;
	display: flex;
	flex-direction: column;
	gap: 7rpx;
	width: 36rpx;
	height: 44rpx;
	padding: 11rpx 9rpx;
	border-radius: 10rpx;
	box-sizing: border-box;
}

.symbol-receipt {
	background: linear-gradient(145deg, #ffb230, #ff8800);
	box-shadow: inset 6rpx 6rpx 9rpx rgba(255, 255, 255, 0.46);
}

.symbol-calendar {
	top: 10rpx;
	background: linear-gradient(145deg, #7662ff, #513ad5);
	box-shadow: inset 6rpx 6rpx 10rpx rgba(255, 255, 255, 0.34);
}

.symbol-receipt text,
.symbol-calendar text {
	display: block;
	width: 100%;
	height: 5rpx;
	border-radius: 999rpx;
	background: rgba(253, 254, 255, 0.88);
}

.symbol-calendar::before,
.symbol-calendar::after {
	content: "";
	position: absolute;
	top: -5rpx;
	width: 7rpx;
	height: 14rpx;
	border-radius: 999rpx;
	background: #513ad5;
}

.symbol-calendar::before {
	left: 9rpx;
}

.symbol-calendar::after {
	right: 9rpx;
}

.dashboard-panel {
	margin-bottom: 28rpx;
	padding: 34rpx 28rpx;
	border-radius: 26rpx;
}

.trend-panel {
	min-height: 430rpx;
}

.type-panel {
	min-height: 316rpx;
}

.attention-panel {
	margin-bottom: 34rpx;
}

.attention-panel__hint {
	margin-left: 14rpx;
	padding: 5rpx 12rpx;
	border-radius: 999rpx;
	background: #f1f6f3;
	color: #467166;
	font-size: 20rpx;
	font-weight: 650;
}

.attention-list {
	display: grid;
	gap: 8rpx;
}

.attention-row {
	display: flex;
	align-items: center;
	min-height: 108rpx;
	padding: 14rpx 2rpx;
	border-top: 1rpx solid #e7edf0;
}

.attention-row__signal {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 56rpx;
	height: 56rpx;
	margin-right: 18rpx;
	border-radius: 18rpx;
	font-size: 28rpx;
	font-weight: 850;
}

.attention-row.is-amber .attention-row__signal {
	background: #fff3db;
	color: #b86905;
}

.attention-row.is-coral .attention-row__signal {
	background: #fff0ec;
	color: #bf5143;
}

.attention-row.is-blue .attention-row__signal {
	background: #eaf2ff;
	color: #2f68aa;
}

.attention-row__copy {
	display: flex;
	min-width: 0;
	flex: 1;
	flex-direction: column;
}

.attention-row__title {
	color: var(--home-ink);
	font-size: 27rpx;
	font-weight: 760;
	line-height: 1.35;
}

.attention-row__desc {
	margin-top: 5rpx;
	color: var(--home-muted);
	font-size: 22rpx;
	line-height: 1.35;
}

.attention-empty {
	display: flex;
	align-items: center;
	min-height: 106rpx;
	padding: 4rpx 2rpx;
	color: #55706a;
	font-size: 24rpx;
}

.attention-empty__check {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 42rpx;
	height: 42rpx;
	margin-right: 16rpx;
	border-radius: 50%;
	background: #e9f6ed;
	color: #278357;
	font-size: 25rpx;
	font-weight: 900;
}

.panel-header {
	justify-content: space-between;
	gap: 22rpx;
}

.panel-title-row {
	gap: 22rpx;
	min-width: 0;
}

.panel-title {
	font-size: 32rpx;
	font-weight: 900;
	line-height: 1.2;
	color: var(--home-ink);
}

.year-pill {
	display: flex;
	align-items: center;
	gap: 6rpx;
	height: 46rpx;
	padding: 0 18rpx;
	border-radius: 999rpx;
	background: rgba(235, 240, 247, 0.72);
	color: #697897;
	font-size: 25rpx;
	font-weight: 700;
	white-space: nowrap;
}

.sync-state {
	gap: 9rpx;
	color: #14a988;
	font-size: 25rpx;
	font-weight: 700;
	white-space: nowrap;
}

.sync-state__dot {
	width: 13rpx;
	height: 13rpx;
	border-radius: 50%;
	background: #57d99d;
}

.chart-grid {
	display: grid;
	grid-template-columns: 42rpx minmax(0, 1fr);
	column-gap: 10rpx;
	margin-top: 34rpx;
}

.chart-axis {
	display: grid;
	grid-template-rows: repeat(4, 1fr);
	height: 270rpx;
	color: #7b88a2;
	font-size: 25rpx;
	font-weight: 500;
	line-height: 1;
}

.chart-axis text {
	display: flex;
	align-items: flex-start;
}

.chart-axis text:last-child {
	align-items: flex-end;
}

.monthly-chart {
	position: relative;
	display: grid;
	grid-template-columns: repeat(12, minmax(0, 1fr));
	gap: 6rpx;
	height: 314rpx;
}

.chart-lines {
	position: absolute;
	top: 9rpx;
	right: 0;
	left: 0;
	display: grid;
	grid-template-rows: repeat(4, 1fr);
	height: 252rpx;
}

.chart-lines text {
	border-top: 1rpx dashed rgba(116, 132, 159, 0.2);
}

.monthly-bar {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-end;
	min-width: 0;
}

.monthly-bar__track {
	display: flex;
	align-items: flex-end;
	width: 32rpx;
	height: 252rpx;
}

.monthly-bar__fill {
	width: 100%;
	min-height: 12rpx;
	border-radius: 999rpx;
	background: linear-gradient(180deg, var(--home-cyan) 0%, var(--home-blue) 100%);
	box-shadow: 0 10rpx 18rpx rgba(35, 117, 238, 0.18);
}

.monthly-bar__label {
	margin-top: 16rpx;
	font-size: 22rpx;
	line-height: 1;
	color: #687795;
	white-space: nowrap;
}

.monthly-bar__label.is-long {
	font-size: 20rpx;
}

.type-total {
	gap: 4rpx;
	flex: 0 0 auto;
	color: var(--home-green);
	font-size: 26rpx;
	font-weight: 800;
	white-space: nowrap;
}

.type-list {
	margin-top: 20rpx;
}

.type-row {
	justify-content: space-between;
	min-height: 78rpx;
	border-bottom: 1rpx solid rgba(104, 119, 149, 0.1);
}

.type-row:last-child {
	border-bottom: 0;
}

.type-row__main {
	min-width: 0;
}

.type-row__dot {
	flex: 0 0 auto;
	width: 14rpx;
	height: 14rpx;
	margin-right: 14rpx;
	border-radius: 50%;
	background: var(--home-cyan);
	box-shadow: 0 0 0 8rpx rgba(36, 210, 196, 0.12);
}

.type-row__name {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 27rpx;
	font-weight: 700;
	color: var(--home-ink);
}

.type-row__count {
	flex: 0 0 auto;
	margin-left: 18rpx;
	font-size: 27rpx;
	font-weight: 800;
	color: var(--home-orange);
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 236rpx;
	padding-top: 10rpx;
	color: #75819b;
	font-size: 29rpx;
	font-weight: 500;
	box-sizing: border-box;
}

.empty-illustration {
	position: relative;
	width: 210rpx;
	height: 118rpx;
	margin-bottom: 22rpx;
}

.empty-illustration::before {
	content: "";
	position: absolute;
	left: 14rpx;
	right: 14rpx;
	bottom: 0;
	height: 34rpx;
	border-radius: 50%;
	background: linear-gradient(90deg, rgba(211, 228, 251, 0), rgba(178, 210, 249, 0.42), rgba(211, 228, 251, 0));
}

.empty-illustration__paper {
	position: absolute;
	left: 85rpx;
	top: 4rpx;
	width: 52rpx;
	height: 70rpx;
	transform: rotate(22deg);
	border-radius: 10rpx;
	background: linear-gradient(160deg, #f4f9ff, #cde0fb);
	box-shadow: 0 8rpx 16rpx rgba(105, 147, 202, 0.13);
}

.empty-illustration__paper::before,
.empty-illustration__paper::after {
	content: "";
	position: absolute;
	left: 11rpx;
	right: 11rpx;
	height: 5rpx;
	border-radius: 999rpx;
	background: rgba(139, 171, 216, 0.5);
}

.empty-illustration__paper::before {
	top: 22rpx;
}

.empty-illustration__paper::after {
	top: 37rpx;
}

.empty-illustration__box {
	position: absolute;
	left: 52rpx;
	bottom: 10rpx;
	width: 104rpx;
	height: 66rpx;
	border-radius: 8rpx 8rpx 16rpx 16rpx;
	background: linear-gradient(150deg, #dcecff, #a9c9f5);
	box-shadow: 0 14rpx 28rpx rgba(111, 150, 205, 0.13);
}

.empty-illustration__box::before,
.empty-illustration__box::after {
	content: "";
	position: absolute;
	top: -28rpx;
	width: 62rpx;
	height: 44rpx;
	background: linear-gradient(160deg, #e9f4ff, #bed6f7);
}

.empty-illustration__box::before {
	left: -8rpx;
	transform: skewY(18deg);
	border-radius: 9rpx 0 8rpx 8rpx;
}

.empty-illustration__box::after {
	right: -8rpx;
	transform: skewY(-18deg);
	border-radius: 0 9rpx 8rpx 8rpx;
}

.empty-illustration__box text {
	position: absolute;
	z-index: 1;
	top: 0;
	width: 1rpx;
	height: 66rpx;
	background: rgba(125, 160, 207, 0.12);
}

.empty-illustration__box text:first-child {
	left: 50%;
}

.empty-illustration__box text:last-child {
	display: none;
}

.empty-illustration__petal {
	position: absolute;
	width: 16rpx;
	height: 24rpx;
	border-radius: 16rpx 16rpx 4rpx 16rpx;
	background: linear-gradient(160deg, #dbeaff, #b5cef3);
}

.empty-illustration__petal.is-one {
	left: 28rpx;
	top: 34rpx;
	transform: rotate(-36deg);
}

.empty-illustration__petal.is-two {
	right: 30rpx;
	top: 36rpx;
	transform: rotate(32deg);
}

.empty-illustration__petal.is-three {
	right: 18rpx;
	top: 70rpx;
	transform: rotate(62deg);
}
</style>
