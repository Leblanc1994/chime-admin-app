import pinyin from "js-pinyin";
import { canConsume, isExpired, type CardAccount } from "./card-policy";

export interface DirectoryMember {
	id: number;
	name?: string;
	nickName?: string;
	phone?: string;
	validCardCount?: number;
	remainTimes?: number;
	lastConsumeTime?: string;
	cards?: CardAccount[];
	[key: string]: any;
}

function memberNameKey(member: DirectoryMember) {
	const name = member.name?.trim() || member.nickName?.trim() || "";
	return pinyin.getFullChars(name).toUpperCase();
}

export function memberInitial(member: DirectoryMember): string {
	return memberNameKey(member).match(/^[A-Z]/)?.[0] || "#";
}

export function filterMembersByInitial(
	members: DirectoryMember[],
	initial: string,
): DirectoryMember[] {
	return initial ? members.filter((member) => memberInitial(member) === initial) : members;
}

export function sortMembersByName(members: DirectoryMember[]): DirectoryMember[] {
	return members
		.map((member) => {
			const key = memberNameKey(member);
			return { member, key, group: /^[A-Z]/.test(key) ? 0 : key ? 1 : 2 };
		})
		.sort(
			(a, b) =>
				a.group - b.group ||
				(a.key < b.key ? -1 : a.key > b.key ? 1 : 0) ||
				a.member.id - b.member.id,
		)
		.map(({ member }) => member);
}

// The API paginates before applying UI card categories or pinyin sorting. Scan
// all pages first so filtering and name order remain correct across UI pages.
export async function collectMemberPages(
	request: (params: Record<string, unknown>) => Promise<any>,
	params: Record<string, unknown> = {},
): Promise<DirectoryMember[]> {
	const members: DirectoryMember[] = [];
	let page = 1;
	while (true) {
		const result = await request({ ...params, page, size: 100 });
		if (!Array.isArray(result?.list)) throw new Error("会员列表数据格式异常，请重新加载");
		members.push(...result.list);
		const total = result.pagination?.total ?? result.total;
		if (
			!result.list.length ||
			(total != null ? members.length >= total : result.list.length < 100)
		)
			break;
		page++;
	}
	return members;
}

export async function hydrateMemberCards(
	members: DirectoryMember[],
	request: (memberId: number) => Promise<CardAccount[]>,
): Promise<DirectoryMember[]> {
	const result = members.slice();
	let cursor = 0;
	await Promise.all(
		Array.from({ length: Math.min(6, members.length) }, async () => {
			while (cursor < members.length) {
				const index = cursor++;
				const cards = await request(members[index].id);
				if (!Array.isArray(cards)) throw new Error("次卡信息加载失败，请重新加载");
				const usable = cards.filter((card) => canConsume(card));
				result[index] = {
					...members[index],
					cards,
					validCardCount: usable.length,
					remainTimes: usable.reduce((sum, card) => sum + Number(card.remainTimes), 0),
				};
			}
		}),
	);
	return result;
}

export function matchesMemberFilter(member: DirectoryMember, filter: string, now = Date.now()) {
	const cards = member.cards || [];
	if (filter === "carded") return cards.length > 0;
	if (filter === "uncarded") return cards.length === 0;
	if (filter === "low")
		return cards.some((card) => canConsume(card, now) && card.remainTimes <= 2);
	if (filter === "expired") return cards.some((card) => isExpired(card, now));
	if (filter === "expiring")
		return cards.some(
			(card) =>
				canConsume(card, now) &&
				card.expireTime &&
				new Date(card.expireTime.replace(" ", "T")).getTime() - now <= 7 * 86400000,
		);
	return true;
}

export function memberCardCaption(member: DirectoryMember) {
	if (!member.cards) return "次卡资料暂未同步";
	if (!member.cards.length) return "尚未开立次卡";
	return member.cards.map((card) => card.cardName || "会员次卡").join(" / ");
}

export function memberStatus(member: DirectoryMember) {
	if (!member.cards) return "";
	if (!member.cards.length) return "未开卡";
	if (matchesMemberFilter(member, "low")) return "低余次";
	if (!member.cards.some((card) => canConsume(card))) {
		if (member.cards.every((card) => isExpired(card))) return "已过期";
		return "暂不可扣次";
	}
	return "";
}
