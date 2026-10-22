<template>
	<cl-page background-color="#f8f5f0" status-bar-background="#f8f5f0">
		<view class="chime-business home-page">
			<qm-main-header>
				<view class="home-brand">
					<image
						class="home-seal"
						src="/static/business/chime-mark.png"
						mode="aspectFit"
					/>
					<view class="home-brand-copy"><text>千绵美学</text><text>门店管理</text></view>
				</view>
			</qm-main-header>
			<view class="home-welcome"
				><text>{{ greeting }}，{{ name }}</text
				><text>{{ dateLabel }}</text></view
			>
			<view class="home-today" :aria-busy="loading">
				<image
					class="home-watermark"
					src="/static/business/chime-mark.png"
					mode="aspectFit"
				/>
				<view class="home-today-heading"
					><text>今日经营</text
					><button @tap="records">
						消费明细<image
							src="/static/business/v53/chevron-light.svg"
							mode="aspectFit"
						/></button
				></view>
				<view class="home-metrics"
					><view v-for="metric in metrics" :key="metric.label"
						><text>{{ metric.label }}</text
						><view
							><text>{{ metric.value }}</text
							><text>{{ metric.unit }}</text></view
						></view
					></view
				>
			</view>
			<view v-if="error" class="qm-error" role="alert"
				>{{ error
				}}<button class="qm-inline" :disabled="loading" @tap="load">重新同步</button></view
			>
			<qm-quick-actions @saved="load" />
			<view class="home-section-title"
				><view
					><text>会员关怀</text
					><text class="home-section-hint">留意每一位顾客的服务进度</text></view
				><button @tap="care('all')">
					全部<image class="qm-chevron" src="/static/business/v53/chevron.svg" /></button
			></view>
			<view class="home-care">
				<button class="home-care-row" @tap="care('low')">
					<view class="home-care-icon"
						><image src="/static/business/v53/card.svg" mode="aspectFit" /></view
					><view class="qm-row__copy"
						><text>关注次卡余次<text class="qm-tag is-warning">低余次</text></text
						><text>{{
							loaded
								? summary.lowBalanceCardCount + " 张次卡仅余 1–2 次"
								: "正在同步关怀提醒"
						}}</text></view
					><image class="qm-chevron" src="/static/business/v53/chevron.svg" />
				</button>
				<button class="home-care-row" @tap="care('expiring')">
					<view class="home-care-icon is-lilac"
						><image src="/static/business/v53/users.svg" mode="aspectFit" /></view
					><view class="qm-row__copy"
						><text>到期与回访</text
						><text>{{
							loaded
								? summary.expiringCardCount +
									" 张卡 7 天内到期 · " +
									summary.inactiveMemberCount +
									" 位会员待关怀"
								: "正在同步关怀提醒"
						}}</text></view
					><image class="qm-chevron" src="/static/business/v53/chevron.svg" />
				</button>
			</view>
			<view class="home-section-title"
				><text>最近消费</text
				><button @tap="records">
					全部记录<image
						class="qm-chevron"
						src="/static/business/v53/chevron.svg"
					/></button
			></view>
			<view v-if="recentLoading && !recent.length" class="qm-skeleton" />
			<view v-if="recentError" class="qm-error" role="alert"
				>{{ recentError }}<button class="qm-inline" @tap="loadRecent">重试</button></view
			>
			<view v-if="recent.length" class="home-recent">
				<button
					v-for="row in recent"
					:key="row.id"
					class="home-recent-row"
					@tap="detail(row)"
				>
					<view class="home-activity"
						><image src="/static/business/v53/receipt.svg" mode="aspectFit" /></view
					><view class="qm-row__copy"
						><text
							>{{ row.memberName || row.memberNickName || "未命名客户"
							}}<text class="home-type">{{ row.consumeType }}</text></text
						><text
							>{{ row.cardName || "非次卡消费" }} ·
							{{ dayjs(row.consumeTime).format("MM.DD HH:mm") }}</text
						></view
					><text class="home-recent-amount">{{
						row.cardAccountId ? "−" + row.consumeTimes + " 次" : "1 笔"
					}}</text>
				</button>
			</view>
			<view v-if="recentLoaded && !recent.length && !recentError" class="qm-empty"
				><text>还没有消费记录</text><text>登记服务后，可在这里查看最近消费</text
				><button class="qm-inline" @tap="router.push('/pages/index/consume-form')">
					登记散客消费
				</button></view
			>
			<view v-if="loaded" class="home-trend"
				><view class="home-section-title"
					><text>{{ trend.title }}</text
					><text class="qm-muted"
						>合计
						{{ trend.points.reduce((sum, point) => sum + point.count, 0) }} 笔</text
					></view
				><view class="home-chart"
					><view v-for="point in trend.points" :key="point.label" class="home-chart-col"
						><text>{{ point.count }}</text
						><view
							class="home-chart-bar"
							:style="{ height: (point.count / peak) * 100 + 'rpx' }"
						/><text>{{ point.label }}</text></view
					></view
				></view
			>
			<view class="home-sync"
				><text>{{
					loaded
						? consumeComparison(
								summary.todayConsumeRecordCount,
								summary.yesterdayConsumeRecordCount,
							)
						: "经营数据尚未同步"
				}}</text
				><button :disabled="loading" @tap="load">
					{{ loading ? "同步中…" : "刷新数据" }}
				</button></view
			>
			<view class="qm-signoff"><text>千绵美学 · 用心记录每次服务</text></view>
		</view>
		<!-- #ifndef MP-WEIXIN -->
		<tabbar design />
		<!-- #endif -->
	</cl-page>
