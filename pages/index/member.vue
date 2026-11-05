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
				<qm-tabs
					:model-value="category"
					:options="categories"
					label="会员分类"
					id-prefix="member-category-"
					@change="(value) => setCategory(String(value))"
				/>
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
							filterCount ? "筛选 · " + filterCount : "姓名 A–Z"
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
			<view class="member-results">
				<scroll-view
					class="member-scroll"
					scroll-y
					enhanced
					:show-scrollbar="false"
					:scroll-top="requestedScrollTop"
					:scroll-into-view="scrollTarget"
					:refresher-enabled="!loading || refreshing"
					:refresher-triggered="refreshing"
					refresher-background="#f8f5f0"
					:aria-busy="loading"
					@scroll="onListScroll"
					@touchstart="onListTouchStart"
					@scrolltolower="more"
					@refresherrefresh="refresh"
				>
					<view v-if="loading && !loaded" class="member-loading" aria-hidden="true"
						><view v-for="n in 4" :key="n" class="qm-skeleton"
					/></view>
					<template v-else>
						<view v-if="error" class="qm-error" role="alert"
							>{{ error
							}}<button class="qm-inline" @tap="reload">重新加载</button></view
						><view class="member-list">
							<template v-for="(item, index) in list" :key="item.id">
								<view
									v-if="!index || memberInitial(list[index - 1]) !== memberInitial(item)"
									:id="groupAnchor(memberInitial(item))"
									:data-initial="memberInitial(item)"
									class="member-group"
								>{{ memberInitial(item) }}</view>
								<button
									:data-member-id="item.id"
									class="qm-panel member-card"
									:class="{
										'is-low': memberStatus(item) === '低余次',
										'is-muted': item.cards && !(item.validCardCount > 0),
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
											><text>{{ item.cards ? item.remainTimes ?? 0 : '—' }}<text> 次</text></text
											><text>{{ item.cards ? (item.validCardCount ?? 0) + ' 张次卡' : '次卡待同步' }}</text></view
										></view
									><view class="member-meta"
										><text>{{ item.cardLoadError ? '次卡资料加载失败，请下拉刷新' : memberCardCaption(item) }}</text
										><text>{{
											item.lastConsumeTime
												? dayjs(item.lastConsumeTime).format("MM.DD") + " 消费"
												: "暂无消费"
										}}</text></view
									><text v-if="memberAction" class="member-action"
										>{{
											memberAction === "openCard"
												? "为此会员开卡"
												: "为此会员扣次"
										}}
										›</text
									>
								</button>
							</template>
						</view
						><view v-if="loaded && !list.length && !error" class="qm-empty"
							><text>{{
								filters.keyWord ||
								category !== "all" ||
								attention ||
								filterCount ||
								initial
									? "没有匹配的会员"
									: "还没有会员"
							}}</text
							><text>{{
								filters.keyWord ||
								category !== "all" ||
								attention ||
								filterCount ||
								initial
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
				<view v-if="showAlphabetIndex" class="member-index">
					<qm-alphabet-index
						:model-value="initial"
						:counts="initialCounts"
						:disabled="loading"
						@change="setInitial"
					/>
				</view>
			</view>
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
import {
	ref, shallowRef, reactive, computed, watch, onUnmounted, nextTick, getCurrentInstance,
} from "vue";
import { onShow, onHide } from "@dcloudio/uni-app";
import dayjs from "dayjs";
import { useCool } from "/@/cool";
import MemberService from "../../service/member/info";
// #ifndef MP-WEIXIN
import Tabbar from "./components/tabbar.vue";
// #endif
import QmButton from "./components/qm-button.vue";
import QmTabs from "./components/qm-tabs.vue";
import QmSheet from "./components/qm-sheet.vue";
import QmAlphabetIndex from "./components/qm-alphabet-index.vue";
import CardService from "../../service/member/card-account";
import {
	collectMemberPages,
	hydrateMemberCards,
	matchesMemberFilter,
	memberCardCaption,
	memberStatus,
	memberInitial,
	sortMembersByName,
} from "./utils/member-directory";
import { pendingMemberQuickAction, pendingMemberFilter } from "./utils/member-quick-action";
import { initialAtScrollTop, type MemberGroupOffset } from "./utils/member-scroll-index";
const { router } = useCool(),
	service = new MemberService(),
	cardService = new CardService();
const navigation = useMiniNavigation();
const instance = getCurrentInstance();
const category = ref("all"),
	attention = ref(""),
	initial = ref("");
const categories = [
	{ label: "全部", value: "all" },
	{ label: "持卡会员", value: "carded" },
	{ label: "非持卡会员", value: "uncarded" },
];
const filteredCache = shallowRef<any[] | null>(null);
const initialCounts = computed(() => {
	const counts: Record<string, number> = {};
	for (const member of filteredCache.value || []) {
		const letter = memberInitial(member);
		counts[letter] = (counts[letter] || 0) + 1;
	}
	return counts;
});
const showAlphabetIndex = computed(
	() => loaded.value || filteredCache.value !== null,
);
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
	requestedScrollTop = ref(0),
	scrollTarget = ref(""),
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
		order: "name",
	}),
	draft = reactive({ gender: -1, source: -1, order: "name" });
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
		Number(filters.order !== "name"),
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
		const needsCardFilter = category.value !== "all" || !!attention.value;
		const params = {
			...filters,
			order: filters.order === "name" ? "createTime" : filters.order,
			gender: filters.gender === -1 ? undefined : filters.gender,
			source: filters.source === -1 ? undefined : filters.source,
			sort: "desc",
		};
		if (!filteredCache.value) {
			const all = await collectMemberPages((params) => service.page(params), params);
			if (seq !== generation) return;
			const ordered = sortMembersByName(all);
			if (needsCardFilter) {
				const hydrated = await withCards(ordered, seq);
				if (seq !== generation) return;
				filteredCache.value = hydrated.filter(
					(row) =>
						matchesMemberFilter(row, category.value) &&
						matchesMemberFilter(row, attention.value),
				);
			} else {
				filteredCache.value = ordered;
			}
		}
		const total = filteredCache.value.length;
		const rows = filteredCache.value.slice();
		if (!needsCardFilter) {
			const firstPage = await withCards(rows.slice(0, pagination.size), seq);
			rows.splice(0, firstPage.length, ...firstPage);
		}
		if (seq !== generation) return;
		list.value = append ? [...list.value, ...rows] : rows;
		pagination.total = total;
		finished.value = list.value.length >= total || rows.length < pagination.size;
		loaded.value = true;
		dirty = false;
		nextTick(() => {
			updateGroupOffsets(seq);
			observeMemberCards(seq);
		});
	} catch (e: any) {
		if (seq !== generation) return;
		error.value = e?.message || "会员列表加载失败";
		if (append) pagination.page--;
	} finally {
		if (seq === generation) loading.value = false;
	}
}
function reload() {
	jumpSequence++;
	groupOffsets = [];
	stopCardObserver();
	cardCache.clear();
	filteredCache.value = null;
	scrollTarget.value = "";
	if (!refreshing.value) {
		loaded.value = false;
		list.value = [];
		requestedScrollTop.value = Math.max(0, currentScrollTop);
		nextTick(() => {
			requestedScrollTop.value = 0;
		});
	}
	currentScrollTop = 0;
	scrollHeight = 0;
	initial.value = "";
	pagination.page = 1;
	finished.value = false;
	return fetch();
}
async function refresh() {
	if (loading.value || refreshing.value) return;
	refreshing.value = true;
	try {
		await nextTick();
		await reload();
		await nextTick();
	} finally {
		refreshing.value = false;
	}
}
function more() {
	if (loading.value || finished.value) return;
	pagination.page++;
	fetch(true);
}
let jumpSequence = 0;
let groupOffsets: MemberGroupOffset[] = [];
let viewportHeight = 0;
let scrollHeight = 0;
let currentScrollTop = 0;
function visibleInitial() {
	if (!groupOffsets.length) return "";
	if (
		viewportHeight > 0 &&
		scrollHeight > viewportHeight &&
		currentScrollTop + viewportHeight >= scrollHeight - 2
	) {
		return groupOffsets[groupOffsets.length - 1].initial;
	}
	return initialAtScrollTop(groupOffsets, currentScrollTop);
}
function onListScroll(event: { detail: { scrollTop: number; scrollHeight?: number } }) {
	currentScrollTop = event.detail.scrollTop;
	if (event.detail.scrollHeight !== undefined) scrollHeight = event.detail.scrollHeight;
	if (groupOffsets.length) initial.value = visibleInitial();
}
function onListTouchStart() {
	scrollTarget.value = "";
}
function groupAnchor(letter: string) {
	return "member-group-" + (letter === "#" ? "other" : letter);
}
function updateGroupOffsets(seq: number) {
	if (seq !== generation || !list.value.length) return;
	const query = uni.createSelectorQuery().in(instance?.proxy);
	query.select(".member-scroll").boundingClientRect();
	query.select(".member-list").boundingClientRect();
	query.selectAll(".member-group").boundingClientRect();
	query.exec((result) => {
		if (seq !== generation) return;
		const [viewport, content, groups] = result;
		if (!viewport || !content || !groups?.length) return;
		viewportHeight = viewport.height;
		groupOffsets = groups.map((group: any) => ({
			initial: group.dataset.initial,
			top: group.top - content.top,
		}));
		initial.value = visibleInitial();
	});
}
async function setInitial(letter: string) {
	if (loading.value || !initialCounts.value[letter]) return;
	const seq = ++jumpSequence;
	initial.value = letter;
	scrollTarget.value = "";
	await nextTick();
	if (seq !== jumpSequence) return;
	scrollTarget.value = groupAnchor(letter);
}

