import { BaseService } from "/@/cool";

export default class MemberInfoService extends BaseService {
	private adminService: BaseService;

	constructor() {
		super("member/info");
		this.adminService = new BaseService("admin/member/info");
	}

	request(options: any = {}) {
		return this.adminService.request(options);
	}
}
