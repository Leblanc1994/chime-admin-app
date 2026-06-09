<template>
	<cl-page status-bar-background="transparent" :background-color="pageBackground">
		<!-- #ifdef MP -->
		<cl-sticky>
			<cl-topbar :show-back="false" :border="false" background-color="transparent" />
		</cl-sticky>
		<!-- #endif -->

		<view class="page-my">
			<view class="profile-hero">
				<view class="profile-hero__info">
					<text class="profile-hero__role">{{ profileRole }}</text>

					<view class="profile-hero__name-row">
						<text class="profile-hero__name">{{ profileName }}</text>
						<text class="verified-mark">
							<text class="icon-check"></text>
						</text>
					</view>

					<text class="profile-hero__id">{{ profileId }}</text>
				</view>

				<view class="profile-avatar" @tap="user.token ? toEdit() : toLogin()">
					<cl-avatar v-if="user.info?.avatarUrl" :src="user.info.avatarUrl" :size="156" />
					<view v-else class="avatar-illustration">
						<text class="avatar-illustration__hair"></text>
						<text class="avatar-illustration__face"></text>
						<text class="avatar-illustration__body"></text>
					</view>
					<view class="avatar-edit">
						<cl-icon name="edit" :size="30" />
					</view>
				</view>
			</view>

			<view class="quick-panel">
				<view
					class="quick-item"
					v-for="item in quickActions"
					:key="item.title"
					@tap="handleQuickAction(item.action)"
				>
					<view class="quick-item__icon" :class="`is-${item.tone}`">
						<text :class="`icon-${item.icon}`"></text>
					</view>
					<text class="quick-item__title">{{ item.title }}</text>
				</view>
			</view>

			<view class="settings-panel">
				<view
					class="settings-row"
					v-for="item in settingsRows"
					:key="item.title"
					@tap="handleSettingsAction(item.action)"
				>
					<view class="settings-row__icon" :class="`is-${item.tone}`">
						<text :class="`icon-${item.icon}`"></text>
					</view>

					<view class="settings-row__content">
						<text class="settings-row__title">{{ item.title }}</text>
						<text class="settings-row__desc">{{ item.desc }}</text>
					</view>

					<text class="settings-row__arrow">›</text>
				</view>
			</view>

			<view class="logout-panel" @tap="user.token ? confirmLogout() : toLogin()">
				<view class="logout-panel__icon">
					<text class="icon-logout"></text>
				</view>
				<text class="logout-panel__label">{{ user.token ? "退出登录" : "前往登录" }}</text>
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

type ActionType = "profile" | "security" | "notice" | "general" | "privacy" | "help" | "about";

const { router } = useCool();
const { user } = useStore();
const ui = useUi();

const pageBackground =
	"radial-gradient(circle at 92% 2%, rgba(210, 252, 245, 0.86) 0%, rgba(210, 252, 245, 0) 30%), radial-gradient(circle at 12% 8%, rgba(231, 224, 255, 0.9) 0%, rgba(231, 224, 255, 0) 34%), linear-gradient(180deg, #f8fbff 0%, #f3f8ff 48%, #f7fbff 100%)";

const profileRole = computed(() => {
	return user.token ? "店长" : "未登录";
});

const profileName = computed(() => {
	return user.info?.nickName || user.info?.name || user.info?.username || "chime";
});

const profileId = computed(() => {
	return user.info?.id ? `ID ${user.info.id}` : user.token ? "ID -" : "点击登录";
});

const quickActions: Array<{ title: string; icon: string; tone: string; action: ActionType }> = [
	{ title: "我的资料", icon: "user-card", tone: "blue", action: "profile" },
	{ title: "账号与安全", icon: "shield-check", tone: "green", action: "security" },
	{ title: "消息通知", icon: "bell", tone: "orange", action: "notice" },
	{ title: "通用设置", icon: "setting", tone: "purple", action: "general" },
];

