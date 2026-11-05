export interface MemberGroupOffset {
	initial: string;
	top: number;
}

// Allow for subpixel rounding when scroll-into-view aligns a group heading.
export function initialAtScrollTop(groups: MemberGroupOffset[], scrollTop: number): string {
	let initial = groups[0]?.initial || "";
	for (const group of groups) {
		if (group.top > Math.max(0, scrollTop) + 1) break;
		initial = group.initial;
	}
	return initial;
}
