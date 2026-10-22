<template>
	<cl-page background-color="#f8f5f0" status-bar-background="#f8f5f0">
		<view class="chime-business member-page" :style="{ top: statusBarHeight + 'px' }">
			<view class="member-controls">
				<view
					class="member-main-header"
					:style="
						navigation.enabled
							? {
									minHeight: navigation.barHeight + 'px',
									paddingRight: 'calc(' + navigation.sideInset + 'px - 38rpx)',
								}
							: {}
					"
				>
					<view class="member-heading"
						><view><text>千绵美学</text><text>会员</text></view></view
					>
				</view>
				<view class="member-search-row">
					<view class="qm-search">
						<image src="/static/business/v53/search.svg" class="search-icon" />
						<input
							v-model.trim="filters.keyWord"
							placeholder="姓名 / 手机号 / 微信昵称"
							confirm-type="search"
							@confirm="reload"
						/>
						<button
							v-if="filters.keyWord"
							aria-label="清空搜索"
							@tap="
								filters.keyWord = '';
								reload();
							"
						>
							×
						</button>
					</view>
					<button class="member-create" aria-label="新增会员" @tap="create">
						<image src="/static/business/v53/plus.svg" mode="aspectFit" /><text
							>新增</text
						>
					</button>
				</view>
				<view class="qm-segments" aria-label="会员分类"
					><button
						v-for="item in categories"
						:key="item.value"
						:id="'member-category-' + item.value"
						:class="{ 'is-active': category === item.value }"
						:aria-pressed="category === item.value"
						@tap="setCategory(item.value)"
					>
						{{ item.label }}
					</button></view
				>
				<view class="member-quick-filters"
					><view
						><button
							id="member-filter-low"
							:class="{ 'is-active': attention === 'low' }"
							:aria-pressed="attention === 'low'"
							@tap="setAttention('low')"
						>
							低余次</button
						><button
							id="member-filter-expired"
							:class="{ 'is-active': attention === 'expired' }"
							:aria-pressed="attention === 'expired'"
							@tap="setAttention('expired')"
						>
							已过期</button
						><button
							v-if="attention === 'expiring'"
							class="is-active"
							@tap="setAttention('expiring')"
						>
							即将到期
						</button></view
					><button @tap="openFilter">
						<image src="/static/business/v53/sort.svg" mode="aspectFit" />{{
							filterCount ? "筛选 · " + filterCount : "默认顺序"
						}}
					</button></view
				>
				<view v-if="memberAction" class="qm-notice member-choice"
					><text>{{ memberAction === "openCard" ? "选择开卡会员" : "选择扣次会员" }}</text
					><button @tap="memberAction = undefined">取消</button></view
				><view class="member-toolbar" role="status" aria-live="polite"
					><text>{{
						loading && !loaded
							? "正在加载会员…"
							: loaded
								? "全部会员 · " + pagination.total + " 位"
								: "会员档案"
					}}</text>
				</view>
			</view>
			<scroll-view
				class="member-scroll"
				scroll-y
				:scroll-top="scrollTop"
				:refresher-enabled="!loading"
				:refresher-triggered="refreshing"
				refresher-background="#f8f5f0"
				:aria-busy="loading"
				@scroll="scrollTop = $event.detail.scrollTop"
				@scrolltolower="more"
				@refresherrefresh="refresh"
			>
				<view v-if="loading && !loaded" class="member-loading" aria-hidden="true"
					><view v-for="n in 4" :key="n" class="qm-skeleton"
				/></view>
				<template v-else>
					<view v-if="error" class="qm-error" role="alert"
						>{{ error }}<button class="qm-inline" @tap="reload">重新加载</button></view
					><view class="member-list"
						><button
							v-for="item in list"
							:key="item.id"
							class="qm-panel member-card"
							:class="{
								'is-low': memberStatus(item) === '低余次',
								'is-muted': !(item.validCardCount > 0),
							}"
							@tap="detail(item)"
						>
							<view class="qm-identity"
								><view class="qm-avatar">{{ name(item).slice(0, 1) }}</view
								><view class="member-copy"
									><text class="qm-identity__name"
										>{{ name(item)
										}}<text
											v-if="memberStatus(item)"
											class="qm-tag"
											:class="{
												'is-warning': memberStatus(item) === '低余次',
											}"
											>{{ memberStatus(item) }}</text
										></text
									><text class="qm-identity__meta">{{
										phone(item.phone)
									}}</text></view
								><view class="member-balance"
									><text>{{ item.remainTimes ?? 0 }}<text> 次</text></text
									><text>{{ item.validCardCount ?? 0 }} 张次卡</text></view
								></view
							><view class="member-meta"
								><text>{{ memberCardCaption(item) }}</text
								><text>{{
									item.lastConsumeTime
										? dayjs(item.lastConsumeTime).format("MM.DD") + " 消费"
										: "暂无消费"
								}}</text></view
							><text v-if="memberAction" class="member-action"
								>{{
									memberAction === "openCard" ? "为此会员开卡" : "为此会员扣次"
								}}
								›</text
							>
						</button></view
					><view v-if="loaded && !list.length && !error" class="qm-empty"
						><text>{{
							filters.keyWord || category !== "all" || attention || filterCount
								? "没有匹配的会员"
								: "还没有会员"
						}}</text
						><text>{{
							filters.keyWord || category !== "all" || attention || filterCount
								? "调整搜索或筛选条件后再试"
								: "先建立一份档案，开始记录每次服务。"
						}}</text
						><qm-button @click="create">新增会员</qm-button></view
					><button
						v-if="list.length && !finished"
						class="qm-inline"
						:disabled="loading"
						@tap="more"
					>
						{{ loading ? "正在加载…" : "加载更多" }}</button
					><text v-else-if="list.length" class="member-end">已显示全部结果</text>
				</template>
			</scroll-view>
		</view>
		<!-- #ifndef MP-WEIXIN -->
		<tabbar design />
		<!-- #endif -->
		<qm-sheet v-model="filterVisible" title="筛选会员"
			><view
				v-for="group in filterGroups"
				:key="group.key"
				class="qm-field member-filter-group"
			>
				<text class="qm-label">{{ group.label }}</text>
				<view class="qm-chips"
					><button
						v-for="option in group.options"
						:key="option.value"
						class="qm-chip"
						:class="{ 'is-active': draft[group.key] === option.value }"
						role="button"
						tabindex="0"
						:aria-pressed="draft[group.key] === option.value"
						@tap="draft[group.key] = option.value"
						@keydown.enter.prevent="draft[group.key] = option.value"
						@keydown.space.prevent="draft[group.key] = option.value"
					>
						{{ option.label }}
					</button></view
				> </view
			><template #footer
				><view class="qm-pair"
					><qm-button variant="secondary" @click="resetFilter">重置</qm-button
					><qm-button @click="applyFilter">应用筛选</qm-button></view
				></template
			></qm-sheet
		>
		<qm-member-business-sheet ref="businessSheet" @saved="reload" />
	</cl-page>
