import { BaseService } from "/@/cool";
import MemberInfoService from "./info";
import MemberCardAccountService from "./card-account";

export default class MemberConsumeRecordService extends BaseService {
	private adminService: BaseService;

	constructor() {
		super("member/consumeRecord");
		this.adminService = new BaseService("admin/member/consumeRecord");
	}

	request(options: any = {}) {
		return this.adminService.request(options);
	}

	// The info endpoint returns the record entity; joined customer/card fields only exist on page.
	// Hydrate them for direct detail URLs and preserve the guest's existing profile remark on edit.
	async info(params: any) {
		const record: any = await super.info(params);
		if (!record?.memberId) return record;
		const member: any = await new MemberInfoService().info({ id: record.memberId });
		let cardName = record.cardName;
		if (record.cardAccountId && !cardName) {
			const cards = (await new MemberCardAccountService().list({
				memberId: record.memberId,
			})) as any[];
			cardName = cards.find(
				(card) => String(card.id) === String(record.cardAccountId),
			)?.cardName;
		}
		return {
			...record,
			cardName,
			memberName: member?.name ?? record.memberName,
			memberNickName: member?.nickName ?? record.memberNickName,
			memberPhone: member?.phone ?? record.memberPhone,
			memberRemark: member?.remark ?? record.memberRemark,
			customerType: member?.customerType || record.customerType || "member",
		};
	}

	addGuestConsume(data: any) {
		return this.request({
			url: "/addGuestConsume",
			method: "POST",
			data,
		});
	}

	updateGuestConsume(data: any) {
		return this.request({
			url: "/updateGuestConsume",
			method: "POST",
			data,
		});
	}
}
