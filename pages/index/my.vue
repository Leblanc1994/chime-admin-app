<template>
	<cl-page status-bar-background="transparent" :background-color="pageBackground">
		<!-- #ifdef MP -->
		<cl-sticky>
			<cl-topbar :show-back="false" :border="false" background-color="transparent" />
		</cl-sticky>
		<!-- #endif -->

		<view class="page-my">
			<view class="profile-card">
				<view class="profile-card__header">
					<view class="profile-card__heading">
						<text class="profile-card__eyebrow">账号中心</text>
						<text class="profile-card__title">当前登录账号</text>
					</view>

					<text class="status-badge" :class="{ 'is-offline': !user.token }">
						{{ user.token ? "已登录" : "未登录" }}
					</text>
				</view>

				<view class="profile-card__body" @tap="user.token ? toEdit() : toLogin()">
					<cl-avatar :src="user.info?.avatarUrl" :size="108" />

					<view class="profile-card__identity">
						<text class="profile-card__name">{{ profileName }}</text>
						<text class="profile-card__subtitle">{{ profileSubtitle }}</text>
					</view>

					<text class="profile-card__arrow">›</text>
				</view>

				<view class="profile-card__meta">
					<text class="summary-pill" v-for="item in profileMeta" :key="item">
						{{ item }}
					</text>
				</view>
			</view>

			<view class="action-grid">
				<view class="action-card" @tap="user.token ? toEdit() : toLogin()">
					<text class="action-card__title">{{ user.token ? "编辑资料" : "立即登录" }}</text>
					<text class="action-card__desc">
						{{ user.token ? "补充头像、昵称和基础账号资料" : "登录后查看并管理当前账号信息" }}
					</text>
				</view>

				<view class="action-card" @tap="user.token ? toSet() : toLogin()">
					<text class="action-card__title">账号设置</text>
					<text class="action-card__desc">
						{{ user.token ? "进入设置页处理头像、协议和登录状态" : "当前未登录，先进入登录页完成验证" }}
					</text>
				</view>
			</view>

			<view class="section-card">
				<view class="section-card__header">
					<text class="section-card__title">账号信息</text>
					<text class="section-card__caption">
						{{ user.token ? "以下信息来自当前登录账户" : "登录后会自动同步账号资料" }}
					</text>
				</view>

				<view class="detail-list">
					<view class="detail-row" v-for="item in accountDetails" :key="item.label">
						<text class="detail-row__label">{{ item.label }}</text>
						<text class="detail-row__value" :class="{ 'is-empty': item.value === '-' }">
							{{ item.value }}
						</text>
					</view>
				</view>
			</view>

			<view class="section-card section-card--danger">
				<view class="section-card__header">
					<text class="section-card__title">安全操作</text>
					<text class="section-card__caption">
						{{ user.token ? "退出后将返回登录页" : "当前设备还没有登录账号" }}
					</text>
				</view>

				<view class="menu-action" @tap="user.token ? confirmLogout() : toLogin()">
					<text class="menu-action__label">{{ user.token ? "退出登录" : "前往登录" }}</text>
					<text class="menu-action__arrow">›</text>
				</view>
			</view>
		</view>

		<tabbar />
	</cl-page>
</template>

<script lang="ts" setup>
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { useCool, useStore } from "/@/cool";
import { useUi } from "/$/cool-ui";
import { computed } from "vue";
import Tabbar from "./components/tabbar.vue";

const { router } = useCool();
const { user } = useStore();
const ui = useUi();

const pageBackground =
	"radial-gradient(circle at top left, rgba(135, 76, 93, 0.14), transparent 38%), radial-gradient(circle at top right, rgba(31, 106, 82, 0.12), transparent 32%), linear-gradient(180deg, #fbf7f1 0%, #f4efe7 50%, #efe8de 100%)";

const profileName = computed(() => {
	return user.info?.nickName || user.info?.name || user.info?.username || "未登录";
});

const profileSubtitle = computed(() => {
	if (!user.token) {
		return "登录后可查看账号信息、设置和资料页";
	}

	return user.info?.phone || user.info?.email || user.info?.username || "点击完善账号资料";
});

const profileMeta = computed(() => {
	const items: string[] = [];

	if (user.info?.id) {
		items.push(`ID ${user.info.id}`);
	}

	if (user.info?.username) {
		items.push(`用户名 ${user.info.username}`);
	}

	if (user.info?.phone) {
		items.push(`手机号 ${user.info.phone}`);
	}

	if (!items.length) {
		items.push(user.token ? "资料可在设置页继续完善" : "当前设备未登录账号");
	}

	return items;
});

const accountDetails = computed(() => {
	return [
		{ label: "昵称", value: user.info?.nickName || "-" },
		{ label: "用户名", value: user.info?.username || "-" },
		{ label: "手机号", value: user.info?.phone || "-" },
		{ label: "邮箱", value: user.info?.email || "-" },
		{ label: "账号 ID", value: user.info?.id ? String(user.info.id) : "-" },
	];
});

async function refresh(showMessage = false) {
	if (!user.token) {
		if (showMessage) {
			ui.showTips("当前还没有登录账号");
		}

		return;
	}

	try {
		await user.get();

		if (showMessage) {
			ui.showTips("账号信息已刷新");
		}
	} catch (err: any) {
		if (showMessage) {
			ui.showTips(err?.message || "账号信息刷新失败");
		}
	}
}

function toLogin() {
	router.push("/pages/user/login");
}

