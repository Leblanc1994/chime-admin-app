import { BaseService } from "/@/cool";

export default class MemberConsumeNoticeSmsService extends BaseService {
	private adminService: BaseService;

	constructor() {
		super("member/consumeNoticeSms");
		this.adminService = new BaseService("admin/member/consumeNoticeSms");
	}

	request(options: any = {}) {
		return this.adminService.request(options);
	}

	summary(params: any) {
		return this.request({
			url: "/summary",
			params,
		});
	}
}