const settingsRows: Array<{
	title: string;
	desc: string;
	icon: string;
	tone: string;
	action: ActionType;
}> = [
	{ title: "个人信息", desc: "头像、昵称等", icon: "person", tone: "blue", action: "profile" },
	{ title: "登录与安全", desc: "密码、设备管理等", icon: "lock", tone: "blue", action: "security" },
	{ title: "隐私设置", desc: "隐私权限与数据管理", icon: "shield-small", tone: "blue", action: "privacy" },
	{ title: "帮助与反馈", desc: "常见问题与联系客服", icon: "headset", tone: "blue", action: "help" },
	{ title: "关于我们", desc: "版本信息与服务协议", icon: "info", tone: "blue", action: "about" },
];

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

function requireLogin(next: () => void) {
	if (!user.token) {
		toLogin();
		return;
	}

	next();
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

function toAbout() {
	router.push("/pages/user/about");
}

function toDoc(key: string, title: string) {
	router.push({
		path: "/pages/user/doc",
		query: {
			key,
			title,
		},
	});
}

function showComingSoon(label: string) {
	ui.showTips(`${label}暂未开放`);
}

function handleQuickAction(action: ActionType) {
	handleSettingsAction(action);
}

function handleSettingsAction(action: ActionType) {
	switch (action) {
		case "profile":
			requireLogin(toEdit);
			break;
		case "security":
		case "general":
			requireLogin(toSet);
			break;
		case "privacy":
			toDoc("privacyPolicy", "隐私政策");
			break;
		case "about":
			toAbout();
			break;
		case "notice":
			showComingSoon("消息通知");
			break;
		case "help":
			showComingSoon("帮助与反馈");
			break;
		default:
			break;
	}
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
	--my-ink: #07143a;
	--my-muted: #7f8ba6;
	--my-line: rgba(125, 143, 171, 0.13);
	--my-blue: #3d8cff;
	--my-blue-deep: #1c6bff;
	--my-green: #3fdc73;
	--my-orange: #ffad38;
	--my-purple: #8a5cf6;
	--my-red: #ff4c4c;
	position: relative;
	min-height: 100%;
	padding: 132rpx 32rpx 64rpx;
	box-sizing: border-box;
	overflow: hidden;
}

.page-my::before {
	content: "";
	position: absolute;
	pointer-events: none;
}

.page-my::before {
	top: -72rpx;
	left: 0;
	right: 0;
	height: 430rpx;
	background: radial-gradient(
		circle at 82% 58%,
		rgba(201, 216, 255, 0.68) 0%,
		rgba(201, 216, 255, 0.36) 30%,
		rgba(201, 216, 255, 0) 66%
	);
}

.profile-hero,
.quick-panel,
.settings-panel,
.logout-panel {
	position: relative;
	z-index: 1;
}

.profile-hero {
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 210rpx;
	margin-bottom: 34rpx;
}

.profile-hero__info {
	min-width: 0;
	padding-top: 2rpx;
}

.profile-hero__role {
	display: block;
	color: var(--my-ink);
	font-size: 46rpx;
	font-weight: 900;
	line-height: 1.15;
	letter-spacing: 0;
}

.profile-hero__name-row {
	display: flex;
	align-items: center;
	margin-top: 18rpx;
}

.profile-hero__name {
	display: block;
	max-width: 330rpx;
	color: #17284e;
	font-size: 28rpx;
	font-weight: 500;
	line-height: 1.2;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.verified-mark {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28rpx;
	height: 28rpx;
	margin-left: 12rpx;
	border-radius: 9rpx;
	background: #40cfbf;
	transform: rotate(45deg);
	box-shadow: 0 6rpx 14rpx rgba(26, 188, 173, 0.26);
}

.verified-mark .icon-check {
	width: 13rpx;
	height: 7rpx;
	border-left: 4rpx solid #fff;
	border-bottom: 4rpx solid #fff;
	transform: rotate(0deg);
}

.profile-hero__id {
	display: inline-flex;
	align-items: center;
	height: 48rpx;
	margin-top: 24rpx;
	padding: 0 18rpx;
	border-radius: 14rpx;
	background: linear-gradient(135deg, rgba(255, 240, 205, 0.98), rgba(255, 247, 229, 0.94));
	color: #f29b19;
	font-size: 26rpx;
	font-weight: 700;
	line-height: 48rpx;
}

.profile-avatar {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 156rpx;
	height: 156rpx;
	margin-right: 36rpx;
	border-radius: 50%;
	background: linear-gradient(145deg, #e6efff 0%, #d9e7ff 100%);
	box-shadow: inset 0 -24rpx 48rpx rgba(69, 121, 225, 0.12);
	flex-shrink: 0;
}

.profile-avatar :deep(.cl-avatar),
.profile-avatar :deep(image) {
	width: 156rpx !important;
	height: 156rpx !important;
	border-radius: 50% !important;
}

.avatar-illustration {
	position: relative;
	width: 126rpx;
	height: 126rpx;
	overflow: hidden;
	border-radius: 50%;
}

.avatar-illustration__hair {
	position: absolute;
	top: 18rpx;
	left: 33rpx;
	width: 60rpx;
	height: 42rpx;
	border-radius: 28rpx 28rpx 16rpx 16rpx;
	background: linear-gradient(135deg, #5d9dff, #386deb);
}

.avatar-illustration__hair::after {
	content: "";
	position: absolute;
	right: -13rpx;
	top: 9rpx;
	width: 30rpx;
	height: 38rpx;
	border-radius: 0 22rpx 16rpx 0;
	background: #4e86f3;
}

.avatar-illustration__face {
	position: absolute;
	top: 48rpx;
	left: 32rpx;
	width: 62rpx;
	height: 56rpx;
	border-radius: 22rpx 22rpx 32rpx 32rpx;
	background: linear-gradient(180deg, #fff, #f2f7ff);
	box-shadow:
		-14rpx 2rpx 0 -4rpx #f6f9ff,
		14rpx 2rpx 0 -4rpx #f6f9ff;
}

.avatar-illustration__body {
	position: absolute;
	left: 16rpx;
	bottom: -8rpx;
	width: 96rpx;
	height: 54rpx;
	border-radius: 54rpx 54rpx 18rpx 18rpx;
	background: linear-gradient(145deg, #8ab6ff, #5e8de9);
}

.avatar-edit {
	position: absolute;
	right: -4rpx;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 54rpx;
	height: 54rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.98);
	color: var(--my-blue);
	box-shadow: 0 8rpx 22rpx rgba(67, 92, 133, 0.18);
}

.quick-panel,
.settings-panel,
.logout-panel {
	background: rgba(255, 255, 255, 0.92);
	border: 1rpx solid rgba(255, 255, 255, 0.96);
	box-shadow: 0 20rpx 54rpx rgba(55, 86, 131, 0.08);
	box-sizing: border-box;
}

.quick-panel {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	min-height: 194rpx;
	margin-bottom: 28rpx;
	padding: 34rpx 22rpx 28rpx;
	border-radius: 26rpx;
}

.quick-item {
	display: flex;
	align-items: center;
	flex-direction: column;
	min-width: 0;
}

.quick-item__icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 68rpx;
	height: 68rpx;
	margin-bottom: 22rpx;
	border-radius: 50%;
	color: var(--my-blue);
}

.quick-item__icon.is-blue {
	background: linear-gradient(145deg, #eef5ff, #e6f0ff);
}

.quick-item__icon.is-green,
.quick-item__icon.is-orange,
.quick-item__icon.is-purple {
	background: transparent;
}

.quick-item__icon.is-green {
	color: var(--my-green);
}

.quick-item__icon.is-orange {
	color: var(--my-orange);
}

.quick-item__icon.is-purple {
	color: var(--my-purple);
}

.quick-item__title {
	display: block;
	width: 100%;
	color: var(--my-ink);
	font-size: 28rpx;
	font-weight: 700;
	line-height: 1.15;
	text-align: center;
	white-space: nowrap;
}

.settings-panel {
	margin-bottom: 28rpx;
	padding: 16rpx 30rpx;
	border-radius: 26rpx;
}

.settings-row {
	display: flex;
	align-items: center;
	min-height: 132rpx;
	border-bottom: 1rpx solid var(--my-line);
}

.settings-row:last-child {
	border-bottom: 0;
}

.settings-row__icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 76rpx;
	height: 76rpx;
	margin-right: 28rpx;
	border-radius: 50%;
	background: linear-gradient(145deg, #eef5ff, #e8f1ff);
	color: var(--my-blue);
	flex-shrink: 0;
}

.settings-row__content {
	display: flex;
	flex: 1;
	min-width: 0;
	flex-direction: column;
}

.settings-row__title {
	display: block;
	color: var(--my-ink);
	font-size: 30rpx;
	font-weight: 850;
	line-height: 1.18;
}

.settings-row__desc {
	display: block;
	margin-top: 14rpx;
	color: var(--my-muted);
	font-size: 25rpx;
	font-weight: 500;
	line-height: 1.2;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.settings-row__arrow {
	margin-left: 20rpx;
	color: #94a0b4;
	font-size: 54rpx;
	font-weight: 300;
	line-height: 1;
	transform: translateY(-2rpx);
}

.logout-panel {
	display: flex;
	align-items: center;
	min-height: 118rpx;
	padding: 22rpx 34rpx;
	border-radius: 26rpx;
}

.logout-panel__icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 76rpx;
	height: 76rpx;
	margin-right: 30rpx;
	border-radius: 50%;
	background: linear-gradient(145deg, rgba(255, 77, 77, 0.12), rgba(255, 77, 77, 0.06));
	color: var(--my-red);
}

.logout-panel__label {
	color: var(--my-red);
	font-size: 30rpx;
	font-weight: 850;
	line-height: 1;
}

.icon-check,
.icon-user-card,
.icon-shield-check,
.icon-bell,
.icon-setting,
.icon-person,
.icon-lock,
.icon-shield-small,
.icon-headset,
.icon-info,
.icon-logout {
	position: relative;
	display: block;
	box-sizing: border-box;
}

.icon-user-card {
	width: 44rpx;
	height: 44rpx;
}

.icon-user-card::before {
	content: "";
	position: absolute;
	top: 0;
	left: 11rpx;
	width: 24rpx;
	height: 24rpx;
	border-radius: 50%;
	background: currentColor;
}

.icon-user-card::after {
	content: "";
	position: absolute;
	left: 3rpx;
	bottom: 0;
	width: 38rpx;
	height: 22rpx;
	border-radius: 24rpx 24rpx 8rpx 8rpx;
	background: currentColor;
	box-shadow: 21rpx -13rpx 0 -15rpx currentColor;
}

.icon-shield-check,
.icon-shield-small {
	width: 52rpx;
	height: 58rpx;
	border-radius: 24rpx 24rpx 28rpx 28rpx;
	background: linear-gradient(145deg, currentColor, color-mix(in srgb, currentColor 78%, white));
	clip-path: polygon(50% 0, 92% 16%, 86% 72%, 50% 100%, 14% 72%, 8% 16%);
}

.icon-shield-check::after,
.icon-shield-small::after {
	content: "";
	position: absolute;
	left: 17rpx;
	top: 23rpx;
	width: 20rpx;
	height: 11rpx;
	border-left: 6rpx solid #fff;
	border-bottom: 6rpx solid #fff;
	transform: rotate(-45deg);
}

.icon-shield-small {
	width: 36rpx;
	height: 40rpx;
}

.icon-shield-small::after {
	left: 12rpx;
	top: 16rpx;
	width: 14rpx;
	height: 8rpx;
	border-left-width: 5rpx;
	border-bottom-width: 5rpx;
}

.icon-bell {
	width: 43rpx;
	height: 43rpx;
	border-radius: 22rpx 22rpx 12rpx 12rpx;
	background: linear-gradient(180deg, #ffc96c, currentColor);
}

.icon-bell::before {
	content: "";
	position: absolute;
	top: -7rpx;
	left: 17rpx;
	width: 12rpx;
	height: 10rpx;
	border-radius: 10rpx 10rpx 0 0;
	background: #ffd68a;
}

.icon-bell::after {
	content: "";
	position: absolute;
	left: 15rpx;
	bottom: -7rpx;
	width: 15rpx;
	height: 8rpx;
	border-radius: 0 0 14rpx 14rpx;
	background: currentColor;
}

.icon-setting {
	width: 50rpx;
	height: 50rpx;
	border-radius: 13rpx;
	background: linear-gradient(145deg, #b58aff, currentColor);
	clip-path: polygon(50% 0, 92% 25%, 92% 75%, 50% 100%, 8% 75%, 8% 25%);
}

.icon-setting::after {
	content: "";
	position: absolute;
	left: 18rpx;
	top: 18rpx;
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	background: #f7f9ff;
}

.icon-person {
	width: 38rpx;
	height: 42rpx;
}

.icon-person::before {
	content: "";
	position: absolute;
	top: 0;
	left: 12rpx;
	width: 15rpx;
	height: 15rpx;
	border: 8rpx solid currentColor;
	border-radius: 50%;
	background: transparent;
}

.icon-person::after {
	content: "";
	position: absolute;
	left: 2rpx;
	bottom: 0;
	width: 34rpx;
	height: 18rpx;
	border-radius: 20rpx 20rpx 8rpx 8rpx;
	background: currentColor;
}

.icon-lock {
	width: 36rpx;
	height: 31rpx;
	margin-top: 12rpx;
	border-radius: 7rpx;
	background: currentColor;
}

.icon-lock::before {
	content: "";
	position: absolute;
	left: 7rpx;
	top: -20rpx;
	width: 22rpx;
	height: 25rpx;
	border: 7rpx solid currentColor;
	border-bottom: 0;
	border-radius: 22rpx 22rpx 0 0;
	box-sizing: border-box;
}

.icon-lock::after {
	content: "";
	position: absolute;
	left: 16rpx;
	top: 10rpx;
	width: 5rpx;
	height: 10rpx;
	border-radius: 99rpx;
	background: #fff;
}

.icon-headset {
	width: 42rpx;
	height: 42rpx;
	border: 7rpx solid currentColor;
	border-bottom-color: transparent;
	border-radius: 50%;
}

.icon-headset::before,
.icon-headset::after {
	content: "";
	position: absolute;
	top: 20rpx;
	width: 10rpx;
	height: 18rpx;
	border-radius: 8rpx;
	background: currentColor;
}

.icon-headset::before {
	left: -8rpx;
}

.icon-headset::after {
	right: -8rpx;
	box-shadow: -8rpx 18rpx 0 -4rpx currentColor;
}

.icon-info {
	width: 38rpx;
	height: 38rpx;
	border-radius: 50%;
	background: currentColor;
}

.icon-info::before,
.icon-info::after {
	content: "";
	position: absolute;
	left: 17rpx;
	border-radius: 99rpx;
	background: #fff;
}

.icon-info::before {
	top: 10rpx;
	width: 5rpx;
	height: 5rpx;
}

.icon-info::after {
	top: 18rpx;
	width: 5rpx;
	height: 13rpx;
}

.icon-logout {
	width: 36rpx;
	height: 36rpx;
	border: 5rpx solid currentColor;
	border-right: 0;
	border-radius: 6rpx 0 0 6rpx;
}

.icon-logout::before {
	content: "";
	position: absolute;
	top: 13rpx;
	left: 12rpx;
	width: 27rpx;
	height: 5rpx;
	border-radius: 99rpx;
	background: currentColor;
}

.icon-logout::after {
	content: "";
	position: absolute;
	top: 5rpx;
	right: -5rpx;
	width: 16rpx;
	height: 16rpx;
	border-top: 5rpx solid currentColor;
	border-right: 5rpx solid currentColor;
	transform: rotate(45deg);
}

@supports not (background: color-mix(in srgb, red, white)) {
	.icon-shield-check,
	.icon-shield-small {
		background: currentColor;
	}
}

@media screen and (max-width: 720rpx) {
	.page-my {
		padding-left: 28rpx;
		padding-right: 28rpx;
	}

	.profile-avatar {
		margin-right: 22rpx;
	}

	.quick-panel {
		padding-left: 16rpx;
		padding-right: 16rpx;
	}

	.quick-item__title {
		font-size: 26rpx;
	}
}
</style>
