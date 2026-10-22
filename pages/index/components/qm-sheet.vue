<template>
	<cl-popup
		:model-value="modelValue"
		:direction="dialog ? 'center' : 'bottom'"
		:size="dialog ? 'calc(100% - 76rpx)' : 'auto'"
		:show-header="false"
		:padding="0"
		:border-radius="dialog ? '38rpx' : '44rpx 44rpx 0 0'"
		background-color="#f8f5f0"
		modal-background="rgba(33,22,46,.35)"
		:close-on-click-modal="false"
		:z-index="zIndex"
		:offset-bottom="form ? keyboardInset : 0"
		@closed="closed"
		@update:model-value="update"
		@opened="focusFirst"
	>
		<view
			:id="id"
			class="chime-business qm-sheet"
			:class="{ 'qm-sheet--dialog': dialog, 'qm-sheet--form': form }"
			:style="form ? { height: sheetHeight + 'px', maxHeight: sheetHeight + 'px' } : {}"
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			:aria-label="title"
		>
			<view v-if="!dialog" class="qm-sheet__handle" />
			<view class="qm-sheet__header"
				><text>{{ title }}</text
				><button
					v-if="!dialog"
					role="button"
					:tabindex="busy ? -1 : 0"
					@keydown.enter.prevent="close"
					@keydown.space.prevent="close"
					aria-label="关闭弹层"
					:disabled="busy"
					@tap="close"
				>
					×
				</button></view
			>
			<scroll-view
				:scroll-into-view="scrollTarget"
				@touchmove.stop
				scroll-y
				:show-scrollbar="false"
				class="qm-sheet__body"
				><slot
			/></scroll-view>
			<view v-if="$slots.footer" class="qm-sheet__footer"><slot name="footer" /></view>
		</view>
	</cl-popup>
</template>
<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onBeforeUnmount } from "vue";
import { holdSheetTabbar, releaseSheetTabbar } from "../utils/sheet-tabbar";
const props = withDefaults(
	defineProps<{
		modelValue: boolean;
		title: string;
		busy?: boolean;
		dialog?: boolean;
		form?: boolean;
		focusTarget?: string;
		zIndex?: number;
	}>(),
	{ zIndex: 500 },
);
const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void; (e: "closed"): void }>();
const id = "qm-layer-" + Math.random().toString(36).slice(2);
let previous: HTMLElement | null = null;
const scrollTarget = ref("");
async function revealField() {
	if (!props.form || !props.modelValue) return;
	scrollTarget.value = "";
	await nextTick();
	scrollTarget.value = props.focusTarget || "";
	// #ifdef H5
	const field = document.getElementById(props.focusTarget || "");
	field?.scrollIntoView({ block: "nearest" });
	// #endif
}
watch(() => props.focusTarget, revealField);
const keyboardInset = ref(0),
	sheetHeight = ref(600);
let baseHeight = 0,
	keyboardHeight = 0;
