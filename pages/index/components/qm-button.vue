<template>
	<button
		:id="id"
		class="qm-button"
		role="button"
		:tabindex="disabled || loading ? -1 : 0"
		:aria-disabled="disabled || loading"
		:class="'qm-button--' + variant"
		:disabled="disabled || loading"
		:aria-busy="loading"
		@tap="activate"
	>
		<text>{{ loading ? loadingText : "" }}</text
		><slot v-if="!loading" />
	</button>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
const props = withDefaults(
	defineProps<{
		variant?: "primary" | "secondary" | "danger";
		disabled?: boolean;
		loading?: boolean;
		loadingText?: string;
	}>(),
	{ variant: "primary", loadingText: "正在提交…" },
);
const id = "qm-button-" + Math.random().toString(36).slice(2);
let element: HTMLElement | null = null;
function onKeydown(event: KeyboardEvent) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		activate();
	}
}
onMounted(() => {
	// #ifdef H5
	element = document.getElementById(id);
	element?.addEventListener("keydown", onKeydown);
	// #endif
});
onBeforeUnmount(() => {
	// #ifdef H5
	element?.removeEventListener("keydown", onKeydown);
	// #endif
});
const emit = defineEmits<{ (e: "click"): void }>();
function activate() {
	if (!props.disabled && !props.loading) emit("click");
}
</script>
<style lang="scss" scoped>
.qm-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	min-height: 96rpx;
	padding: 18rpx 22rpx !important;
	border: 1px solid #6741b1 !important;
	border-radius: 27rpx !important;
	background: #6741b1 !important;
	color: #fffefd !important;
	font-size: 29rpx !important;
	font-weight: 500;
	line-height: 1.5 !important;
	box-sizing: border-box;
}
.qm-button--secondary {
	background: #eee7f6 !important;
	color: #6741b1 !important;
	border-color: #eee7f6 !important;
}
.qm-button--danger {
	background: #9e4653 !important;
	border-color: #9e4653 !important;
}
.qm-button[disabled] {
	background: #ece7ef !important;
	border-color: #e5dfe9 !important;
	color: #9c91a5 !important;
}
.qm-button::after {
	border: 0;
}
</style>
