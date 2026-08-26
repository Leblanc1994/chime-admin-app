<template>
	<cl-page status-bar-background="transparent" background-color="#fbfbfe">
		<cl-topbar :border="false" background-color="transparent" />

		<view class="page-login">
			<view class="page-login__background">
				<view class="page-login__glow page-login__glow--top"></view>
				<view class="page-login__glow page-login__glow--bottom"></view>
			</view>

			<view class="login-box">
				<view class="login-hero">
					<view class="login-hero__glow login-hero__glow--one"></view>
					<view class="login-hero__glow login-hero__glow--two"></view>

					<view class="brand">
						<view class="brand__logo"><image src="/static/logo.png" mode="aspectFit" /></view>
						<view>
							<text class="brand__eyebrow">CHIME</text>
							<text class="brand__name">门店管理后台</text>
						</view>
					</view>

					<view class="login-hero__copy">
						<text>把经营管理，放在手边</text>
						<text>会员、卡项与消费动态，随时清晰掌握</text>
					</view>
				</view>

				<view class="panel">
					<view class="panel__heading">
						<view>
							<text class="panel__title">欢迎回来</text>
							<text class="panel__subtitle">请使用管理员账号登录</text>
						</view>
						<view class="panel__badge"><text></text><text>在线</text></view>
					</view>

					<view class="field">
						<view class="field__label"><text class="field__icon field__icon--user"></text><text>用户名</text></view>
						<cl-input v-model="form.username" :border="false" :clearable="false" :font-size="30" background-color="transparent" placeholder="请输入管理员用户名" confirm-type="next" />
					</view>

					<view class="field">
						<view class="field__label"><text class="field__icon field__icon--lock"></text><text>密码</text></view>
						<cl-input v-model="form.password" :border="false" :clearable="false" :password="passwordHidden" :font-size="30" background-color="transparent" placeholder="请输入密码" confirm-type="next">
							<template #append><text class="field__toggle" @tap.stop="togglePassword">{{ passwordHidden ? "显示" : "隐藏" }}</text></template>
						</cl-input>
					</view>

					<view class="field">
						<view class="field__label"><text class="field__icon field__icon--shield"></text><text>验证码</text></view>
						<view class="captcha-row">
							<view class="captcha-row__input"><cl-input v-model="form.verifyCode" :border="false" :clearable="false" :font-size="30" background-color="transparent" placeholder="请输入验证码" confirm-type="done" @confirm="adminLogin" /></view>
							<view class="captcha-box" @tap="refreshCaptcha()"><image v-if="captcha.image" :src="captcha.image" mode="scaleToFill" /><text v-else>{{ captchaLoading ? "加载中" : "刷新验证码" }}</text></view>
						</view>
					</view>

					<cl-button class="login-submit" fill type="primary" :height="92" :font-size="30" :loading="loading" @tap="adminLogin">进入工作台</cl-button>

					<view class="panel__footer"><text class="panel__hint" @tap="refreshCaptcha()">看不清？点击验证码图片刷新</text><text>安全登录</text></view>
				</view>
			</view>

			<view class="copyright"><text>CHIME</text><text>·</text><text>让门店管理更从容</text></view>
		</view>
	</cl-page>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { onReady } from "@dcloudio/uni-app";
import { useCool, useStore } from "/@/cool";
import { useUi } from "/$/cool-ui";

const { service, router, storage } = useCool();
const { user } = useStore();
const ui = useUi();

const loading = ref(false);
const captchaLoading = ref(false);
const passwordHidden = ref(true);

const form = reactive({
	username: storage.get("username") || "",
	password: "",
	captchaId: "",
	verifyCode: "",
});

const captcha = reactive({
	image: "",
});

function togglePassword() {
	passwordHidden.value = !passwordHidden.value;
}