function measure() {
	if (!props.form || !props.modelValue) return;
	const info = uni.getSystemInfoSync();
	const height = info.windowHeight || 700;
	baseHeight = Math.max(baseHeight, height);
	let bottom = Math.max(0, keyboardHeight - Math.max(0, baseHeight - height));
	let available = height - bottom;
	// #ifdef H5
	const viewport = window.visualViewport;
	if (viewport) {
		bottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
		available = viewport.height;
	}
	// #endif
	keyboardInset.value = bottom;
	sheetHeight.value = Math.max(
		180,
		Math.min(baseHeight * 0.88, available - (info.statusBarHeight || 20) - 48),
	);
}
function viewportChanged() {
	measure();
	revealField();
}
function keyboardChanged(event: { height: number }) {
	keyboardHeight = event.height;
	measure();
	revealField();
}
function closed() {
	if (props.modelValue) return;
	releaseSheetTabbar(id);
	emit("closed");
}
onMounted(() => {
	if (!props.form) return;
	// #ifdef MP-WEIXIN
	uni.onKeyboardHeightChange(keyboardChanged);
	uni.onWindowResize(measure);
	// #endif
	// #ifdef H5
	window.visualViewport?.addEventListener("resize", viewportChanged);
	window.visualViewport?.addEventListener("scroll", measure);
	// #endif
});
function close() {
	if (!props.busy) emit("update:modelValue", false);
}
function update(value: boolean) {
	if (!value) close();
}
function focusFirst() {
	// #ifdef H5
	const root = document.getElementById(id);
	const target = root?.querySelector<HTMLElement>("[data-qm-autofocus]") || root;
	target?.focus();
	// #endif
}
function onKeydown(event: KeyboardEvent) {
	// #ifdef H5
	if (!props.modelValue) return;
	const root = document.getElementById(id);
	const layer = root?.closest(".cl-popup__wrapper");
	if (!root || !layer) return;
	const layerIndex = Number(getComputedStyle(layer).zIndex);
	const higherLayer = Array.from(
		document.querySelectorAll(".cl-popup__wrapper, .uni-picker-container"),
	).some(
		(el) =>
			el !== layer &&
			el.getClientRects().length &&
			getComputedStyle(el).visibility !== "hidden" &&
			getComputedStyle(el).display !== "none" &&
			Number(getComputedStyle(el).zIndex) > layerIndex,
	);
	if (higherLayer) return;
	if (event.key === "Escape") {
		event.preventDefault();
		close();
		return;
	}
	if (event.key === "Enter" || event.key === " ") {
		const button = (event.target as HTMLElement)?.closest<HTMLElement>(
			'[role="button"][tabindex="0"]',
		);
		if (button && root.contains(button) && !button.classList.contains("qm-button")) {
			event.preventDefault();
			event.stopImmediatePropagation();
			button.click();
		}
		return;
	}
	if (event.key !== "Tab") return;
	const controls = Array.from(
		document
			.getElementById(id)
			?.querySelectorAll<HTMLElement>(
				'button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
			) || [],
	).filter((el) => el.getClientRects().length);
	const first = controls[0],
		last = controls[controls.length - 1];
	if (!first) {
		event.preventDefault();
		return;
	}
	if (document.activeElement === root || !root.contains(document.activeElement)) {
		event.preventDefault();
		(event.shiftKey ? last : first).focus();
		return;
	}
	if (event.shiftKey && document.activeElement === first) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && document.activeElement === last) {
		event.preventDefault();
		first.focus();
	}
	// #endif
}
watch(
	() => props.modelValue,
	async (visible) => {
		if (props.form) {
			if (visible) {
				baseHeight = 0;
				keyboardHeight = 0;
				holdSheetTabbar(id);
				measure();
			} else uni.hideKeyboard();
		}
		// #ifdef H5
		if (visible) {
			previous = document.activeElement as HTMLElement;
			document.addEventListener("keydown", onKeydown, true);
			await nextTick();
			focusFirst();
		} else {
			document.removeEventListener("keydown", onKeydown, true);
			if (previous?.isConnected) previous.focus();
		}
		// #endif
	},
);
onBeforeUnmount(() => {
	releaseSheetTabbar(id);
	// #ifdef MP-WEIXIN
	if (props.form) {
		uni.offKeyboardHeightChange(keyboardChanged);
		uni.offWindowResize(measure);
	}
	// #endif
	// #ifdef H5
	window.visualViewport?.removeEventListener("resize", viewportChanged);
	window.visualViewport?.removeEventListener("scroll", measure);
	// #endif
	// #ifdef H5
	document.removeEventListener("keydown", onKeydown, true);
	// #endif
	previous = null;
});
</script>
<style lang="scss" scoped>
.qm-sheet:focus {
	outline: none;
}
.qm-sheet {
	display: flex;
	flex-direction: column;
	max-height: 88vh;
	max-height: 88dvh;
	background: #f8f5f0;
	border-radius: 44rpx 44rpx 0 0;
	overflow: hidden;
}
.qm-sheet__handle {
	width: 66rpx;
	height: 8rpx;
	border-radius: 8rpx;
	background: #d5cbdc;
	margin: 18rpx auto 0;
	flex-shrink: 0;
}
.qm-sheet__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10rpx 38rpx 16rpx;
	font-size: 33rpx;
	font-weight: 550;
	flex-shrink: 0;
	button {
		width: 80rpx;
		height: 80rpx;
		font-size: 40rpx;
		color: #615e6a;
	}
}
.qm-sheet__body {
	min-height: 0;
	max-height: 65vh;
	flex: 1;
	box-sizing: border-box;
	padding: 0 38rpx 10rpx;
}
.qm-sheet__footer {
	padding: 22rpx 38rpx calc(28rpx + env(safe-area-inset-bottom));
	background: #fffefd;
	flex-shrink: 0;
}
.qm-sheet--form {
	.qm-sheet__body {
		height: 0;
		max-height: none;
		flex: 1;
	}
	.qm-sheet__header {
		padding-bottom: 12rpx;
	}
	.qm-sheet__footer .qm-error {
		margin: 0 0 16rpx;
	}
}
.qm-sheet--dialog {
	border-radius: 38rpx;
	background: #fffefd;
	.qm-sheet__header {
		justify-content: center;
		text-align: center;
		padding: 44rpx 34rpx 24rpx;
		font-size: 36rpx;
	}
	.qm-sheet__body {
		padding: 0 32rpx 10rpx;
		max-height: 55vh;
	}
	.qm-sheet__footer {
		padding: 22rpx 32rpx 34rpx;
	}
}
</style>
