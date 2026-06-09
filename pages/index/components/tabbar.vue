<template>
	<cl-footer class="tabbar-shell" :flex="false" background-color="transparent" :z-index="399" :padding="0">
		<view class="tabbar">
			<view
				class="item"
				v-for="(item, index) in list"
				:key="index"
				:class="{
					'is-active': item.active,
				}"
				@tap="toLink(item.pagePath)"
			>
				<view class="icon">
					<image :src="item.icon" mode="aspectFit" />
				</view>
				<text class="label">{{ item.text }}</text>
				<view class="badge" v-if="item.number > 0">{{ item.number || 0 }}</view>
			</view>
		</view>
	</cl-footer>
</template>

<script lang="ts" setup>
import { onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { useCool } from "/@/cool";
import { useI18n } from "vue-i18n";

const { router } = useCool();
const { t } = useI18n();

// 当前页面路径
const currentPagePath = ref(normalizePath(router.path));

function normalizePath(path?: string) {
	return (path || "").replace(/^\//, "");
}

const list = computed(() => {
	const arr = [...router.tabs];

	return arr.map((e) => {
		const active = normalizePath(e.pagePath) === currentPagePath.value;

		return {
			...e,
			icon: "/" + (active ? e.selectedIconPath : e.iconPath),
			active,
			number: 0,
			text: t((e.text || "")?.replace(/%/g, "")!),
		};
	});
});

function toLink(pagePath: string) {
	const to = (link: string) => {
		// #ifdef H5
		location.href = link;
		// #endif

		// #ifdef APP-PLUS
		plus.runtime.openURL(link);
		// #endif
	};

	switch (pagePath) {
		case "cool":
			to("https://cool-js.com");
			break;

		case "admin":
			to("http://www.chime.pink/admin-app");
			break;

		default:
			router.push("/" + pagePath);
			break;
	}
}

onShow(() => {
	currentPagePath.value = normalizePath(router.path);
});

uni.hideTabBar();
</script>

<style lang="scss" scoped>
$icon-size: 54rpx;

.tabbar-shell :deep(.cl-footer) {
	background: transparent;
}

.tabbar-shell :deep(.cl-footer__border) {
	display: none;
}

.tabbar {
	display: flex;
	align-items: center;
	width: calc(100% - 68rpx);
	height: 112rpx;
	margin: 0 34rpx calc(22rpx + env(safe-area-inset-bottom));
	padding: 10rpx 22rpx;
	box-sizing: border-box;
	border: 1rpx solid rgba(255, 255, 255, 0.94);
	border-radius: 999rpx;
	background: rgba(253, 254, 255, 0.96);
	box-shadow: 0 -12rpx 42rpx rgba(55, 87, 129, 0.11);

	.item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		position: relative;
		height: 100%;
		border-radius: 999rpx;
		transition: all 0.2s ease;

		.icon {
			display: flex;
			align-items: center;
			justify-content: center;
			height: $icon-size;
			width: $icon-size;
			margin-bottom: 1rpx;

			image {
				height: 100%;
				width: 100%;
			}
		}

		.label {
			font-size: 23rpx;
			font-weight: 600;
			line-height: 1;
			color: #727d95;
		}

		.badge {
			display: flex;
			align-items: center;
			justify-content: center;
			position: absolute;
			top: 20rpx;
			transform: translateX(20rpx);
			font-size: 20rpx;
			height: 36rpx;
			min-width: 36rpx;
			padding: 0 6rpx;
			background-color: #f56c6c;
			border: 4rpx solid #fff;
			color: #fff;
			border-radius: 18rpx;
			font-weight: bold;
			box-sizing: border-box;
		}

		&.is-active {
			.label {
				color: #1677ff;
				font-weight: 800;
			}
		}
	}
}
</style>
