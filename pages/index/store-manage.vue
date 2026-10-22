<template>
	<cl-page status-bar-background="#fff" :background-color="pageBackground">
		<view class="page-store">
			<!-- 顶部导航（白底） -->
			<view class="page-nav">
				<view class="page-nav__btn" @tap="back">
					<cl-icon name="arrow-left" :size="32" color="#5a5365" />
				</view>
				<text class="page-nav__title">门店管理</text>
				<view class="page-nav__btn" @tap="openMore">
					<text class="page-nav__more">···</text>
				</view>
			</view>
			<view class="page-nav__hairline"></view>

			<!-- 统计卡 -->
			<view class="store-stats">
				<view class="store-stats__item">
					<text class="store-stats__num is-violet">{{ stats.total }}</text>
					<text class="store-stats__label">门店总数</text>
				</view>
				<view class="store-stats__divider"></view>
				<view class="store-stats__item">
					<text class="store-stats__num is-green">{{ stats.open }}</text>
					<text class="store-stats__label">营业中</text>
				</view>
				<view class="store-stats__divider"></view>
				<view class="store-stats__item">
					<text class="store-stats__num is-orange">{{ stats.expired }}</text>
					<text class="store-stats__label">已到期</text>
				</view>
			</view>

			<!-- 门店卡列表 -->
			<view
				v-for="store in stores"
				:key="store.id"
				class="store-card"
			>
				<view class="store-card__head">
					<view class="store-card__logo" :class="`is-${store.tone}`">
						<text>{{ store.logoText }}</text>
					</view>
					<view class="store-card__info">
						<text class="store-card__name">{{ store.name }}</text>
						<text class="store-card__addr">{{ store.address }}</text>
						<text class="store-card__expiry">{{ store.expiryText }}</text>
					</view>
					<view class="store-card__badge" :class="`is-${store.status}`">
						{{ store.statusLabel }}
					</view>
				</view>
				<view class="store-card__actions">
					<view class="store-card__btn is-violet" @tap="switchStore(store)">切换门店</view>
					<view class="store-card__btn is-gray" @tap="editStore(store)">编辑资料</view>
					<view class="store-card__btn is-primary" @tap="renewStore(store)">
						{{ store.status === "expired" ? "立即续期" : "续期服务" }}
					</view>
				</view>
			</view>

			<!-- 新增门店 -->
			<view class="store-add" @tap="addStore">
				<text class="store-add__text">+ 新增门店</text>
			</view>
		</view>
	</cl-page>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { useCool } from "/@/cool";
import { useUi } from "/$/cool-ui";

const { router } = useCool();
const ui = useUi();

const pageBackground = "#f7f7fb";

type Tone = "violet" | "orange";
type Status = "open" | "expired";

type StoreItem = {
	id: number;
	name: string;
	address: string;
	expiryText: string;
	logoText: string;
	tone: Tone;
	status: Status;
	statusLabel: string;
};

// Mock 数据（按设计稿 09 门店管理）。
// TODO: 接入门店 service 后替换。
const stats = reactive({ total: 2, open: 1, expired: 1 });

const stores = ref<StoreItem[]>([
	{
		id: 1,
		name: "星漾美肌 · 南山店",
		address: "南山区科技园南区 A 座 1F",
		expiryText: "服务到期 2027.03.10 · 剩余 182 天",
		logoText: "星",
		tone: "violet",
		status: "open",
		statusLabel: "营业中",
	},
	{
		id: 2,
		name: "星漾美肌 · 宝安店",
		address: "宝安区新安街道海秀路 8 号",
		expiryText: "服务到期 2026.05.31 · 已过期 102 天",
		logoText: "宝",
		tone: "orange",
		status: "expired",
		statusLabel: "已到期",
	},
]);

function back() {
	router.back();
}

function openMore() {
	ui.showTips("更多操作即将上线");
}

function switchStore(store: StoreItem) {
	ui.showTips(`已切换到 ${store.name}`);
}

function editStore(store: StoreItem) {
	router.push({
		path: "/pages/index/store-brand",
		query: { id: String(store.id) },
	});
}

function renewStore(store: StoreItem) {
	ui.showTips(`${store.name} 续期流程即将上线`);
}

function addStore() {
	ui.showTips("新增门店流程即将上线");
}
</script>

<style lang="scss" scoped>
.page-store {
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

/* ── 统计卡 ───────────────────────────── */
.store-stats {
	display: flex;
	align-items: center;
	margin: 24rpx 24rpx 0;
	padding: 30rpx 0;
	border-radius: 28rpx;
	background: #ffffff;
}

.store-stats__item {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1;
	gap: 8rpx;
}

.store-stats__num {
	font-size: 40rpx;
	font-weight: 800;

	&.is-violet {
		color: #6e44f5;
	}

	&.is-green {
		color: #20b875;
	}

	&.is-orange {
		color: #f59e0b;
	}
}

.store-stats__label {
	font-size: 24rpx;
	color: #8c8794;
}

.store-stats__divider {
	width: 1rpx;
	height: 56rpx;
	background: #f2eff4;
}

/* ── 门店卡 ───────────────────────────── */
.store-card {
	margin: 24rpx 24rpx 0;
	padding: 30rpx 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
}

.store-card__head {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.store-card__logo {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 88rpx;
	height: 88rpx;
	border-radius: 24rpx;

	&.is-violet {
		background: linear-gradient(145deg, #8158fc, #6841ec);
	}

	&.is-orange {
		background: #fef3e2;

		text {
			color: #f59e0b;
		}
	}

	text {
		font-size: 34rpx;
		font-weight: 800;
		color: #ffffff;
	}
}

.store-card__info {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
	flex: 1;
	min-width: 0;
}

.store-card__name {
	font-size: 30rpx;
	font-weight: 800;
	color: #26232c;
}

.store-card__addr,
.store-card__expiry {
	font-size: 24rpx;
	color: #8c8794;
}

.store-card__badge {
	flex-shrink: 0;
	padding: 6rpx 18rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	font-weight: 700;

	&.is-open {
		background: #e8f8f0;
		color: #20b875;
	}

	&.is-expired {
		background: #fef3e2;
		color: #f59e0b;
	}
}

.store-card__actions {
	display: flex;
	gap: 16rpx;
	margin-top: 26rpx;
}

.store-card__btn {
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

	&.is-primary {
		background: linear-gradient(145deg, #8158fc, #6841ec);
		color: #ffffff;
	}
}

/* ── 新增门店 ─────────────────────────── */
.store-add {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 96rpx;
	margin: 24rpx 24rpx 0;
	border-radius: 28rpx;
	background: #ffffff;
}

.store-add__text {
	font-size: 28rpx;
	font-weight: 800;
	color: #6e44f5;
}
</style>
