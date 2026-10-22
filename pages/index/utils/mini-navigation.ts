export interface MenuButtonRect {
	top: number;
	bottom: number;
	left: number;
	right: number;
	width: number;
	height: number;
}

// Menu coordinates and status-bar heights use API px, never rpx.
export function miniNavigationLayout(
	window: { windowWidth?: number; statusBarHeight?: number; safeArea?: { top?: number } },
	menu?: Partial<MenuButtonRect> | null,
) {
	const measuredWidth = window.windowWidth;
	const width = Number.isFinite(measuredWidth) && measuredWidth! > 0 ? measuredWidth! : 375;
	const statusBarHeight =
		[window.statusBarHeight, window.safeArea?.top].find(
			(value) => typeof value === "number" && Number.isFinite(value) && value >= 0,
		) ?? 20;
	const validMenu =
		menu &&
		[menu.top, menu.bottom, menu.left, menu.right, menu.width, menu.height].every(
			(value) => typeof value === "number" && Number.isFinite(value),
		) &&
		menu.height! > 0 &&
		menu.width! > 0 &&
		menu.top! >= statusBarHeight &&
		menu.top! - statusBarHeight <= 40 &&
		menu.bottom! > menu.top! &&
		Math.abs(menu.bottom! - menu.top! - menu.height!) < 1 &&
		menu.left! > width / 2 &&
		menu.right! <= width &&
		Math.abs(menu.right! - menu.left! - menu.width!) < 1;
	const barHeight = validMenu
		? Math.max(44, menu.height! + 2 * (menu.top! - statusBarHeight))
		: 44;
	// Matching left/right columns keep the title centered on screen and away from the capsule.
	const sideInset = validMenu ? width - menu.left! + 12 : 108;
	return {
		statusBarHeight,
		barHeight,
		navigationBottom: statusBarHeight + barHeight,
		sideInset: Math.max(52, Math.min(sideInset, (width - 80) / 2)),
	};
}
