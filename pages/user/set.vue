<template>
	<qm-page :title="account ? '账号信息' : '个人资料'">
		<view v-if="error" class="qm-error" role="alert">{{ error }}</view>
		<template v-if="user.info">
			<view class="qm-panel profile-panel">
				<text class="qm-section-title">{{ account ? "当前账号" : "个人资料" }}</text>
				<template v-if="!account">
					<view class="qm-row"
						><view class="qm-row__copy"><text>头像</text></view
						><button
							class="qm-avatar profile-avatar"
							aria-label="更换头像"
							:disabled="uploading"
							@tap="uploadAvatar"
						>
							<image
								v-if="user.info.avatarUrl"
								:src="user.info.avatarUrl"
								mode="aspectFill"
							/><text v-else>{{
								(user.info.nickName || user.info.username || "千").slice(0, 1)
							}}</text>
						</button></view
					>
					<button class="qm-row" @tap="router.push('/pages/user/edit')">
						<view class="qm-row__copy"><text>昵称</text></view
						><text class="profile-value">{{ user.info.nickName || "未填写" }}</text
						><image class="qm-chevron" src="/static/business/v53/chevron.svg" />
					</button>
				</template>
				<view v-for="item in entries" :key="item.label" class="qm-kv"
					><text>{{ item.label }}</text
					><text>{{ item.value || "未填写" }}</text></view
				>
			</view>
			<template v-if="account"
				><text class="qm-heading">关于与协议</text
				><view class="qm-menu profile-menu"
					><button
						v-for="item in documents"
						:key="item.label"
						class="qm-row"
						@tap="openDocument(item)"
					>
						<image
							class="profile-menu-icon"
							:src="'/static/business/v53/' + item.icon + '.svg'"
							mode="aspectFit"
						/><view class="qm-row__copy"
							><text>{{ item.label }}</text></view
						><image
							class="qm-chevron"
							src="/static/business/v53/chevron.svg"
						/></button></view
				><text class="qm-heading">切换账号</text
				><text class="qm-intro">退出后登录其他账号</text></template
			>
		</template>
		<view v-else class="qm-empty"
			><text>请先登录</text><qm-button @click="router.login()">前往登录</qm-button></view
		>
		<text v-if="uploading" class="qm-hint">正在更新头像…</text>
		<template v-if="account && user.info" #footer
			><qm-button @click="logoutVisible = true">退出登录</qm-button></template
		>
		<qm-confirm
			v-model="logoutVisible"
			title="退出登录？"
			message="退出后需要重新登录，才能继续管理门店。"
			confirm-text="退出登录"
			:busy="loggingOut"
			:error="logoutError"
			@confirm="logout"
		/>
	</qm-page>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useCool, useStore } from "/@/cool";
import QmPage from "../index/components/qm-page.vue";
import QmButton from "../index/components/qm-button.vue";
import QmConfirm from "../index/components/qm-confirm.vue";
const { router, upload } = useCool();
const { user } = useStore();
const account = ref(false),
	uploading = ref(false),
	error = ref("");
const logoutVisible = ref(false),
	loggingOut = ref(false),
	logoutError = ref("");
const role = computed(
	() =>
		({ manager: "店长", staff: "店员", platform_admin: "平台管理员" })[
			(user.info as any)?.role
		] || "门店账号",
);
const entries = computed(() =>
	account.value
		? [
				{ label: "登录账号", value: user.info?.username },
				{ label: "角色", value: role.value },
				{ label: "当前门店", value: "千绵美学" },
			]
		: [
				{ label: "手机号", value: user.info?.phone },
				{ label: "登录账号", value: user.info?.username },
			],
);
const documents = [
	{ label: "关于千绵美学", icon: "info", path: "/pages/user/about" },
	{ label: "用户协议", icon: "doc", key: "userAgreement" },
	{ label: "隐私政策", icon: "lock", key: "privacyPolicy" },
];
function openDocument(item: any) {
	router.push(
		item.path || { path: "/pages/user/doc", query: { key: item.key, title: item.label } },
	);
}
async function logout() {
	if (loggingOut.value) return;
	loggingOut.value = true;
	logoutError.value = "";
	try {
		await user.logout();
		logoutVisible.value = false;
	} catch (e: any) {
		logoutError.value = e?.message || "退出失败，请重试";
	} finally {
		loggingOut.value = false;
	}
}
function uploadAvatar() {
	if (uploading.value) return;
	uni.chooseImage({
		count: 1,
		success: async (res) => {
			uploading.value = true;
			error.value = "";
			try {
				const file = res.tempFiles[0] as any;
				const url = await upload({ path: file.path || res.tempFilePaths[0] });
				await user.update({ avatarUrl: url });
				uni.showToast({ title: "头像已更新", icon: "success" });
			} catch (e: any) {
				error.value = e?.message || "头像更新失败，请重试";
			} finally {
				uploading.value = false;
			}
		},
	});
}
onLoad((q) => {
	account.value = q?.view === "account";
});
</script>
<style scoped lang="scss">
.profile-panel {
	padding: 28rpx 30rpx;
}
.profile-avatar {
	width: 88rpx;
	height: 88rpx;
}
.profile-value {
	color: var(--qm-muted);
	font-size: 26rpx;
}
.profile-menu-icon {
	width: 38rpx;
	height: 38rpx;
	flex-shrink: 0;
}
.profile-menu .qm-row {
	min-height: 108rpx;
}
</style>
