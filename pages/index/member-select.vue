<template>
	<qm-page
		:title="
			purpose === 'appointment'
				? '选择预约会员'
				: purpose === 'openCard'
					? '选择开卡会员'
					: '选择扣次会员'
		"
		:fill="purpose === 'appointment'"
	>
		<view v-if="purpose === 'deduct'" class="qm-steps"
			><text class="is-active">1 选择会员</text><text>2 填写扣次</text
			><text>3 核对</text></view
		>
		<view class="qm-search"
			><image src="/static/business/v53/search.svg" mode="aspectFit" /><input
				v-model.trim="keyword"
				placeholder="搜索姓名 / 手机号 / 微信昵称"
				confirm-type="search"
			/><button v-if="keyword" aria-label="清空搜索" @tap="keyword = ''">×</button></view
		>
		<template v-if="purpose === 'appointment'">
			<view class="selector-directory-heading" role="status" aria-live="polite">
				<text>{{ loading ? '正在加载会员…' : '全部会员 · ' + available.length + ' 位' }}</text>
				<text>姓名 A–Z</text>
			</view>
			<view class="selector-results">
				<scroll-view
					class="selector-scroll"
					scroll-y
					enhanced
					:show-scrollbar="false"
					:scroll-top="scrollTop"
					:scroll-into-view="scrollTarget"
					:aria-busy="loading"
					@scroll="onListScroll"
				>
					<view v-if="loading" aria-hidden="true">
						<view v-for="n in 4" :key="n" class="qm-skeleton selector-skeleton" />
					</view>
					<view v-else-if="error" class="qm-empty" role="alert">
						<text>会员加载失败</text><text>{{ error }}</text>
						<qm-button @click="load">重新加载</qm-button>
					</view>
					<template v-else-if="available.length">
						<view class="selector-directory">
							<template v-for="(member, index) in available" :key="member.id">
								<view
									v-if="!index || memberInitial(available[index - 1]) !== memberInitial(member)"
									:id="groupAnchor(memberInitial(member))"
									:data-initial="memberInitial(member)"
									class="selector-group"
								>{{ memberInitial(member) }}</view>
								<button class="selector-directory-member qm-panel" @tap="select(member)">
									<view class="qm-identity">
										<view class="qm-avatar">{{ displayName(member).slice(0, 1) }}</view>
										<view class="selector-copy">
											<text class="qm-identity__name">{{ displayName(member) }}</text>
											<text class="qm-identity__meta">{{ phone(member.phone) }}</text>
										</view>
										<image class="qm-chevron" src="/static/business/v53/chevron.svg" />
									</view>
								</button>
							</template>
						</view>
						<text class="selector-end">已显示全部结果</text>
						<view :style="{ height: scrollPadding + 'px' }" aria-hidden="true" />
					</template>
					<view v-else class="qm-empty">
						<text>{{ keyword ? '没有匹配的会员' : '还没有会员' }}</text>
						<text>{{ keyword ? '试试其他姓名、手机号或微信昵称' : '先建立会员档案，再选择预约会员。' }}</text>
						<qm-button v-if="!keyword" @click="create">新增会员</qm-button>
					</view>
				</scroll-view>
				<view v-if="!loading && !error && available.length" class="selector-index">
					<qm-alphabet-index :model-value="initial" :counts="initialCounts" @change="setInitial" />
				</view>
			</view>
		</template>
		<template v-else>
			<view v-if="loading"
				><view v-for="n in 3" :key="n" class="qm-skeleton selector-skeleton"
			/></view>
			<view v-else-if="error" class="qm-empty"
				><text>会员加载失败</text><text>{{ error }}</text
				><qm-button @click="load">重新加载</qm-button></view
			>
			<template v-else>
				<view class="selector-heading"
					><text>{{ purpose !== "deduct" ? "全部会员" : "可扣次会员" }}</text
					><text>{{ available.length }} 位</text></view
				>
				<view v-if="available.length" class="selector-list"
					><button
						v-for="member in available.slice(0, visibleCount)"
						:key="member.id"
						class="selector-member"
						@tap="select(member)"
					>
						<view class="qm-identity"
							><view class="qm-avatar">{{ displayName(member).slice(0, 1) }}</view
							><view class="selector-copy"
								><text class="qm-identity__name">{{ displayName(member) }}</text
								><text class="qm-identity__meta">{{
									member.phone || "未填写手机号"
								}}</text></view
							><image class="qm-chevron" src="/static/business/v53/chevron.svg" /></view
						><text
							v-if="purpose === 'deduct'"
							class="selector-caption"
							:class="{ 'is-warning': memberStatus(member) === '低余次' }"
							>{{ member.validCardCount }} 张可用次卡 ·
							{{ memberCardCaption(member) }}</text
						>
					</button></view
				>
				<view v-else class="qm-empty"
					><text>{{
						keyword
							? "没有匹配的会员"
							: purpose !== "deduct"
								? "还没有会员"
								: "暂无可扣次会员"
					}}</text
					><text>{{
						keyword
							? "试试其他姓名、手机号或微信昵称"
							: purpose === "deduct"
								? "先建立会员档案并为会员开通次卡。"
								: purpose === "appointment"
									? "先建立会员档案，再选择预约会员。"
									: "先建立会员档案，再为会员开卡。"
					}}</text
					><qm-button v-if="!keyword" @click="create">新增会员</qm-button></view
				>
				<button
					v-if="available.length > visibleCount"
					class="qm-inline"
					@tap="visibleCount += 30"
				>
					显示更多会员
				</button>
				<template v-if="unavailable.length"
					><text class="selector-unavailable-label">暂不可扣次</text
					><view class="selector-list is-unavailable"
						><view
							v-for="member in unavailable.slice(0, visibleCount)"
							:key="member.id"
							class="selector-member"
							><view class="qm-identity"
								><view class="qm-avatar">{{ displayName(member).slice(0, 1) }}</view
								><view class="selector-copy"
									><text class="qm-identity__name">{{ displayName(member) }}</text
									><text class="qm-identity__meta">{{
										member.phone || "未填写手机号"
									}}</text></view
								><text class="selector-reason">{{ memberStatus(member) }}</text></view
							></view
						></view
					></template
				>
				<text v-if="purpose === 'deduct'" class="qm-hint selector-hint"
					>仅可选择有有效次卡且余次大于 0 的会员。</text
				>
			</template>
		</template>
		<qm-member-business-sheet ref="businessSheet" @saved="load" />
	</qm-page>
