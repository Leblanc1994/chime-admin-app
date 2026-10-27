<template>
	<qm-page title="会员卡维护">
		<view class="catalog-toolbar">
			<view class="qm-search"
				><image src="/static/business/v53/search.svg" mode="aspectFit" /><input
					v-model="keyword"
					placeholder="搜索卡项名称"
					confirm-type="search"
					:maxlength="50"
					@confirm="reload"
				/><button v-if="keyword" aria-label="清空搜索" @tap="keyword = ''">×</button></view
			>
			<button
				class="catalog-add"
				role="button"
				tabindex="0"
				@keydown.enter.prevent="editor?.open()"
				@keydown.space.prevent="editor?.open()"
				@tap="editor?.open()"
			>
				+ 新增
			</button>
		</view>
		<qm-tabs v-model="status" :options="states" label="卡项状态筛选" />
		<text v-if="loaded" class="catalog-count"
			>{{ keyword || status !== -1 ? "找到" : "已新增" }} {{ total }} 个卡项</text
		>
		<view v-if="loading && !loaded"><view v-for="n in 3" :key="n" class="qm-skeleton" /></view>
		<view v-if="error" class="qm-error" role="alert"
			>{{ error }}<button class="qm-inline" @tap="reload">重新加载</button></view
		>
		<view class="catalog-list">
			<button
				v-for="row in rows"
				:key="row.id"
				class="catalog-card"
				role="button"
				tabindex="0"
				@keydown.enter.prevent="editor?.open(row)"
				@keydown.space.prevent="editor?.open(row)"
				:style="cardColorStyle(row.color)"
				:aria-label="'编辑' + row.name"
				@tap="editor?.open(row)"
			>
				<view class="catalog-card__heading"
					><text>{{ row.name }}</text
					><text class="catalog-badge">{{
						row.status === 1 ? "启用" : "停用"
					}}</text></view
				>
				<view class="catalog-card__numbers"
					><text>{{ row.totalTimes }} 次 / 张</text
					><text>¥ {{ cardPrice(row.price) }}</text></view
				>
				<view class="catalog-card__bottom"
					><text>{{ row.remark || "暂无备注" }}</text
					><text>编辑</text></view
				>
			</button>
		</view>
		<view v-if="loaded && !rows.length && !error" class="qm-empty"
			><text>{{ keyword || status !== -1 ? "没有匹配的卡项" : "还没有会员卡项" }}</text
			><text>{{
				keyword || status !== -1
					? "试试其他名称或筛选条件"
					: "添加卡项，为会员开卡时直接选择"
			}}</text
			><qm-button v-if="!keyword && status === -1" @click="editor?.open()"
				>新增会员卡</qm-button
			></view
		>
		<button v-if="rows.length && !finished" class="qm-inline" :disabled="loading" @tap="more">
			{{ loading ? "正在加载…" : "加载更多" }}
		</button>
		<qm-card-template-sheet ref="editor" @saved="reload" />
	</qm-page>
</template>
<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import { onShow, onReachBottom, onPullDownRefresh } from "@dcloudio/uni-app";
import Service from "../../service/member/card-template";
import { cardColorStyle, cardPrice, type CardTemplate } from "./utils/card-template";
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
import QmTabs from "./components/qm-tabs.vue";
import QmCardTemplateSheet from "./components/qm-card-template-sheet.vue";
const service = new Service();
const editor = ref<InstanceType<typeof QmCardTemplateSheet>>();
const keyword = ref(""),
	status = ref(-1),
	page = ref(1),
	total = ref(0),
	rows = ref<CardTemplate[]>([]),
	loading = ref(false),
	loaded = ref(false),
	error = ref(""),
	finished = ref(false);
const states = [
	{ label: "全部", value: -1 },
	{ label: "启用", value: 1 },
	{ label: "停用", value: 0 },
];
let generation = 0,
	timer: ReturnType<typeof setTimeout> | undefined;
async function fetch(append = false) {
	const seq = ++generation;
	loading.value = true;
	error.value = "";
	try {
		const result = await service.page({
			page: page.value,
			size: 15,
			keyWord: keyword.value.trim() || undefined,
			status: status.value === -1 ? undefined : status.value,
		});
		if (seq !== generation) return;
		const list = result.list || [];
		total.value = Number(result.pagination?.total || 0);
		rows.value = append ? [...rows.value, ...list] : list;
		finished.value = rows.value.length >= total.value || list.length < 15;
		loaded.value = true;
	} catch (e: any) {
		if (seq !== generation) return;
		error.value = e?.message || "卡项列表加载失败，请重试";
		if (append) page.value--;
	} finally {
		if (seq === generation) loading.value = false;
	}
}
function reload() {
	clearTimeout(timer);
	page.value = 1;
	finished.value = false;
	return fetch();
}
function more() {
	if (loading.value || finished.value) return;
	page.value++;
	fetch(true);
}
watch(keyword, () => {
	clearTimeout(timer);
	timer = setTimeout(reload, 300);
});
watch(status, reload);
onShow(reload);
onReachBottom(more);
onPullDownRefresh(async () => {
	await reload();
	uni.stopPullDownRefresh();
});
onUnmounted(() => {
	clearTimeout(timer);
	generation++;
});
</script>
<style scoped lang="scss">
.catalog-toolbar {
	display: flex;
	gap: 20rpx;
	align-items: center;
	.qm-search {
		flex: 1;
		min-width: 0;
		margin: 0;
		height: 88rpx;
		box-sizing: border-box;
		image {
			width: 38rpx;
			height: 38rpx;
			flex-shrink: 0;
		}
		input {
			width: 0;
			flex: 1;
			min-width: 0;
			font-size: 25rpx;
		}
	}
}
.catalog-add {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 158rpx;
	height: 88rpx;
	flex-shrink: 0;
	border-radius: 24rpx !important;
	background: var(--qm-brand) !important;
	color: var(--qm-on-brand) !important;
	font-size: 28rpx !important;
}
.catalog-count {
	display: block;
	font-size: 23rpx;
	color: var(--qm-muted);
	margin: 30rpx 0;
}
.catalog-list {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}
.catalog-card {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	padding: 30rpx !important;
	width: 100%;
	text-align: left;
	box-sizing: border-box;
	border-radius: 38rpx !important;
	background: var(--card-surface) !important;
	color: var(--qm-ink) !important;
}
.catalog-card__heading {
	display: flex;
	align-items: center;
	gap: 18rpx;
	width: 100%;
	> text:first-child {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
		font-size: 30rpx;
		font-weight: 550;
		line-height: 1.5;
	}
}
.catalog-badge {
	padding: 8rpx 16rpx;
	border-radius: 99rpx;
	background: var(--qm-surface);
	color: var(--qm-muted);
	font-size: 21rpx;
	flex-shrink: 0;
}
.catalog-card__numbers {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 12rpx;
	width: 100%;
	> text:first-child {
		font-size: 27rpx;
		color: var(--qm-muted);
	}
	> text:last-child {
		font-size: 46rpx;
		font-weight: 550;
		color: var(--card-accent);
		overflow-wrap: anywhere;
	}
}
.catalog-card__bottom {
	display: flex;
	align-items: center;
	gap: 24rpx;
	width: 100%;
	font-size: 23rpx;
	line-height: 1.5;
	> text:first-child {
		flex: 1;
		min-width: 0;
		color: var(--qm-muted);
		overflow-wrap: anywhere;
	}
	> text:last-child {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 62rpx;
		min-width: 84rpx;
		font-size: 25rpx;
		color: var(--qm-brand);
	}
}
</style>
