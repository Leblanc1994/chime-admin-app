<template>
	<cl-page status-bar-background="#fff" :background-color="pageBackground">
		<view class="page-brand">
			<!-- 顶部导航（白底） -->
			<view class="page-nav">
				<view class="page-nav__btn" @tap="back">
					<cl-icon name="arrow-left" :size="32" color="#5a5365" />
				</view>
				<text class="page-nav__title">门店品牌</text>
				<view class="page-nav__btn" @tap="openMore">
					<text class="page-nav__more">···</text>
				</view>
			</view>
			<view class="page-nav__hairline"></view>

			<!-- Logo 卡 -->
			<view class="brand-logo">
				<view class="brand-logo__mark">
					<text>{{ form.logoText }}</text>
				</view>
				<view class="brand-logo__texts">
					<text class="brand-logo__title">门店 Logo</text>
					<text class="brand-logo__hint">1:1 正方形 · ≤ 2MB</text>
				</view>
				<view class="brand-logo__btn" @tap="changeLogo">更换</view>
			</view>

			<!-- 表单卡 -->
			<view class="brand-form">
				<view class="brand-form__field">
					<text class="brand-form__label">门店名称</text>
					<input
						v-model="form.name"
						class="brand-form__input"
						placeholder="请输入门店名称"
						placeholder-class="brand-form__placeholder"
					/>
				</view>
				<view class="brand-form__divider"></view>

				<view class="brand-form__field">
					<text class="brand-form__label">门店简称</text>
					<input
						v-model="form.shortName"
						class="brand-form__input"
						placeholder="请输入门店简称"
						placeholder-class="brand-form__placeholder"
					/>
				</view>
				<view class="brand-form__divider"></view>

				<view class="brand-form__field" @tap="pickCategory">
					<text class="brand-form__label">门店品类</text>
					<text class="brand-form__value">{{ form.category }}</text>
					<cl-icon name="arrow-right" :size="24" color="#b8b3bf" />
				</view>
				<view class="brand-form__divider"></view>

				<view class="brand-form__field">
					<text class="brand-form__label">联系电话</text>
					<input
						v-model="form.phone"
						class="brand-form__input"
						placeholder="请输入联系电话"
						placeholder-class="brand-form__placeholder"
					/>
				</view>
				<view class="brand-form__divider"></view>

				<view class="brand-form__field" @tap="pickAddress">
					<text class="brand-form__label">门店地址</text>
					<text class="brand-form__value">{{ form.address }}</text>
					<cl-icon name="arrow-right" :size="24" color="#b8b3bf" />
				</view>
				<view class="brand-form__divider"></view>

				<view class="brand-form__field" @tap="pickHours">
					<text class="brand-form__label">营业时间</text>
					<text class="brand-form__value">{{ form.hours }}</text>
					<cl-icon name="arrow-right" :size="24" color="#b8b3bf" />
				</view>
			</view>

			<!-- 简介卡 -->
			<view class="brand-intro">
				<view class="brand-intro__header">
					<text class="brand-intro__title">门店简介</text>
					<text class="brand-intro__count">{{ form.intro.length }}/100</text>
				</view>
				<textarea
					v-model="form.intro"
					class="brand-intro__input"
					:maxlength="100"
					auto-height
					placeholder="介绍一下你的门店"
					placeholder-class="brand-form__placeholder"
				/>
			</view>

			<!-- 保存 -->
			<view class="brand-save" @tap="save">保存修改</view>
			<text class="brand-save__hint">修改后对会员端展示的同名门店生效</text>
		</view>
	</cl-page>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import { useCool } from "/@/cool";
import { useUi } from "/$/cool-ui";

const { router } = useCool();
const ui = useUi();

const pageBackground = "#f7f7fb";

