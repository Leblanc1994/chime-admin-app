<template>
	<qm-page title="次卡管理" :busy="busy">
		<view v-if="loading"><view class="qm-skeleton" /><view class="qm-skeleton" /></view
		><view v-else-if="loadError" class="qm-empty"
			><text>次卡加载失败</text><text>{{ loadError }}</text
			><qm-button @click="load">重新加载</qm-button></view
		>
		<template v-else-if="card">
			<qm-member-summary :name="name" :phone="member?.phone" />
			<qm-card :card="card" />
			<template v-if="card.status !== 4">
				<text v-if="canAdjust(card) || canConsume(card)" class="qm-heading">次数管理</text>
				<view class="qm-menu">
					<button v-if="canConsume(card)" class="qm-row" @tap="deduct">
						<image
							class="card-action-icon"
							src="/static/business/v53/card.svg"
							mode="aspectFit"
						/><view class="qm-row__copy"
							><text>扣次消费</text><text>记录本次服务并扣减余次</text></view
						><image class="qm-chevron" src="/static/business/v53/chevron.svg" />
					</button>
					<button v-if="canAdjust(card)" class="qm-row" @tap="openAdjustment('plus')">
						<image
							class="card-action-icon"
							src="/static/business/v53/doc.svg"
							mode="aspectFit"
						/><view class="qm-row__copy"
							><text>补次</text><text>增加本卡剩余次数</text></view
						><image class="qm-chevron" src="/static/business/v53/chevron.svg" />
					</button>
					<button v-if="canAdjust(card)" class="qm-row" @tap="openAdjustment('set')">
						<image
							class="card-action-icon"
							src="/static/business/v53/sort.svg"
							mode="aspectFit"
						/><view class="qm-row__copy"
							><text>手工调整余次</text><text>将剩余次数设为指定数值</text></view
						><image class="qm-chevron" src="/static/business/v53/chevron.svg" />
					</button>
				</view>
				<text class="qm-heading">次卡状态</text
				><view class="qm-menu">
					<button v-if="card.status === 0" class="qm-row" @tap="openConfirm('enable')">
						<image
							class="card-action-icon"
							src="/static/business/v53/lock.svg"
							mode="aspectFit"
						/><view class="qm-row__copy"
							><text>启用次卡</text><text>恢复后仍需在有效期内且有余次</text></view
						><image class="qm-chevron" src="/static/business/v53/chevron.svg" />
					</button>
					<button v-else-if="!isExpired(card)" class="qm-row" @tap="openConfirm('stop')">
						<image
							class="card-action-icon"
							src="/static/business/v53/lock.svg"
							mode="aspectFit"
						/><view class="qm-row__copy"
							><text>停用次卡</text><text>暂停使用，保留历史记录</text></view
						><image class="qm-chevron" src="/static/business/v53/chevron.svg" />
					</button>
					<button class="qm-row" @tap="openConfirm('discard')">
						<image
							class="card-action-icon"
							src="/static/business/v53/shield.svg"
							mode="aspectFit"
						/><view class="qm-row__copy"
							><text class="card-danger">作废次卡</text
							><text>作废后无法恢复</text></view
						><image class="qm-chevron" src="/static/business/v53/chevron.svg" />
					</button>
				</view>
			</template>
			<view v-if="card.status === 4 || isExpired(card)" class="qm-notice">{{
				card.status === 4
					? "本卡已作废，历史记录保留，无法继续使用或恢复。"
					: "本卡已过期，当前不能扣次、补次或调整余次。"
			}}</view>
			<button
				class="qm-inline"
				:aria-expanded="detailsVisible"
				@tap="detailsVisible = !detailsVisible"
			>
				{{ detailsVisible ? "收起次卡资料" : "查看次卡资料" }}
			</button>
			<view v-if="detailsVisible" class="qm-panel"
				><view class="qm-kv"
					><text>卡号</text><text>{{ card.id }}</text></view
				><view class="qm-kv"
					><text>开卡时间</text
					><text>{{ card.createTime?.slice(0, 16) || "未记录" }}</text></view
				><view class="qm-kv"
					><text>开卡备注</text><text>{{ card.remark || "未填写" }}</text></view
				></view
			>
		</template>
		<qm-sheet
			v-model="adjustVisible"
			:title="adjustMode === 'plus' ? '补次' : '调整余次'"
			:busy="busy"
			><text class="qm-intro">{{ name }} · {{ card?.cardName }}</text
			><view class="qm-field"
				><text class="qm-label"
					>{{ adjustMode === "plus" ? "增加次数" : "调整后剩余次数"
					}}<text class="qm-required">*</text></text
				><cl-input
					v-model="times"
					type="number"
					:placeholder="
						adjustMode === 'plus' ? '请输入正整数' : '请输入 0 或正整数'
					" /></view
			><view class="qm-balance"
				><text>当前 {{ card?.remainTimes }} 次</text
				><text>→ {{ preview === null ? "—" : preview }} 次</text></view
			><view class="qm-field card-reason"
				><text class="qm-label"
					>{{ adjustMode === "plus" ? "补次说明" : "调整说明" }}（选填）</text
				><cl-textarea
					v-model="reason"
					placeholder="记录原因，便于后续核对"
					:maxlength="300"
					auto-height /></view
			><view v-if="error" class="qm-error" role="alert">{{ error }}</view
			><template #footer
				><qm-button :loading="busy" @click="saveAdjustment">{{
					adjustMode === "plus" ? "确认补次" : "保存调整"
				}}</qm-button></template
			></qm-sheet
		>
		<qm-confirm
			v-model="confirmVisible"
			:title="actionLabel + '次卡？'"
			:message="impact"
			:danger="action !== 'enable'"
			:confirm-text="'确认' + actionLabel"
			:busy="busy"
			:error="error"
			@confirm="saveStatus"
			><view class="qm-kv"
				><text>会员</text><text>{{ name }}</text></view
			><view class="qm-kv"
				><text>次卡</text><text>{{ card?.cardName }}</text></view
			><view class="qm-kv"
				><text>剩余次数</text><text>{{ card?.remainTimes }} 次</text></view
			></qm-confirm
		>
	</qm-page>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
