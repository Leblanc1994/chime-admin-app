import { BaseService } from "/@/cool";

export type MemberDashboardTypeCount = {
	consumeType: string;
	recordCount: number;
};

export type MemberDashboardMonthlyCount = {
	month: number;
	recordCount: number;
};

export type MemberDashboardSummary = {
	totalMemberCount: number;
	todayNewMemberCount: number;
	todayConsumeRecordCount: number;
	yesterdayConsumeRecordCount: number;
	weekConsumeRecordCount: number;
	monthConsumeRecordCount: number;
	todayTypeCounts: MemberDashboardTypeCount[];
	monthlyConsumeRecordCounts: MemberDashboardMonthlyCount[];
};

export default class MemberDashboardService extends BaseService {
	private adminService: BaseService;

	constructor() {
		super("member/dashboard");
		this.adminService = new BaseService("admin/member/dashboard");
	}

	request(options: any = {}) {
		return this.adminService.request(options);
	}

	summary(): Promise<MemberDashboardSummary> {
		return this.request({
			url: "/summary",
			method: "GET",
		}) as Promise<MemberDashboardSummary>;
	}
}
