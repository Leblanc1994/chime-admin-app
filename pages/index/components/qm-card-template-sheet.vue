<template>
	<qm-sheet
		v-model="visible"
		:title="editingId ? '编辑会员卡' : '新增会员卡'"
		:busy="saving"
		:focus-target="focusTarget"
		form
	>
		<view class="catalog-form">
			<view id="catalog-name" class="qm-field">
				<text class="qm-label">卡项名称<text class="qm-required">*</text></text>
				<cl-input
					v-model="form.name"
					placeholder="例如：水光焕肤次卡"
					:maxlength="50"
					:adjust-position="false"
					@focus="focusTarget = 'catalog-name'"
				/>
				<text v-if="errors.name" class="catalog-field-error">{{ errors.name }}</text>
			</view>
			<view class="catalog-form__pair">
				<view id="catalog-totalTimes" class="qm-field">
					<text class="qm-label">总次数<text class="qm-required">*</text></text>
					<cl-input
						v-model="form.totalTimes"
						placeholder="请输入次数"
						type="number"
						:maxlength="10"
						:adjust-position="false"
						@focus="focusTarget = 'catalog-totalTimes'"
					/>
					<text v-if="errors.totalTimes" class="catalog-field-error">{{
						errors.totalTimes
					}}</text>
				</view>
				<view id="catalog-price" class="qm-field">
					<text class="qm-label">售价（元）<text class="qm-required">*</text></text>
					<cl-input
						v-model="form.price"
						placeholder="请输入售价"
						type="digit"
						:maxlength="13"
						:adjust-position="false"
						@focus="focusTarget = 'catalog-price'"
					/>
					<text v-if="errors.price" class="catalog-field-error">{{ errors.price }}</text>
				</view>
			</view>
			<view class="qm-field">
				<view class="catalog-form__label"
					><text class="qm-label">卡项颜色</text
					><text>{{ cardPalette(form.color).label }}</text></view
				>
				<view class="catalog-swatches" role="radiogroup" aria-label="卡项颜色">
					<button
						v-for="color in cardColors"
						:key="color.value"
						role="radio"
						tabindex="0"
						:aria-label="color.label"
						:aria-checked="form.color === color.value"
						:style="{
							background: color.surface,
							color: color.accent,
							borderColor: form.color === color.value ? color.accent : 'transparent',
						}"
						@keydown.enter.prevent="form.color = color.value"
						@keydown.space.prevent="form.color = color.value"
						@tap="form.color = color.value"
					>
						<view :style="{ background: color.accent }"
							><text v-if="form.color === color.value">✓</text></view
						>
					</button>
				</view>
				<text class="qm-hint">会员持卡时也将显示此配色</text>
			</view>
			<view class="qm-field">
				<text class="qm-label">状态</text>
				<view class="qm-segments catalog-status" role="radiogroup" aria-label="卡项状态">
					<button
						v-for="state in states"
						:key="state.value"
						role="radio"
						tabindex="0"
						:aria-checked="form.status === state.value"
						:class="{ 'is-active': form.status === state.value }"
						@keydown.enter.prevent="form.status = state.value"
						@keydown.space.prevent="form.status = state.value"
						@tap="form.status = state.value"
					>
						{{ state.label }}
					</button>
				</view>
				<text class="qm-hint">停用后将不再用于新开卡，已开卡会员可继续使用</text>
			</view>
			<view id="catalog-remark" class="qm-field">
				<text class="qm-label">备注</text>
				<cl-textarea
					v-model="form.remark"
					placeholder="记录卡项用途或补充说明（选填）"
					:maxlength="500"
					count
					fixed
					:adjust-position="false"
					@focus="focusTarget = 'catalog-remark'"
				/>
			</view>
		</view>
		<template #footer>
			<view v-if="error" class="qm-error" role="alert">{{ error }}</view>
			<qm-button :loading="saving" @click="save">{{
				editingId ? "保存修改" : "保存会员卡"
			}}</qm-button>
		</template>
	</qm-sheet>
</template>
<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import Service from "../../../service/member/card-template";
import {
	cardColors,
	cardPalette,
	newCardTemplate,
	cardTemplateErrors,
	cardTemplatePayload,
	type CardTemplate,
} from "../utils/card-template";
import QmSheet from "./qm-sheet.vue";
import QmButton from "./qm-button.vue";
const emit = defineEmits<{ (e: "saved"): void }>();
const service = new Service();
const visible = ref(false),
	editingId = ref(0),
	saving = ref(false),
	attempted = ref(false),
	error = ref(""),
	focusTarget = ref("");
const form = reactive(newCardTemplate());
const errors = computed(() => (attempted.value ? cardTemplateErrors(form) : {}));
const states = [
	{ label: "启用", value: 1 },
	{ label: "停用", value: 0 },
];
function open(row?: CardTemplate) {
	if (saving.value) return;
	editingId.value = row?.id || 0;
	Object.assign(
		form,
		row
			? {
					name: row.name,
					totalTimes: String(row.totalTimes),
					price: String(row.price),
					color: row.color,
					status: row.status,
					remark: row.remark || "",
				}
			: newCardTemplate(),
	);
	attempted.value = false;
	error.value = "";
	focusTarget.value = "";
	visible.value = true;
}
async function save() {
	if (saving.value) return;
	attempted.value = true;
	error.value = "";
	const invalid = Object.keys(errors.value)[0];
	if (invalid) {
		focusTarget.value = "catalog-" + invalid;
		return;
	}
	uni.hideKeyboard();
	saving.value = true;
	try {
		const payload = cardTemplatePayload(form);
		if (editingId.value) await service.update({ ...payload, id: editingId.value });
		else await service.add(payload);
		visible.value = false;
		uni.showToast({ title: editingId.value ? "修改已保存" : "会员卡已新增", icon: "success" });
		uni.$emit("chime:card-templates-changed");
		emit("saved");
	} catch (e: any) {
		error.value = e?.message || "保存失败，请重试";
	} finally {
		saving.value = false;
	}
}
defineExpose({ open });
</script>
<style scoped lang="scss">
.catalog-form {
	background: var(--qm-surface);
	border-radius: 32rpx;
	padding: 28rpx;
	margin-bottom: 12rpx;
}
.catalog-form > .qm-field:last-child {
	margin-bottom: 0;
}
.catalog-form__pair {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 24rpx;
}
.catalog-form__pair .qm-field {
	min-width: 0;
}
.catalog-form__label {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 12rpx;
	> text:last-child {
		font-size: 23rpx;
		color: var(--qm-muted);
	}
}
.catalog-swatches {
	display: grid;
	grid-template-columns: repeat(6, minmax(0, 1fr));
	gap: 10rpx;
	margin: 0 0 14rpx;
	button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 72rpx;
		border-radius: 18rpx !important;
		border: 2px solid transparent;
		box-sizing: border-box;
		padding: 0 !important;
	}
	view {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 42rpx;
		height: 42rpx;
		border-radius: 50%;
		color: white;
		font-size: 25rpx;
	}
}
.catalog-status {
	margin: 0 0 14rpx;
	border: 1px solid var(--qm-line);
}
.catalog-field-error {
	display: block;
	color: var(--qm-danger, #9e4653);
	font-size: 23rpx;
	line-height: 1.5;
	margin-top: 12rpx;
}
</style>