import CardService from "../../service/member/card-account";
import MemberService from "../../service/member/info";
import {
	canConsume,
	canAdjust,
	isExpired,
	cardStatus,
	positiveTimes,
	nonnegativeTimes,
} from "./utils/card-policy";
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
import QmSheet from "./components/qm-sheet.vue";
import QmConfirm from "./components/qm-confirm.vue";
import QmCard from "./components/qm-card.vue";
import QmMemberSummary from "./components/qm-member-summary.vue";
const { router } = useCool(),
	service = new CardService(),
	members = new MemberService();
const memberId = ref(0),
	cardId = ref(0),
	member = ref<any>(),
	card = ref<any>(),
	loading = ref(false),
	loadError = ref(""),
	busy = ref(false),
	error = ref(""),
	adjustVisible = ref(false),
	adjustMode = ref("plus"),
	times = ref("1"),
	reason = ref(""),
	confirmVisible = ref(false),
	action = ref<"stop" | "enable" | "discard">("stop"),
	detailsVisible = ref(false);
let initialized = false;
const name = computed(() => member.value?.name || member.value?.nickName || "未命名会员"),
	preview = computed(() => {
		const n = Number(times.value);
		if (
			!(adjustMode.value === "plus"
				? positiveTimes(times.value)
				: nonnegativeTimes(times.value))
		)
			return null;
		const result = adjustMode.value === "plus" ? Number(card.value?.remainTimes) + n : n;
		return Number.isSafeInteger(result) ? result : null;
	}),
	actionLabel = computed(() => ({ stop: "停用", enable: "启用", discard: "作废" })[action.value]),
	impact = computed(() =>
		action.value === "discard"
			? "作废后将不能再使用或恢复，请核对会员与次卡。"
			: action.value === "stop"
				? "停用后暂停扣次，剩余次数保留，可在需要时重新启用。"
				: "启用后仍需在有效期内且有剩余次数，才能扣次。",
	);
async function load() {
	if (loading.value) return;
	loading.value = true;
	loadError.value = "";
	try {
		const [m, c]: any = await Promise.all([
			members.info({ id: memberId.value }),
			service.list({ memberId: memberId.value }),
		]);
		if (!m?.id) throw new Error("未找到会员");
		const item = c.find((x) => Number(x.id) === cardId.value);
		if (!item) throw new Error("未找到该会员的次卡");
		member.value = m;
		card.value = item;
	} catch (e: any) {
		loadError.value = e?.message || "加载失败";
	} finally {
		loading.value = false;
		initialized = true;
	}
}
function openAdjustment(mode: string) {
	if (!card.value || !canAdjust(card.value)) return;
	adjustMode.value = mode;
	times.value = mode === "plus" ? "1" : String(card.value.remainTimes);
	reason.value = "";
	error.value = "";
	adjustVisible.value = true;
}
function openConfirm(value: "stop" | "enable" | "discard") {
	action.value = value;
	error.value = "";
	confirmVisible.value = true;
}
function changed() {
	uni.$emit("chime:member-changed", memberId.value);
}
async function saveAdjustment() {
	if (busy.value || !card.value) return;
	error.value = "";
	if (preview.value === null) {
		error.value = "请输入有效的整数次数";
		return;
	}
	if (!canAdjust(card.value)) {
		error.value = "次卡状态已不可调整，请刷新后重试";
		return;
	}
	busy.value = true;
	try {
		if (adjustMode.value === "plus")
			await service.plusTimes({
				id: cardId.value,
				changeTimes: Number(times.value),
				remark: reason.value.trim(),
			});
		else
			await service.setRemainTimes({
				id: cardId.value,
				remainTimes: Number(times.value),
				remark: reason.value.trim(),
			});
		adjustVisible.value = false;
		changed();
		await load();
		uni.showToast({ title: "余次已更新", icon: "success" });
	} catch (e: any) {
		error.value = e?.message || "保存失败，请重试";
	} finally {
		busy.value = false;
	}
}
async function saveStatus() {
	if (busy.value) return;
	busy.value = true;
	error.value = "";
	try {
		await service[action.value]({ id: cardId.value });
		confirmVisible.value = false;
		changed();
		await load();
		uni.showToast({ title: "次卡已" + actionLabel.value, icon: "success" });
	} catch (e: any) {
		error.value = e?.message || "操作失败，请重试";
	} finally {
		busy.value = false;
	}
}
function deduct() {
	router.push({
		path: "/pages/index/member-action",
		query: { memberId: memberId.value, cardId: cardId.value },
	});
}
onLoad((q) => {
	memberId.value = Number(q?.memberId) || 0;
	cardId.value = Number(q?.cardId) || 0;
	load();
});
onShow(() => {
	if (initialized) load();
});
</script>
<style scoped>
.card-action-icon {
	width: 42rpx;
	height: 42rpx;
	flex-shrink: 0;
}
.card-danger {
	color: var(--qm-danger);
}
.card-actions {
	padding-top: 0;
	padding-bottom: 0;
}
.card-reason {
	margin-top: 28rpx;
}
</style>