function toSet() {
	router.push("/pages/user/set");
}

function toEdit() {
	router.push("/pages/user/edit");
}

function confirmLogout() {
	ui.showConfirm({
		title: "退出登录",
		type: "warning",
		message: "确认退出当前账号吗？退出后将返回登录页。",
		confirmButtonText: "确认退出",
		beforeClose(action, { done }) {
			if (action !== "confirm") {
				done();
				return;
			}

			done();
			user.logout();
		},
	});
}

onPullDownRefresh(async () => {
	await refresh();
	uni.stopPullDownRefresh();
});

onShow(() => {
	refresh();
});
</script>

<style lang="scss" scoped>
.page-my {
	min-height: 100%;
	padding: 28rpx 24rpx 156rpx;
	box-sizing: border-box;
}

.profile-card,
.section-card {
	border-radius: 32rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	background: rgba(255, 252, 247, 0.92);
	border: 1rpx solid rgba(255, 255, 255, 0.72);
	box-shadow: 0 22rpx 50rpx rgba(73, 57, 36, 0.08);
	box-sizing: border-box;
}

.profile-card__header,
.section-card__header,
.profile-card__body,
.detail-row,
.menu-action {
	display: flex;
	align-items: center;
}

.profile-card__header,
.section-card__header {
	justify-content: space-between;
}

.profile-card__heading {
	display: flex;
	flex-direction: column;
}

.profile-card__eyebrow {
	display: block;
	font-size: 22rpx;
	letter-spacing: 6rpx;
	text-transform: uppercase;
	color: #9b7b57;
	margin-bottom: 10rpx;
}

.profile-card__title,
.section-card__title,
.profile-card__name {
	display: block;
	color: #2f3129;
	font-weight: 600;
}

.profile-card__title,
.section-card__title {
	font-size: 30rpx;
}

.status-badge {
	flex-shrink: 0;
	padding: 10rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(31, 106, 82, 0.1);
	color: #1f6a52;
	font-size: 22rpx;
	font-weight: 600;
}

.status-badge.is-offline {
	background: rgba(135, 76, 93, 0.1);
	color: #874c5d;
}

.profile-card__body {
	padding: 30rpx 0 26rpx;
}

.profile-card__identity {
	flex: 1;
	min-width: 0;
	margin-left: 24rpx;
}

.profile-card__name {
	display: block;
	font-size: 40rpx;
	line-height: 1.2;
}

.profile-card__subtitle,
.section-card__caption,
.action-card__desc,
.detail-row__label {
	color: #6c695d;
}

.profile-card__subtitle {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.6;
}

.profile-card__arrow,
.menu-action__arrow {
	flex-shrink: 0;
	color: #a18463;
	font-size: 36rpx;
	line-height: 1;
}

.profile-card__meta {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.summary-pill {
	padding: 10rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.76);
	border: 1rpx solid rgba(92, 74, 54, 0.08);
	font-size: 22rpx;
	color: #6f6658;
}

.action-grid {
	display: flex;
	flex-wrap: wrap;
	margin: 0 -8rpx 20rpx;
}

.action-grid > .action-card {
	width: calc(50% - 16rpx);
	margin: 0 8rpx 16rpx;
	margin-bottom: 20rpx;
}

.action-card {
	min-height: 174rpx;
	padding: 28rpx 26rpx;
	border-radius: 28rpx;
	background: linear-gradient(160deg, rgba(255, 255, 255, 0.94) 0%, rgba(249, 241, 231, 0.88) 100%);
	border: 1rpx solid rgba(103, 84, 61, 0.08);
	box-shadow: 0 16rpx 40rpx rgba(88, 67, 46, 0.06);
	box-sizing: border-box;
}

.action-card__title {
	display: block;
	color: #2f3129;
	font-size: 30rpx;
	font-weight: 600;
	margin-bottom: 14rpx;
}

.action-card__desc {
	display: block;
	font-size: 24rpx;
	line-height: 1.7;
}

.section-card__caption {
	display: block;
	font-size: 22rpx;
	text-align: right;
}

.detail-list {
	margin-top: 16rpx;
}

.detail-row {
	justify-content: space-between;
	padding: 24rpx 0;
	border-bottom: 1rpx solid rgba(111, 102, 88, 0.08);
	gap: 24rpx;
}

.detail-row:last-child {
	border-bottom: 0;
	padding-bottom: 0;
}

.detail-row__label,
.detail-row__value,
.menu-action__label {
	font-size: 26rpx;
}

.detail-row__value,
.menu-action__label {
	color: #2f3129;
}

.detail-row__value {
	flex: 1;
	text-align: right;
	word-break: break-all;
}

.detail-row__value.is-empty {
	color: #b3a794;
}

.section-card--danger .menu-action__label {
	color: #b85c4a;
}

.menu-action {
	justify-content: space-between;
	margin-top: 16rpx;
	padding-top: 8rpx;
}

@media screen and (max-width: 720rpx) {
	.page-my {
		padding-left: 20rpx;
		padding-right: 20rpx;
	}

	.profile-card,
	.section-card {
		padding: 26rpx;
		border-radius: 28rpx;
	}

	.action-grid {
		display: block;
		margin-left: 0;
		margin-right: 0;
	}

	.action-grid > .action-card {
		width: 100%;
		margin-left: 0;
		margin-right: 0;
	}

	.profile-card__name {
		font-size: 36rpx;
	}
}
</style>
