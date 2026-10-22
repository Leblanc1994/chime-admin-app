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
	statisticsDate?: string;
	totalMemberCount: number;
	todayNewMemberCount: number;
	todayConsumeRecordCount: number;
	yesterdayConsumeRecordCount: number;
	weekConsumeRecordCount: number;
	monthConsumeRecordCount: number;
	lowBalanceCardCount: number;
	expiringCardCount: number;
	inactiveMemberCount: number;
	todayTypeCounts: MemberDashboardTypeCount[];
	monthlyConsumeRecordCounts: MemberDashboardMonthlyCount[];
	dailyConsumeRecordCounts?: { date: string; recordCount: number }[];
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
