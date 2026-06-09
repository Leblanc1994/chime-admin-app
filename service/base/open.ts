import { BaseService } from "/@/cool";

export default class BaseOpenService extends BaseService {
	private adminService: BaseService;

	constructor() {
		super("base/open");
		this.adminService = new BaseService("admin/base/open");
	}

	request(options: any = {}) {
		return this.adminService.request(options);
	}

	login(data?: {
		username: string;
		password: string;
		captchaId: string;
		verifyCode: string;
	}) {
		return this.request({
			url: "/login",
			method: "POST",
			data,
		});
	}

	captcha(params?: {
		type?: string;
		width?: number;
		height?: number;
	}) {
		return this.request({
			url: "/captcha",
			method: "GET",
			params,
		});
	}

	refreshToken(params?: { refreshToken: string }) {
		return this.request({
			url: "/refreshToken",
			method: "GET",
			params,
		});
	}
}
