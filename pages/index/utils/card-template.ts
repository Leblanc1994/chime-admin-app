export const cardColors = [
	{ value: "purple", label: "鸢尾紫", accent: "#6741b1", surface: "#eee7f6" },
	{ value: "gold", label: "香槟金", accent: "#98866b", surface: "#f5ede0" },
	{ value: "rose", label: "玫瑰红", accent: "#9e4653", surface: "#f6e8e9" },
	{ value: "teal", label: "松石绿", accent: "#39766e", surface: "#e7f1ed" },
	{ value: "blue", label: "雾霭蓝", accent: "#5276a2", surface: "#e9eff6" },
	{ value: "slate", label: "岩石灰", accent: "#646a73", surface: "#ecedef" },
] as const;
export type CardColor = (typeof cardColors)[number]["value"];
export interface CardTemplate {
	id: number;
	name: string;
	totalTimes: number;
	price: number | string;
	color: CardColor;
	status: number;
	remark?: string;
}
export const newCardTemplate = () => ({
	name: "",
	totalTimes: "",
	price: "",
	color: "purple" as CardColor,
	status: 1,
	remark: "",
});
export type CardTemplateForm = ReturnType<typeof newCardTemplate>;
export function cardPalette(color?: string | null) {
	return cardColors.find((item) => item.value === color) || cardColors[0];
}
export function cardColorStyle(color?: string | null) {
	const palette = cardPalette(color);
	return { "--card-accent": palette.accent, "--card-surface": palette.surface };
}
export function cardPrice(value: string | number) {
	const n = Number(value);
	return Number.isFinite(n)
		? n.toLocaleString("en-US", {
				minimumFractionDigits: n % 1 ? 2 : 0,
				maximumFractionDigits: 2,
			})
		: "—";
}
export function cardTemplateErrors(form: CardTemplateForm) {
	const errors: Partial<Record<keyof CardTemplateForm, string>> = {};
	if (!form.name.trim()) errors.name = "请填写卡项名称";
	else if (form.name.trim().length > 50) errors.name = "卡项名称不能超过 50 字";
	if (!/^[1-9]\d{0,9}$/.test(form.totalTimes.trim()) || Number(form.totalTimes) > 2147483647)
		errors.totalTimes = "请输入 1–2147483647 的整数";
	if (!/^\d{1,10}(\.\d{1,2})?$/.test(form.price.trim()) || Number(form.price) > 9999999999.99)
		errors.price = "请填写售价，最多两位小数";
	if (!cardColors.some((c) => c.value === form.color)) errors.color = "请选择卡项颜色";
	if (![0, 1].includes(form.status)) errors.status = "请选择启用或停用";
	if (form.remark.trim().length > 500) errors.remark = "备注不能超过 500 字";
	return errors;
}
export function cardTemplatePayload(form: CardTemplateForm) {
	return {
		name: form.name.trim(),
		totalTimes: Number(form.totalTimes),
		// 保留十进制字符串，交给后端 BigDecimal 处理。
		price: form.price.trim(),
		color: form.color,
		status: form.status,
		remark: form.remark.trim(),
	};
}
