<template>
	<qm-sheet
		v-model="visible"
		:title="title"
		:busy="saving"
		:focus-target="focusTarget"
		form
		@closed="emit('closed')"
	>
		<template v-if="success">
			<view class="business-success">
				<text class="qm-success__mark">✓</text>
				<text class="business-success__title">{{
					kind === "create" ? "会员档案已建立" : "开卡成功"
				}}</text>
				<text class="qm-muted">{{
					kind === "create" ? "可以继续为这位会员开通次卡" : "次卡已添加至当前会员档案"
				}}</text>
			</view>
			<qm-member-summary :name="memberName" :phone="member?.phone" />
			<view v-if="kind === 'card'" class="business-result">
				<text>{{ card.cardName }}</text
				><text>{{ card.totalTimes }} 次</text>
				<text class="qm-muted">{{
					card.expireTime ? card.expireTime + " 到期" : "长期有效"
				}}</text>
			</view>
		</template>
		<template v-else>
			<view v-if="kind === 'card'" class="business-member">
				<text class="business-eyebrow">开卡会员</text>
				<qm-member-summary :name="memberName" :phone="member?.phone" />
			</view>
			<qm-member-fields
				v-if="kind === 'create'"
				:form="form"
				sheet
				@focus-field="focusTarget = $event"
			/>
			<view v-else class="business-card-fields">
				<view class="qm-field" id="card-field-name"
					><text class="qm-label">次卡名称<text class="qm-required">*</text></text>
					<cl-input
						v-model="card.cardName"
						@focus="focusTarget = 'card-field-name'"
						placeholder="例如：水光焕肤次卡"
						:maxlength="50"
						:adjust-position="false"
				/></view>
				<view class="qm-field" id="card-field-times"
					><text class="qm-label">总次数<text class="qm-required">*</text></text>
					<cl-input
						v-model="card.totalTimes"
						@focus="focusTarget = 'card-field-times'"
						type="number"
						placeholder="请输入正整数"
						:adjust-position="false"
				/></view>
				<view class="qm-field"
					><text class="qm-label">有效期至</text>
					<cl-select-date
						v-model="card.expireTime"
						:mode="dateMode"
						format="YYYY-MM-DD HH:mm"
						placeholder="选填，留空表示长期有效"
					/>
					<button v-if="card.expireTime" class="qm-inline" @tap="card.expireTime = ''">
						改为长期有效
					</button></view
				>
				<view class="qm-field"
					><text class="qm-label" id="card-field-remark">开卡备注</text>
					<cl-textarea
						v-model="card.remark"
						@focus="focusTarget = 'card-field-remark'"
						placeholder="记录约定或补充说明"
						:maxlength="500"
						count
						fixed
						:adjust-position="false"
				/></view>
			</view>
		</template>
		<template #footer>
			<view v-if="error" class="qm-error" role="alert">{{ error }}</view>
			<view v-if="success && kind === 'create'" class="qm-pair">
				<qm-button variant="secondary" @click="visible = false">完成</qm-button>
				<qm-button @click="continueCard">继续开卡</qm-button>
			</view>
			<qm-button v-else-if="success" @click="visible = false">完成</qm-button>
			<qm-button v-else :loading="saving" @click="save">{{
				kind === "create" ? "建立会员档案" : "确认开卡"
			}}</qm-button>
		</template>
	</qm-sheet>
</template>
<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import dayjs from "dayjs";
import { useCool } from "/@/cool";
import MemberService from "../../../service/member/info";
import CardService from "../../../service/member/card-account";
import { positiveTimes } from "../utils/card-policy";
import {
	newMemberForm,
	memberFormError,
	memberPayload,
	createdMemberId,
} from "../utils/member-form";
import QmSheet from "./qm-sheet.vue";
import QmButton from "./qm-button.vue";
import QmMemberFields from "./qm-member-fields.vue";
import QmMemberSummary from "./qm-member-summary.vue";
const emit = defineEmits<{
	(e: "saved", kind: "create" | "card", memberId: number): void;
	(e: "closed"): void;
}>();
const { router } = useCool();
const members = new MemberService(),
	cards = new CardService();
