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
				<text class="qm-muted">售价 ¥ {{ cardPrice(card.price) }}</text>
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
				<view v-if="templatesLoading" class="qm-hint">正在加载可开卡项…</view>
				<view v-else-if="templatesError" class="qm-error" role="alert"
					>{{ templatesError
					}}<button class="qm-inline" @tap="loadTemplates">重新加载</button></view
				>
				<view v-else-if="!templates.length" class="business-no-template">
					<text>暂无可开通的卡项</text
					><text class="qm-hint">请先新增或启用会员卡项，再为当前会员开卡</text>
					<button class="qm-inline" @tap="manageTemplates">维护会员卡项</button>
				</view>
				<view v-else class="qm-field">
					<text class="qm-label">选择卡项<text class="qm-required">*</text></text>
					<view
						class="business-template-list"
						role="radiogroup"
						aria-label="选择开卡卡项"
					>
						<button
							v-for="item in templates"
							:key="item.id"
							class="business-template"
							:class="{ 'is-selected': card.templateId === item.id }"
							:style="cardColorStyle(item.color)"
							role="radio"
							tabindex="0"
							:aria-label="
								item.name + '，' + item.totalTimes + '次，售价' + item.price + '元'
							"
							:aria-checked="card.templateId === item.id"
							@keydown.enter.prevent="card.templateId = item.id"
							@keydown.space.prevent="card.templateId = item.id"
							@tap="card.templateId = item.id"
						>
							<view
								><text>{{ item.name }}</text
								><text
									>{{ item.totalTimes }} 次 / 张 · ¥
									{{ cardPrice(item.price) }}</text
								></view
							>
							<text class="business-template-check">{{
								card.templateId === item.id ? "✓" : ""
							}}</text>
						</button>
					</view>
				</view>
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
			<qm-button
				v-else
				:loading="saving"
				:disabled="
					kind === 'card' && (templatesLoading || !!templatesError || !templates.length)
				"
				@click="save"
				>{{ kind === "create" ? "建立会员档案" : "确认开卡" }}</qm-button
			>
		</template>
	</qm-sheet>
</template>
<script setup lang="ts">
import { ref, reactive, computed, onUnmounted, watch } from "vue";
import dayjs from "dayjs";
import { useCool } from "/@/cool";
import MemberService from "../../../service/member/info";
import CardService from "../../../service/member/card-account";
import TemplateService from "../../../service/member/card-template";
import { cardColorStyle, cardPrice, type CardTemplate } from "../utils/card-template";
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
	cards = new CardService(),
	templatesService = new TemplateService();
const visible = ref(false),
	kind = ref<"create" | "card">("create"),
	saving = ref(false),
	success = ref(false),
	error = ref("");
const member = ref<any>(null);
const focusTarget = ref("");
const form = reactive(newMemberForm());
const blankCard = () => ({
	templateId: undefined as number | undefined,
	cardName: "",
	totalTimes: "",
	price: "",
	color: "purple",
	expireTime: "",
	remark: "",
});
const templates = ref<CardTemplate[]>([]),
	templatesLoading = ref(false),
	templatesError = ref("");
let templateGeneration = 0;
const selectedTemplate = computed(() => templates.value.find((row) => row.id === card.templateId));
async function loadTemplates() {
	const seq = ++templateGeneration;
	templatesLoading.value = true;
	templatesError.value = "";
	try {
		const result = await templatesService.list({ status: 1 });
		if (seq !== templateGeneration) return;
		templates.value = (result || [])
			.filter((row: CardTemplate) => row.status === 1)
			.map((row: CardTemplate) => ({ ...row, id: Number(row.id) }));
		if (!templates.value.some((row) => row.id === card.templateId)) card.templateId = undefined;
	} catch (e: any) {
		if (seq === templateGeneration) templatesError.value = e?.message || "卡项加载失败，请重试";
	} finally {
		if (seq === templateGeneration) templatesLoading.value = false;
	}
}
function templatesChanged() {
	if (visible.value && kind.value === "card" && !success.value && !saving.value) loadTemplates();
}
uni.$on("chime:card-templates-changed", templatesChanged);
onUnmounted(() => {
	templateGeneration++;
	uni.$off("chime:card-templates-changed", templatesChanged);
});
function manageTemplates() {
	visible.value = false;
	router.push("/pages/index/card-catalog");
}
const card = reactive(blankCard());
watch(selectedTemplate, (row) => {
	if (!row || success.value || saving.value) return;
	Object.assign(card, {
		cardName: row.name,
		totalTimes: String(row.totalTimes),
		price: String(row.price),
		color: row.color,
	});
});
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
	templates.value = [];
	visible.value = true;
	loadTemplates();
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
	else if (templatesLoading.value || templatesError.value) error.value = "请先加载可开卡项";
	else if (!selectedTemplate.value) error.value = "请选择已启用的卡项";
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
				templateId: card.templateId,
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
.business-no-template {
	display: flex;
	flex-direction: column;
	gap: 14rpx;
	text-align: center;
	padding: 22rpx 0;
}
.business-template-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}
.business-template {
	display: flex;
	width: 100%;
	align-items: center;
	gap: 16rpx;
	padding: 22rpx !important;
	border: 1px solid transparent;
	background: var(--card-surface) !important;
	border-radius: 24rpx !important;
	box-sizing: border-box;
	text-align: left;
	> view {
		flex: 1;
		min-width: 0;
		text {
			display: block;
			overflow-wrap: anywhere;
			font-size: 28rpx;
			font-weight: 500;
			color: var(--qm-ink);
		}
		text + text {
			font-size: 24rpx;
			color: var(--card-accent);
			font-weight: 400;
			margin-top: 8rpx;
		}
	}
}
.business-template.is-selected {
	border-color: var(--card-accent);
}
.business-template-check {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36rpx;
	height: 36rpx;
	border-radius: 50%;
	border: 1px solid var(--card-accent);
	flex-shrink: 0;
	font-size: 24rpx;
	color: var(--card-accent);
}
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
