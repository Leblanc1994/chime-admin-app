<template>
	<qm-page :title="title" :busy="saving" :footer-stacked="success">
		<view v-if="loading"><view class="qm-skeleton" /><view class="qm-skeleton" /></view>
		<view v-else-if="loadError" class="qm-empty"
			><text>资料加载失败</text><text>{{ loadError }}</text
			><qm-button @click="load">重新加载</qm-button></view
		>
		<template v-else-if="success">
			<view class="qm-success"
				><text class="qm-success__mark">✓</text
				><text class="qm-success__title">{{
					recordId ? "修改已保存" : isCard ? "扣次成功" : "消费已登记"
				}}</text
				><text class="qm-muted">{{
					isCard
						? "已为" + memberName + "扣减 " + form.consumeTimes + " 次"
						: "资料与业务记录已更新"
				}}</text></view
			>
			<view class="qm-panel"
				><view class="qm-kv"
					><text>会员</text><text>{{ memberName }}</text></view
				><view class="qm-kv"
					><text>{{ isCard ? "次卡" : "消费类型" }}</text
					><text>{{ isCard ? selectedCard?.cardName : form.consumeType }}</text></view
				><view v-if="isCard" class="qm-kv"
					><text>余次变化</text
					><text class="action-result-balance">{{
						resultRemain === null
							? "请在会员档案核对"
							: submittedBefore + " → " + resultRemain + " 次"
					}}</text></view
				><view class="qm-kv"
					><text>消费时间</text><text>{{ form.consumeTime }}</text></view
				><view v-if="isCard && !recordId" class="qm-kv"
					><text>短信通知</text
					><text>{{ sendSms ? "已提交发送申请" : "未发送" }}</text></view
				></view
			>
			<view v-if="isCard && sendSms" class="qm-notice"
				>扣次已完成。短信实际发送结果可在会员档案的短信日志查看。</view
			>
			<text class="qm-success-note">会员余次与业务记录已更新</text>
		</template>
		<template v-else>
			<view v-if="isCard && !recordId" class="qm-steps"
				><text>1 选择会员</text><text class="is-active">2 填写扣次</text
				><text>3 核对</text></view
			>
			<view v-if="error" class="qm-error" role="alert">{{ error }}</view>
			<qm-member-summary
				:name="memberName"
				:phone="member?.phone"
				:changeable="!recordId"
				@change="changeMember"
			/>

			<view v-if="isCard && !recordId && !availableCards.length" class="qm-empty"
				><text>暂无可扣次的次卡</text><text>次卡需在有效期内、状态正常且有剩余次数。</text
				><qm-button @click="toOpenCard">为会员开卡</qm-button
				><button class="qm-inline" @tap="form.consumeType = '抖音新客福利'">
					登记其他消费
				</button></view
			>
			<template v-else>
				<template v-if="isCard && !recordId">
					<text class="action-section-title">选择本次消费的次卡</text>
					<view class="action-card-list"
						><button
							v-for="card in availableCards"
							:key="card.id"
							class="action-card-option"
							:class="{ 'is-selected': form.cardAccountId === card.id }"
							:aria-pressed="form.cardAccountId === card.id"
							@tap="form.cardAccountId = card.id"
						>
							<image
								class="action-card-icon"
								src="/static/business/v53/card.svg"
								mode="aspectFit"
							/><view
								><text>{{ card.cardName || "会员次卡" }}</text
								><text
									>{{ card.remainTimes }} 次可用 / 共
									{{ card.totalTimes ?? "—" }} 次</text
								><text>{{
									card.expireTime
										? card.expireTime.slice(0, 10).replace(/-/g, ".") + " 到期"
										: "长期有效"
								}}</text></view
							><image
								v-if="form.cardAccountId === card.id"
								class="action-radio"
								src="/static/business/v53/check.svg"
								mode="aspectFit"
							/><view v-else class="action-radio action-radio--empty" /></button
					></view>
				</template>
				<view class="qm-panel">
					<view v-if="recordId || !isCard" class="qm-field"
						><text class="qm-label">消费类型<text class="qm-required">*</text></text
						><cl-select v-model="form.consumeType" :options="types"
					/></view>
					<view v-if="isCard && recordId" class="qm-field"
						><text class="qm-label">消费次卡<text class="qm-required">*</text></text
						><cl-select
							v-model="form.cardAccountId"
							:options="cardOptions"
							placeholder="请选择次卡"
					/></view>
					<template v-if="isCard">
						<view class="action-times-row"
							><text>本次扣减</text
							><view class="action-stepper"
								><button
									aria-label="减少扣次"
									:disabled="!selectedCard || Number(form.consumeTimes) <= 1"
									@tap="step(-1)"
								>
									<image
										src="/static/business/v53/minus.svg"
										mode="aspectFit"
									/></button
								><input
									v-model="form.consumeTimes"
									type="number"
									:disabled="!selectedCard"
									aria-label="本次扣减次数" /><button
									aria-label="增加扣次"
									:disabled="!selectedCard || Number(form.consumeTimes) >= limit"
									@tap="step(1)"
								>
									<image
										src="/static/business/v53/plus.svg"
										mode="aspectFit"
									/></button></view
						></view>
						<text class="action-after" :class="{ 'is-placeholder': !validPreview }">{{
							validPreview
								? "扣次后剩余 " + (limit - Number(form.consumeTimes)) + " 次"
								: selectedCard
									? "请填写可扣减的整数次数"
									: "请先选择次卡"
						}}</text>
					</template>
					<view class="qm-field"
						><text class="qm-label">消费时间<text class="qm-required">*</text></text
						><cl-select-date
							v-model="form.consumeTime"
							:mode="dateMode"
							format="YYYY-MM-DD HH:mm"
							placeholder="请选择消费时间"
					/></view>
					<view class="qm-field"
						><text class="qm-label">消费备注</text
						><cl-textarea
							v-model="form.remark"
							placeholder="选填"
							:maxlength="500"
							count
							auto-height
					/></view>
				</view>
				<view v-if="isCard && !recordId" class="action-sms"
					><view class="qm-switch"
						><text>发送扣次短信</text
						><switch
							:checked="sendSms"
							:disabled="!smsReady"
							color="#6741b1"
							@change="sendSms = $event.detail.value" /></view
					><text v-if="!smsReady" class="qm-hint">{{
						smsError || "短信服务暂不可用，不影响本次扣次"
					}}</text></view
				>
				<button
					v-if="isCard && !recordId"
					class="qm-inline"
					@tap="form.consumeType = '抖音新客福利'"
				>
					登记其他消费
				</button>
			</template>
		</template>
		<template #footer>
			<view v-if="success" class="action-result-actions"
				><qm-button v-if="isCard && !recordId" @click="continueDeduction"
					>继续扣次</qm-button
				><qm-button v-else @click="archive">返回会员档案</qm-button
				><qm-button variant="secondary" @click="router.switchTab('home')"
					>返回首页</qm-button
				></view
			>
			<qm-button
				v-else
				:loading="saving"
				:disabled="
					loading ||
					!!loadError ||
					(isCard &&
						(!selectedCard || !validPreview || (!recordId && !availableCards.length)))
				"
				@click="review"
				>{{
					isCard ? (selectedCard ? "下一步 · 核对扣次" : "请选择次卡") : "保存消费记录"
				}}</qm-button
			>
		</template>
		<qm-sheet v-model="reviewVisible" title="核对本次扣次" :busy="saving">
			<text class="qm-intro">请确认会员与次卡，提交后更新余次。</text>
			<qm-member-summary :name="memberName" :phone="member?.phone" />
			<text class="action-review-card">{{ selectedCard?.cardName }}</text>
			<view class="action-review-numbers"
				><view
					><text>当前余次</text><text>{{ limit }} 次</text></view
				><view
					><text>本次扣减</text><text>{{ form.consumeTimes }} 次</text></view
				><view
					><text>扣后剩余</text
					><text>{{ limit - Number(form.consumeTimes) }} 次</text></view
				></view
			>
			<view class="qm-kv"
				><text>消费时间</text><text>{{ form.consumeTime }}</text></view
			><view v-if="!recordId" class="qm-kv"
				><text>短信通知</text><text>{{ sendSms ? "发送" : "不发送" }}</text></view
			><view v-if="form.remark" class="qm-kv"
				><text>消费备注</text><text>{{ form.remark }}</text></view
			>
			<view v-if="recordId" class="qm-notice"
				>保存时会先撤销原记录的扣次，再按新内容扣减。</view
			><view v-if="error" class="qm-error" role="alert">{{ error }}</view>
			<template #footer
				><qm-button :loading="saving" @click="save"
					>确认扣减 {{ form.consumeTimes }} 次</qm-button
				><button v-if="!saving" class="qm-inline" @tap="reviewVisible = false">
					返回修改
				</button></template
			>
		</qm-sheet>
		<qm-member-business-sheet ref="businessSheet" @saved="load" />
	</qm-page>
