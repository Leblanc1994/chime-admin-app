<template>
	<qm-sheet
		:model-value="modelValue"
		:title="title"
		dialog
		:busy="busy"
		@update:model-value="emit('update:modelValue', $event)"
		><text v-if="message" class="qm-intro">{{ message }}</text
		><slot /><view v-if="error" class="qm-error" role="alert">{{ error }}</view
		><template #footer
			><view class="qm-confirm__buttons"
				><qm-button
					:variant="danger ? 'danger' : 'primary'"
					:loading="busy"
					@click="emit('confirm')"
					>{{ confirmText }}</qm-button
				><qm-button
					variant="secondary"
					data-qm-autofocus
					:disabled="busy"
					@click="emit('update:modelValue', false)"
					>{{ cancelText }}</qm-button
				></view
			></template
		></qm-sheet
	>
</template>
<script setup lang="ts">
import QmSheet from "./qm-sheet.vue";
import QmButton from "./qm-button.vue";
withDefaults(
	defineProps<{
		modelValue: boolean;
		title: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		danger?: boolean;
		busy?: boolean;
		error?: string;
	}>(),
	{ confirmText: "确认", cancelText: "取消" },
);
const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void; (e: "confirm"): void }>();
</script>
<style scoped>
.qm-confirm__buttons {
	display: flex;
	flex-direction: column;
	gap: 18rpx;
}
</style>
