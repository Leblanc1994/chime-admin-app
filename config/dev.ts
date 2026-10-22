import { host, value } from "./proxy";

export default {
	// 根地址
	host,

	// 请求地址
	get baseUrl() {
		// #ifdef H5
		if (import.meta.env.VITE_CHIME_UI_PREVIEW === "1") return "/preview";
		return `/${value}`;
		// #endif

		// #ifndef H5
		return this.host + (value === "prod" ? "/api" : "");
		// #endif
	},
};
