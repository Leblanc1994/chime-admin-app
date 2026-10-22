<template>
	<qm-page title="消费查询">
		<view class="qm-search"
			><image
				class="records-search-icon"
				src="/static/business/v53/search.svg"
				mode="aspectFit"
			/><input
				v-model.trim="keyword"
				placeholder="搜索姓名 / 手机号 / 微信昵称"
				confirm-type="search"
				@confirm="reload"
			/><button
				v-if="keyword"
				aria-label="清空搜索"
				@tap="
					keyword = '';
					reload();
				"
			>
				×
			</button></view
		>
		<view class="qm-segments"
			><button
				v-for="item in ranges"
				:key="item.value"
				:class="{ 'is-active': range === item.value }"
				@tap="item.value === 'custom' ? openDate() : setRange(item.value)"
			>
				{{ item.label }}
			</button></view
		>
		<button class="records-range" @tap="openDate">
			<text>{{ start.replace(/-/g, ".") }} 至 {{ end.replace(/-/g, ".") }}</text
			><image src="/static/business/v53/select-chevron.svg" mode="aspectFit" />
		</button>
		<scroll-view scroll-x class="records-types"
			><view
				><button
					v-for="type in consumeTypes"
					:key="type"
					class="qm-chip"
					:class="{ 'is-active': consumeType === type }"
					:aria-pressed="consumeType === type"
					@tap="
						consumeType = type;
						reload();
					"
				>
					{{ type || "全部" }}
				</button></view
			></scroll-view
		>
		<view class="records-summary"
			><view
				><text>消费笔数</text><text>{{ loaded ? total : "—" }}<text> 笔</text></text></view
			><view
				><text>次卡扣减</text
				><text
					>{{ totalsLoading ? "—" : (totals?.times ?? "—") }}<text> 次</text></text
				></view
			></view
		>
		<view v-if="totalsError" class="qm-notice"
			>{{ totalsError }}<button class="qm-inline" @tap="loadSummary">重试统计</button></view
		>
		<view class="records-total"
			><text>消费明细{{ loaded ? " · " + total + " 笔" : "" }}</text></view
		>
		<view v-if="loading && !loaded"><view v-for="n in 3" :key="n" class="qm-skeleton" /></view
		><view v-if="error" class="qm-error" role="alert"
			>{{ error }}<button class="qm-inline" @tap="reload">重新加载</button></view
		>
		<view v-if="rows.length" class="records-list"
			><button v-for="row in rows" :key="row.id" class="records-item" @tap="detail(row)">
				<view class="records-item-heading"
					><text>{{ name(row) }}</text
					><text :class="{ 'records-deduct': row.cardAccountId }">{{
						row.cardAccountId ? "−" + row.consumeTimes + " 次" : "已记录"
					}}</text></view
				><text class="records-item-desc">{{ row.cardName || row.consumeType }}</text
				><text class="records-item-time">{{ formatTime(row.consumeTime) }}</text>
			</button></view
		>
		<view v-else-if="loaded && !error" class="qm-empty"
			><text>暂无消费记录</text><text>当前筛选范围没有记录，试试其他日期。</text
			><qm-button variant="secondary" @click="openDate">调整筛选</qm-button></view
		>
		<button v-if="rows.length && !finished" class="qm-inline" :disabled="loading" @tap="more">
			{{ loading ? "正在加载…" : "加载更多" }}
		</button>
		<template #footer><qm-button @click="add">＋ 新增消费</qm-button></template>
		<qm-sheet v-model="dateVisible" title="筛选消费日期"
			><view class="qm-field"
				><text class="qm-label">开始日期</text
				><cl-select-date v-model="draftStart" :mode="dateMode" format="YYYY-MM-DD" /></view
			><view class="qm-field"
				><text class="qm-label">结束日期</text
				><cl-select-date v-model="draftEnd" :mode="dateMode" format="YYYY-MM-DD" /></view
			><text class="qm-hint">包含开始和结束当天的消费记录</text
			><view v-if="dateError" class="qm-error" role="alert">{{ dateError }}</view
			><template #footer
				><qm-button @click="applyDate">查看记录</qm-button></template
			></qm-sheet
		>
	</qm-page>
