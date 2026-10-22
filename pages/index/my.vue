<template>
	<cl-page background-color="#f8f5f0" status-bar-background="#f8f5f0">
		<view class="chime-business my-page">
			<qm-main-header
				><view class="my-heading"
					><text>千绵美学</text><text>我的</text></view
				></qm-main-header
			>
			<button class="my-profile" aria-label="编辑个人资料" @tap="profile">
				<image
					class="my-watermark"
					src="/static/business/chime-mark.png"
					mode="aspectFit"
				/>
				<view class="my-profile-top"
					><view class="qm-avatar my-avatar"
						><image
							v-if="user.info?.avatarUrl"
							:src="user.info.avatarUrl"
							mode="aspectFill"
						/><text v-else>{{ name.slice(0, 1) }}</text></view
					><view class="my-profile-copy"
						><view class="my-name-line"
							><text class="my-name">{{ name }}</text
							><text v-if="user.token" class="my-role">{{ role }}</text></view
						><text>{{ user.token ? "千绵美学" : "登录后管理门店日常事务" }}</text></view
					><image
						class="qm-chevron my-profile-chevron"
						src="/static/business/my-imgIcon1.svg"
						mode="aspectFit"
				/></view>
				<view class="my-profile-bottom"
					><text>{{
						user.token ? "账号 " + (user.info?.username || "未记录") : "门店账号"
					}}</text
					><text>{{ user.token ? "已登录" : "前往登录" }}</text></view
				>
			</button>
			<template v-for="group in groups" :key="group.title"
				><text class="qm-heading">{{ group.title }}</text
				><view class="my-menu"
					><button
						v-for="item in group.items"
						:key="item.title"
						class="qm-row"
						@tap="open(item)"
					>
						<image
							class="my-icon"
							:src="'/static/business/v53/' + item.icon + '.svg'"
							mode="aspectFit"
						/><view class="qm-row__copy"
							><text>{{ item.title }}</text></view
						><image
							class="qm-chevron"
							src="/static/business/v53/chevron.svg"
						/></button></view
			></template>
			<button class="my-logout" @tap="user.token ? (logoutVisible = true) : router.login()">
				{{ user.token ? "退出登录" : "前往登录" }}
			</button>
		</view>
		<!-- #ifndef MP-WEIXIN -->
		<tabbar design />
		<!-- #endif -->
		<qm-confirm
			v-model="logoutVisible"
			title="退出登录？"
			message="退出后需要重新登录，才能继续管理门店。"
			confirm-text="退出登录"
			:busy="loggingOut"
			@confirm="logout"
		/>
	</cl-page>
</template>
<script setup lang="ts">
import QmMainHeader from "./components/qm-main-header.vue";
import { computed, ref } from "vue";
import { useCool, useStore } from "/@/cool";
// #ifndef MP-WEIXIN
import Tabbar from "./components/tabbar.vue";
// #endif
import QmConfirm from "./components/qm-confirm.vue";
const { router } = useCool();
const { user } = useStore();
const logoutVisible = ref(false),
	loggingOut = ref(false);
const name = computed(
		() => user.info?.nickName || user.info?.name || user.info?.username || "门店账号",
	),
	role = computed(() =>
		(user.info as any)?.role === "staff"
			? "店员"
			: (user.info as any)?.role === "platform_admin"
				? "平台管理员"
				: (user.info as any)?.role === "manager"
					? "店长"
					: "门店账号",
	);
const groups = [
	{
		title: "账号管理",
		items: [
			{ title: "个人资料", icon: "user", path: "/pages/user/set" },
			{ title: "账号信息", icon: "shield", path: "/pages/user/set", account: true },
		],
	},
	{
		title: "关于与协议",
		items: [
			{ title: "关于千绵美学", icon: "info", path: "/pages/user/about" },
			{ title: "用户协议", icon: "doc", key: "userAgreement" },
			{ title: "隐私政策", icon: "lock", key: "privacyPolicy" },
		],
	},
];
function profile() {
	if (user.token) router.push("/pages/user/set");
	else router.login();
}
function open(item: any) {
	if (item.key)
		router.push({ path: "/pages/user/doc", query: { key: item.key, title: item.title } });
	else router.push({ path: item.path, query: item.account ? { view: "account" } : undefined });
}
async function logout() {
	if (loggingOut.value) return;
	loggingOut.value = true;
	try {
		await user.logout();
		logoutVisible.value = false;
	} finally {
		loggingOut.value = false;
	}
}
</script>
<style scoped lang="scss">
.my-page {
	padding: 30rpx 38rpx 28rpx;
	min-height: calc(100vh - 140rpx);
	background: var(--qm-paper);
	/* #ifdef MP-WEIXIN */
	padding-top: 0;
	/* #endif */
}
.my-heading {
	width: 100%;
	padding: 6rpx 0 32rpx;
	text {
		display: block;
		font-size: 21rpx;
		color: var(--qm-muted);
	}
	text + text {
		font-size: 50rpx;
		font-weight: 700;
		color: var(--qm-deep);
		margin-top: 8rpx;
		line-height: 1.4;
	}
}
.my-profile {
	position: relative;
	display: block;
	width: 100%;
	padding: 38rpx !important;
	text-align: left;
	background: var(--qm-deep) !important;
	border-radius: 46rpx !important;
	color: var(--qm-on-brand) !important;
	overflow: hidden;
}
.my-watermark {
	position: absolute;
	width: 300rpx;
	height: 300rpx;
	right: -55rpx;
	top: -10rpx;
	opacity: 0.14;
	pointer-events: none;
}
.my-profile-top {
	position: relative;
	display: flex;
	align-items: center;
	gap: 24rpx;
}
.my-avatar {
	width: 108rpx;
	height: 108rpx;
	font-size: 44rpx;
	background: var(--qm-cream);
	color: var(--qm-warning);
}
.my-profile-copy {
	flex: 1;
	min-width: 0;
	> text {
		display: block;
		font-size: 24rpx;
		margin-top: 10rpx;
	}
}
.my-name-line {
	display: flex;
	align-items: center;
	gap: 12rpx;
	flex-wrap: wrap;
}
.my-name {
	font-size: 42rpx;
	font-weight: 700;
	overflow-wrap: anywhere;
	line-height: 1.3;
}
.my-role {
	padding: 4rpx 13rpx;
	background: var(--qm-cream);
	color: var(--qm-warning);
	border-radius: 999rpx;
	font-size: 20rpx;
	white-space: nowrap;
}
.my-profile-bottom {
	position: relative;
	display: flex;
	justify-content: space-between;
	gap: 16rpx;
	margin-top: 26rpx;
	font-size: 22rpx;
	> text:first-child {
		overflow-wrap: anywhere;
	}
	> text:last-child {
		flex-shrink: 0;
	}
}
.my-page .qm-heading {
	font-size: 35rpx;
	margin: 44rpx 0 18rpx;
}
.my-menu {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}
.my-menu .qm-row {
	padding: 24rpx 28rpx;
	background: var(--qm-surface);
	border-radius: 30rpx;
	border: 0;
	min-height: 106rpx;
	gap: 22rpx;
}
.my-icon {
	width: 38rpx;
	height: 38rpx;
	flex-shrink: 0;
}
.my-logout {
	background: var(--qm-surface) !important;
	color: var(--qm-muted) !important;
	width: 100%;
	min-height: 92rpx;
	margin-top: 44rpx !important;
	border-radius: 28rpx !important;
	font-size: 27rpx !important;
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>

<style scoped>
.my-profile :deep(.qm-chevron) {
	filter: brightness(0) invert(1);
}
</style>