async function refreshCaptcha(showError = false) {
	captchaLoading.value = true;

	try {
		const res = await service.base.open.captcha({
			width: 150,
			height: 45,
		});

		form.captchaId = res?.captchaId || "";
		captcha.image = res?.data || "";

		if (!captcha.image && showError) {
			ui.showTips("验证码获取失败，请稍后重试");
		}
	} catch (err: any) {
		if (showError) {
			ui.showTips(err?.message || "验证码获取失败，请稍后重试");
		}
	} finally {
		captchaLoading.value = false;
	}
}

async function adminLogin() {
	if (!form.username) {
		return ui.showTips("请输入管理员用户名");
	}

	if (!form.password) {
		return ui.showTips("请输入密码");
	}

	if (!form.verifyCode) {
		return ui.showTips("请输入验证码");
	}

	if (!form.captchaId) {
		await refreshCaptcha(true);
		return ui.showTips("验证码已失效，请重新输入");
	}

	loading.value = true;

	try {
		const token = await service.base.open.login({
			username: form.username,
			password: form.password,
			captchaId: form.captchaId,
			verifyCode: form.verifyCode,
		});

		user.setToken(token);
		await user.get();
		storage.set("username", form.username);
		router.nextLogin("admin");
	} catch (err: any) {
		form.verifyCode = "";
		await refreshCaptcha();
		ui.showTips(err?.message || "登录失败，请稍后重试");
	} finally {
		loading.value = false;
	}
}

onReady(() => {
	refreshCaptcha();
});
</script>

