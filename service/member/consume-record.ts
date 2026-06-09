import { BaseService } from "/@/cool";

export default class MemberConsumeRecordService extends BaseService {
	private adminService: BaseService;

	constructor() {
		super("member/consumeRecord");
		this.adminService = new BaseService("admin/member/consumeRecord");
	}

	request(options: any = {}) {
		return this.adminService.request(options);
	}
}
