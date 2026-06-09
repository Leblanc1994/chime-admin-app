<template>
	<cl-page background-color="#f6f4ef">
		<cl-topbar :border="false" background-color="transparent" />

		<view class="page-login">
			<view class="page-login__bg">
				<view class="page-login__orb page-login__orb--left"></view>
				<view class="page-login__orb page-login__orb--right"></view>
			</view>

			<view class="login-box">
				<view class="brand">
					<view class="brand__logo">
						<image src="/static/logo.png" mode="aspectFit" />
					</view>

					<text class="brand__name">{{ app.info.name }}</text>
				</view>

				<text class="brand__desc">千绵美学管理系统移动端</text>

				<view class="panel">
					<text class="panel__title">欢迎登录</text>
					<text class="panel__subtitle">
						使用管理员账号进入移动工作台，会员档案、次卡和门店数据会在这里同步展开
					</text>

					<view class="field">
						<text class="field__label">用户名</text>
						<cl-input
							v-model="form.username"
							:border="false"
							:clearable="false"
							:font-size="30"
							background-color="transparent"
							placeholder="请输入管理员用户名"
							confirm-type="next"
						/>
					</view>

					<view class="field">
						<text class="field__label">密码</text>
						<cl-input
							v-model="form.password"
							:border="false"
							:clearable="false"
							:password="passwordHidden"
							:font-size="30"
							background-color="transparent"
							placeholder="请输入密码"
							confirm-type="next"
						>
							<template #append>
								<text class="field__toggle" @tap.stop="togglePassword">
									{{ passwordHidden ? "显示" : "隐藏" }}
								</text>
							</template>
						</cl-input>
					</view>

					<view class="field">
						<text class="field__label">验证码</text>

						<view class="captcha-row">
							<view class="captcha-row__input">
								<cl-input
									v-model="form.verifyCode"
									:border="false"
									:clearable="false"
									:font-size="30"
									background-color="transparent"
									placeholder="请输入验证码"
									confirm-type="done"
									@confirm="adminLogin"
								/>
							</view>

							<view class="captcha-box" @tap="refreshCaptcha()">
								<image v-if="captcha.image" :src="captcha.image" mode="scaleToFill" />
								<text v-else>{{ captchaLoading ? "加载中" : "刷新验证码" }}</text>
							</view>
						</view>
					</view>

					<cl-button
						fill
						type="primary"
						:height="92"
						:font-size="30"
						:loading="loading"
						@tap="adminLogin"
					>
						登录
					</cl-button>

					<text class="panel__hint" @tap="refreshCaptcha()">看不清验证码？点击右侧图片刷新</text>
				</view>
			</view>

			<view class="copyright">Copyright © CHIME</view>
		</view>
	</cl-page>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { onReady } from "@dcloudio/uni-app";
import { useApp, useCool, useStore } from "/@/cool";
import { useUi } from "/$/cool-ui";

const { service, router, storage } = useCool();
const { user } = useStore();
const app = useApp();
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
	padding: 30rpx 30rpx 70rpx;
	box-sizing: border-box;
	overflow: hidden;
}

.page-login__bg {
	position: absolute;
	inset: 0;
	pointer-events: none;
}

.page-login__orb {
	position: absolute;
	border-radius: 50%;
	filter: blur(10rpx);
}

.page-login__orb--left {
	left: -120rpx;
	top: 120rpx;
	width: 380rpx;
	height: 380rpx;
	background: rgba(44, 49, 66, 0.1);
}

.page-login__orb--right {
	right: -100rpx;
	top: 420rpx;
	width: 320rpx;
	height: 320rpx;
	background: rgba(187, 163, 120, 0.12);
}

.login-box {
	position: relative;
	z-index: 1;
	padding-top: 40rpx;
}

.brand {
	display: flex;
	align-items: center;
	justify-content: center;
}

.brand__logo {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 96rpx;
	height: 96rpx;
	margin-right: 22rpx;
	border-radius: 22rpx;
	background: #2c3142;
	box-shadow: 0 18rpx 36rpx rgba(44, 49, 66, 0.18);

	image {
		width: 62rpx;
		height: 62rpx;
	}
}

.brand__name {
	font-size: 52rpx;
	font-weight: 700;
	letter-spacing: 4rpx;
	color: #2c3142;
	font-family: "Baskerville", "Times New Roman", serif;
}

.brand__desc {
	display: block;
	margin-top: 22rpx;
	text-align: center;
	font-size: 26rpx;
	letter-spacing: 2rpx;
	color: #6f7481;
}

.panel {
	margin-top: 54rpx;
	padding: 42rpx 34rpx 38rpx;
	border-radius: 34rpx;
	background: rgba(255, 255, 255, 0.84);
	border: 1rpx solid rgba(255, 255, 255, 0.92);
	box-shadow: 0 24rpx 60rpx rgba(44, 49, 66, 0.08);
	backdrop-filter: blur(20rpx);
}

.panel__title {
	display: block;
	font-size: 40rpx;
	font-weight: 700;
	color: #2c3142;
}

.panel__subtitle {
	display: block;
	margin-top: 14rpx;
	font-size: 24rpx;
	line-height: 1.8;
	color: #7c818d;
}

.panel__hint {
	display: block;
	margin-top: 24rpx;
	font-size: 22rpx;
	text-align: center;
	color: #7c818d;
}

.field {
	margin-top: 28rpx;
	padding: 8rpx 24rpx;
	border-radius: 24rpx;
	background: #f7f7f6;
	border: 1rpx solid rgba(44, 49, 66, 0.06);
}

.field__label {
	display: block;
	padding: 16rpx 0 8rpx;
	font-size: 22rpx;
	color: #7c818d;
	letter-spacing: 2rpx;
}

.field__toggle {
	padding: 0 6rpx;
	font-size: 24rpx;
	font-weight: 600;
	color: #2c3142;
}

.captcha-row {
	display: flex;
	align-items: center;
	gap: 18rpx;
	padding-bottom: 12rpx;
}

.captcha-row__input {
	flex: 1;
	min-width: 0;
}

.captcha-box {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	width: 210rpx;
	height: 88rpx;
	border-radius: 18rpx;
	overflow: hidden;
	background: #ece8de;
	color: #6f7481;
	font-size: 22rpx;

	image {
		width: 100%;
		height: 100%;
	}
}

.copyright {
	margin-top: 50rpx;
	text-align: center;
	font-size: 22rpx;
	color: #9ca1ab;
}
</style>
