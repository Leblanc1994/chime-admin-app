<template>
	<view class="qm-card" :class="{ 'is-muted': state !== '可使用' }">
		<image class="qm-card__watermark" src="/static/business/chime-mark.png" mode="aspectFit" />
		<view class="qm-card__heading"
			><image src="/static/business/chime-mark.png" mode="aspectFit" /><text>{{
				card.cardName || "会员次卡"
			}}</text
			><text
				class="qm-tag"
				:class="{ 'is-success': state === '可使用', 'is-warning': state === '已过期' }"
				>{{ state }}</text
			></view
		>
		<view class="qm-card__balance"
			><view
				><text class="qm-card__number">{{ card.remainTimes ?? 0 }}</text
				><text>次可用 / 共 {{ card.totalTimes ?? "—" }} 次</text></view
			><view class="qm-card__expiry"
				><text>{{
					card.expireTime ? card.expireTime.slice(0, 10).replace(/-/g, ".") : "长期有效"
				}}</text
				><text v-if="card.expireTime">到期</text></view
			></view
		>
		<view v-if="showActions || $slots.default" class="qm-card__bottom"
			><template v-if="showActions"
				><button class="qm-card__details" @tap="emit('manage')">
					次卡详情<image
						src="/static/business/v53/chevron.svg"
						mode="aspectFit"
					/></button
				><button
					class="qm-card__deduct"
					:disabled="state !== '可使用'"
					@tap="emit('deduct')"
				>
					扣次
				</button></template
			><slot v-else
		/></view>
	</view>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { cardStatus, type CardAccount } from "../utils/card-policy";
const props = defineProps<{ card: CardAccount; showActions?: boolean }>();
const emit = defineEmits<{ (event: "manage"): void; (event: "deduct"): void }>();
const state = computed(() => cardStatus(props.card));
</script>
<style scoped lang="scss">
.qm-card {
	position: relative;
	padding: 30rpx;
	border: 1px solid #e8d4aa;
	border-radius: 38rpx;
	background: linear-gradient(145deg, #f5ede0 3%, #fffefd 55%);
	color: var(--qm-ink);
	margin: 24rpx 0;
	overflow: hidden;
}
.qm-card__watermark {
	position: absolute;
	width: 220rpx;
	height: 220rpx;
	right: 24rpx;
	top: -20rpx;
	opacity: 0.09;
	pointer-events: none;
}
.qm-card__heading {
	position: relative;
	display: flex;
	align-items: center;
	gap: 14rpx;
	font-size: 30rpx;
	font-weight: 500;
	> image {
		width: 42rpx;
		height: 42rpx;
		flex-shrink: 0;
	}
	> text:not(.qm-tag) {
		flex: 1;
		min-width: 0;
	}
	.qm-tag {
		font-weight: 400;
		font-size: 21rpx;
	}
}
.qm-card__balance {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	margin: 26rpx 0 8rpx;
	> view:first-child {
		display: flex;
		align-items: baseline;
		gap: 10rpx;
		flex-wrap: wrap;
	}
	text {
		font-size: 23rpx;
		color: var(--qm-muted);
	}
	.qm-card__number {
		font-size: 68rpx;
		color: var(--qm-deep);
		font-weight: 700;
		line-height: 1.2;
		font-variant-numeric: tabular-nums;
	}
}
.qm-card__expiry {
	flex-shrink: 0;
	text-align: right;
	text {
		display: block;
	}
	text:first-child {
		font-size: 24rpx;
	}
}
.qm-card__bottom {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
	border-top: 1px solid var(--qm-line);
	padding-top: 22rpx;
	margin-top: 26rpx;
}
.qm-card__details {
	display: flex;
	align-items: center;
	gap: 6rpx;
	color: var(--qm-muted) !important;
	font-size: 25rpx !important;
	min-height: 84rpx;
	image {
		width: 26rpx;
		height: 26rpx;
	}
}
.qm-card__deduct {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 168rpx;
	min-height: 84rpx;
	border-radius: 23rpx !important;
	background: var(--qm-brand) !important;
	color: var(--qm-on-brand) !important;
	font-size: 27rpx !important;
}
.qm-card__deduct[disabled] {
	background: #e7e2eb !important;
	color: #8c8295 !important;
}
.is-muted {
	background: var(--qm-cream);
	border-color: #e3dbce;
}
</style>
