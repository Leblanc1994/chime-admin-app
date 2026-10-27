<template>
	<view
		v-if="visibleLetters.length"
		class="qm-alphabet-index"
		role="group"
		aria-label="按姓名首字母定位会员"
		@touchmove.stop.prevent="moveTouch"
		@touchend.stop="endTouch"
		@touchcancel.stop="endTouch"
	>
		<button
			v-for="letter in visibleLetters"
			:key="letter"
			class="qm-alphabet-index__item"
			role="button"
			hover-class="none"
			:class="{
				'is-active': modelValue === letter,
				'is-pressing': pressedLetter === letter,
				'is-disabled': disabled,
			}"
			:aria-label="letter === '#' ? '其他姓名' : letter + ' 开头的会员'"
			:aria-pressed="modelValue === letter"
			:aria-disabled="disabled"
			:tabindex="disabled ? -1 : 0"
			:disabled="disabled"
			@touchstart.stop.prevent="startTouch($event, letter)"
			@mousedown="press(letter)"
			@mouseup="release"
			@mouseleave="release"
			@focus="press(letter)"
			@blur="release"
			@tap="select(letter)"
			@keydown.enter.prevent="select(letter)"
			@keydown.space.prevent="select(letter)"
		>
			<text class="qm-alphabet-index__letter">{{ letter }}</text>
			<view class="qm-alphabet-index__preview" aria-hidden="true">
				<text class="qm-alphabet-index__preview-letter">{{ letter }}</text>
			</view>
		</button>
	</view>
</template>
<script lang="ts">
export default { options: { virtualHost: true } };
</script>
<script setup lang="ts">
import { computed, getCurrentInstance, ref, watch } from "vue";

const props = withDefaults(
	defineProps<{
		modelValue: string;
		counts: Record<string, number>;
		disabled?: boolean;
	}>(),
	{ disabled: false },
);
const emit = defineEmits<{ (e: "change", letter: string): void }>();
const letters = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];
const visibleLetters = computed(() => letters.filter((letter) => props.counts[letter] > 0));
const pressedLetter = ref("");
const instance = getCurrentInstance();
let touching = false;
let touchSequence = 0;
let latestY: number | undefined;
let ignoreTapUntil = 0;
let bounds: { top: number; bottom: number }[] = [];

type IndexTouchEvent = { touches?: { clientY?: number; pageY?: number }[] };

function touchY(event: IndexTouchEvent) {
	const touch = event.touches?.[0];
	return touch?.clientY ?? touch?.pageY;
}

function startTouch(event: IndexTouchEvent, letter: string) {
	if (props.disabled || !props.counts[letter]) return;
	touching = true;
	const seq = ++touchSequence;
	latestY = touchY(event);
	bounds = [];
	press(letter);
	emit("change", letter);
	uni.createSelectorQuery()
		.in(instance?.proxy)
		.selectAll(".qm-alphabet-index__item")
		.boundingClientRect((rects: any) => {
			if (!touching || seq !== touchSequence || !Array.isArray(rects)) return;
			bounds = rects;
			moveToY();
		})
		.exec();
}

function moveTouch(event: IndexTouchEvent) {
	if (!touching || props.disabled) return;
	latestY = touchY(event);
	moveToY();
}

function moveToY() {
	const y = latestY;
	if (!bounds.length || y == null || !Number.isFinite(y)) return;
	const index = bounds.findIndex((rect) => y < rect.bottom);
	const letter = visibleLetters.value[index === -1 ? bounds.length - 1 : index];
	if (!letter || letter === pressedLetter.value) return;
	press(letter);
	emit("change", letter);
}

function endTouch() {
	if (touching) ignoreTapUntil = Date.now() + 500;
	touching = false;
	touchSequence++;
	bounds = [];
	release();
}

watch(visibleLetters, endTouch);
watch(
	() => props.disabled,
	(disabled) => { if (disabled) endTouch(); },
);

function press(letter: string) {
	if (props.disabled || !props.counts[letter]) return;
	pressedLetter.value = letter;
}

function release() {
	if (touching) return;
	pressedLetter.value = "";
}

function select(letter: string) {
	if (Date.now() < ignoreTapUntil) return;
	release();
	if (props.disabled || !props.counts[letter]) return;
	emit("change", letter);
}
</script>
<style scoped lang="scss">
.qm-alphabet-index {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	justify-content: center;
	padding: 4rpx 0;
	box-sizing: border-box;
	overflow: visible;
	pointer-events: auto;
	user-select: none;
	touch-action: none;
}
.qm-alphabet-index .qm-alphabet-index__item {
	position: relative;
	display: flex;
	flex: 1 1 0%;
	align-items: center;
	justify-content: center;
	height: 0;
	min-height: 0;
	max-height: 40rpx;
	margin: 0;
	padding: 0;
	border: 0;
	border-radius: 0;
	color: var(--qm-muted, #615e6a);
	background: transparent;
	font-family: inherit;
	font-size: 20rpx;
	font-weight: 500;
	line-height: 1;
	box-sizing: border-box;
	overflow: visible;
	&::after {
		border: 0;
	}
	&.is-active {
		color: var(--qm-on-brand, #fdf9ff);
		font-weight: 700;
	}
	&.is-active .qm-alphabet-index__letter,
	&.is-pressing .qm-alphabet-index__letter {
		color: var(--qm-on-brand, #fdf9ff);
		background: var(--qm-brand, #6741b1);
	}
	&.is-pressing {
		z-index: 1;
	}
	&.is-disabled {
		color: var(--qm-muted, #615e6a);
		opacity: 0.32;
	}
	&.is-active.is-disabled {
		color: var(--qm-on-brand, #fdf9ff);
		opacity: 0.65;
	}
	&:focus {
		outline: none;
	}
	&:focus-visible .qm-alphabet-index__letter {
		outline: 2px solid var(--qm-brand, #6741b1);
		outline-offset: 2px;
	}
}
.qm-alphabet-index__letter {
	display: flex;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	width: 30rpx;
	height: 30rpx;
	border-radius: 50%;
	line-height: 1;
}
.qm-alphabet-index__preview {
	position: absolute;
	top: 50%;
	right: calc(100% + 28rpx);
	display: flex;
	align-items: center;
	justify-content: center;
	width: 96rpx;
	height: 96rpx;
	color: var(--qm-on-brand, #fdf9ff);
	font-size: 48rpx;
	font-weight: 600;
	line-height: 1;
	opacity: 0;
	pointer-events: none;
	transform: translate(16rpx, -50%) scale(0.35);
	transform-origin: right center;
	transition:
		transform 140ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 100ms ease-out;
	&::before {
		content: "";
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		border-radius: 50% 50% 0 50%;
		background: #cbcacc;
		transform: rotate(-45deg);
	}
}
.qm-alphabet-index__preview-letter {
	position: relative;
	z-index: 1;
}
.is-pressing .qm-alphabet-index__preview {
	opacity: 1;
	transform: translate(0, -50%) scale(1);
	transition-duration: 180ms, 120ms;
}
@media (prefers-reduced-motion: reduce) {
	.qm-alphabet-index__preview {
		transition: none;
	}
}
</style>