</template>
<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { onShow, onLoad, onReachBottom, onPullDownRefresh } from "@dcloudio/uni-app";
import dayjs from "dayjs";
import { useCool } from "/@/cool";
import Service from "../../service/member/consume-record";
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
import QmSheet from "./components/qm-sheet.vue";
import { collectConsumeSummary } from "./utils/consume-summary";
const { router } = useCool(),
	service = new Service();
const consumeType = ref(""),
	totals = ref<{ count: number; times: number } | null>(null),
	totalsLoading = ref(false),
	totalsError = ref("");
let totalsGeneration = 0;
const consumeTypes = ["", "会员次卡", "美团团购", "抖音新客福利", "纹绣", "眼线"];
const keyword = ref(""),
	start = ref(dayjs().startOf("month").format("YYYY-MM-DD")),
	end = ref(dayjs().format("YYYY-MM-DD")),
	range = ref("month"),
	rows = ref<any[]>([]),
	page = ref(1),
	total = ref(0),
	loading = ref(false),
	loaded = ref(false),
	finished = ref(false),
	error = ref(""),
	dateVisible = ref(false),
	draftStart = ref(""),
	draftEnd = ref(""),
	dateError = ref("");
const ranges = [
		{ label: "今日", value: "today" },
		{ label: "本周", value: "week" },
		{ label: "本月", value: "month" },
		{ label: "自定义", value: "custom" },
	],
	dateMode = ["year", "month", "date"];
let dirty = true,
	generation = 0;
