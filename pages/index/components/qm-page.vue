<template>
	<cl-page
		background-color="#f8f5f0"
		status-bar-background="#f8f5f0"
		:status-bar="!navigation.enabled"
	>
		<view
			class="chime-business qm-page"
			:class="{ 'qm-page--footer': $slots.footer, 'qm-page--stacked': footerStacked, 'qm-page--fill': fill }"
		>
			<view
				class="qm-page__navigation"
				:style="navigation.enabled ? { paddingTop: navigation.statusBarHeight + 'px' } : {}"
			>
				<view
					class="qm-page__header"
					:class="{ 'qm-page__header--mini': navigation.enabled }"
					:style="
						navigation.enabled
							? {
									height: navigation.barHeight + 'px',
									gridTemplateColumns:
										navigation.sideInset +
										'px minmax(0, 1fr) ' +
										navigation.sideInset +
										'px',
								}
							: {}
					"
				>
					<button class="qm-page__back" aria-label="返回" :disabled="busy" @tap="back">
						<image src="/static/business/v53/back.svg" mode="aspectFit" />
					</button>
					<text class="qm-page__title">{{ title }}</text
					><view class="qm-page__right"
						><slot v-if="!navigation.enabled" name="right"
					/></view>
				</view>
				<view v-if="navigation.enabled && $slots.right" class="qm-page__mini-actions">
					<slot name="right" />
				</view>
			</view>
			<view class="qm-page__body"><slot /></view>
			<view v-if="$slots.footer" class="qm-page__footer"><slot name="footer" /></view>
		</view>
	</cl-page>
</template>
<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useCool } from "/@/cool";
import { useMiniNavigation } from "../utils/use-mini-navigation";
const props = defineProps<{ title: string; busy?: boolean; footerStacked?: boolean; fill?: boolean }>();
const { router } = useCool();
const navigation = useMiniNavigation();
onMounted(() => uni.setNavigationBarTitle({ title: props.title }));
watch(
	() => props.title,
	(title) => uni.setNavigationBarTitle({ title }),
);
function back() {
	if (!props.busy) router.back();
}
</script>
<style lang="scss" scoped>
.qm-page {
	min-height: 100vh;
	background: #f8f5f0;
}
.qm-page--footer {
	padding-bottom: calc(156rpx + env(safe-area-inset-bottom));
}
.qm-page--stacked {
	padding-bottom: calc(274rpx + env(safe-area-inset-bottom));
}
.qm-page--fill {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	display: flex;
	flex-direction: column;
	min-height: 0;
	overflow: hidden;
	.qm-page__navigation {
		flex-shrink: 0;
	}
	.qm-page__body {
		display: flex;
		flex: 1;
		flex-direction: column;
		height: 0;
		min-height: 0;
		padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	}
}
.qm-page__navigation {
	position: sticky;
	top: 0;
	z-index: 20;
	background: #f8f5f0;
}
.qm-page__header {
	display: grid;
	grid-template-columns: 100rpx 1fr 100rpx;
	align-items: center;
	height: 92rpx;
	padding: 0 26rpx;
	background: #f8f5f0;
	box-sizing: border-box;
}
.qm-page__title {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	text-align: center;
	font-size: 33rpx;
	font-weight: 550;
}
.qm-page__back {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 88rpx;
	height: 88rpx;
	image {
		width: 40rpx;
		height: 40rpx;
	}
}
.qm-page__right {
	display: flex;
	justify-content: flex-end;
	font-size: 27rpx;
	color: #6741b1;
}
.qm-page__header--mini {
	padding: 0;
	.qm-page__back {
		margin-left: 13px;
		width: 44px;
		height: 44px;
	}
}
.qm-page__mini-actions {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	min-height: 72rpx;
	padding: 0 38rpx;
	color: #6741b1;
	font-size: 27rpx;
}
.qm-page__body {
	padding: 30rpx 38rpx 44rpx;
}
.qm-page__footer {
	position: fixed;
	z-index: 30;
	bottom: 0;
	left: 0;
	right: 0;
	background: #fffefd;
	border-top: 0;
	padding: 30rpx 38rpx calc(28rpx + env(safe-area-inset-bottom));
}
</style>
