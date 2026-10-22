import { BaseService } from "/@/cool";

export default class MemberCardTemplateService extends BaseService {
	private adminService: BaseService;
	constructor() {
		super("member/cardTemplate");
		this.adminService = new BaseService("admin/member/cardTemplate");
	}
	request(options: any = {}) {
		return this.adminService.request(options);
	}
}
