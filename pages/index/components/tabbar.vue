<template>
	<cl-footer class="tabbar-shell" :flex="false" background-color="transparent" :z-index="399" :padding="0">
		<view class="tabbar">
			<view
				class="item"
				v-for="(item, index) in list"
				:key="index"
				:class="{
					'is-active': item.active,
					[`tabbar-item--${index}`]: true,
				}"
				@tap="toLink(item.pagePath)"
			>
				<view class="icon">
					<image :src="item.icon" mode="aspectFit" />
				</view>
				<text class="label">{{ item.text }}</text>
				<view class="badge" v-if="item.number > 0">{{ item.number || 0 }}</view>
			</view>
			<view
				class="quick-trigger"
				:class="{ 'is-open': quickActionsVisible }"
				aria-label="快捷操作"
				@tap="quickActionsVisible = true"
			>
				<text></text>
				<text></text>
			</view>
		</view>

		<cl-popup
			v-model="quickActionsVisible"
			direction="bottom"
			border-radius="36rpx 36rpx 0 0"
			:padding="0"
		>
			<view class="quick-sheet">
				<view class="quick-sheet__handle"></view>
				<view class="quick-sheet__title">快捷操作</view>
				<view class="quick-sheet__grid">
					<view
						v-for="item in quickActions"
						:key="item.label"
						class="quick-sheet__item"
						@tap="handleQuickAction(item.action)"
					>
						<view class="quick-sheet__icon" :class="`is-${item.tone}`"><text>{{ item.symbol }}</text></view>
						<text>{{ item.label }}</text>
					</view>
				</view>
				<view class="quick-sheet__cancel" @tap="quickActionsVisible = false">取消</view>
			</view>
		</cl-popup>
	</cl-footer>
</template>

<script lang="ts" setup>
import { onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import { useCool } from "/@/cool";
import { useUi } from "/$/cool-ui";
import { useI18n } from "vue-i18n";

const { router } = useCool();
const ui = useUi();
const { t } = useI18n();
const quickActionsVisible = ref(false);

const quickActions = [
	{ label: "开卡", symbol: "▣", tone: "violet", action: "member" },
	{ label: "新增会员", symbol: "♙", tone: "blue", action: "member" },
	{ label: "收银", symbol: "¥", tone: "green", action: "cashier" },
	{ label: "扣次", symbol: "⌾", tone: "orange", action: "deduct" },
	{ label: "储值充值", symbol: "▰", tone: "coral", action: "recharge" },
	{ label: "新增预约", symbol: "✦", tone: "indigo", action: "booking" },
];

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

function handleQuickAction(action: string) {
	quickActionsVisible.value = false;

	if (action === "member") {
		router.push("/pages/index/member");
		return;
	}

	if (action === "cashier") {
		router.push("/pages/index/consume-statistics");
		return;
	}

	const label = quickActions.find((item) => item.action === action)?.label || "该";
	ui.showTips(`${label}功能暂未开放`);
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
	display: grid;
	grid-template-columns: repeat(5, minmax(0, 1fr));
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

	.tabbar-item--0 {
		grid-column: 1;
	}

	.tabbar-item--1 {
		grid-column: 2;
	}

	.tabbar-item--2 {
		grid-column: 4;
	}

	.tabbar-item--3 {
		grid-column: 5;
	}

	.quick-trigger {
		display: flex;
		grid-column: 3;
		grid-row: 1;
		align-items: center;
		justify-content: center;
		justify-self: center;
		width: 76rpx;
		height: 76rpx;
		border: 6rpx solid rgba(255, 255, 255, 0.92);
		border-radius: 50%;
		background: linear-gradient(145deg, #7855ff, #5e39e8);
		box-shadow: 0 10rpx 22rpx rgba(94, 57, 232, 0.36);
		box-sizing: border-box;
		transition: transform 0.22s ease;

		text {
			position: absolute;
			width: 30rpx;
			height: 4rpx;
			border-radius: 99rpx;
			background: #fff;
		}

		text:last-child {
			transform: rotate(90deg);
		}

		&.is-open {
			transform: rotate(45deg);
		}
	}
}

.quick-sheet {
	padding: 18rpx 34rpx calc(30rpx + env(safe-area-inset-bottom));
	background: #fff;
	box-sizing: border-box;

	&__handle {
		width: 64rpx;
		height: 8rpx;
		margin: 0 auto 22rpx;
		border-radius: 99rpx;
		background: #e4e7ef;
	}

	&__title {
		margin-bottom: 30rpx;
		text-align: center;
		font-size: 31rpx;
		font-weight: 800;
		color: #222b3d;
	}

	&__grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		row-gap: 34rpx;
	}

	&__item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
		font-size: 24rpx;
		font-weight: 650;
		color: #343c4d;
	}

	&__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 82rpx;
		height: 82rpx;
		border-radius: 22rpx;
		box-shadow: 0 9rpx 20rpx rgba(55, 70, 108, 0.14);
		color: #fff;
		font-size: 42rpx;
		font-weight: 800;

		&.is-violet { background: linear-gradient(145deg, #8b71ff, #653df0); }
		&.is-blue { background: linear-gradient(145deg, #72a8ff, #3977ee); }
		&.is-green { background: linear-gradient(145deg, #4ed79a, #17aa72); }
		&.is-orange { background: linear-gradient(145deg, #ffc161, #f09034); }
		&.is-coral { background: linear-gradient(145deg, #ff8eae, #f65079); }
		&.is-indigo { background: linear-gradient(145deg, #837cff, #5a55da); }
	}

	&__cancel {
		margin-top: 38rpx;
		padding-top: 28rpx;
		border-top: 1rpx solid #edf0f5;
		text-align: center;
		font-size: 28rpx;
		font-weight: 650;
		color: #596278;
	}
}

:deep(.cl-popup__modal) {
	background: rgba(18, 22, 39, 0.46) !important;
}
</style>
