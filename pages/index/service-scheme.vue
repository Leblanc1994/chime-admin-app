<template>
	<cl-page status-bar-background="#fff" :background-color="pageBackground">
		<view class="page-scheme">
			<!-- 顶部导航（白底） -->
			<view class="page-nav">
				<view class="page-nav__btn" @tap="back">
					<cl-icon name="arrow-left" :size="32" color="#5a5365" />
				</view>
				<text class="page-nav__title">服务方案</text>
				<view class="page-nav__btn" @tap="openMore">
					<text class="page-nav__more">···</text>
				</view>
			</view>
			<view class="page-nav__hairline"></view>

			<!-- Header Row -->
			<view class="scheme-header">
				<text class="scheme-header__summary">
					共 {{ schemes.length }} 个方案 · 在售 {{ onSaleCount }}
				</text>
				<text class="scheme-header__add" @tap="addScheme">新增方案</text>
			</view>

			<!-- 方案卡列表 -->
			<view v-for="scheme in schemes" :key="scheme.id" class="scheme-card">
				<view class="scheme-card__top">
					<text class="scheme-card__name">{{ scheme.name }}</text>
					<view class="scheme-card__badge" :class="`is-${scheme.status}`">
						{{ scheme.statusLabel }}
					</view>
					<text class="scheme-card__price" :class="{ 'is-muted': scheme.status === 'offline' }">
						¥{{ scheme.price }}
					</text>
				</view>
				<text class="scheme-card__meta">{{ scheme.meta }}</text>
				<view class="scheme-card__actions">
					<view class="scheme-card__btn is-violet" @tap="editScheme(scheme)">编辑方案</view>
					<view
						class="scheme-card__btn"
						:class="scheme.status === 'offline' ? 'is-green' : 'is-gray'"
						@tap="toggleSale(scheme)"
					>
						{{ scheme.status === "offline" ? "重新上架" : "下架" }}
					</view>
				</view>
			</view>
		</view>
	</cl-page>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useCool } from "/@/cool";
import { useUi } from "/$/cool-ui";

const { router } = useCool();
const ui = useUi();

const pageBackground = "#f7f7fb";

type Status = "onsale" | "offline";

type SchemeItem = {
	id: number;
	name: string;
	price: number;
	meta: string;
	status: Status;
	statusLabel: string;
};

// Mock 数据（按设计稿 10 服务方案）。
// TODO: 接入服务方案 service 后替换。
const schemes = ref<SchemeItem[]>([
	{
		id: 1,
		name: "4 次卡 · 水光焕肤",
		price: 680,
		meta: "4 次 · 90 天有效 · 适用南山店",
		status: "onsale",
		statusLabel: "在售",
	},
	{
		id: 2,
		name: "6 次卡 · 肩颈舒缓",
		price: 980,
		meta: "6 次 · 180 天有效 · 适用全部门店",
		status: "onsale",
		statusLabel: "在售",
	},
	{
		id: 3,
		name: "单次体验卡",
		price: 128,
		meta: "1 次 · 30 天有效 · 新客专享",
		status: "onsale",
		statusLabel: "在售",
	},
	{
		id: 4,
		name: "12 次卡 · 综合护理",
		price: 1680,
		meta: "12 次 · 365 天有效 · 已停售",
		status: "offline",
		statusLabel: "已下架",
	},
]);

const onSaleCount = computed(() => schemes.value.filter((s) => s.status === "onsale").length);

function back() {
	router.back();
}

function openMore() {
	ui.showTips("更多操作即将上线");
}

function addScheme() {
	ui.showTips("新增方案流程即将上线");
}

function editScheme(scheme: SchemeItem) {
	ui.showTips(`编辑「${scheme.name}」即将上线`);
}

function toggleSale(scheme: SchemeItem) {
	if (scheme.status === "onsale") {
		scheme.status = "offline";
		scheme.statusLabel = "已下架";
		scheme.meta = scheme.meta.replace(/ · .+$/, " · 已停售");
		ui.showTips(`「${scheme.name}」已下架`);
	} else {
		scheme.status = "onsale";
		scheme.statusLabel = "在售";
		scheme.meta = scheme.meta.replace(/ · .+$/, " · 恢复在售");
		ui.showTips(`「${scheme.name}」已重新上架`);
	}
}
</script>

<style lang="scss" scoped>
.page-scheme {
	min-height: 100vh;
	padding-bottom: 60rpx;
	box-sizing: border-box;
}

/* ── 顶部导航（白底） ───────────────────── */
.page-nav {
	display: flex;
	align-items: center;
	gap: 20rpx;
	height: 104rpx;
	padding: 0 24rpx;
	background: #ffffff;
}

.page-nav__btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 64rpx;
	height: 64rpx;
	border-radius: 18rpx;
	background: #f5f2f7;
}

.page-nav__more {
	font-size: 26rpx;
	font-weight: 800;
	letter-spacing: 2rpx;
	color: #5a5365;
}

.page-nav__title {
	flex: 1;
	text-align: center;
	font-size: 32rpx;
	font-weight: 800;
	color: #26232c;
}

.page-nav__hairline {
	height: 1rpx;
	background: #f2eff4;
}

/* ── Header Row ───────────────────────── */
.scheme-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 32rpx 8rpx;
}

.scheme-header__summary {
	font-size: 24rpx;
	color: #8c8794;
}

.scheme-header__add {
	font-size: 26rpx;
	font-weight: 800;
	color: #6e44f5;
}

/* ── 方案卡 ───────────────────────────── */
.scheme-card {
	margin: 20rpx 24rpx 0;
	padding: 30rpx 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
}

.scheme-card__top {
	display: flex;
	align-items: center;
	gap: 14rpx;
}

.scheme-card__name {
	flex: 1;
	min-width: 0;
	font-size: 30rpx;
	font-weight: 800;
	color: #26232c;
}

.scheme-card__badge {
	flex-shrink: 0;
	padding: 6rpx 18rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	font-weight: 700;

	&.is-onsale {
		background: #e8f8f0;
		color: #20b875;
	}

	&.is-offline {
		background: #f0eff2;
		color: #8c8794;
	}
}

.scheme-card__price {
	flex-shrink: 0;
	font-size: 30rpx;
	font-weight: 800;
	color: #6e44f5;

	&.is-muted {
		color: #a8a3b0;
	}
}

.scheme-card__meta {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #8c8794;
}

.scheme-card__actions {
	display: flex;
	gap: 16rpx;
	margin-top: 26rpx;
}

.scheme-card__btn {
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 1;
	height: 72rpx;
	border-radius: 999rpx;
	font-size: 26rpx;
	font-weight: 700;

	&.is-violet {
		background: #f1edff;
		color: #6e44f5;
	}

	&.is-gray {
		background: #f5f4f6;
		color: #544f5c;
	}

	&.is-green {
		background: #e8f8f0;
		color: #20b875;
	}
}
</style>
