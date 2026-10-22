<template>
	<qm-page title="门店登录" :busy="loading"
		><view class="login-brand"
			><image src="/static/business/chime-mark.png" mode="aspectFit" /><text>千绵美学</text
			><text>CHIME · BEAUTY STUDIO</text></view
		><text class="login-title">欢迎回来</text
		><text class="qm-intro">登录门店账号，开始今天的工作。</text
		><view class="qm-field"
			><text class="qm-label">登录账号<text class="qm-required">*</text></text
			><cl-input
				v-model.trim="form.username"
				placeholder="请输入门店账号"
				:maxlength="64"
				:disabled="loading"
				confirm-type="next" /></view
		><view class="qm-field"
			><text class="qm-label">密码<text class="qm-required">*</text></text
			><cl-input
				v-model="form.password"
				:password="passwordHidden"
				placeholder="请输入密码"
				:disabled="loading"
				:maxlength="64"
				confirm-type="next"
				><template #append
					><button
						class="login-password-toggle"
						:disabled="loading"
						@tap.stop="passwordHidden = !passwordHidden"
					>
						{{ passwordHidden ? "显示" : "隐藏" }}
					</button></template
				></cl-input
			></view
		><view class="qm-field"
			><text class="qm-label">验证码<text class="qm-required">*</text></text
			><view class="login-captcha"
				><cl-input
					v-model.trim="form.verifyCode"
					placeholder="请输入验证码"
					:disabled="loading"
					:maxlength="12"
					confirm-type="done"
					@confirm="login"
				/><button
					aria-label="刷新验证码"
					:disabled="loading || captchaLoading"
					@tap="refreshCaptcha"
				>
					<image v-if="captchaImage" :src="captchaImage" mode="scaleToFill" /><text
						v-else
						>{{ captchaLoading ? "加载中…" : "点击刷新" }}</text
					>
				</button></view
			><text class="qm-hint">看不清时，点击图片刷新验证码</text></view
		><view v-if="error" class="qm-error" role="alert">{{ error }}</view
		><template #footer
			><qm-button :loading="loading" @click="login">登录</qm-button
			><view class="login-docs"
				><button @tap="doc('userAgreement', '用户协议')">用户协议</button><text>与</text
				><button @tap="doc('privacyPolicy', '隐私政策')">隐私政策</button></view
			></template
		></qm-page
	>
</template>
<script setup lang="ts">
import { ref, reactive } from "vue";
import { onReady } from "@dcloudio/uni-app";
import { useCool, useStore } from "/@/cool";
import QmPage from "../index/components/qm-page.vue";
import QmButton from "../index/components/qm-button.vue";
const { service, router, storage } = useCool();
const { user } = useStore();
const loading = ref(false),
	captchaLoading = ref(false),
	passwordHidden = ref(true),
	captchaImage = ref(""),
	error = ref("");
const form = reactive({
	username: storage.get("username") || "",
	password: "",
	captchaId: "",
	verifyCode: "",
});
async function refreshCaptcha() {
	if (captchaLoading.value || loading.value) return;
	captchaLoading.value = true;
	try {
		const result: any = await service.base.open.captcha({ width: 150, height: 50 });
		form.captchaId = result?.captchaId || "";
		captchaImage.value = result?.data || result?.image || "";
		if (!form.captchaId || !captchaImage.value) throw new Error("验证码内容不完整，请重新刷新");
	} catch (e: any) {
		form.captchaId = "";
		captchaImage.value = "";
		error.value = e?.message || "验证码加载失败，请重试";
	} finally {
		captchaLoading.value = false;
	}
}
async function login() {
	if (loading.value) return;
	error.value = "";
	if (!form.username) error.value = "请填写门店账号";
	else if (!form.password) error.value = "请填写密码";
	else if (!form.verifyCode) error.value = "请填写验证码";
	else if (!form.captchaId) error.value = "请先刷新验证码";
	if (error.value) return;
	loading.value = true;
	let retryCaptcha = false;
	try {
		const token = await service.base.open.login({ ...form });
		user.setToken(token);
		await user.get();
		if (!user.token || !user.info) throw new Error("登录状态获取失败，请重试");
		storage.set("username", form.username);
		router.nextLogin("admin");
	} catch (e: any) {
		error.value = e?.message || "登录失败，请重试";
		form.verifyCode = "";
		retryCaptcha = true;
	} finally {
		loading.value = false;
		if (retryCaptcha) await refreshCaptcha();
	}
}
function doc(key: string, title: string) {
	router.push({ path: "/pages/user/doc", query: { key, title }, isGuard: false });
}
onReady(refreshCaptcha);
</script>
<style scoped lang="scss">
.login-brand {
	display: flex;
	align-items: center;
	flex-direction: column;
	padding: 22rpx 0 56rpx;
	image {
		width: 138rpx;
		height: 138rpx;
		margin: 12rpx 0 30rpx;
	}
	text {
		font-size: 42rpx;
		letter-spacing: 10rpx;
		font-weight: 550;
	}
	text + text {
		font-size: 21rpx;
		color: #98866b;
		letter-spacing: 6rpx;
		font-weight: 400;
		margin-top: 20rpx;
	}
}
.login-title {
	display: block;
	font-size: 40rpx;
	font-weight: 550;
	margin: 4rpx 0 18rpx;
}
.login-captcha {
	display: flex;
	align-items: center;
	gap: 18rpx;
	> cl-input {
		flex: 1;
		min-width: 0;
	}
	> button {
		width: 184rpx;
		height: 92rpx;
		flex-shrink: 0;
		background: #ece4f3;
		border: 1px solid #ddd0e9;
		border-radius: 18rpx;
		color: #6741b1;
		font-size: 23rpx;
		overflow: hidden;
		image {
			width: 100%;
			height: 100%;
			display: block;
		}
	}
}
.login-password-toggle {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 80rpx;
	min-width: 70rpx;
	font-size: 23rpx;
	color: #6741b1;
}
.login-docs {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 18rpx;
	font-size: 21rpx;
	color: #615e6a;
	margin-top: 16rpx;
	button {
		display: flex;
		align-items: center;
		color: #6741b1;
		min-height: 70rpx;
	}
}
</style>
