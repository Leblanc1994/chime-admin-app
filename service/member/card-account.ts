import { BaseService } from "/@/cool";

export default class MemberCardAccountService extends BaseService {
	private adminService: BaseService;

	constructor() {
		super("member/cardAccount");
		this.adminService = new BaseService("admin/member/cardAccount");
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

	plusTimes(data: any) {
		return this.request({
			url: "/plusTimes",
			method: "POST",
			data,
		});
	}

	setRemainTimes(data: any) {
		return this.request({
			url: "/setRemainTimes",
			method: "POST",
			data,
		});
	}

	stop(data: any) {
		return this.request({
			url: "/stop",
			method: "POST",
			data,
		});
	}

	enable(data: any) {
		return this.request({
			url: "/enable",
			method: "POST",
			data,
		});
	}

	discard(data: any) {
		return this.request({
			url: "/discard",
			method: "POST",
			data,
		});
	}
}
