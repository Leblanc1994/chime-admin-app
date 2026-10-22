// Keep the native tab bar hidden until the last business sheet has closed.
const owners = new Set<string>();
export function holdSheetTabbar(id: string) {
	// #ifdef MP-WEIXIN
	const pages = getCurrentPages();
	if (
		![
			"pages/index/home",
			"pages/index/member",
			"pages/index/workbench",
			"pages/index/my",
		].includes(pages[pages.length - 1]?.route || "")
	)
		return;
	if (!owners.size) uni.hideTabBar({ animation: false });
	owners.add(id);
	// #endif
}
export function releaseSheetTabbar(id: string) {
	// #ifdef MP-WEIXIN
	if (owners.delete(id) && !owners.size) uni.showTabBar({ animation: false });
	// #endif
}