let cardObserver: ReturnType<typeof uni.createIntersectionObserver> | undefined;
const cardQueue = new Map<number, any>();
const cardInFlight = new Set<string>();
let activeCardRequests = 0;
function stopCardObserver() {
	cardObserver?.disconnect();
	cardObserver = undefined;
	cardQueue.clear();
}
function observeMemberCards(seq: number) {
	if (seq !== generation) return;
	stopCardObserver();
	if (!list.value.some((row) => !row.cards)) return;
	cardObserver = uni.createIntersectionObserver(instance?.proxy, { observeAll: true });
	cardObserver.relativeTo(".member-scroll", { bottom: 200 }).observe(".member-card", (result) => {
		if (seq !== generation || result.intersectionRatio <= 0) return;
		const id = Number(result.dataset.memberId);
		const row = list.value.find((member) => member.id === id);
		if (!row || row.cards || cardInFlight.has(seq + ":" + id)) return;
		cardQueue.set(id, row);
		drainCardQueue();
	});
}
function drainCardQueue() {
	while (activeCardRequests < 6 && cardQueue.size) {
		const [id, row] = cardQueue.entries().next().value!;
		cardQueue.delete(id);
		const seq = generation;
		const key = seq + ":" + id;
		cardInFlight.add(key);
		activeCardRequests++;
		withCards([row], seq)
			.then(([hydrated]) => {
				if (seq !== generation) return;
				const index = list.value.findIndex((member) => member.id === id);
				if (index !== -1) list.value[index] = hydrated;
				nextTick(() => updateGroupOffsets(seq));
			})
			.catch(() => {
				if (seq !== generation) return;
				const member = list.value.find((member) => member.id === id);
				if (member) member.cardLoadError = true;
				nextTick(() => updateGroupOffsets(seq));
			})
			.finally(() => {
				cardInFlight.delete(key);
				activeCardRequests--;
				drainCardQueue();
			});
	}
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
	Object.assign(draft, { gender: -1, source: -1, order: "name" });
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
	filteredCache.value = null;
	dirty = true;
}
uni.$on("chime:members-changed", markDirty);
uni.$on("chime:member-changed", markDirty);
onUnmounted(() => {
	stopCardObserver();
	generation++;
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
		initial.value = "";
		filteredCache.value = null;
		dirty = true;
	}
	pending();
	if (dirty) reload();
	else nextTick(() => {
		updateGroupOffsets(generation);
		observeMemberCards(generation);
	});
});
onHide(() => {
	memberAction.value = undefined;
	stopCardObserver();
});
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
.member-results {
	position: relative;
	flex: 1;
	height: 0;
	min-height: 0;
}
.member-scroll {
	width: 100%;
	height: 100%;
	overscroll-behavior-y: contain;
}
/* #ifdef H5 */
.member-scroll :deep(.uni-scroll-view) {
	scrollbar-width: none;
}
.member-scroll :deep(.uni-scroll-view::-webkit-scrollbar) {
	display: none;
	width: 0;
	height: 0;
}
/* #endif */
.member-index {
	position: absolute;
	top: 8rpx;
	right: -28rpx;
	bottom: 8rpx;
	z-index: 3;
	width: 52rpx;
	pointer-events: none;
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
.member-group {
	padding: 12rpx 4rpx 16rpx;
	font-size: 24rpx;
	font-weight: 600;
	color: var(--qm-muted);
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
