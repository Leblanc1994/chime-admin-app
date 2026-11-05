<template>
	<view class="qm-quick-actions" aria-label="日常业务">
		<button class="qm-quick-actions__primary" @tap="run('deduct')">
			<image :src="primaryIcon" mode="aspectFit" />
			<view
				><text>会员扣次</text
				><image src="/static/business/v53/chevron-light.svg" mode="aspectFit"
			/></view>
			<text class="qm-quick-actions__hint">先选会员</text>
		</button>
		<view class="qm-quick-actions__secondary">
			<button v-for="item in secondary" :key="item.action" @tap="run(item.action)">
				<image :src="item.icon" mode="aspectFit" />
				<text>{{ item.label }}</text>
			</button>
		</view>
	</view>
	<qm-member-business-sheet ref="businessSheet" @saved="emit('saved')" />
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import QmMemberBusinessSheet from "./qm-member-business-sheet.vue";
const businessSheet = ref<InstanceType<typeof QmMemberBusinessSheet>>();
import { useCool } from "/@/cool";
const props = defineProps<{ appointmentShortcut?: boolean }>();
const { router } = useCool();
const emit = defineEmits<{ (e: "saved"): void }>();
const iconPath = (name: string) =>
	props.appointmentShortcut
		? `/static/business/v54/quick-${name}.png`
		: `/static/business/v53/quick-${name}.svg`;
const primaryIcon = computed(() => iconPath("deduct"));
const secondary = computed(() => [
	props.appointmentShortcut
		? { label: "预约日程", action: "appointment", icon: iconPath("appointment") }
		: { label: "会员开卡", action: "openCard", icon: iconPath("open") },
	{ label: "散客消费", action: "guest", icon: iconPath("receipt") },
	{ label: "新增会员", action: "addMember", icon: iconPath("member") },
]);
function run(action: string) {
	if (action === "appointment") return router.push("/pages/index/appointment");
	if (action === "guest") return router.push("/pages/index/consume-form");
	if (action === "addMember") return businessSheet.value?.openCreate();
	router.push({ path: "/pages/index/member-select", query: { purpose: action } });
}
</script>
<style scoped lang="scss">
.qm-quick-actions {
	display: flex;
	gap: 20rpx;
	width: 100%;
	margin: 30rpx 0;
}
.qm-quick-actions__primary {
	display: flex;
	flex: 0 0 232rpx;
	flex-direction: column;
	align-items: flex-start;
	justify-content: center;
	padding: 18rpx 20rpx !important;
	min-height: 184rpx;
	box-sizing: border-box;
	background: var(--qm-brand) !important;
	border-radius: 38rpx !important;
	color: var(--qm-on-brand) !important;
	text-align: left;
}
.qm-quick-actions__primary > image {
	width: 62rpx;
	height: 62rpx;
	margin-bottom: 6rpx;
}
.qm-quick-actions__primary > view {
	display: flex;
	width: 100%;
	align-items: center;
	justify-content: space-between;
	font-size: 29rpx;
	font-weight: 500;
	line-height: 1.4;
}
.qm-quick-actions__primary > view image {
	width: 25rpx;
	height: 25rpx;
}
.qm-quick-actions__hint {
	font-size: 21rpx;
	line-height: 1.5;
	margin-top: 4rpx;
}
.qm-quick-actions__secondary {
	display: flex;
	flex: 1;
	min-width: 0;
	gap: 8rpx;
	padding: 12rpx 8rpx;
	background: var(--qm-surface);
	border-radius: 38rpx;
}
.qm-quick-actions__secondary button {
	display: flex;
	flex: 1;
	min-width: 0;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 18rpx;
	font-size: 24rpx;
	white-space: nowrap;
	font-weight: 500;
}
.qm-quick-actions__secondary image {
	width: 62rpx;
	height: 62rpx;
}
@media (max-width: 350px) {
	.qm-quick-actions__primary {
		flex-basis: 210rpx;
	}
	.qm-quick-actions__secondary button {
		font-size: 23rpx;
	}
}
</style>
