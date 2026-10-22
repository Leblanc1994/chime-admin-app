<template>
	<cl-page background-color="#f8f5f0" status-bar-background="#f8f5f0">
		<view class="chime-business main-page">
			<qm-main-header
				><view class="main-heading"
					><text>千绵美学</text><text>工作台</text></view
				></qm-main-header
			>
			<view class="wb-store"
				><image src="/static/business/chime-mark.png" mode="aspectFit" /><view
					><text>千绵美学</text><text>{{ profile }} · {{ role }}</text></view
				><text>门店管理</text></view
			>
			<text class="qm-heading">日常业务</text><qm-quick-actions />
			<text class="qm-heading">业务查询</text>
			<view class="qm-menu"
				><button v-for="item in business" :key="item.label" class="qm-row" @tap="go(item)">
					<view class="qm-menu-icon"
						><image
							:src="'/static/business/v53/' + item.icon + '.svg'"
							mode="aspectFit" /></view
					><view class="qm-row__copy"
						><text>{{ item.label }}</text
						><text>{{ item.desc }}</text></view
					><image class="qm-chevron" src="/static/business/v53/chevron.svg" /></button
			></view>
			<text class="qm-heading">门店管理</text
			><view class="qm-menu"
				><button class="qm-row" @tap="router.push('/pages/index/staff')">
					<view class="qm-menu-icon"
						><image src="/static/business/v53/user.svg" mode="aspectFit" /></view
					><view class="qm-row__copy"
						><text>员工管理</text><text>员工账号与在职状态</text></view
					><image class="qm-chevron" src="/static/business/v53/chevron.svg" /></button
			></view>
			<template v-if="platformAdmin"
				><text class="qm-heading">平台运营</text
				><view class="qm-menu"
					><button
						v-for="item in platform"
						:key="item.path"
						class="qm-row"
						@tap="router.push(item.path)"
					>
						<view class="qm-row__copy"
							><text>{{ item.label }}</text></view
						><image
							class="qm-chevron"
							src="/static/business/v53/chevron.svg"
						/></button></view
			></template>
			<view class="qm-signoff"><text>千绵美学 · 门店工作台</text></view>
		</view>
		<!-- #ifndef MP-WEIXIN -->
		<tabbar design />
		<!-- #endif -->
	</cl-page>
</template>
<script setup lang="ts">
import QmMainHeader from "./components/qm-main-header.vue";
import { computed } from "vue";
import { useCool, useStore } from "/@/cool";
// #ifndef MP-WEIXIN
import Tabbar from "./components/tabbar.vue";
// #endif
import QmQuickActions from "./components/qm-quick-actions.vue";
const { router } = useCool();
const { user } = useStore();
const profile = computed(
	() => user.info?.nickName || user.info?.name || user.info?.username || "门店账号",
);
const role = computed(() => {
	const v = (user.info as any)?.role;
	return v === "staff"
		? "店员"
		: v === "platform_admin"
			? "平台管理员"
			: v === "manager"
				? "店长"
				: "门店账号";
});
const platformAdmin = computed(() => (user.info as any)?.role === "platform_admin");
const business = [
	{
		label: "消费记录",
		desc: "按日期查看会员与散客消费",
		icon: "receipt",
		path: "/pages/index/consume-statistics",
	},
	{ label: "会员档案", desc: "会员资料、次卡与余次记录", icon: "users", tab: "member" },
];
const platform = [
	{ label: "门店管理", path: "/pages/index/store-manage" },
	{ label: "服务方案", path: "/pages/index/service-scheme" },
	{ label: "门店品牌", path: "/pages/index/store-brand" },
];
function go(item: any) {
	if (item.tab) router.switchTab(item.tab);
	else router.push(item.path);
}
</script>
<style scoped lang="scss">
.main-page {
	min-height: calc(100vh - 140rpx);
	padding: 30rpx 38rpx 24rpx;
	background: var(--qm-paper);
	/* #ifdef MP-WEIXIN */
	padding-top: 0;
	/* #endif */
}
.main-heading {
	width: 100%;
	padding: 6rpx 0 32rpx;
	text {
		display: block;
		font-size: 21rpx;
		color: var(--qm-muted);
	}
	text + text {
		font-size: 50rpx;
		color: var(--qm-deep);
		font-weight: 700;
		margin-top: 8rpx;
		line-height: 1.4;
	}
}
.wb-store {
	display: flex;
	align-items: center;
	gap: 26rpx;
	padding: 30rpx;
	min-height: 170rpx;
	box-sizing: border-box;
	background: var(--qm-cream);
	border-radius: 38rpx;
	image {
		width: 88rpx;
		height: 88rpx;
		flex-shrink: 0;
	}
	> view {
		flex: 1;
		min-width: 0;
		text {
			display: block;
			color: var(--qm-deep);
			font-size: 37rpx;
			font-weight: 700;
		}
		text + text {
			font-size: 24rpx;
			font-weight: 400;
			color: var(--qm-muted);
			margin-top: 8rpx;
		}
	}
	> text {
		font-size: 21rpx;
		color: var(--qm-warning);
	}
}
.main-page .qm-heading {
	font-size: 35rpx;
	margin: 38rpx 0 20rpx;
}
.main-page :deep(.qm-quick-actions) {
	margin: 0;
}
.main-page .qm-menu {
	gap: 16rpx;
}
.main-page .qm-signoff {
	font-size: 21rpx;
	letter-spacing: 0;
	margin: 44rpx 0 20rpx;
}
</style>
