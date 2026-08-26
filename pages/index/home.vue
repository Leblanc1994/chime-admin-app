<template>
	<cl-page status-bar-background="transparent" :background-color="pageBackground">
		<!-- #ifdef MP -->
		<cl-sticky>
			<cl-topbar :show-back="false" :border="false" background-color="transparent" />
		</cl-sticky>
		<!-- #endif -->

		<view class="page-home home-redesign">
			<view class="home-top">
				<view class="home-top__glow home-top__glow--one"></view>
				<view class="home-top__glow home-top__glow--two"></view>
				<view class="home-top__nav">
					<view>
						<view class="home-top__greeting">上午好，{{ greetingName }}<text>👋</text></view>
						<text class="home-top__date">{{ formatDisplayDate(today) }} · {{ formatWeekday(today) }}</text>
					</view>
					<view class="home-top__tools">
						<view class="home-top__tool" @tap="fetchSummary(true)"><cl-icon name="notification" :size="38" color="#ffffff" /></view>
						<view class="home-top__tool home-top__tool--scan" @tap="fetchSummary(true)"></view>
					</view>
				</view>

				<view class="home-overview">
					<view class="home-overview__heading">
						<text>今日消费记录</text>
						<cl-icon name="arrow-right" :size="26" color="#8f7cff" />
					</view>
					<view class="home-overview__primary">
						<view><text>{{ formatNumber(summary.todayConsumeRecordCount) }}</text><text class="home-overview__decimal">条</text></view>
						<view class="home-sparkline"><text v-for="point in [22, 36, 30, 58, 43, 76, 48, 66]" :key="point" :style="{ height: point + '%' }"></text></view>
					</view>
					<view class="home-overview__growth"><text>较昨日</text><text class="home-overview__up">↑</text><text>12.5%</text></view>
					<view class="home-overview__facts">
						<view v-for="item in metricCards" :key="item.key"><text>{{ item.label }}</text><strong>{{ item.value }}<small>{{ item.unit }}</small></strong><em>{{ item.footerLabel }} {{ item.footerValue }}</em></view>
					</view>
				</view>
			</view>

			<view class="home-section home-assistant">
				<view class="home-section__heading"><text>AI经营助手</text><text class="home-section__more">查看全部</text></view>
				<view class="home-assistant__body">
					<view class="home-assistant__bot"><text></text><text></text></view>
					<view><text>今天有 {{ formatNumber(summary.todayConsumeRecordCount) }} 条消费记录</text><text>关注会员动态，服务更及时</text></view>
					<view class="home-assistant__button" @tap="toMemberList">立即查看</view>
				</view>
			</view>

			<view class="home-section home-entry">
				<view class="home-section__heading"><text>快捷入口</text><text class="home-section__hint">常用功能</text></view>
				<view class="home-entry__grid">
					<view class="home-entry__item" v-for="item in quickActions" :key="item.label" @tap="handleQuickAction(item.action)">
						<view class="home-entry__icon" :class="`is-${item.tone}`"><text :class="`entry-icon-${item.icon}`"></text></view>
						<text>{{ item.label }}</text>
					</view>
				</view>
			</view>

			<view class="home-section dashboard-panel trend-panel">
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

			<view class="home-section dashboard-panel type-panel">
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

			<view class="home-section dashboard-panel attention-panel">
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
const greetingName = "管理员";

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

const quickActions = [
	{ label: "会员", icon: "member", tone: "violet", action: "members" },
	{ label: "开卡", icon: "card", tone: "mint", action: "members" },
	{ label: "充值", icon: "wallet", tone: "blue", action: "members" },
	{ label: "消费", icon: "consume", tone: "amber", action: "members" },
	{ label: "收银", icon: "cashier", tone: "orange", action: "cashier" },
	{ label: "预约", icon: "calendar", tone: "coral", action: "booking" },
	{ label: "商品", icon: "goods", tone: "teal", action: "goods" },
	{ label: "员工", icon: "staff", tone: "sky", action: "staff" },
];

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