</template>
<script setup lang="ts">
import QmMainHeader from "./components/qm-main-header.vue";
import { ref, computed } from "vue";
import { onShow, onPullDownRefresh } from "@dcloudio/uni-app";
import dayjs from "dayjs";
import { useCool, useStore } from "/@/cool";
import DashboardService, { type MemberDashboardSummary } from "../../service/member/dashboard";
import RecordService from "../../service/member/consume-record";
import {
	businessDate,
	consumeComparison,
	consumeTrend,
	validateDashboardSummary,
} from "./utils/home-dashboard";
// #ifndef MP-WEIXIN
import Tabbar from "./components/tabbar.vue";
// #endif
import QmQuickActions from "./components/qm-quick-actions.vue";
import { pendingMemberFilter } from "./utils/member-quick-action";
const { router } = useCool();
const { user } = useStore();
const dashboard = new DashboardService(),
	recordService = new RecordService();
const loading = ref(false),
	loaded = ref(false),
	error = ref(""),
	summary = ref<MemberDashboardSummary>({
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
		monthlyConsumeRecordCounts: [],
	}),
	recent = ref<any[]>([]),
	recentLoading = ref(false),
	recentLoaded = ref(false),
	recentError = ref("");
const name = computed(
		() => user.info?.nickName || user.info?.name || user.info?.username || "店长",
	),
	greeting = computed(() => {
		const hour = Number(dayjs().format("H"));
		return hour < 12 ? "上午好" : hour < 18 ? "下午好" : "晚上好";
	}),
	dateLabel = computed(
		() =>
			dayjs(summary.value.statisticsDate || businessDate()).format("MM.DD") +
			"  " +
			["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
				dayjs(summary.value.statisticsDate || businessDate()).day()
			],
	);
const metrics = computed(() => [
	{
		label: "消费笔数",
		value: loaded.value ? summary.value.todayConsumeRecordCount : "—",
		unit: "笔",
	},
	{
		label: "首次开卡",
		value: loaded.value ? summary.value.todayNewMemberCount : "—",
		unit: "人",
	},
	{ label: "已开卡会员", value: loaded.value ? summary.value.totalMemberCount : "—", unit: "人" },
	{
		label: "本月消费",
		value: loaded.value ? summary.value.monthConsumeRecordCount : "—",
		unit: "笔",
	},
]);
const trend = computed(() => consumeTrend(summary.value, "week")),
	peak = computed(() => Math.max(1, ...trend.value.points.map((p) => p.count)));
function care(filter: string) {
	pendingMemberFilter.value = filter;
	router.switchTab("member");
}
async function load() {
	if (loading.value) return;
	loading.value = true;
	error.value = "";
	try {
		const data = await dashboard.summary();
		validateDashboardSummary(data);
		summary.value = data;
		loaded.value = true;
	} catch (e: any) {
		error.value = e?.message || "经营数据加载失败，请稍后刷新";
	} finally {
		loading.value = false;
	}
}
async function loadRecent() {
	if (recentLoading.value) return;
	recentLoading.value = true;
	recentError.value = "";
	try {
		const data: any = await recordService.page({
			page: 1,
			size: 3,
			order: "consumeTime",
			sort: "desc",
		});
		recent.value = data.list || [];
		recentLoaded.value = true;
	} catch (e: any) {
		recentError.value = e?.message || "最近消费加载失败";
	} finally {
		recentLoading.value = false;
	}
}

