export interface CardAccount {
	id: number;
	status: number;
	remainTimes: number;
	expireTime?: string | null;
	cardName?: string;
	totalTimes?: number;
	remark?: string;
}
export function isExpired(card: CardAccount, now = Date.now()) {
	if (card.status === 3) return true;
	if (!card.expireTime) return false;
	const expiry = new Date(card.expireTime.replace(" ", "T")).getTime();
	return !Number.isFinite(expiry) || expiry <= now;
}
export function cardStatus(card: CardAccount, now = Date.now()) {
	if (card.status === 4) return "已作废";
	if (card.status === 0) return "已停用";
	if (isExpired(card, now)) return "已过期";
	if (card.remainTimes <= 0 || card.status === 2) return "已用尽";
	if (card.status !== 1 || !Number.isSafeInteger(Number(card.remainTimes))) return "状态异常";
	return "可使用";
}
export function canConsume(card: CardAccount, now = Date.now()) {
	return cardStatus(card, now) === "可使用";
}
export function canAdjust(card: CardAccount, now = Date.now()) {
	return card.status !== 4 && !isExpired(card, now);
}
export function positiveTimes(value: unknown) {
	const n = Number(value);
	return String(value ?? "").trim() !== "" && Number.isSafeInteger(n) && n > 0;
}
export function nonnegativeTimes(value: unknown) {
	const n = Number(value);
	return String(value ?? "").trim() !== "" && Number.isSafeInteger(n) && n >= 0;
}
export function deductionLimit(
	card: CardAccount,
	original?: { cardAccountId?: number; consumeTimes?: number },
) {
	return (
		Number(card.remainTimes) +
		(original?.cardAccountId === card.id ? Number(original.consumeTimes) || 0 : 0)
	);
}
