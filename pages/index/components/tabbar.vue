<template>
	<cl-footer :flex="false" background-color="#fffefd" :z-index="399" :padding="0"
		><view class="chime-business qm-tabbar" role="navigation" aria-label="主要导航"
			><button
				v-for="(item, index) in list"
				:key="item.pagePath"
				:aria-label="item.text"
				:aria-current="item.active ? 'page' : undefined"
				:class="{ 'is-active': item.active }"
				@tap="router.switchTab(item.pagePath.split('/').pop() || 'home')"
			>
				<image :src="item.icon" mode="aspectFit" /><text>{{ item.text }}</text>
			</button></view
		></cl-footer
	>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useCool } from "/@/cool";
const { router } = useCool();
defineProps<{ design?: boolean }>();
const path = ref(router.path);
onShow(() => (path.value = router.path));
const list = computed(() =>
	router.tabs.map((item, i) => {
		const active = (path.value || "").replace(/^\//, "") === item.pagePath;
		const prefix = active
			? ["home", "members", "workbench", "my"][i]
			: ["workbench", "workbench", "home", "workbench"][i];
		return {
			...item,
			active,
			text: (item.text || "").replace(/%/g, ""),
			icon:
				"/static/business/" +
				prefix +
				"-imgIcon" +
				["Home", "Users", "Grid", "User"][i] +
				".svg",
		};
	}),
);
</script>
<style scoped lang="scss">
.qm-tabbar {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	padding: 12rpx 20rpx calc(18rpx + env(safe-area-inset-bottom));
	background: #fffefd;
	border-top: 1px solid #e4e3e9;
	button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		min-height: 100rpx;
		color: #82758c;
		font-size: 21rpx;
		image {
			width: 44rpx;
			height: 44rpx;
		}
	}
	.is-active {
		color: #6741b1;
	}
}
</style>