function records() {
	router.push("/pages/index/consume-statistics");
}
function detail(row: any) {
	router.push({
		path: "/pages/index/consume-detail",
		query: { id: row.id },
		params: { record: row },
	});
}
onShow(() => {
	load();
	loadRecent();
});
onPullDownRefresh(async () => {
	await Promise.allSettled([load(), loadRecent()]);
	uni.stopPullDownRefresh();
});
</script>
<style scoped lang="scss">
.home-page {
	padding: 24rpx 38rpx 20rpx;
	background: var(--qm-paper);
	min-height: calc(100vh - 140rpx);
	/* #ifdef MP-WEIXIN */
	padding-top: 0;
	/* #endif */
}
.home-brand {
	width: 100%;
	display: flex;
	gap: 18rpx;
	align-items: center;
}
.home-seal {
	width: 66rpx;
	height: 66rpx;
	flex-shrink: 0;
}
.home-brand-copy {
	flex: 1;
	min-width: 0;
	text {
		display: block;
		font-size: 33rpx;
		line-height: 1.4;
		font-weight: 700;
	}
	text + text {
		font-size: 21rpx;
		font-weight: 400;
		color: var(--qm-muted);
		margin-top: 2rpx;
	}
}
.home-welcome {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	margin: 28rpx 0 24rpx;
	> text:first-child {
		font-size: 48rpx;
		color: var(--qm-deep);
		font-weight: 700;
		line-height: 1.4;
	}
	> text:last-child {
		font-size: 23rpx;
		color: var(--qm-muted);
		flex-shrink: 0;
	}
}
.home-today {
	position: relative;
	padding: 30rpx 36rpx;
	border-radius: 46rpx;
	background: linear-gradient(110deg, #39274f, #77539b);
	color: var(--qm-on-brand);
	overflow: hidden;
	box-shadow: 0 10rpx 34rpx #39274f12;
}
.home-watermark {
	position: absolute;
	right: -80rpx;
	top: -48rpx;
	width: 370rpx;
	height: 370rpx;
	opacity: 0.17;
	pointer-events: none;
}
.home-today-heading {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 29rpx;
	font-weight: 500;
	button {
		display: flex;
		gap: 6rpx;
		align-items: center;
		font-size: 23rpx;
		color: #e8d4aa;
		min-height: 52rpx;
	}
	image {
		width: 26rpx;
		height: 26rpx;
	}
}
.home-metrics {
	position: relative;
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 8rpx;
	margin-top: 22rpx;
	> view > text {
		font-size: 23rpx;
	}
	> view > view {
		display: flex;
		align-items: baseline;
		gap: 7rpx;
		margin-top: 7rpx;
		> text:first-child {
			font-size: 55rpx;
			font-weight: 700;
			font-variant-numeric: tabular-nums;
			line-height: 1.35;
		}
		> text + text {
			font-size: 23rpx;
			color: #e8d4aa;
		}
	}
}
.home-section-title {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16rpx;
	margin: 28rpx 0 18rpx;
	font-size: 34rpx;
	font-weight: 700;
	button {
		display: flex;
		align-items: center;
		gap: 4rpx;
		min-height: 60rpx;
		font-size: 23rpx;
		font-weight: 400;
		color: var(--qm-muted);
	}
	.qm-muted {
		font-size: 23rpx;
		font-weight: 400;
	}
}
.home-section-hint {
	display: none;
}
.home-care,
.home-recent {
	padding: 0 26rpx;
	background: var(--qm-surface);
	border-radius: 38rpx;
}
.home-care-row,
.home-recent-row {
	display: flex;
	align-items: center;
	width: 100%;
	gap: 18rpx;
	padding: 22rpx 0 !important;
	text-align: left;
	border-bottom: 1px solid var(--qm-line);
	&:last-child {
		border-bottom: 0;
	}
}
.home-care-row .qm-tag {
	margin-left: 12rpx;
	font-weight: 400;
}
.home-care-icon,
.home-activity {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 70rpx;
	height: 70rpx;
	background: var(--qm-cream);
	border-radius: 23rpx;
	flex-shrink: 0;
	image {
		width: 36rpx;
		height: 36rpx;
	}
}
.home-care-icon.is-lilac,
.home-activity {
	background: var(--qm-lilac);
}
.home-recent-amount {
	color: var(--qm-brand);
	font-size: 26rpx;
	white-space: nowrap;
}
.home-type {
	margin-left: 12rpx;
	font-size: 20rpx;
	font-weight: 400;
	color: var(--qm-muted);
}
.home-chart {
	display: flex;
	align-items: flex-end;
	gap: 12rpx;
	padding: 16rpx 20rpx;
	background: var(--qm-surface);
	border-radius: 30rpx;
	overflow-x: auto;
}
.home-chart-col {
	flex: 1;
	min-width: 34rpx;
	display: flex;
	align-items: center;
	flex-direction: column;
	font-size: 20rpx;
	color: var(--qm-muted);
}
.home-chart-bar {
	width: 24rpx;
	min-height: 2rpx;
	background: #ad94c4;
	border-radius: 6rpx 6rpx 0 0;
	margin: 8rpx 0;
}
.home-sync {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 22rpx;
	color: var(--qm-muted);
	margin-top: 24rpx;
	button {
		min-height: 60rpx;
		color: var(--qm-brand);
	}
}
.home-page .qm-signoff {
	margin: 24rpx 0;
	font-size: 21rpx;
	letter-spacing: 0;
}
</style>