// Mock 数据（按设计稿 11 门店品牌）。
// TODO: 接入门店品牌 service 后替换。
const form = reactive({
	logoText: "星",
	name: "星漾美肌 · 南山店",
	shortName: "星漾南山",
	category: "美容美体 / 皮肤管理",
	phone: "0755-8866 6688",
	address: "南山区科技园南区 A 座 1F",
	hours: "10:00 - 22:00",
	intro: "专注轻医美与肌肤管理，主打水光焕肤与肩颈舒缓，到店可享会员专属价。",
});

function back() {
	router.back();
}

function openMore() {
	ui.showTips("更多操作即将上线");
}

function changeLogo() {
	ui.showTips("Logo 上传即将上线");
}

function pickCategory() {
	ui.showTips("品类选择即将上线");
}

function pickAddress() {
	ui.showTips("地址选择即将上线");
}

function pickHours() {
	ui.showTips("营业时间设置即将上线");
}

function save() {
	if (!form.name.trim()) {
		ui.showTips("请输入门店名称");
		return;
	}
	// TODO: 调用保存接口
	ui.showTips("已保存");
}
</script>

<style lang="scss" scoped>
.page-brand {
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

/* ── Logo 卡 ──────────────────────────── */
.brand-logo {
	display: flex;
	align-items: center;
	gap: 22rpx;
	margin: 24rpx 24rpx 0;
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
}

.brand-logo__mark {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 112rpx;
	height: 112rpx;
	border-radius: 32rpx;
	background: linear-gradient(145deg, #8158fc, #6841ec);

	text {
		font-size: 44rpx;
		font-weight: 800;
		color: #ffffff;
	}
}

.brand-logo__texts {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	flex: 1;
}

.brand-logo__title {
	font-size: 30rpx;
	font-weight: 800;
	color: #26232c;
}

.brand-logo__hint {
	font-size: 24rpx;
	color: #8c8794;
}

.brand-logo__btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 112rpx;
	height: 64rpx;
	border-radius: 999rpx;
	background: #f1edff;
	font-size: 26rpx;
	font-weight: 700;
	color: #6e44f5;
}

/* ── 表单卡 ───────────────────────────── */
.brand-form {
	margin: 24rpx 24rpx 0;
	padding: 6rpx 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
}

.brand-form__field {
	display: flex;
	align-items: center;
	gap: 20rpx;
	min-height: 96rpx;
	padding: 10rpx 0;
	box-sizing: border-box;
}

.brand-form__label {
	flex-shrink: 0;
	width: 152rpx;
	font-size: 26rpx;
	color: #8c8794;
}

.brand-form__input,
.brand-form__value {
	flex: 1;
	min-width: 0;
	font-size: 28rpx;
	font-weight: 600;
	color: #26232c;
	text-align: left;
}

.brand-form__placeholder {
	color: #b8b3bf;
	font-weight: 400;
}

.brand-form__divider {
	height: 1rpx;
	background: #f2eff4;
}

/* ── 简介卡 ───────────────────────────── */
.brand-intro {
	margin: 24rpx 24rpx 0;
	padding: 28rpx;
	border-radius: 28rpx;
	background: #ffffff;
}

.brand-intro__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 14rpx;
}

.brand-intro__title {
	font-size: 30rpx;
	font-weight: 800;
	color: #26232c;
}

.brand-intro__count {
	font-size: 24rpx;
	color: #a8a3b0;
}

.brand-intro__input {
	width: 100%;
	min-height: 88rpx;
	font-size: 26rpx;
	line-height: 1.6;
	color: #544f5c;
}

/* ── 保存 ─────────────────────────────── */
.brand-save {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 96rpx;
	margin: 36rpx 24rpx 0;
	border-radius: 999rpx;
	background: linear-gradient(145deg, #8158fc, #6841ec);
	font-size: 30rpx;
	font-weight: 800;
	color: #ffffff;
}

.brand-save__hint {
	display: block;
	margin-top: 18rpx;
	text-align: center;
	font-size: 22rpx;
	color: #a8a3b0;
}
</style>
