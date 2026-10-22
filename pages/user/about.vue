<template>
	<qm-page title="关于千绵美学"
		><view class="about-brand"
			><image src="/static/business/chime-mark.png" mode="aspectFit" /><text>千绵美学</text
			><text>门店管理</text></view
		><view class="qm-panel"
			><text class="about-copy">让每一次服务都有记录，让每一位顾客都被用心照顾。</text
			><view class="qm-kv"><text>产品</text><text>千绵美学门店管理</text></view></view
		><view class="qm-panel about-links"
			><button
				v-for="d in docs"
				:key="d.key"
				class="qm-row"
				@tap="
					router.push({ path: '/pages/user/doc', query: { key: d.key, title: d.label } })
				"
			>
				<view class="qm-row__copy"
					><text>{{ d.label }}</text></view
				><image class="qm-chevron" src="/static/business/v53/chevron.svg" /></button></view
	></qm-page>
</template>
<script setup lang="ts">
import { useCool } from "/@/cool";
import QmPage from "../index/components/qm-page.vue";
const { router } = useCool();
const docs = [
	{ key: "userAgreement", label: "用户协议" },
	{ key: "privacyPolicy", label: "隐私政策" },
];
</script>
<style scoped lang="scss">
.about-brand {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 70rpx 0;
	image {
		width: 170rpx;
		height: 170rpx;
		margin-bottom: 30rpx;
	}
	text {
		font-size: 46rpx;
		letter-spacing: 10rpx;
		color: #98866b;
	}
	text + text {
		font-size: 24rpx;
		letter-spacing: 5rpx;
		color: #615e6a;
		margin-top: 16rpx;
	}
}
.about-copy {
	display: block;
	font-size: 29rpx;
	line-height: 1.9;
	margin: 4rpx 0 32rpx;
}
.about-links {
	padding: 0 28rpx;
}
</style>