function name(row: any) {
	return row.memberName || row.memberNickName || "未命名客户";
}
function formatTime(value: string) {
	return value && dayjs(value).isValid() ? dayjs(value).format("MM.DD HH:mm") : "未记录时间";
}
async function fetch(append = false) {
	const seq = ++generation;
	loading.value = true;
	error.value = "";
	try {
		const data: any = await service.page({
			page: page.value,
			size: 15,
			order: "consumeTime",
			sort: "desc",
			consumeStartTime: start.value + " 00:00:00",
			consumeEndTime: dayjs(end.value).add(1, "day").format("YYYY-MM-DD") + " 00:00:00",
			memberKeyword: keyword.value || undefined,
			consumeType: consumeType.value || undefined,
		});
		if (seq !== generation) return;
		const list = data.list || [];
		rows.value = append ? [...rows.value, ...list] : list;
		total.value = data.pagination?.total ?? data.total ?? rows.value.length;
		loaded.value = true;
		finished.value = rows.value.length >= total.value || list.length < 15;
		dirty = false;
	} catch (e: any) {
		if (seq !== generation) return;
		error.value = e?.message || "消费记录加载失败";
		if (append) page.value--;
	} finally {
		if (seq === generation) loading.value = false;
	}
}
function reload() {
	loadSummary();
	page.value = 1;
	finished.value = false;
	return fetch();
}
async function loadSummary() {
	const seq = ++totalsGeneration;
	totalsLoading.value = true;
	totalsError.value = "";
	totals.value = null;
	try {
		const result = await collectConsumeSummary((params) => service.page(params), {
			order: "consumeTime",
			sort: "desc",
			consumeStartTime: start.value + " 00:00:00",
			consumeEndTime: dayjs(end.value).add(1, "day").format("YYYY-MM-DD") + " 00:00:00",
			memberKeyword: keyword.value || undefined,
			consumeType: consumeType.value || undefined,
		});
		if (seq === totalsGeneration) totals.value = result;
	} catch {
		if (seq === totalsGeneration)
			totalsError.value = "扣减次数统计暂不可用，消费明细仍可查看。";
	} finally {
		if (seq === totalsGeneration) totalsLoading.value = false;
	}
}
function more() {
	if (loading.value || finished.value) return;
	page.value++;
	fetch(true);
}
function setRange(value: string) {
	range.value = value;
	const now = dayjs();
	if (value === "today" || value === "yesterday") {
		start.value = end.value = now
			.subtract(value === "today" ? 0 : 1, "day")
			.format("YYYY-MM-DD");
	} else if (value === "week") {
		const weekday = now.day() || 7;
		start.value = now.subtract(weekday - 1, "day").format("YYYY-MM-DD");
		end.value = now.format("YYYY-MM-DD");
	} else {
		const date = value === "lastMonth" ? now.subtract(1, "month") : now;
		start.value = date.startOf("month").format("YYYY-MM-DD");
		end.value = (value === "lastMonth" ? date.endOf("month") : now).format("YYYY-MM-DD");
	}
	reload();
}
function openDate() {
	draftStart.value = start.value;
	draftEnd.value = end.value;
	dateError.value = "";
	dateVisible.value = true;
}
function applyDate() {
	dateError.value = "";
	if (
		!draftStart.value ||
		!draftEnd.value ||
		!dayjs(draftStart.value).isValid() ||
		!dayjs(draftEnd.value).isValid()
	) {
		dateError.value = "请选择有效的开始和结束日期";
		return;
	}
	if (draftStart.value > draftEnd.value) {
		dateError.value = "结束日期不能早于开始日期";
		return;
	}
	start.value = draftStart.value;
	end.value = draftEnd.value;
	range.value = "custom";
	dateVisible.value = false;
	reload();
}
function detail(row: any) {
	router.push({
		path: "/pages/index/consume-detail",
		query: { id: row.id },
		params: { record: row },
	});
}
function add() {
	router.push("/pages/index/consume-form");
}
function markDirty() {
	dirty = true;
}
uni.$on("chime:consumes-changed", markDirty);
onUnmounted(() => uni.$off("chime:consumes-changed", markDirty));
onLoad((q) => {
	if (q?.start && q?.end) {
		start.value = q.start;
		end.value = q.end;
		range.value = "custom";
	}
});
onShow(() => {
	if (dirty) reload();
});
onReachBottom(more);
onPullDownRefresh(async () => {
	await reload();
	uni.stopPullDownRefresh();
});
</script>
<style scoped lang="scss">
.records-search-icon {
	width: 34rpx;
	height: 34rpx;
}
.records-range {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16rpx;
	font-size: 25rpx;
	color: var(--qm-muted);
	width: 100%;
	min-height: 64rpx;
	margin-top: -12rpx !important;
	image {
		width: 26rpx;
		height: 26rpx;
	}
}
.records-types {
	width: 100%;
	margin: 22rpx 0;
	white-space: nowrap;
	> view {
		display: inline-flex;
		gap: 14rpx;
		padding: 2rpx;
	}
	.qm-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 64rpx;
		font-size: 23rpx;
	}
}
.records-summary {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20rpx;
	margin: 26rpx 0 34rpx;
	> view {
		background: var(--qm-lilac);
		border-radius: 30rpx;
		padding: 24rpx 30rpx;
		> text {
			display: block;
			font-size: 23rpx;
			color: var(--qm-muted);
		}
		> text + text {
			font-size: 44rpx;
			font-weight: 700;
			color: var(--qm-deep);
			margin-top: 8rpx;
			text {
				font-size: 23rpx;
				font-weight: 400;
			}
		}
	}
	> view + view {
		background: var(--qm-cream);
	}
}
.records-total {
	margin: 22rpx 0;
	font-size: 30rpx;
	font-weight: 500;
}
.records-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}
.records-item {
	display: block;
	width: 100%;
	text-align: left;
	padding: 24rpx 28rpx !important;
	background: var(--qm-surface) !important;
	border-radius: 30rpx !important;
}
.records-item-heading {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
	font-size: 29rpx;
	font-weight: 500;
	> text:last-child {
		font-size: 24rpx;
		color: var(--qm-muted);
		white-space: nowrap;
	}
	.records-deduct {
		color: var(--qm-brand) !important;
	}
}
.records-item-desc,
.records-item-time {
	display: block;
	font-size: 24rpx;
	color: var(--qm-muted);
	margin-top: 5rpx;
}
.records-item-time {
	font-size: 22rpx;
}
</style>