</template>
<script setup lang="ts">
import QmMemberBusinessSheet from "./components/qm-member-business-sheet.vue";
const businessSheet = ref<InstanceType<typeof QmMemberBusinessSheet>>();
import { useMiniNavigation } from "./utils/use-mini-navigation";
import { ref, reactive, computed, watch, onUnmounted } from "vue";
import { onShow, onHide } from "@dcloudio/uni-app";
import dayjs from "dayjs";
import { useCool } from "/@/cool";
import MemberService from "../../service/member/info";
// #ifndef MP-WEIXIN
import Tabbar from "./components/tabbar.vue";
// #endif
import QmButton from "./components/qm-button.vue";
import QmSheet from "./components/qm-sheet.vue";
import CardService from "../../service/member/card-account";
import {
	collectMemberPages,
	hydrateMemberCards,
	matchesMemberFilter,
	memberCardCaption,
	memberStatus,
} from "./utils/member-directory";
import { pendingMemberQuickAction, pendingMemberFilter } from "./utils/member-quick-action";
const { router } = useCool(),
	service = new MemberService(),
	cardService = new CardService();
const navigation = useMiniNavigation();
const category = ref("all"),
	attention = ref("");
const categories = [
	{ label: "全部", value: "all" },
	{ label: "持卡会员", value: "carded" },
	{ label: "非持卡会员", value: "uncarded" },
];
let filteredCache: any[] | null = null;
const cardCache = new Map<number, any[]>();
async function withCards(rows: any[], seq: number) {
	return hydrateMemberCards(rows, async (id) => {
		if (cardCache.has(id)) return cardCache.get(id)!;
		const cards: any = await cardService.list({ memberId: id });
		if (seq === generation) cardCache.set(id, cards);
		return cards;
	});
}
function setCategory(value: string) {
	if (category.value === value) return;
	category.value = value;
	reload();
}
function setAttention(value: string) {
	attention.value = attention.value === value ? "" : value;
	reload();
}
const list = ref<any[]>([]),
	loading = ref(false),
	loaded = ref(false),
	statusBarHeight = ref(0),
	scrollTop = ref(0),
	refreshing = ref(false),
	error = ref(""),
	finished = ref(false),
	memberAction = ref<"openCard" | "deduct">(),
	filterVisible = ref(false);
