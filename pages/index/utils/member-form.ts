export const memberSources = [
	{ label: "抖音", value: 1 },
	{ label: "美团", value: 2 },
	{ label: "朋友介绍", value: 3 },
];
export function newMemberForm() {
	return {
		name: "",
		phone: "",
		nickName: "",
		wechatNo: "",
		gender: 2,
		source: undefined as number | undefined,
		remark: "",
	};
}
export type MemberForm = ReturnType<typeof newMemberForm>;
export function memberFormError(form: MemberForm) {
	if (!form.nickName.trim()) return "请填写微信昵称";
	if (!form.wechatNo.trim()) return "请填写微信号";
	if (!memberSources.some((s) => s.value === form.source)) return "请选择客户来源";
	return "";
}
export function memberPayload(form: MemberForm) {
	return {
		...form,
		name: form.name.trim(),
		phone: form.phone.trim(),
		nickName: form.nickName.trim(),
		wechatNo: form.wechatNo.trim(),
		remark: form.remark.trim(),
	};
}
// The server returns the new entity ID. Never guess a member from a fuzzy search.
export function createdMemberId(result: any): number {
	const value = typeof result === "object" ? result?.id : result;
	if (typeof value !== "number" && typeof value !== "string") return 0;
	const id = Number(value);
	return Number.isSafeInteger(id) && id > 0 ? id : 0;
}
