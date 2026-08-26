import { BaseService } from "/@/cool";

export interface StoreStaff {
	id: number;
	name: string;
	username: string;
	phone?: string;
	status: number;
	remark?: string;
	createTime?: string;
}

export interface StoreStaffPage {
	list: StoreStaff[];
	total: number;
	page: number;
	size: number;
}

/** 店长仅能管理当前门店的店员账号。 */
export default class StoreStaffService extends BaseService {
	constructor() {
		super("admin/store/staff");
	}

	page(data: Record<string, unknown>) {
		return this.request({
			url: "/page",
			method: "POST",
			data,
		}) as unknown as Promise<StoreStaffPage>;
	}

	add(data: Record<string, unknown>) {
		return this.request({ url: "/add", method: "POST", data });
	}

	update(data: Record<string, unknown>) {
		return this.request({ url: "/update", method: "POST", data });
	}

	resetPassword(id: number, password: string) {
		return this.request({ url: "/resetPassword", method: "POST", data: { id, password } });
	}

	updateStatus(id: number, status: number) {
		return this.request({ url: "/updateStatus", method: "POST", data: { id, status } });
	}
}
