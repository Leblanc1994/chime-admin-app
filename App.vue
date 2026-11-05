<script setup lang="ts">
import { useStore } from "/@/cool";
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
// #ifdef MP-WEIXIN
import { createMiniProgramUpdate } from "/@/cool/utils/mini-program-update";

const miniProgramUpdate = createMiniProgramUpdate();
// #endif

onLaunch(() => {
	console.log("App Launch");
	// #ifdef MP-WEIXIN
	miniProgramUpdate.init();
	// #endif

	const { dict, user } = useStore();

	// 获取字典
	// dict.refresh();

	if (user.token) {
		// 获取登录用户信息
		// user.get();
	}
});

onShow(() => {
	console.log("App Show");
	// #ifdef MP-WEIXIN
	miniProgramUpdate.onShow();
	// #endif
});

onHide(() => {
	console.log("App Hide");
	// #ifdef MP-WEIXIN
	miniProgramUpdate.onHide();
	// #endif
});
</script>

<style lang="scss">
@import "/$/cool-ui/index.scss";
@import "/@/static/css/index.scss";
@import "/@/static/css/design-font.scss";
@import "/@/static/css/business.scss";
</style>
