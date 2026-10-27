<template>
	<view :id="id" class="qm-tabs" :role="role" :aria-label="label">
		<view class="qm-tabs__track">
			<view
				v-if="activeIndex >= 0"
				class="qm-tabs__indicator"
				aria-hidden="true"
				:style="indicatorStyle"
			/>
			<button
				v-for="item in options"
				:id="idPrefix ? idPrefix + item.value : undefined"
				:key="item.value"
				class="qm-tabs__item"
				:class="{ 'is-active': modelValue === item.value }"
				:role="role === 'radiogroup' ? 'radio' : 'button'"
				:aria-pressed="role === 'group' ? modelValue === item.value : undefined"
				:aria-checked="role === 'radiogroup' ? modelValue === item.value : undefined"
				:disabled="item.disabled"
				:tabindex="item.disabled ? -1 : 0"
				@tap="select(item)"
			>
				<text class="qm-tabs__label">{{ item.label }}</text>
			</button>
		</view>
	</view>
</template>
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from "vue";

interface TabOption {
	label: string;
	value: string | number;
	disabled?: boolean;
}

const props = withDefaults(
	defineProps<{
		modelValue: string | number;
		options: TabOption[];
		label: string;
		role?: "group" | "radiogroup";
		idPrefix?: string;
	}>(),
	{ role: "group", idPrefix: "" },
);
const emit = defineEmits<{
	(e: "update:modelValue", value: string | number): void;
	(e: "change", value: string | number): void;
	(e: "select", value: string | number): void;
}>();
const id = "qm-tabs-" + Math.random().toString(36).slice(2);
// uni-app's H5 buttons are custom elements, so keyboard activation is handled explicitly.
// #ifdef H5
let element: HTMLElement | null = null;
function onKeydown(event: KeyboardEvent) {
	if (event.key !== "Enter" && event.key !== " ") return;
	const button = (event.target as HTMLElement).closest(".qm-tabs__item");
	if (!button || !element) return;
	const index = Array.from(element.querySelectorAll(".qm-tabs__item")).indexOf(button);
	const item = props.options[index];
	if (item) {
		event.preventDefault();
		if (!event.repeat) select(item);
	}
}
onMounted(() => {
	element = document.getElementById(id);
	element?.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => element?.removeEventListener("keydown", onKeydown));
// #endif
const activeIndex = computed(() =>
	props.options.findIndex((item) => item.value === props.modelValue),
);
// Equal-width slots keep the slider aligned without measuring DOM nodes on each platform.
const indicatorStyle = computed(() => ({
	width: `calc((100% - ${(props.options.length - 1) * 8}rpx) / ${props.options.length})`,
	transform: `translateX(calc(${activeIndex.value * 100}% + ${activeIndex.value * 8}rpx))`,
}));

function select(item: TabOption) {
	if (item.disabled) return;
	if (item.value !== props.modelValue) {
		emit("update:modelValue", item.value);
		emit("change", item.value);
	}
	// Also fires for the current option so actions such as reopening a date picker still work.
	emit("select", item.value);
}
</script>
<style scoped lang="scss">
.qm-tabs {
	padding: 8rpx;
	margin: 24rpx 0;
	border-radius: 30rpx;
	background: var(--qm-surface, #fffefd);
	box-sizing: border-box;
}
.qm-tabs__track {
	position: relative;
	display: flex;
	gap: 8rpx;
}
.qm-tabs__indicator {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	border-radius: 23rpx;
	background: var(--qm-lilac, #eee7f6);
	pointer-events: none;
	transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
.qm-tabs .qm-tabs__item {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 1;
	min-width: 0;
	min-height: 70rpx;
	margin: 0;
	padding: 10rpx 8rpx;
	border: 0;
	border-radius: 23rpx;
	background: transparent;
	color: var(--qm-muted, #615e6a);
	font-family: inherit;
	font-size: 25rpx;
	font-weight: 400;
	line-height: 1.4;
	box-sizing: border-box;
	transition: color 160ms ease-out;
	&::after {
		border: 0;
	}
	&.is-active {
		color: var(--qm-brand, #6741b1);
		font-weight: 500;
	}
	&:focus-visible {
		outline: 2px solid var(--qm-brand, #6741b1);
		outline-offset: -2px;
	}
	&[disabled] {
		opacity: 0.58;
	}
}
.qm-tabs__label {
	display: block;
	line-height: 1.4;
	text-align: center;
}
@media (prefers-reduced-motion: reduce) {
	.qm-tabs__indicator,
	.qm-tabs .qm-tabs__item {
		transition: none;
	}
}
</style>
