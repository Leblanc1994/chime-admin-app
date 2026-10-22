import { BaseService } from "/@/cool";

// Documents are public app parameters; the admin comm controller has no param endpoint.
export default class DocumentService extends BaseService {
	private appService: BaseService;

	constructor() {
		// Register documents separately so they cannot replace the admin base.comm service.
		super("base/document");
		this.appService = new BaseService("app/base/comm");
	}

	get(key: "userAgreement" | "privacyPolicy") {
		return this.appService.request({ url: "/param", params: { key } });
	}
}