</template>
<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import dayjs from "dayjs";
import { useCool } from "/@/cool";
import MemberService from "../../service/member/info";
import CardService from "../../service/member/card-account";
import RecordService from "../../service/member/consume-record";
import SmsService from "../../service/member/consume-notice-sms";
import {
	canConsume,
	positiveTimes,
	deductionLimit,
	isExpired,
	type CardAccount,
} from "./utils/card-policy";
import QmMemberBusinessSheet from "./components/qm-member-business-sheet.vue";
const businessSheet = ref<InstanceType<typeof QmMemberBusinessSheet>>();
import QmPage from "./components/qm-page.vue";
import QmButton from "./components/qm-button.vue";
import QmSheet from "./components/qm-sheet.vue";
import QmMemberSummary from "./components/qm-member-summary.vue";
const { router } = useCool(),
	members = new MemberService(),
	cardsService = new CardService(),
	records = new RecordService();
const sms = new SmsService();
const smsReady = ref(false);
const sendSms = ref(false);
const smsError = ref("");
const memberId = ref(0),
	recordId = ref(0),
	loading = ref(false),
	saving = ref(false),
	loadError = ref(""),
	error = ref(""),
	success = ref(false),
	reviewVisible = ref(false),
	member = ref<any>(null),
	cards = ref<CardAccount[]>([]),
	original = ref<any>(null),
	resultRemain = ref<number | null>(null),
	submittedBefore = ref(0);
