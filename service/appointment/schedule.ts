import { BaseService } from "/@/cool";

export interface AppointmentProject {
	id: number;
	name: string;
	code: string;
	color: string;
	durationMinutes: number;
}
export interface Appointment {
	id: number;
	customerName: string;
	memberId?: number | null;
	memberPhone?: string | null;
	projectId: number;
	projectName: string;
	projectColor: string;
	startTime: string;
	endTime: string;
	remark: string;
	status: number;
	cancelledAt?: string;
}

export default class AppointmentService extends BaseService {
	constructor() {
		super("appointment/schedule");
	}
	// Keep the public EPS namespace stable while always using authenticated admin APIs.
	request(options: any = {}) {
		return new BaseService("admin/appointment/schedule").request(options);
	}
	projects(): Promise<AppointmentProject[]> {
		return new BaseService("admin/appointment/project").list({}) as Promise<
			AppointmentProject[]
		>;
	}
	cancel(id: number) {
		return this.request({ url: "/cancel", method: "POST", data: { id } });
	}
}