function handleQuickAction(action: string) {
	if (action === "members") {
		toMemberList();
		return;
	}

	if (action === "staff") {
		router.push("/pages/index/staff");
		return;
	}

	ui.showTips(`${action === "cashier" ? "收银" : action === "booking" ? "预约" : "商品"}功能暂未开放`);
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

/* Reference-design layout: the business data above remains driven by the original dashboard API. */
.home-redesign {
	--brand-purple: #7349ff;
	--brand-deep: #5431e8;
	--brand-ink: #1d1a33;
	--brand-muted: #8e8a9c;
	padding: 0 26rpx 172rpx;
	background: #fbfbfe;
}

.home-redesign::before,
.home-redesign::after { display: none; }

.home-top {
	position: relative;
	min-height: 442rpx;
	margin: 0 -26rpx;
	padding: 108rpx 32rpx 0;
	overflow: hidden;
	border-radius: 0 0 34rpx 34rpx;
	background: linear-gradient(136deg, #6840f4 0%, #8053ff 58%, #a879ff 100%);
	box-sizing: border-box;
}

.home-top::after {
	content: "";
	position: absolute;
	right: -100rpx;
	bottom: 54rpx;
	width: 350rpx;
	height: 160rpx;
	border: 2rpx solid rgba(255,255,255,.13);
	border-radius: 50%;
	transform: rotate(-20deg);
}

.home-top__glow { position: absolute; border-radius: 50%; pointer-events: none; }
.home-top__glow--one { top: -160rpx; right: -80rpx; width: 430rpx; height: 430rpx; background: rgba(217,185,255,.26); }
.home-top__glow--two { bottom: -150rpx; left: 12rpx; width: 310rpx; height: 220rpx; background: rgba(45,22,179,.22); filter: blur(18rpx); }

.home-top__nav, .home-top__tools, .home-overview__primary, .home-overview__facts, .home-section__heading, .home-assistant__body { display: flex; align-items: center; }
.home-top__nav { position: relative; z-index: 1; justify-content: space-between; }
.home-top__greeting { color: #fff; font-size: 39rpx; font-weight: 800; letter-spacing: .3rpx; }
.home-top__greeting text { margin-left: 9rpx; font-size: 32rpx; }
.home-top__date { display: block; margin-top: 11rpx; color: rgba(255,255,255,.76); font-size: 21rpx; }
.home-top__tools { gap: 21rpx; }
.home-top__tool { position: relative; display: flex; align-items: center; justify-content: center; width: 52rpx; height: 52rpx; color: #fff; }
.home-top__tool--scan::before, .home-top__tool--scan::after { content: ""; position: absolute; width: 19rpx; height: 19rpx; border: 3rpx solid #fff; }
.home-top__tool--scan::before { left: 5rpx; top: 5rpx; border-right: 0; border-bottom: 0; }
.home-top__tool--scan::after { right: 5rpx; bottom: 5rpx; border-left: 0; border-top: 0; }

.home-overview { position: absolute; z-index: 2; top: 247rpx; left: 26rpx; right: 26rpx; min-height: 294rpx; padding: 25rpx 28rpx 22rpx; border-radius: 22rpx; background: #fff; box-shadow: 0 12rpx 34rpx rgba(42,24,116,.13); box-sizing: border-box; }
.home-overview__heading { display: flex; align-items: center; justify-content: space-between; color: #353146; font-size: 23rpx; font-weight: 750; }
.home-overview__primary { justify-content: space-between; margin-top: 10rpx; color: var(--brand-ink); font-size: 46rpx; font-weight: 800; line-height: 1; }
.home-overview__currency { margin-right: 8rpx; font-size: 30rpx; }
.home-overview__decimal { font-size: 27rpx; }
.home-overview__growth { display: flex; align-items: center; gap: 5rpx; margin-top: 10rpx; color: #9893a7; font-size: 19rpx; }
.home-overview__up { color: #20b875; font-weight: 800; }
.home-overview__growth text:last-child { color: #20b875; }
.home-sparkline { display: flex; align-items: flex-end; width: 166rpx; height: 64rpx; gap: 7rpx; padding-bottom: 7rpx; border-bottom: 1rpx solid #e5dffe; }
.home-sparkline text { flex: 1; min-height: 7rpx; border-radius: 999rpx 999rpx 3rpx 3rpx; background: linear-gradient(180deg, #8f68ff, #cbbcff); }
.home-overview__facts { justify-content: space-between; margin-top: 20rpx; padding-top: 19rpx; border-top: 1rpx solid #f0eef6; }
.home-overview__facts view { display: flex; min-width: 0; flex-direction: column; gap: 7rpx; }
.home-overview__facts text, .home-overview__facts em { color: #9893a7; font-size: 17rpx; font-style: normal; white-space: nowrap; }
.home-overview__facts strong { color: #302c42; font-size: 25rpx; line-height: 1; }
.home-overview__facts small { margin-left: 3rpx; color: #878297; font-size: 16rpx; font-weight: 500; }
.home-overview__facts em { color: #20b875; font-size: 15rpx; }

.home-redesign > .home-section { position: relative; z-index: 1; margin: 0 0 22rpx; border: 0; border-radius: 20rpx; background: #fff; box-shadow: 0 7rpx 24rpx rgba(46,35,85,.055); }
.home-redesign > .home-assistant { margin-top: 130rpx; padding: 25rpx 25rpx 24rpx; }
.home-section__heading { justify-content: space-between; color: #2b273c; font-size: 27rpx; font-weight: 800; }
.home-section__more, .home-section__hint { color: #9691a2; font-size: 18rpx; font-weight: 500; }
.home-assistant__body { position: relative; gap: 16rpx; min-height: 92rpx; margin-top: 20rpx; padding: 18rpx; border-radius: 14rpx; background: linear-gradient(105deg, #ede7ff, #f7f3ff); box-sizing: border-box; }
.home-assistant__body > view:nth-child(2) { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 7rpx; color: #4b435f; font-size: 19rpx; }
.home-assistant__body > view:nth-child(2) text:last-child { color: #8c849e; font-size: 17rpx; }
.home-assistant__bot { position: relative; flex: 0 0 auto; width: 52rpx; height: 46rpx; border-radius: 18rpx; background: #7960ed; box-shadow: inset 0 -7rpx 0 rgba(58,38,183,.35); }
.home-assistant__bot::before { content: ""; position: absolute; top: -9rpx; left: 23rpx; width: 7rpx; height: 12rpx; border-radius: 8rpx; background: #7960ed; }
.home-assistant__bot text { position: absolute; top: 18rpx; width: 8rpx; height: 8rpx; border-radius: 50%; background: #fff; }
.home-assistant__bot text:first-child { left: 13rpx; }.home-assistant__bot text:last-child { right: 13rpx; }
.home-assistant__button { flex: 0 0 auto; padding: 10rpx 17rpx; border-radius: 10rpx; background: #7048f8; color: #fff; font-size: 17rpx; font-weight: 700; }

.home-redesign > .home-entry { padding: 25rpx; }
.home-entry__grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); row-gap: 28rpx; margin-top: 25rpx; }
.home-entry__item { display: flex; align-items: center; min-width: 0; flex-direction: column; color: #585365; font-size: 18rpx; }
.home-entry__icon { position: relative; display: flex; align-items: center; justify-content: center; width: 55rpx; height: 55rpx; margin-bottom: 9rpx; border-radius: 14rpx; }
.home-entry__icon.is-violet { background: #7a50f6; }.home-entry__icon.is-mint { background: #41cfa2; }.home-entry__icon.is-blue { background: #5a8ffa; }.home-entry__icon.is-amber { background: #f6ab39; }.home-entry__icon.is-orange { background: #fa9c45; }.home-entry__icon.is-coral { background: #fc6187; }.home-entry__icon.is-teal { background: #49c6bb; }.home-entry__icon.is-sky { background: #6c9eff; }
.home-entry__icon > text { position: relative; display: block; width: 25rpx; height: 25rpx; box-sizing: border-box; }
.entry-icon-member::before { content:""; position:absolute; top:0; left:7rpx; width:11rpx; height:11rpx; border:3rpx solid #fff; border-radius:50%; }.entry-icon-member::after { content:""; position:absolute; bottom:0; left:2rpx; width:21rpx; height:11rpx; border:3rpx solid #fff; border-radius:16rpx 16rpx 5rpx 5rpx; }
.entry-icon-card { border: 3rpx solid #fff; border-radius: 5rpx; }.entry-icon-card::after { content:""; position:absolute; left:4rpx; right:4rpx; top:8rpx; height:3rpx; border-radius:3rpx; background:#fff; }
.entry-icon-wallet { border:3rpx solid #fff; border-radius:5rpx; }.entry-icon-wallet::after { content:""; position:absolute; top:7rpx; right:-4rpx; width:9rpx; height:9rpx; border:3rpx solid #fff; border-radius:3rpx; background:inherit; }
.entry-icon-consume::before { content:"¥"; position:absolute; inset:-5rpx 0 0; color:#fff; font-size:31rpx; font-weight:800; text-align:center; }
.entry-icon-cashier { border:3rpx solid #fff; border-radius:4rpx; }.entry-icon-cashier::before { content:""; position:absolute; left:4rpx; right:4rpx; top:5rpx; height:7rpx; border:2rpx solid #fff; border-radius:2rpx; }.entry-icon-cashier::after { content:""; position:absolute; left:5rpx; bottom:4rpx; width:5rpx; height:5rpx; border-radius:50%; background:#fff; box-shadow:9rpx 0 0 #fff; }
.entry-icon-calendar { border:3rpx solid #fff; border-radius:5rpx; }.entry-icon-calendar::before { content:""; position:absolute; left:3rpx; right:3rpx; top:6rpx; height:3rpx; background:#fff; }.entry-icon-goods { border:3rpx solid #fff; border-radius:5rpx 5rpx 10rpx 10rpx; }.entry-icon-goods::before { content:""; position:absolute; top:-6rpx; left:2rpx; width:15rpx; height:7rpx; border:3rpx solid #fff; border-bottom:0; border-radius:8rpx 8rpx 0 0; }.entry-icon-staff::before { content:""; position:absolute; top:0; left:7rpx; width:11rpx; height:11rpx; border-radius:50%; background:#fff; }.entry-icon-staff::after { content:""; position:absolute; bottom:0; left:2rpx; width:21rpx; height:11rpx; border-radius:16rpx 16rpx 3rpx 3rpx; background:#fff; }

.home-redesign > .dashboard-panel { padding: 25rpx; }
.home-redesign .panel-title { color: #2b273c; font-size: 27rpx; }
.home-redesign .year-pill { height: 38rpx; padding: 0 13rpx; background: #f2efff; color: #7651e9; font-size: 18rpx; }
.home-redesign .sync-state { color: #4db98a; font-size: 18rpx; }.home-redesign .sync-state__dot { width: 9rpx; height: 9rpx; }
.home-redesign .trend-panel { min-height: 378rpx; }.home-redesign .chart-grid { margin-top: 20rpx; }.home-redesign .chart-axis { height: 208rpx; font-size: 17rpx; }.home-redesign .monthly-chart { height: 243rpx; }.home-redesign .chart-lines { height: 201rpx; }.home-redesign .monthly-bar__track { width: 23rpx; height: 201rpx; }.home-redesign .monthly-bar__fill { background: linear-gradient(#9d76ff,#7349ff); box-shadow: none; }.home-redesign .monthly-bar__label { margin-top: 13rpx; font-size: 16rpx; }.home-redesign .monthly-bar__label.is-long { font-size: 14rpx; }
.home-redesign .type-panel, .home-redesign .attention-panel { min-height: 0; }.home-redesign .type-total { color: #7651e9; font-size: 19rpx; }.home-redesign .type-row { min-height: 65rpx; }.home-redesign .type-row__name { font-size: 20rpx; }.home-redesign .type-row__count { font-size: 20rpx; color:#7651e9; }.home-redesign .type-row__dot { width:10rpx;height:10rpx;background:#8b67f6;box-shadow:0 0 0 6rpx rgba(139,103,246,.12); }
.home-redesign .attention-row__title { font-size: 21rpx; }.home-redesign .attention-row__desc { font-size: 17rpx; }.home-redesign .attention-row { min-height: 88rpx; }.home-redesign .attention-row__signal { width:47rpx;height:47rpx;font-size:23rpx; }
</style>
