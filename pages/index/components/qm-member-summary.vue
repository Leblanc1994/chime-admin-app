<template>
	<view class="qm-member-summary">
		<view class="qm-avatar">{{ name.slice(0, 1) }}</view>
		<view class="qm-member-summary__copy"
			><text class="qm-identity__name">{{ name }}</text
			><text class="qm-identity__meta">{{ phone || "未填写手机号" }}</text></view
		>
		<button v-if="changeable" class="qm-member-summary__change" @tap="emit('change')">
			更换
		</button>
	</view>
</template>
<script setup lang="ts">
defineProps<{ name: string; phone?: string; changeable?: boolean }>();
const emit = defineEmits<{ (event: "change"): void }>();
</script>
<style scoped lang="scss">
.qm-member-summary {
	display: flex;
	align-items: center;
	gap: 22rpx;
	padding: 26rpx;
	min-height: 134rpx;
	box-sizing: border-box;
	background: var(--qm-surface);
	border-radius: 38rpx;
	margin-bottom: 30rpx;
}
.qm-member-summary__copy {
	flex: 1;
	min-width: 0;
}
.qm-member-summary__change {
	min-width: 72rpx;
	min-height: 80rpx;
	color: var(--qm-brand) !important;
	font-size: 24rpx !important;
}
</style>
