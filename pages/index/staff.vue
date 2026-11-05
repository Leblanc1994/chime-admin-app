<template>
	<qm-page title="员工管理" :footer-visible="!showEmptyAdd"
		><text class="staff-store-label">千绵美学 · 本店员工</text>
		<view class="qm-search"
			><image
				class="staff-search-icon"
				src="/static/business/v53/search.svg"
				mode="aspectFit"
			/><input
				v-model.trim="keyword"
				placeholder="搜索姓名、账号或手机号"
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
		<qm-tabs v-model="status" :options="statuses" label="员工状态" @change="reload" />
		<view class="staff-summary"
			><text>门店团队</text><text v-if="loaded">{{ total }} 名员工</text></view
		>
		<view v-if="loading && !loaded"><view v-for="n in 3" :key="n" class="qm-skeleton" /></view>
		<view v-if="error" class="qm-error" role="alert"
			>{{ error }}<button class="qm-inline" @tap="reload">重新加载</button></view
		>
		<view v-if="rows.length" class="staff-list"
			><button v-for="row in rows" :key="row.id" class="qm-row" @tap="edit(row)">
				<view class="qm-avatar">{{ (row.name || row.username).slice(0, 1) }}</view
				><view class="qm-row__copy"
					><text>{{ row.name || row.username }}</text
					><text>{{ row.username }} · {{ row.phone || "未填写手机号" }}</text></view
				><text class="qm-tag" :class="{ 'is-success': row.status === 1 }">{{
					row.status === 1 ? "在职" : "已停用"
				}}</text
				><image src="/static/business/v53/chevron.svg" class="qm-chevron" /></button
		></view>
		<view v-else-if="loaded && !error" class="qm-empty"
			><text>{{ keyword || status !== -1 ? "没有匹配的员工" : "还没有员工账号" }}</text
			><text>{{
				keyword || status !== -1
					? "更换关键词或筛选条件后再试"
					: "添加店员，一起处理门店日常事务"
			}}</text
			><qm-button v-if="showEmptyAdd" @click="edit()">新增员工</qm-button></view
		>
		<button v-if="rows.length && !finished" class="qm-inline" :disabled="loading" @tap="more">
			{{ loading ? "正在加载…" : "加载更多" }}
		</button>
		<template #footer>
			<qm-button @click="edit()">＋ 新增员工</qm-button>
		</template>
		<view class="qm-signoff"
			><image src="/static/business/chime-mark.png" mode="aspectFit" /><text
				>仅管理当前门店员工</text
			></view
		>
	</qm-page>
</template>
<script setup lang="ts">
import { computed, ref, onUnmounted } from "vue";
import { onShow, onReachBottom, onPullDownRefresh } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import Service, { type StoreStaff } from "../../service/store/staff";
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
import QmTabs from "./components/qm-tabs.vue";
const { router } = useCool(),
	service = new Service();
const keyword = ref(""),
	status = ref(-1),
	page = ref(1),
	total = ref(0),
	rows = ref<StoreStaff[]>([]),
	loading = ref(false),
	loaded = ref(false),
	finished = ref(false),
	error = ref("");
let dirty = true,
	generation = 0;
const statuses = [
	{ label: "全部", value: -1 },
	{ label: "在职", value: 1 },
	{ label: "已停用", value: 0 },
];
const showEmptyAdd = computed(
	() => loaded.value && !error.value && !rows.value.length && !keyword.value && status.value === -1,
);
async function fetch(append = false) {
	const seq = ++generation;
	loading.value = true;
	error.value = "";
	try {
		const result = await service.page({
			page: page.value,
			size: 15,
			keyword: keyword.value || undefined,
			status: status.value === -1 ? undefined : status.value,
		});
		if (seq !== generation) return;
		total.value = result.total || 0;
		rows.value = append ? [...rows.value, ...result.list] : result.list;
		finished.value = rows.value.length >= total.value || result.list.length < 15;
		loaded.value = true;
		dirty = false;
	} catch (e: any) {
		if (seq !== generation) return;
		error.value = e?.message || "员工列表加载失败";
		if (append) page.value--;
	} finally {
		if (seq === generation) loading.value = false;
	}
}
function reload() {
	page.value = 1;
	finished.value = false;
	return fetch();
}
function more() {
	if (loading.value || finished.value) return;
	page.value++;
	fetch(true);
}
function edit(row?: StoreStaff) {
	router.push({
		path: "/pages/index/staff-form",
		query: { id: row?.id },
		params: { staff: row },
	});
}
function markDirty() {
	dirty = true;
}
uni.$on("chime:staff-changed", markDirty);
onUnmounted(() => uni.$off("chime:staff-changed", markDirty));
onShow(() => {
	if (dirty) reload();
});
onReachBottom(more);
onPullDownRefresh(async () => {
	await reload();
	uni.stopPullDownRefresh();
});
</script>
<style scoped>
.staff-add {
	color: #6741b1;
	min-height: 80rpx;
	min-width: 80rpx;
}
.staff-summary {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 38rpx 0 20rpx;
	font-size: 29rpx;
}
.staff-summary text + text {
	font-size: 24rpx;
	color: #615e6a;
}
.staff-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}
.staff-list .qm-row {
	padding: 26rpx;
	background: var(--qm-surface);
	border: 0;
	border-radius: 30rpx;
}
.staff-search-icon {
	width: 34rpx;
	height: 34rpx;
}
.staff-store-label {
	display: block;
	color: var(--qm-muted);
	font-size: 23rpx;
	margin-bottom: 24rpx;
}
</style>