const visible = ref(false),
	kind = ref<"create" | "card">("create"),
	saving = ref(false),
	success = ref(false),
	error = ref("");
const member = ref<any>(null);
const focusTarget = ref("");
const form = reactive(newMemberForm());
const blankCard = () => ({ cardName: "", totalTimes: "10", expireTime: "", remark: "" });
const card = reactive(blankCard());
const dateMode = ["year", "month", "date", "hour", "minute"];
const title = computed(() => (kind.value === "create" ? "新增会员" : "为会员开卡"));
const memberName = computed(() => member.value?.name || member.value?.nickName || "未命名会员");
function reset() {
	if (saving.value) return false;
	error.value = "";
	focusTarget.value = "";
	success.value = false;
	return true;
}
function openCreate() {
	if (!reset()) return;
	kind.value = "create";
	member.value = null;
	Object.assign(form, newMemberForm());
	visible.value = true;
}
function openCard(target: { id: number; name?: string; nickName?: string; phone?: string }) {
	if (!target?.id || !reset()) return;
	kind.value = "card";
	member.value = { ...target };
	Object.assign(card, blankCard());
	visible.value = true;
}
function continueCard() {
	if (member.value?.id) openCard(member.value);
	else {
		visible.value = false;
		router.push({ path: "/pages/index/member-select", query: { purpose: "openCard" } });
	}
}
async function save() {
	if (saving.value || success.value) return;
	error.value = "";
	if (kind.value === "create") error.value = memberFormError(form);
	else if (!member.value?.id) error.value = "请先选择会员";
	else if (!card.cardName.trim()) error.value = "请填写次卡名称";
	else if (!positiveTimes(card.totalTimes)) error.value = "总次数需要为大于 0 的整数";
	else if (
		card.expireTime &&
		(!dayjs(card.expireTime).isValid() || dayjs(card.expireTime).valueOf() <= Date.now())
	)
		error.value = "有效期需要晚于当前时间";
	if (error.value) return;
	uni.hideKeyboard();
	saving.value = true;
	try {
		if (kind.value === "create") {
			const payload = memberPayload(form);
			const result = await members.add(payload);
			member.value = { ...payload, id: createdMemberId(result) };
			success.value = true;
			uni.$emit("chime:members-changed");
		} else {
			await cards.add({
				memberId: member.value.id,
				cardName: card.cardName.trim(),
				totalTimes: Number(card.totalTimes),
				expireTime: card.expireTime
					? dayjs(card.expireTime).format("YYYY-MM-DD HH:mm:ss")
					: null,
				remark: card.remark.trim(),
			});
			success.value = true;
			uni.$emit("chime:member-changed", member.value.id);
		}
		emit("saved", kind.value, member.value.id);
	} catch (e: any) {
		error.value = e?.message || "保存失败，请重试";
	} finally {
		saving.value = false;
	}
}
defineExpose({ openCreate, openCard });
</script>
<style scoped lang="scss">
.business-eyebrow {
	display: block;
	color: var(--qm-muted);
	font-size: 23rpx;
	margin: 0 0 14rpx;
}
.business-member {
	margin-bottom: 24rpx;
}
.business-card-fields {
	background: var(--qm-surface);
	padding: 26rpx;
	border-radius: 30rpx;
	margin-bottom: 14rpx;
}
.business-card-fields .qm-field:last-child {
	margin-bottom: 0;
}
.business-success {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14rpx;
	padding: 24rpx 0 40rpx;
	text-align: center;
}
.business-success__title {
	font-size: 36rpx;
	font-weight: 550;
}
.business-result {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
	padding: 32rpx 0;
	font-size: 29rpx;
}
.business-result > text:nth-child(2) {
	color: var(--qm-brand);
	font-size: 48rpx;
	font-weight: 600;
}
</style>
