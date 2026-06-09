import { BaseService } from "/@/cool";

export default class BaseCommService extends BaseService {
	private adminService: BaseService;

	constructor() {
		super("base/comm");
		this.adminService = new BaseService("admin/base/comm");
	}

	request(options: any = {}) {
		return this.adminService.request(options);
	}

	person() {
		return this.request({
			url: "/person",
			method: "GET",
		});
	}

	personUpdate(data?: any) {
		return this.request({
			url: "/personUpdate",
			method: "POST",
			data,
		});
	}

	upload(data?: any) {
		return this.request({
			url: "/upload",
			method: "POST",
			data,
		});
	}

	uploadMode() {
		return this.request({
			url: "/uploadMode",
			method: "GET",
		});
	}

	logout() {
		return this.request({
			url: "/logout",
			method: "POST",
		});
	}
}