const form = reactive({
	consumeType: "会员次卡",
	cardAccountId: undefined as number | undefined,
	consumeTimes: "1",
	consumeTime: dayjs().format("YYYY-MM-DD HH:mm"),
	remark: "",
});
const dateMode = ["year", "month", "date", "hour", "minute"];
const types = ["会员次卡", "抖音新客福利", "美团团购", "纹绣", "眼线"].map((value) => ({
	label: value,
	value,
}));
const memberName = computed(() => member.value?.name || member.value?.nickName || "未命名会员");
const title = computed(() =>
	recordId.value ? "编辑消费记录" : isCard.value ? "会员扣次" : "登记其他消费",
);
const isCard = computed(() => form.consumeType === "会员次卡"),
	availableCards = computed(() => cards.value.filter((c) => canConsume(c))),
	selectedCard = computed(() => cards.value.find((c) => c.id === form.cardAccountId)),
	limit = computed(() =>
		selectedCard.value ? deductionLimit(selectedCard.value, original.value) : 0,
	);
const validPreview = computed(
	() => positiveTimes(form.consumeTimes) && Number(form.consumeTimes) <= limit.value,
);
const cardOptions = computed(() =>
	cards.value
		.filter(
			(c) =>
				canConsume(c) ||
				(original.value?.cardAccountId === c.id &&
					c.status !== 0 &&
					c.status !== 4 &&
					!isExpired(c)),
		)
		.map((c) => ({
			label: (c.cardName || "会员次卡") + " · 余 " + c.remainTimes + " 次",
			value: c.id,
		})),
);
async function load() {
	loading.value = true;
	loadError.value = "";
	try {
		if (!memberId.value) throw new Error("缺少会员信息，请返回会员列表选择");
		const [m, c] = await Promise.all([
			members.info({ id: memberId.value }),
			cardsService.list({ memberId: memberId.value }),
		]);
		if (!m?.id) throw new Error("该会员已不存在");
		member.value = m;
		cards.value = ((c || []) as CardAccount[]).map((card) => ({
			...card,
			id: Number(card.id),
		}));
		if (!recordId.value) {
			try {
				const status: any = await sms.summary({ memberId: memberId.value });
				smsReady.value = Boolean(status?.ready);
			} catch {
				smsError.value = "通知服务状态加载失败，本次可先保存消费记录";
			}
		}
		if (recordId.value) {
			const row: any = await records.info({ id: recordId.value });
			if (!row?.id || Number(row.memberId) !== memberId.value)
				throw new Error("未找到该会员的消费记录");
			original.value = { ...row, cardAccountId: Number(row.cardAccountId) || undefined };
			Object.assign(form, {
				consumeType: row.consumeType,
				cardAccountId: Number(row.cardAccountId) || undefined,
				consumeTimes: String(row.consumeTimes || 1),
				consumeTime: dayjs(row.consumeTime).format("YYYY-MM-DD HH:mm"),
				remark: row.remark || "",
			});
		}
	} catch (e: any) {
		loadError.value = e?.message || "加载失败，请重试";
	} finally {
		loading.value = false;
	}
}
function validate() {
	error.value = "";

	if (!types.some((t) => t.value === form.consumeType)) error.value = "请选择消费类型";
	else if (!form.consumeTime || !dayjs(form.consumeTime).isValid())
		error.value = "请选择有效的消费时间";
	else if (isCard.value) {
		if (!selectedCard.value || !cardOptions.value.some((c) => c.value === form.cardAccountId))
			error.value = "该次卡当前不可扣次，请重新选择";
		else if (!positiveTimes(form.consumeTimes)) error.value = "扣减次数需要为大于 0 的整数";
		else if (Number(form.consumeTimes) > limit.value)
			error.value = "扣减次数超过可用余额，请核对";
	}
	return !error.value;
}
function review() {
	if (saving.value || !validate()) return;
	if (isCard.value) reviewVisible.value = true;
	else save();
}
async function save() {
	if (saving.value || !validate()) return;
	saving.value = true;
	submittedBefore.value = limit.value;
	try {
		const payload = {
			memberId: memberId.value,
			consumeType: form.consumeType,
			cardAccountId: isCard.value ? form.cardAccountId : null,
			consumeTimes: isCard.value ? Number(form.consumeTimes) : null,
			consumeTime: dayjs(form.consumeTime).format("YYYY-MM-DD HH:mm:ss"),
			remark: form.remark.trim(),
			sendSmsNotice: !recordId.value && isCard.value && smsReady.value && sendSms.value,
		};
		if (recordId.value) await records.update({ id: recordId.value, ...payload });
		else await records.add(payload);
		if (isCard.value) resultRemain.value = limit.value - Number(form.consumeTimes);
		success.value = true;
		reviewVisible.value = false;
		uni.$emit("chime:member-changed", memberId.value);
		uni.$emit("chime:consumes-changed");
		// A failed refresh must never turn an already saved operation into a retryable submission.
		if (isCard.value) {
			try {
				const current: any[] = await cardsService.list({ memberId: memberId.value });
				const saved = current.find((c) => c.id === form.cardAccountId);
				resultRemain.value = saved ? Number(saved.remainTimes) : null;
			} catch {
				resultRemain.value = null;
			}
		}
	} catch (e: any) {
		error.value = e?.message || "保存失败，请重试";
	} finally {
		saving.value = false;
	}
}
function step(delta: number) {
	const current = Number(form.consumeTimes);
	const next = (Number.isSafeInteger(current) ? current : 1) + delta;
	form.consumeTimes = String(Math.min(limit.value, Math.max(1, next)));
}
function changeMember() {
	router.push({
		path: "/pages/index/member-select",
		query: { purpose: "deduct" },
		mode: "redirectTo",
	});
}
function continueDeduction() {
	router.push({
		path: "/pages/index/member-select",
		query: { purpose: "deduct" },
		mode: "redirectTo",
	});
}
function archive() {
	router.push({
		path: "/pages/index/member-detail",
		query: { id: memberId.value },
		mode: "redirectTo",
	});
}
function toOpenCard() {
	businessSheet.value?.openCard(member.value);
}

