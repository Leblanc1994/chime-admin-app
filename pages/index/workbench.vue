<template>
	<cl-page status-bar-background="transparent" :background-color="pageBackground">
		<!-- #ifdef MP -->
		<cl-sticky>
			<cl-topbar :show-back="false" :border="false" background-color="transparent" />
		</cl-sticky>
		<!-- #endif -->

		<view class="page-workbench">
			<view class="menu-grid">
				<view class="menu-card" v-for="item in menus" :key="item.path" :class="`is-${item.tone}`" @tap="toPage(item.path)">
					<view class="menu-card__icon">
						<text class="menu-card__glyph" :class="`is-${item.glyph}`"></text>
					</view>
					<view class="menu-card__body">
						<text class="menu-card__title">{{ item.title }}</text>
						<text class="menu-card__desc">{{ item.desc }}</text>
					</view>
					<text class="menu-card__arrow">›</text>
				</view>
			</view>
		</view>

		<tabbar />
	</cl-page>
</template>

<script lang="ts" setup>
import { useCool } from "/@/cool";
import Tabbar from "./components/tabbar.vue";

const { router } = useCool();
const pageBackground =
	"linear-gradient(180deg, #f6f9fc 0%, #edf3f7 54%, #e8eef4 100%)";

const menus = [
	{
		title: "会员列表",
		desc: "查看、筛选和维护会员档案",
		path: "/pages/index/member",
		glyph: "member",
		tone: "green",
	},
	{
		title: "消费统计",
		desc: "按日期、客户和类型查看消费记录",
		path: "/pages/index/consume-statistics",
		glyph: "consume",
		tone: "copper",
	},
];

function toPage(path: string) {
	router.push(path);
}
</script>

<style lang="scss" scoped>
.page-workbench {
	--workbench-ink: #1d2835;
	--workbench-muted: #657587;
	--workbench-surface: #fbfdff;
	--workbench-line: #d8e2ea;
	--workbench-accent: #168276;
	--workbench-coral: #d06459;
	--workbench-blue: #4b78aa;
	min-height: 100%;
	padding: 24rpx 24rpx 156rpx;
	box-sizing: border-box;
}

.menu-grid {
	display: grid;
	gap: 20rpx;
}

.menu-card {
	display: flex;
	align-items: center;
	min-height: 162rpx;
	padding: 26rpx;
	border-radius: 24rpx;
	background: var(--workbench-surface);
	border: 1rpx solid var(--workbench-line);
	box-shadow: 0 14rpx 34rpx rgba(38, 55, 72, 0.08);
	box-sizing: border-box;
}

.menu-card__icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 86rpx;
	height: 86rpx;
	margin-right: 24rpx;
	border-radius: 22rpx;
	flex-shrink: 0;
}

.menu-card.is-green .menu-card__icon {
	background: rgba(22, 130, 118, 0.12);
	color: var(--workbench-accent);
}

.menu-card.is-copper .menu-card__icon {
	background: rgba(208, 100, 89, 0.12);
	color: var(--workbench-coral);
}

.menu-card__glyph {
	width: 48rpx;
	height: 48rpx;
	background-color: currentColor;
	flex-shrink: 0;
	-webkit-mask: var(--workbench-menu-icon) center / contain no-repeat;
	mask: var(--workbench-menu-icon) center / contain no-repeat;
}

.menu-card__glyph.is-member {
	--workbench-menu-icon: url("/static/member-icons/01-member-card.svg");
}

.menu-card__glyph.is-consume {
	--workbench-menu-icon: url("/static/member-icons/03-consume-check.svg");
}

.menu-card__body {
	display: flex;
	flex: 1;
	min-width: 0;
	flex-direction: column;
}

.menu-card__title {
	font-size: 32rpx;
	font-weight: 850;
	color: var(--workbench-ink);
	line-height: 1.2;
}

.menu-card__desc {
	margin-top: 10rpx;
	font-size: 24rpx;
	color: var(--workbench-muted);
	line-height: 1.4;
}

.menu-card__arrow {
	margin-left: 18rpx;
	font-size: 50rpx;
	line-height: 1;
	color: #94a6b8;
}
</style>