const pagination = reactive({ page: 1, size: 15, total: 0 }),
	filters = reactive({
		keyWord: "",
		gender: -1,
		source: -1,
		order: "createTime",
	}),
	draft = reactive({ gender: -1, source: -1, order: "createTime" });
let generation = 0,
	dirty = true;
const sources = { 1: "抖音", 2: "美团", 3: "朋友介绍" },
	genders = [
		{ label: "全部", value: -1 },
		{ label: "未知", value: 0 },
		{ label: "男", value: 1 },
		{ label: "女", value: 2 },
	],
	sourceOptions = [
		{ label: "全部来源", value: -1 },
		{ label: "抖音", value: 1 },
		{ label: "美团", value: 2 },
		{ label: "朋友介绍", value: 3 },
	],
	orders = [
		{ label: "最新加入", value: "createTime" },
		{ label: "最近消费", value: "lastConsumeTime" },
		{ label: "剩余次数", value: "remainTimes" },
		{ label: "有效次卡", value: "validCardCount" },
	];
const filterGroups = [
	{ key: "gender" as const, label: "性别", options: genders },
	{ key: "source" as const, label: "来源", options: sourceOptions },
	{ key: "order" as const, label: "排序", options: orders },
];
const filterCount = computed(
	() =>
		Number(filters.gender !== -1) +
		Number(filters.source !== -1) +
		Number(filters.order !== "createTime"),
);
function name(item: any) {
	return item.name || item.nickName || "未命名会员";
}
function phone(value?: string) {
	return value ? value.replace(/^(\d{3})(\d{4})(\d{4})$/, "$1 $2 $3") : "未填写手机号";
}
async function fetch(append = false) {
	const seq = ++generation;
	loading.value = true;
	error.value = "";
	try {
		const params = {
			...filters,
			gender: filters.gender === -1 ? undefined : filters.gender,
			source: filters.source === -1 ? undefined : filters.source,
			sort: "desc",
		};
		let rows: any[], total: number;
		if (category.value !== "all" || attention.value) {
			if (!filteredCache) {
				const all = await collectMemberPages((params) => service.page(params), params);
				if (seq !== generation) return;
				const hydrated = await withCards(all, seq);
				if (seq !== generation) return;
				filteredCache = hydrated.filter(
					(row) =>
						matchesMemberFilter(row, category.value) &&
						matchesMemberFilter(row, attention.value),
				);
			}
			total = filteredCache.length;
			rows = filteredCache.slice(
				(pagination.page - 1) * pagination.size,
				pagination.page * pagination.size,
			);
		} else {
			const res: any = await service.page({
				...params,
				page: pagination.page,
				size: pagination.size,
			});
			if (seq !== generation) return;
			rows = await withCards(res.list || [], seq);
			total = res.pagination?.total ?? res.total ?? rows.length;
		}
		if (seq !== generation) return;
		list.value = append ? [...list.value, ...rows] : rows;
		pagination.total = total;
		finished.value = list.value.length >= total || rows.length < pagination.size;
		loaded.value = true;
		dirty = false;
	} catch (e: any) {
		if (seq !== generation) return;
		error.value = e?.message || "会员列表加载失败";
		if (append) pagination.page--;
	} finally {
		if (seq === generation) loading.value = false;
	}
}
function reload() {
	cardCache.clear();
	filteredCache = null;
	loaded.value = false;
	list.value = [];
	scrollTop.value = 0;
	pagination.page = 1;
	finished.value = false;
	return fetch();
}
async function refresh() {
	if (loading.value) return;
	refreshing.value = true;
	try {
		await reload();
	} finally {
		refreshing.value = false;
	}
}
function more() {
	if (loading.value || finished.value) return;
	pagination.page++;
	fetch(true);
}
function create() {
	businessSheet.value?.openCreate();
}
function detail(item: any) {
	if (memberAction.value === "openCard") return businessSheet.value?.openCard(item);
	if (memberAction.value) {
		router.push({
			path: "/pages/index/member-action",
			query: {
				memberId: item.id,
				mode: memberAction.value === "openCard" ? "openCard" : undefined,
			},
		});
	} else router.push({ path: "/pages/index/member-detail", query: { id: item.id } });
}
function openFilter() {
	Object.assign(draft, { gender: filters.gender, source: filters.source, order: filters.order });
	filterVisible.value = true;
}
function resetFilter() {
	Object.assign(draft, { gender: -1, source: -1, order: "createTime" });
}
function applyFilter() {
	Object.assign(filters, draft);
	filterVisible.value = false;
	reload();
}
function pending() {
	if ((router.path || "").replace(/^\//, "") !== "pages/index/member") return;
	const action = pendingMemberQuickAction.value;
	if (!action) return;
	pendingMemberQuickAction.value = undefined;
	if (action === "addMember") {
		memberAction.value = undefined;
		create();
	} else memberAction.value = action;
}
function markDirty() {
	cardCache.clear();
	filteredCache = null;
	dirty = true;
}
uni.$on("chime:members-changed", markDirty);
uni.$on("chime:member-changed", markDirty);
onUnmounted(() => {
	uni.$off("chime:members-changed", markDirty);
	uni.$off("chime:member-changed", markDirty);
});
watch(pendingMemberQuickAction, pending, { flush: "post" });
onShow(() => {
	statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 0;
	const intent = pendingMemberFilter.value;
	if (intent) {
		pendingMemberFilter.value = undefined;
		category.value = "all";
		attention.value = intent === "all" ? "" : intent;
		filteredCache = null;
		dirty = true;
	}
	pending();
	if (dirty) reload();
});
onHide(() => (memberAction.value = undefined));
</script>
<style scoped lang="scss">
.member-page {
	position: fixed;
	right: 0;
	bottom: 0;
	left: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	padding: 30rpx 38rpx 20rpx;
	/* #ifndef MP-WEIXIN */
	bottom: calc(130rpx + env(safe-area-inset-bottom) + 1px);
	/* #endif */
	/* #ifdef MP-WEIXIN */
	padding-top: 0;
	/* #endif */
}
.member-controls {
	flex-shrink: 0;
}
.member-main-header {
	display: flex;
	align-items: center;
	box-sizing: border-box;
}
.member-scroll {
	flex: 1;
	height: 0;
	min-height: 0;
	overscroll-behavior-y: contain;
}
.member-loading .qm-skeleton {
	height: 184rpx;
	border-radius: 38rpx;
	margin-bottom: 16rpx;
}
.member-heading {
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin: 6rpx 0 26rpx;
	> view > text {
		display: block;
		font-size: 21rpx;
		color: var(--qm-muted);
	}
	> view > text + text {
		font-size: 50rpx;
		line-height: 1.4;
		font-weight: 700;
		color: var(--qm-deep);
		margin-top: 8rpx;
	}
}
.member-search-row {
	display: flex;
	align-items: stretch;
	gap: 16rpx;
	.qm-search {
		flex: 1;
		min-width: 0;
	}
}
.member-create {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	gap: 5rpx;
	padding: 0 24rpx;
	min-height: 88rpx;
	color: var(--qm-on-brand);
	background: var(--qm-brand);
	border-radius: 24rpx;
	font-size: 28rpx;
	image {
		width: 26rpx;
		height: 26rpx;
		filter: brightness(0) invert(1);
	}
}
.search-icon {
	width: 36rpx;
	height: 36rpx;
}
.member-quick-filters {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
	margin: 20rpx 0 16rpx;
	> view {
		display: flex;
		gap: 14rpx;
		flex-wrap: wrap;
	}
	button {
		display: flex;
		align-items: center;
		gap: 8rpx;
		font-size: 22rpx;
		color: var(--qm-muted);
		min-height: 60rpx;
	}
	> view button {
		padding: 10rpx 26rpx;
		background: var(--qm-surface);
		border-radius: 999rpx;
	}
	.is-active {
		color: var(--qm-brand);
		background: var(--qm-lilac);
	}
	image {
		width: 28rpx;
		height: 28rpx;
	}
}
.member-toolbar {
	font-size: 23rpx;
	color: var(--qm-muted);
	margin: 16rpx 0 18rpx;
}
.member-card {
	display: block;
	width: 100%;
	padding: 24rpx 26rpx !important;
	text-align: left;
	margin-bottom: 16rpx !important;
}
.member-copy {
	flex: 1;
	min-width: 0;
	.qm-identity__name {
		font-weight: 500;
		font-size: 29rpx;
	}
	.qm-tag {
		margin-left: 12rpx;
		font-size: 20rpx;
		font-weight: 400;
	}
}
.member-balance {
	text-align: right;
	white-space: nowrap;
	> text {
		display: block;
		color: var(--qm-deep);
		font-size: 43rpx;
		font-weight: 700;
		line-height: 1.2;
		text {
			font-size: 22rpx;
			font-weight: 400;
			margin-left: 4rpx;
		}
	}
	> text + text {
		font-size: 21rpx;
		font-weight: 400;
		color: var(--qm-muted);
		margin-top: 10rpx;
	}
}
.member-card.is-low .member-balance > text:first-child {
	color: var(--qm-warning);
}
.member-card.is-low .qm-avatar {
	background: var(--qm-cream);
	color: var(--qm-warning);
}
.member-card.is-muted .qm-avatar {
	background: var(--qm-paper);
	color: var(--qm-muted);
}
.member-card.is-muted .member-balance > text:first-child {
	color: var(--qm-muted);
}
.member-meta {
	display: flex;
	justify-content: space-between;
	gap: 14rpx;
	margin-top: 20rpx;
	font-size: 22rpx;
	color: var(--qm-muted);
	> text:first-child {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	> text:last-child {
		flex-shrink: 0;
	}
}
.member-choice {
	display: flex;
	align-items: center;
	justify-content: space-between;
	button {
		color: var(--qm-brand);
		min-height: 60rpx;
	}
}
.member-action {
	display: block;
	text-align: right;
	font-size: 24rpx;
	color: var(--qm-brand);
	margin-top: 14rpx;
}
.member-end {
	display: block;
	text-align: center;
	font-size: 21rpx;
	color: var(--qm-muted);
	margin: 22rpx 0;
}
.member-filter-group .qm-chips {
	margin: 16rpx 0 28rpx;
}
</style>
