export declare interface ModuleConfig {
	name?: string;
	description?: string;
	order?: number;
	demo?: { label: string; path: string };
	options?: {
		[key: string]: any;
	};
	onLoad?(options?: any): any;
}

export declare interface Module extends ModuleConfig {
	name: string;
	options: {
		[key: string]: any;
	};
	[key: string]: any;
}

export namespace User {
	interface Token {
		token: string;
		expire: number;
		refreshToken: string;
		refreshExpire: number;
	}

	interface Info {
		id?: number;
		username?: string;
		name?: string;
		nickName?: string;
		phone?: string;
		email?: string;
		headImg?: string;
		avatarUrl?: string;
		remark?: string;
		[key: string]: any;
	}
}

export namespace Dict {
	type Key = Eps.DictKey | (string & {});

	interface Item {
		id: string;
		label: string;
		value: any;
		children?: Item[];
		[key: string]: any;
	}

	interface Data {
		[key: string]: Item[];
	}
}
