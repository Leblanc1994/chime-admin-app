<template>
	<qm-page title="消费详情"
		><view v-if="loading" class="qm-skeleton" /><view v-else-if="loadError" class="qm-empty"
			><text>记录加载失败</text><text>{{ loadError }}</text
			><qm-button @click="load">重新加载</qm-button></view
		>
		<template v-else-if="row">
			<view class="qm-panel detail-summary"
				><text class="detail-customer">{{ name }}</text
				><view class="qm-kv"
					><text>消费类型</text><text>{{ row.consumeType }}</text></view
				><view class="qm-kv"
					><text>{{ row.cardAccountId ? "本次扣减" : "记录状态" }}</text
					><text class="detail-amount">{{
						row.cardAccountId ? "−" + row.consumeTimes + " 次" : "已记录"
					}}</text></view
				><view class="qm-kv"
					><text>消费时间</text
					><text>{{ row.consumeTime?.slice(0, 16) || "未记录" }}</text></view
				></view
			>
			<view class="qm-panel"
				><view class="qm-kv"
					><text>顾客身份</text
					><text>{{ row.customerType === "guest" ? "散客" : "会员" }}</text></view
				><template v-if="row.cardAccountId"
					><view class="qm-kv"
						><text>消费次卡</text><text>{{ row.cardName || "会员次卡" }}</text></view
					><view class="qm-kv"
						><text>扣前余次</text
						><text>{{
							row.remainTimesAfter == null
								? "未记录"
								: Number(row.remainTimesAfter) + Number(row.consumeTimes) + " 次"
						}}</text></view
					><view class="qm-kv"
						><text>扣后余次</text
						><text>{{
							row.remainTimesAfter == null ? "未记录" : row.remainTimesAfter + " 次"
						}}</text></view
					></template
				><view class="qm-kv"
					><text>消费备注</text><text>{{ row.remark || "未填写" }}</text></view
				><view class="qm-kv"
					><text>记录编号</text><text>{{ row.id }}</text></view
				></view
			>
			<view class="qm-menu"
				><button
					v-if="row.customerType !== 'guest' && row.memberId"
					class="qm-row"
					@tap="archive"
				>
					<view class="qm-menu-icon"
						><image src="/static/business/v53/user.svg" mode="aspectFit" /></view
					><view class="qm-row__copy"
						><text>会员档案</text
						><text>{{ name }} · {{ row.memberPhone || "未填写手机号" }}</text></view
					><image class="qm-chevron" src="/static/business/v53/chevron.svg" /></button
				><button
					class="qm-row"
					@tap="
						deleteError = '';
						deleteVisible = true;
					"
				>
					<view class="qm-menu-icon"
						><image src="/static/business/v53/receipt.svg" mode="aspectFit" /></view
					><view class="qm-row__copy"
						><text class="detail-delete">删除消费记录</text
						><text>删除前核对该笔消费</text></view
					><image class="qm-chevron" src="/static/business/v53/chevron.svg" /></button
			></view> </template
		><template #footer
			><qm-button :disabled="!row || loading || !!loadError" @click="edit"
				>编辑消费记录</qm-button
			></template
		><qm-confirm
			v-model="deleteVisible"
			title="删除消费记录？"
			confirm-text="确认删除"
			danger
			:busy="deleting"
			:error="deleteError"
			:message="
				name +
				' · ' +
				(row?.consumeType || '消费记录') +
				' · ' +
				(row?.consumeTime?.slice(0, 16) || '')
			"
			@confirm="remove"
			><view class="qm-notice is-danger">{{
				row?.cardAccountId
					? "删除后将撤销本次扣次，并同步回滚相关统计。"
					: "删除后会同步回滚相关统计，此操作无法撤销。"
			}}</view></qm-confirm
		></qm-page
	>
</template>
<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import Service from "../../service/member/consume-record";
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
import QmConfirm from "./components/qm-confirm.vue";
const { router } = useCool(),
	service = new Service();
const id = ref(0),
	row = ref<any>(),
	loading = ref(false),
	loadError = ref(""),
	deleteVisible = ref(false),
	deleting = ref(false),
	deleteError = ref("");
let dirty = false,
	initialized = false;
const name = computed(
	() => row.value?.memberName || row.value?.memberNickName || row.value?.name || "未命名客户",
);
async function load() {
	loading.value = true;
	loadError.value = "";
	try {
		const data: any = await service.info({ id: id.value });
		if (!data?.id) throw new Error("未找到该消费记录");
		row.value = data;
		dirty = false;
	} catch (e: any) {
		loadError.value = e?.message || "加载失败";
	} finally {
		loading.value = false;
		initialized = true;
	}
}
function edit() {
	if (!row.value) return;
	if (row.value.customerType !== "guest" && !row.value.memberId) {
		loadError.value = "记录缺少会员信息，请从会员档案中编辑";
		return;
	}
	router.push({
		path:
			row.value.customerType === "guest"
				? "/pages/index/consume-form"
				: "/pages/index/member-action",
		query:
			row.value.customerType === "guest"
				? { id: id.value }
				: { memberId: row.value.memberId, recordId: id.value },
		params: { record: row.value },
	});
}
function archive() {
	router.push({ path: "/pages/index/member-detail", query: { id: row.value.memberId } });
}
async function remove() {
	if (deleting.value) return;
	deleting.value = true;
	deleteError.value = "";
	try {
		await service.delete({ ids: [id.value] });
		deleteVisible.value = false;
		uni.$emit("chime:consumes-changed");
		if (row.value.memberId) uni.$emit("chime:member-changed", row.value.memberId);
		router.back();
	} catch (e: any) {
		deleteError.value = e?.message || "删除失败，请重试";
	} finally {
		deleting.value = false;
	}
}
function markDirty() {
	dirty = true;
}
uni.$on("chime:consumes-changed", markDirty);
onUnmounted(() => uni.$off("chime:consumes-changed", markDirty));
onShow(() => {
	if (initialized && dirty) load();
});
onLoad((q) => {
	id.value = Number(q?.id) || 0;
	load();
});
</script>
<style scoped>
.detail-customer {
	display: block;
	font-size: 38rpx;
	font-weight: 700;
	color: var(--qm-deep);
	margin-bottom: 12rpx;
}
.detail-amount {
	color: var(--qm-brand);
	font-weight: 700;
}
.detail-delete {
	color: var(--qm-danger);
}
.detail-summary {
	background: var(--qm-lilac);
}
</style>
