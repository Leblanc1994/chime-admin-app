import { reactive, onBeforeUnmount, getCurrentInstance } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { miniNavigationLayout } from "./mini-navigation";

export function useMiniNavigation() {
	const navigation = reactive({ enabled: false, ...miniNavigationLayout({}) });
	// #ifdef MP-WEIXIN
	navigation.enabled = true;
	function refresh() {
		let window = {};
		let menu;
		try {
			window = uni.getSystemInfoSync();
		} catch {}
		try {
			menu = uni.getMenuButtonBoundingClientRect();
		} catch {}
		Object.assign(navigation, miniNavigationLayout(window, menu));
	}
	refresh();
	// This composable is used by shared components; page visibility belongs to the page root.
	onShow(refresh, getCurrentInstance()?.root);
	uni.onWindowResize(refresh);
	onBeforeUnmount(() => uni.offWindowResize(refresh));
	// #endif
	return navigation;
}
