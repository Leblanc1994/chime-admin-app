<template>
	<qm-page
		:title="
			purpose === 'appointment'
				? '选择预约会员'
				: purpose === 'openCard'
					? '选择开卡会员'
					: '选择扣次会员'
		"
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
		<qm-member-business-sheet ref="businessSheet" @saved="load" />
	</qm-page>
</template>
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import MemberService from "../../service/member/info";
import CardService from "../../service/member/card-account";
import {
	collectMemberPages,
	hydrateMemberCards,
	memberCardCaption,
	memberStatus,
	type DirectoryMember,
} from "./utils/member-directory";
import QmMemberBusinessSheet from "./components/qm-member-business-sheet.vue";
const businessSheet = ref<InstanceType<typeof QmMemberBusinessSheet>>();
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
const { router } = useCool();
const service = new MemberService(),
	cards = new CardService();
const purpose = ref("deduct"),
	keyword = ref(""),
	loading = ref(false),
	error = ref(""),
	rows = ref<DirectoryMember[]>([]),
	visibleCount = ref(30);
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
		rows.value =
			purpose.value !== "deduct"
				? members
				: await hydrateMemberCards(members, (id) => cards.list({ memberId: id }) as any);
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
</script>
<style scoped lang="scss">
.qm-search > image {
	width: 34rpx;
	height: 34rpx;
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