onLoad((q) => {
	memberId.value = Number(q?.memberId) || 0;
	recordId.value = Number(q?.recordId) || 0;
	if (q?.mode === "openCard") {
		router.push({
			path: "/pages/index/member-detail",
			query: { id: memberId.value, action: "openCard" },
			mode: "redirectTo",
		});
		return;
	}
	if (q?.type === "other") form.consumeType = "抖音新客福利";
	form.cardAccountId = Number(q?.cardId) || undefined;
	load();
});
</script>
<style scoped lang="scss">
.action-section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 500;
	margin-bottom: 22rpx;
}
.action-card-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	margin-bottom: 30rpx;
}
.action-card-option {
	display: flex;
	width: 100%;
	align-items: center;
	gap: 16rpx;
	text-align: left;
	padding: 20rpx !important;
	border: 1px solid var(--qm-line);
	border-radius: 25rpx !important;
	background: var(--qm-surface) !important;
	box-sizing: border-box;
	> view:not(.action-radio) {
		flex: 1;
		min-width: 0;
		> text {
			display: block;
			font-size: 27rpx;
			font-weight: 500;
		}
		> text + text {
			color: var(--qm-brand);
			font-size: 24rpx;
			font-weight: 400;
			margin-top: 2rpx;
		}
		> text:last-child {
			color: var(--qm-muted);
			font-size: 21rpx;
		}
	}
}
.action-card-option.is-selected {
	border-color: var(--qm-brand);
	background: var(--qm-lilac) !important;
}
.action-card-icon {
	width: 42rpx;
	height: 42rpx;
	flex-shrink: 0;
}
.action-radio {
	width: 30rpx;
	height: 30rpx;
	flex-shrink: 0;
}
.action-radio--empty {
	border: 1px solid var(--qm-line);
	box-sizing: border-box;
	border-radius: 50%;
}
.action-times-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20rpx;
	font-size: 28rpx;
	font-weight: 500;
}
.action-stepper {
	display: flex;
	align-items: center;
	background: var(--qm-paper);
	border-radius: 20rpx;
	overflow: hidden;
	button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 74rpx;
		height: 74rpx;
	}
	image {
		width: 26rpx;
		height: 26rpx;
	}
	input {
		width: 66rpx;
		font-size: 30rpx;
		height: 74rpx;
		text-align: center;
	}
}
.action-after {
	display: block;
	font-size: 23rpx;
	color: var(--qm-brand);
	margin: 18rpx 0 28rpx;
}
.action-after.is-placeholder {
	color: var(--qm-muted);
}
.action-sms {
	background: var(--qm-surface);
	border-radius: 30rpx;
	padding: 20rpx 28rpx;
	.qm-switch {
		margin-top: 0;
		font-size: 26rpx;
	}
}
.action-review-card {
	display: block;
	font-size: 29rpx;
	margin: 22rpx 0;
	font-weight: 500;
}
.action-review-numbers {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	background: var(--qm-lilac);
	padding: 24rpx 10rpx;
	border-radius: 28rpx;
	margin-bottom: 22rpx;
	> view {
		text-align: center;
	}
	text {
		display: block;
		color: var(--qm-muted);
		font-size: 22rpx;
	}
	text + text {
		color: var(--qm-deep);
		font-size: 39rpx;
		font-weight: 700;
		margin-top: 6rpx;
	}
}
.action-result-actions {
	display: flex;
	flex-direction: column;
	gap: 14rpx;
}
.action-result-balance {
	color: var(--qm-brand);
	font-weight: 500;
}
</style>