</template>
<script setup lang="ts">
import { ref, computed, watch, nextTick, getCurrentInstance } from "vue";
import { onLoad, onShow, onUnload } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import MemberService from "../../service/member/info";
import CardService from "../../service/member/card-account";
import {
	collectMemberPages,
	hydrateMemberCards,
	memberCardCaption,
	memberStatus,
	memberInitial,
	sortMembersByName,
	type DirectoryMember,
} from "./utils/member-directory";
import QmMemberBusinessSheet from "./components/qm-member-business-sheet.vue";
const businessSheet = ref<InstanceType<typeof QmMemberBusinessSheet>>();
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
import QmAlphabetIndex from "./components/qm-alphabet-index.vue";
import { initialAtScrollTop, type MemberGroupOffset } from "./utils/member-scroll-index";
const { router } = useCool();
const instance = getCurrentInstance();
const service = new MemberService(),
	cards = new CardService();
const purpose = ref("deduct"),
	keyword = ref(""),
	loading = ref(false),
	error = ref(""),
	rows = ref<DirectoryMember[]>([]),
	visibleCount = ref(30);
const initial = ref(""),
	scrollTop = ref(0),
	scrollTarget = ref(""),
	scrollPadding = ref(0);
let jumpSequence = 0;
let layoutSequence = 0;
let groupOffsets: MemberGroupOffset[] = [];
let initialized = false;
let selectionToken = "";
const matching = computed(() =>
	rows.value.filter(
		(member) =>
			!keyword.value ||
			[member.name, member.nickName, member.phone, member.wechatNo].some((value) =>
				value?.toLowerCase().includes(keyword.value.toLowerCase()),
			),
	),
);
const available = computed(() =>
	purpose.value !== "deduct"
		? matching.value
		: matching.value.filter((member) => Number(member.validCardCount) > 0),
);
const unavailable = computed(() =>
	purpose.value !== "deduct" ? [] : matching.value.filter((member) => !member.validCardCount),
);
const initialCounts = computed(() => {
	const counts: Record<string, number> = {};
	for (const member of available.value) {
		const letter = memberInitial(member);
		counts[letter] = (counts[letter] || 0) + 1;
	}
	return counts;
});
function groupAnchor(letter: string) {
	return "selector-group-" + (letter === "#" ? "other" : letter);
}
function onListScroll(event: { detail: { scrollTop: number } }) {
	scrollTop.value = event.detail.scrollTop;
	if (groupOffsets.length) initial.value = initialAtScrollTop(groupOffsets, scrollTop.value);
}
async function setInitial(letter: string) {
	if (loading.value || !initialCounts.value[letter]) return;
	const seq = ++jumpSequence;
	initial.value = letter;
	scrollTarget.value = "";
	await nextTick();
	if (seq === jumpSequence) scrollTarget.value = groupAnchor(letter);
}
function resetDirectory() {
	jumpSequence++;
	const seq = ++layoutSequence;
	groupOffsets = [];
	initial.value = "";
	scrollTarget.value = "";
	scrollTop.value = 0;
	scrollPadding.value = 0;
	if (purpose.value !== "appointment" || loading.value || error.value || !available.value.length) return;
	const query = uni.createSelectorQuery().in(instance?.proxy);
	query.select(".selector-scroll").boundingClientRect();
	query.select(".selector-directory").boundingClientRect();
	query.selectAll(".selector-group").boundingClientRect();
	query.select(".selector-end").boundingClientRect();
	query.exec((result) => {
		if (seq !== layoutSequence) return;
		const [viewport, content, groups, end] = result;
		const last = groups?.[groups.length - 1];
		if (!viewport || !content || !last) return;
		groupOffsets = groups.map((group: any) => ({
			initial: group.dataset.initial,
			top: group.top - content.top,
		}));
		initial.value = initialAtScrollTop(groupOffsets, scrollTop.value);
		scrollPadding.value = Math.max(
			0,
			Math.ceil(viewport.height - (content.bottom - last.top) - (end?.height || 0)),
		);
	});
}
function phone(value?: string) {
	return value ? value.replace(/^(\d{3})(\d{4})(\d{4})$/, "$1 $2 $3") : "未填写手机号";
}
function displayName(member: DirectoryMember) {
	return member.name || member.nickName || "未命名会员";
}
async function load() {
	if (loading.value) return;
	loading.value = true;
	error.value = "";
	try {
		const members = await collectMemberPages((params) => service.page(params), {
			order: "lastConsumeTime",
			sort: "desc",
		});
		rows.value = purpose.value === "appointment"
			? sortMembersByName(members)
			: purpose.value === "deduct"
				? await hydrateMemberCards(members, (id) => cards.list({ memberId: id }) as any)
				: members;
	} catch (e: any) {
		error.value = e?.message || "会员加载失败，请重试";
	} finally {
		loading.value = false;
		initialized = true;
	}
}
function select(member: DirectoryMember) {
	if (purpose.value === "appointment") {
		if (!selectionToken) return;
		uni.$emit("chime:appointment-member:" + selectionToken, {
			id: member.id,
			name: member.name,
			nickName: member.nickName,
			phone: member.phone,
		});
		router.back();
		return;
	}
	if (purpose.value === "openCard") return businessSheet.value?.openCard(member);
	if (purpose.value !== "openCard" && !member.validCardCount) return;
	router.push({
		path: "/pages/index/member-action",
		query: { memberId: member.id, mode: purpose.value === "openCard" ? "openCard" : undefined },
	});
}
function create() {
	businessSheet.value?.openCreate();
}
watch(keyword, () => (visibleCount.value = 30));
watch([available, loading, error], resetDirectory, { flush: "post" });
onLoad((query) => {
	purpose.value =
		query?.purpose === "appointment"
			? "appointment"
			: query?.purpose === "openCard"
				? "openCard"
				: "deduct";
	selectionToken = query?.selectionToken || "";
	load();
});
onShow(() => {
	if (initialized) load();
});
onUnload(() => {
	jumpSequence++;
	layoutSequence++;
});
</script>
<style scoped lang="scss">
.qm-search > image {
	width: 34rpx;
	height: 34rpx;
}
.qm-search {
	flex-shrink: 0;
}
.selector-directory-heading {
	display: flex;
	flex-shrink: 0;
	justify-content: space-between;
	margin: 24rpx 0 18rpx;
	color: var(--qm-muted);
	font-size: 23rpx;
}
.selector-results {
	position: relative;
	flex: 1;
	height: 0;
	min-height: 0;
}
.selector-scroll {
	width: 100%;
	height: 100%;
	overscroll-behavior-y: contain;
}
/* #ifdef H5 */
.selector-scroll :deep(.uni-scroll-view) {
	scrollbar-width: none;
}
.selector-scroll :deep(.uni-scroll-view::-webkit-scrollbar) {
	display: none;
	width: 0;
	height: 0;
}
/* #endif */
.selector-index {
	position: absolute;
	top: 8rpx;
	right: -28rpx;
	bottom: 8rpx;
	z-index: 3;
	width: 52rpx;
	pointer-events: none;
}
.selector-group {
	padding: 12rpx 4rpx 16rpx;
	font-size: 24rpx;
	font-weight: 600;
	color: var(--qm-muted);
}
.selector-directory-member {
	display: block;
	width: 100%;
	padding: 24rpx 26rpx !important;
	margin-bottom: 16rpx !important;
	text-align: left;
}
.selector-end {
	display: block;
	padding: 20rpx 0;
	text-align: center;
	font-size: 21rpx;
	color: var(--qm-muted);
}
.selector-heading {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 36rpx 0 20rpx;
	font-size: 29rpx;
	font-weight: 500;
	> text + text {
		color: var(--qm-muted);
		font-size: 23rpx;
		font-weight: 400;
	}
}
.selector-list {
	padding: 0 26rpx;
	background: var(--qm-surface);
	border-radius: 38rpx;
}
.selector-member {
	display: block;
	width: 100%;
	text-align: left;
	padding: 24rpx 0 !important;
	border-bottom: 1px solid var(--qm-line);
	&:last-child {
		border-bottom: 0;
	}
}
.selector-copy {
	flex: 1;
	min-width: 0;
}
.selector-caption {
	display: block;
	color: var(--qm-muted);
	font-size: 23rpx;
	margin-top: 16rpx;
}
.selector-caption.is-warning {
	color: var(--qm-warning);
}
.selector-unavailable-label {
	display: block;
	margin: 48rpx 0 20rpx;
	font-size: 26rpx;
	color: var(--qm-muted);
}
.is-unavailable .qm-avatar {
	background: var(--qm-paper);
	color: var(--qm-muted);
}
.selector-reason {
	font-size: 21rpx;
	color: var(--qm-muted);
}
.selector-hint {
	font-size: 22rpx;
	margin-top: 28rpx;
	line-height: 1.8;
}
.selector-skeleton {
	margin-top: 30rpx;
}
</style>
