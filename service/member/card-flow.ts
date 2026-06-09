import { BaseService } from "/@/cool";

export default class MemberCardFlowService extends BaseService {
	private adminService: BaseService;

	constructor() {
		super("member/cardFlow");
		this.adminService = new BaseService("admin/member/cardFlow");
	}

	request(options: any = {}) {
		return this.adminService.request(options);
	}
}
