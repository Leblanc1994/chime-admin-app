<template>
	<view
		class="qm-main-header"
		:class="{ 'qm-main-header--mini': navigation.enabled }"
		:style="
			navigation.enabled
				? {
						top: navigation.statusBarHeight + 'px',
						minHeight: navigation.barHeight + 'px',
						paddingRight: 'calc(' + navigation.sideInset + 'px - 38rpx)',
					}
				: {}
		"
	>
		<slot />
		<view
			v-if="navigation.enabled"
			class="qm-main-header__status"
			:style="{ height: navigation.statusBarHeight + 'px' }"
		/>
	</view>
</template>
<script lang="ts">
export default { options: { virtualHost: true } };
</script>
<script setup lang="ts">
import { useMiniNavigation } from "../utils/use-mini-navigation";
const navigation = useMiniNavigation();
</script>
<style scoped lang="scss">
.qm-main-header--mini {
	position: sticky;
	z-index: 40;
	display: flex;
	align-items: center;
	box-sizing: border-box;
	background: #f8f5f0;
}
.qm-main-header__status {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background: #f8f5f0;
}
</style>
