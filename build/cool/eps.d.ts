declare namespace Eps {
	interface UserAddressEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface UserInfoEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface DictInfoEntity {
		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	type json = any;

	interface UserAddress {
		/**
		 * info
		 */
		info(data?: any): Promise<UserAddressEntity>;

		/**
		 * page
		 */
		page(data?: any): Promise<{
			pagination: { size: number; page: number; total: number; [key: string]: any };
			list: UserAddressEntity[];
			[key: string]: any;
		}>;

		/**
		 * list
		 */
		list(data?: any): Promise<UserAddressEntity[]>;

		/**
		 * add
		 */
		add(data?: any): Promise<any>;

		/**
		 * update
		 */
		update(data?: any): Promise<any>;

		/**
		 * default
		 */
		default(data?: any): Promise<any>;

		/**
		 * delete
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			info: string;
			page: string;
			list: string;
			add: string;
			update: string;
			default: string;
			delete: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			info: boolean;
			page: boolean;
			list: boolean;
			add: boolean;
			update: boolean;
			default: boolean;
			delete: boolean;
		};

		request: Service["request"];
	}

	interface UserLogin {
		/**
		 * mini
		 */
		mini(data?: any): Promise<any>;

		/**
		 * mp
		 */
		mp(data?: any): Promise<any>;

		/**
		 * refreshToken
		 */
		refreshToken(data?: any): Promise<any>;

		/**
		 * captcha
		 */
		captcha(data?: any): Promise<any>;

		/**
		 * phone
		 */
		phone(data?: any): Promise<any>;

		/**
		 * miniPhone
		 */
		miniPhone(data?: any): Promise<any>;

		/**
		 * uniPhone
		 */
		uniPhone(data?: any): Promise<any>;

		/**
		 * wxApp
		 */
		wxApp(data?: any): Promise<any>;

		/**
		 * password
		 */
		password(data?: any): Promise<any>;

		/**
		 * smsCode
		 */
		smsCode(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			mini: string;
			mp: string;
			refreshToken: string;
			captcha: string;
			phone: string;
			miniPhone: string;
			uniPhone: string;
			wxApp: string;
			password: string;
			smsCode: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			mini: boolean;
			mp: boolean;
			refreshToken: boolean;
			captcha: boolean;
			phone: boolean;
			miniPhone: boolean;
			uniPhone: boolean;
			wxApp: boolean;
			password: boolean;
			smsCode: boolean;
		};

		request: Service["request"];
	}

	interface UserInfo {
		/**
		 * logoff
		 */
		logoff(data?: any): Promise<any>;

		/**
		 * person
		 */
		person(data?: any): Promise<any>;

		/**
		 * updatePassword
		 */
		updatePassword(data?: any): Promise<any>;

		/**
		 * bindPhone
		 */
		bindPhone(data?: any): Promise<any>;

		/**
		 * updatePerson
		 */
		updatePerson(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			logoff: string;
			person: string;
			updatePassword: string;
			bindPhone: string;
			updatePerson: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			logoff: boolean;
			person: boolean;
			updatePassword: boolean;
			bindPhone: boolean;
			updatePerson: boolean;
		};

		request: Service["request"];
	}

	interface MemberInfo {
		/**
		 * page
		 */
		page(data?: any): Promise<{
			pagination: { size: number; page: number; total: number; [key: string]: any };
			list: UserInfoEntity[];
			[key: string]: any;
		}>;

		/**
		 * info
		 */
		info(data?: any): Promise<UserInfoEntity>;

		/**
		 * 权限标识
		 */
		permission: { page: string; info: string };

		/**
		 * 权限状态
		 */
		_permission: { page: boolean; info: boolean };

		request: Service["request"];
	}

	interface DictInfo {
		/**
		 * data
		 */
		data(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { data: string };

		/**
		 * 权限状态
		 */
		_permission: { data: boolean };

		request: Service["request"];
	}

	interface BaseComm {
		/**
		 * upload
		 */
		upload(data?: any): Promise<any>;

		/**
		 * uploadMode
		 */
		uploadMode(data?: any): Promise<any>;

		/**
		 * param
		 */
		param(data?: any): Promise<any>;

		/**
		 * eps
		 */
		eps(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { upload: string; uploadMode: string; param: string; eps: string };

		/**
		 * 权限状态
		 */
		_permission: { upload: boolean; uploadMode: boolean; param: boolean; eps: boolean };

		request: Service["request"];
	}

	type Service = {
		/**
		 * 基础请求
		 */
		request(options?: {
			url: string;
			method?: "POST" | "GET" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
			data?: any;
			params?: any;
			headers?: {
				authorization?: string;
				[key: string]: any;
			};
			timeout?: number;
			proxy?: boolean;
			[key: string]: any;
		}): Promise<any>;

		user: { address: UserAddress; login: UserLogin; info: UserInfo };
		member: { info: MemberInfo };
		dict: { info: DictInfo };
		base: { comm: BaseComm };
	};

	undefined;
}