<style lang="scss" scoped>
.page-login {
	position: relative;
	min-height: 100%;
	padding: 24rpx 30rpx 62rpx;
	box-sizing: border-box;
	overflow: hidden;
	background: linear-gradient(156deg, #fbfdff 0%, #edf7ff 34%, #f8f8ff 72%, #fbfbfe 100%);
}

.page-login__background { position: absolute; inset: 0; pointer-events: none; }
.page-login__glow { position: absolute; border-radius: 50%; }
.page-login__glow--top { top: 180rpx; right: -150rpx; width: 360rpx; height: 360rpx; background: rgba(142, 104, 255, 0.12); }
.page-login__glow--bottom { bottom: -120rpx; left: -130rpx; width: 360rpx; height: 360rpx; background: rgba(80, 190, 255, 0.09); }

.login-box { position: relative; z-index: 1; max-width: 690rpx; margin: 0 auto; }

.login-hero {
	position: relative;
	min-height: 318rpx;
	padding: 46rpx 42rpx 74rpx;
	border-radius: 30rpx 30rpx 44rpx 44rpx;
	box-sizing: border-box;
	overflow: hidden;
	background: linear-gradient(136deg, #6840f4 0%, #8053ff 57%, #a879ff 100%);
	box-shadow: 0 22rpx 42rpx rgba(85, 53, 204, 0.2);
}

.login-hero::after { content: ""; position: absolute; left: -8%; right: -8%; bottom: -50rpx; height: 104rpx; border-radius: 50%; background: rgba(49, 26, 151, 0.18); }
.login-hero__glow { position: absolute; border-radius: 50%; pointer-events: none; }
.login-hero__glow--one { top: -140rpx; right: -82rpx; width: 380rpx; height: 380rpx; background: rgba(224, 200, 255, 0.25); }
.login-hero__glow--two { bottom: -158rpx; left: -28rpx; width: 280rpx; height: 250rpx; background: rgba(44, 23, 170, 0.25); filter: blur(16rpx); }

.brand { position: relative; z-index: 1; display: flex; align-items: center; }
.brand__logo {
	display: flex; align-items: center; justify-content: center; width: 76rpx; height: 76rpx; margin-right: 18rpx;
	border-radius: 22rpx; background: rgba(255, 255, 255, 0.18); border: 1rpx solid rgba(255, 255, 255, 0.34);
	image { width: 50rpx; height: 50rpx; }
}
.brand__eyebrow, .brand__name { display: block; color: #fff; }
.brand__eyebrow { font-size: 17rpx; font-weight: 800; letter-spacing: 3.4rpx; color: rgba(255, 255, 255, 0.68); }
.brand__name { margin-top: 5rpx; font-size: 29rpx; font-weight: 750; letter-spacing: 0.5rpx; }

.login-hero__copy { position: relative; z-index: 1; margin-top: 50rpx; }
.login-hero__copy text { display: block; }
.login-hero__copy text:first-child { font-size: 38rpx; font-weight: 800; letter-spacing: 0.6rpx; color: #fff; }
.login-hero__copy text:last-child { margin-top: 13rpx; font-size: 21rpx; color: rgba(255, 255, 255, 0.73); }

.panel { position: relative; z-index: 2; margin: -36rpx 18rpx 0; padding: 38rpx 30rpx 32rpx; border-radius: 26rpx; background: #fff; box-shadow: 0 16rpx 42rpx rgba(53, 40, 96, 0.12); }
.panel__heading { display: flex; align-items: flex-start; justify-content: space-between; }
.panel__title { display: block; font-size: 40rpx; font-weight: 700; color: #2b273c; }
.panel__subtitle { display: block; margin-top: 9rpx; font-size: 22rpx; color: #918ba1; }
.panel__badge { display: flex; align-items: center; gap: 7rpx; margin-top: 8rpx; padding: 8rpx 11rpx; border-radius: 999rpx; background: #effbf6; color: #2b9e72; font-size: 17rpx; }
.panel__badge text:first-child { width: 9rpx; height: 9rpx; border-radius: 50%; background: #31bd8b; }

.field { margin-top: 25rpx; padding: 9rpx 22rpx; border-radius: 18rpx; background: #f7f7fc; border: 1rpx solid #edeaf5; }
.field__label { display: flex; align-items: center; gap: 10rpx; padding: 13rpx 0 5rpx; font-size: 20rpx; color: #878194; letter-spacing: 1rpx; }
.field__icon { position: relative; display: inline-block; width: 19rpx; height: 19rpx; box-sizing: border-box; border: 2rpx solid #8a6bef; }
.field__icon--user { border-radius: 50%; transform: scale(0.65) translateY(-5rpx); }
.field__icon--user::after { content: ""; position: absolute; left: -7rpx; top: 23rpx; width: 29rpx; height: 17rpx; border: 3rpx solid #8a6bef; border-bottom: 0; border-radius: 18rpx 18rpx 0 0; }
.field__icon--lock { width: 18rpx; height: 15rpx; margin-top: 7rpx; border-radius: 3rpx; }
.field__icon--lock::before { content: ""; position: absolute; left: 3rpx; top: -13rpx; width: 8rpx; height: 10rpx; border: 2rpx solid #8a6bef; border-bottom: 0; border-radius: 8rpx 8rpx 0 0; }
.field__icon--shield { border-radius: 5rpx 5rpx 9rpx 9rpx; transform: rotate(45deg) scale(0.74); }
.field__toggle { padding: 0 6rpx; font-size: 24rpx; font-weight: 600; color: #7651e9; }

.captcha-row { display: flex; align-items: center; gap: 15rpx; padding-bottom: 9rpx; }
.captcha-row__input { flex: 1; min-width: 0; }
.captcha-box { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 190rpx; height: 80rpx; border-radius: 13rpx; overflow: hidden; background: #eee9ff; color: #746b8a; font-size: 22rpx; }
.captcha-box image { width: 100%; height: 100%; }

.login-submit { margin-top: 32rpx; border-radius: 16rpx !important; background: #7048f8 !important; box-shadow: 0 12rpx 22rpx rgba(100, 61, 224, 0.28); }
.panel__footer { display: flex; align-items: center; justify-content: space-between; margin-top: 22rpx; font-size: 19rpx; color: #a09aa9; }
.panel__hint { color: #827a95; }

.copyright { display: flex; align-items: center; justify-content: center; gap: 12rpx; margin-top: 38rpx; text-align: center; font-size: 19rpx; color: #9d98a8; }
.copyright text:first-child { font-weight: 800; letter-spacing: 1.6rpx; color: #7766ba; }
</style>
