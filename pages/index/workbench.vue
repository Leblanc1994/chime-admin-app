<template>
	<cl-page status-bar-background="transparent" :background-color="pageBackground">
		<!-- #ifdef MP -->
		<cl-sticky>
			<cl-topbar :show-back="false" :border="false" background-color="transparent" />
		</cl-sticky>
		<!-- #endif -->

		<view class="page-workbench workbench-redesign">
			<view class="workbench-hero">
				<view class="workbench-hero__orb"></view>
				<text class="workbench-hero__eyebrow">CHIME WORKSPACE</text>
				<text class="workbench-hero__title">工作台</text>
				<text class="workbench-hero__desc">快速进入门店日常管理</text>
				<view class="workbench-hero__spark workbench-hero__spark--one"></view><view class="workbench-hero__spark workbench-hero__spark--two"></view>
			</view>

			<view class="workbench-section">
				<view class="workbench-section__heading"><text>快捷操作</text><text>已开通 {{ menus.length }} 项服务</text></view>
				<view class="menu-grid">
					<view class="menu-card" v-for="item in menus" :key="item.path" :class="`is-${item.tone}`" @tap="toPage(item.path)">
						<view class="menu-card__icon"><text class="menu-card__glyph" :class="`is-${item.glyph}`"></text></view>
						<view class="menu-card__body"><text class="menu-card__title">{{ item.title }}</text><text class="menu-card__desc">{{ item.desc }}</text></view>
						<view class="menu-card__arrow"><cl-icon name="arrow-right" :size="26" color="currentColor" /></view>
					</view>
				</view>
			</view>

			<view class="workbench-note"><view class="workbench-note__icon">✓</view><view><text>工作台已为你准备好</text><text>从快捷操作开始处理门店事务</text></view></view>
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
		title: "消费记录",
		desc: "查看会员与散客消费记录，并可直接录入散客消费",
		path: "/pages/index/consume-statistics",
		glyph: "consume",
		tone: "copper",
	},
	{
		title: "员工管理",
		desc: "添加店员账号，管理登录权限",
		path: "/pages/index/staff",
		glyph: "staff",
		tone: "blue",
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

.menu-card.is-blue .menu-card__icon { background: #e7f1ff; color: #427fda; }

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

.menu-card__glyph.is-staff { --workbench-menu-icon: url("/static/member-icons/01-member-card.svg"); }

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

/* Quick-action hub in the same violet operating-system language as the supplied design. */
.workbench-redesign {
	--workbench-ink: #2e293e;
	--workbench-muted: #958fa1;
	min-height: 100%;
	padding: 92rpx 25rpx 170rpx;
	background: #fbfbfe;
}

.workbench-hero { position: relative; min-height: 228rpx; padding: 31rpx 28rpx; overflow: hidden; border-radius: 23rpx; background: linear-gradient(135deg,#663ee9 0%,#7b51f5 58%,#9a72fb 100%); color:#fff; box-sizing:border-box; box-shadow:0 13rpx 31rpx rgba(91,54,214,.22); }
.workbench-hero::after { content:""; position:absolute; right:-77rpx; bottom:-82rpx; width:270rpx; height:220rpx; border:2rpx solid rgba(255,255,255,.14); border-radius:50%; transform:rotate(-29deg); }.workbench-hero__orb { position:absolute; top:-100rpx; right:-76rpx; width:260rpx; height:260rpx; border-radius:50%; background:rgba(220,195,255,.2); }.workbench-hero__eyebrow,.workbench-hero__title,.workbench-hero__desc { position:relative; z-index:1; display:block; }.workbench-hero__eyebrow { color:rgba(255,255,255,.72); font-size:16rpx; letter-spacing:2rpx; }.workbench-hero__title { margin-top:18rpx; font-size:45rpx; font-weight:850; line-height:1; }.workbench-hero__desc { margin-top:15rpx; color:rgba(255,255,255,.78); font-size:20rpx; }.workbench-hero__spark { position:absolute; z-index:1; width:9rpx; height:9rpx; border-radius:50%; background:#fff; box-shadow:0 0 15rpx rgba(255,255,255,.9); }.workbench-hero__spark--one { top:42rpx; right:52rpx; }.workbench-hero__spark--two { top:90rpx; right:95rpx; width:6rpx; height:6rpx; }
.workbench-section { margin-top:31rpx; }.workbench-section__heading { display:flex; align-items:center; justify-content:space-between; margin:0 4rpx 17rpx; color:var(--workbench-ink); font-size:27rpx; font-weight:800; }.workbench-section__heading text:last-child { color:var(--workbench-muted); font-size:17rpx; font-weight:500; }
.menu-grid { gap:15rpx; }.menu-card { min-height:122rpx; padding:20rpx; border:1rpx solid #efedf3; border-radius:20rpx; background:#fff; box-shadow:0 7rpx 21rpx rgba(42,31,75,.055); }.menu-card__icon { width:70rpx; height:70rpx; margin-right:17rpx; border-radius:18rpx; }.menu-card.is-green .menu-card__icon { background:#eee9ff; color:#734af1; }.menu-card.is-copper .menu-card__icon { background:#e4f8f1; color:#31ba87; }.menu-card__glyph { width:38rpx; height:38rpx; }.menu-card__title { color:#373144; font-size:24rpx; font-weight:800; }.menu-card__desc { margin-top:7rpx; color:#9791a2; font-size:17rpx; line-height:1.35; }.menu-card__arrow { display:flex; align-items:center; justify-content:center; width:34rpx; height:34rpx; margin-left:11rpx; border-radius:50%; background:#f4f1ff; color:#7651ec; font-size:0; }
.workbench-note { display:flex; align-items:center; gap:13rpx; margin-top:23rpx; padding:17rpx 20rpx; border-radius:17rpx; background:#f1edff; box-sizing:border-box; }.workbench-note__icon { display:flex; align-items:center; justify-content:center; width:32rpx; height:32rpx; border-radius:50%; background:#7850ef; color:#fff; font-size:18rpx; font-weight:800; }.workbench-note > view:last-child { display:flex; flex-direction:column; gap:5rpx; color:#5f5871; font-size:19rpx; }.workbench-note > view:last-child text:last-child { color:#918a9f; font-size:16rpx; }
</style>
